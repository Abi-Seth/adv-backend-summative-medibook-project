const redis = require('../config/redis');
const appointments = require('../models/appointmentModel');
const patients = require('../models/patientModel');
const booking = require('./appointmentService');
const { requireRedis } = require('./jobQueue');
const { clinicNow, validateAppointmentTime } = require('../utils/time');
const httpError = require('../utils/httpError');
const audit = require('../utils/audit');

function key(doctorId, date) { return 'medibook:waitlist:' + doctorId + ':' + date; }

async function list(doctorId, date) {
  requireRedis();
  return (await redis.lrange(key(doctorId, date), 0, -1)).map(value => JSON.parse(value));
}

async function join(data) {
  return appointments.withDoctor(data.doctor_id, async (doctor, connection) => {
    validateAppointmentTime(data.appointment_datetime);
    if (!await patients.find(data.patient_id, connection)) throw httpError(404, 'Patient not found');
    const date = data.appointment_datetime.slice(0, 10);
    const booked = await appointments.bookedForDay(doctor.id, date, connection);
    const conflict = booking.bookingConflict(booked, data.appointment_datetime);
    if (!conflict) throw httpError(409, 'This slot is available; book it through POST /appointments');
    const entries = await list(doctor.id, date);
    if (entries.some(entry => entry.patient_id === data.patient_id && (entry.scope === 'day' || conflict.scope === 'day' || entry.appointment_datetime === data.appointment_datetime))) {
      throw httpError(409, 'This patient is already on the waitlist for that slot or day');
    }
    const entry = {
      ...data, appt_ref: booking.newReference(), scope: conflict.scope,
      amount_paid: data.amount_paid ?? doctor.consultation_fee, joined_at: clinicNow(),
    };
    await redis.rpush(key(doctor.id, date), JSON.stringify(entry));
    return entry;
  });
}

function availableTime(entry, date, booked) {
  const times = entry.scope === 'slot' ? [entry.appointment_datetime] :
    Array.from({ length: 16 }, (_, index) => date + ' ' + String(9 + Math.floor(index / 2)).padStart(2, '0') + ':' + (index % 2 ? '30' : '00') + ':00');
  for (const time of times) {
    if (booked.includes(time)) continue;
    try { return validateAppointmentTime(time); } catch (error) {
      if (error.status !== 422) throw error;
    }
  }
  return null;
}

async function promote(appointmentId) {
  const cancelled = await appointments.find(appointmentId);
  if (!cancelled) return;
  const date = cancelled.appointment_datetime.slice(0, 10);
  const queueKey = key(cancelled.doctor_id, date);
  while (true) {
    const result = await appointments.withDoctor(cancelled.doctor_id, async (doctor, connection) => {
      const current = await appointments.find(appointmentId, connection);
      if (current.status !== 'cancelled') return null;
      requireRedis();
      const entries = await redis.lrange(queueKey, 0, -1);
      const booked = await appointments.bookedForDay(doctor.id, date, connection);
      for (const raw of entries) {
        const entry = JSON.parse(raw);
        const existing = await appointments.findByReference(entry.appt_ref, connection);
        if (existing) return { raw, appointment: existing, alreadyBooked: true };
        if (booked.length >= 12) return null;
        const time = availableTime(entry, date, booked);
        if (!time) continue; // FIFO among patients eligible for an available slot.
        const appointment = await booking.bookLocked({ ...entry, appointment_datetime: time }, doctor, connection);
        return { raw, appointment, alreadyBooked: false };
      }
      return null;
    });
    if (!result) return;
    if (!result.alreadyBooked) await audit('booking', { appointment_id: result.appointment.id, appt_ref: result.appointment.appt_ref, source: 'waitlist' });
    // Remove only after commit. A failed removal/restarted job finds the same
    // appt_ref above and acknowledges it without making a second appointment.
    await redis.lrem(queueKey, 1, result.raw);
  }
}

module.exports = { join, list, promote };
