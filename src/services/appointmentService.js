const { randomBytes } = require('node:crypto');
const appointments = require('../models/appointmentModel');
const patients = require('../models/patientModel');
const { enqueue } = require('./jobQueue');
const { clinicNow, parseDateTime, validateAppointmentTime } = require('../utils/time');
const calculateRefund = require('../utils/refund');
const httpError = require('../utils/httpError');
const audit = require('../utils/audit');

function newReference() { return 'AP-' + randomBytes(8).toString('hex'); }

function bookingConflict(booked, time) {
  if (booked.length >= 12) return { scope: 'day', message: 'This doctor has reached the daily limit of 12 appointments' };
  if (booked.includes(time)) return { scope: 'slot', message: 'This doctor slot is already booked' };
  return null;
}

async function bookLocked(data, doctor, connection) {
  validateAppointmentTime(data.appointment_datetime);
  if (!await patients.find(data.patient_id, connection)) throw httpError(404, 'Patient not found');
  const booked = await appointments.bookedForDay(doctor.id, data.appointment_datetime.slice(0, 10), connection);
  const conflict = bookingConflict(booked, data.appointment_datetime);
  if (conflict) throw httpError(409, conflict.message, { waitlist: { method: 'POST', url: '/waitlist', scope: conflict.scope } });
  const appointment = await appointments.create({
    ...data, amount_paid: data.amount_paid ?? doctor.consultation_fee, booked_on: clinicNow(),
  }, connection);
  // Enqueue before commit: Redis failure rolls back the booking. The worker
  // takes the same doctor lock before checking whether this booking committed.
  await enqueue('confirmation', { doctor_id: doctor.id, appt_ref: appointment.appt_ref }, 'confirm-' + appointment.appt_ref);
  return appointment;
}

async function book(data) {
  const appointment = await appointments.withDoctor(data.doctor_id, (doctor, connection) =>
    bookLocked({ ...data, appt_ref: newReference() }, doctor, connection));
  await audit('booking', { appointment_id: appointment.id, appt_ref: appointment.appt_ref, source: 'api' });
  return appointment;
}

async function cancel(id) {
  const original = await appointments.find(id);
  if (!original) throw httpError(404, 'Appointment not found');
  const appointment = await appointments.withDoctor(original.doctor_id, async (doctor, connection) => {
    const current = await appointments.find(id, connection);
    if (current.status === 'cancelled') throw httpError(409, 'Appointment is already cancelled');
    const now = new Date();
    const noticeHours = (parseDateTime(current.appointment_datetime).date - now) / 3600000;
    const refund = calculateRefund(current.amount_paid, noticeHours);
    const cancelled = await appointments.cancel(id, refund, clinicNow(now), connection);
    await enqueue('promotion', { appointment_id: id }, 'cancel-' + id);
    return cancelled;
  });
  await audit('cancellation', { appointment_id: appointment.id, appt_ref: appointment.appt_ref, refund_amount: appointment.refund_amount });
  return appointment;
}

async function confirmation(data) {
  const appointment = await appointments.withDoctor(data.doctor_id, (doctor, connection) =>
    appointments.findByReference(data.appt_ref, connection));
  if (!appointment) return; // The booking transaction rolled back.
  const patient = await patients.find(appointment.patient_id);
  const written = await audit('confirmation', {
    appointment_id: appointment.id, to: patient.email,
    message: 'Appointment ' + appointment.appt_ref + ' was confirmed for ' + appointment.appointment_datetime + ' (Kigali time).',
  });
  if (!written) throw new Error('Confirmation log failed; retrying the notification');
}

module.exports = { book, cancel, confirmation, bookLocked, bookingConflict, newReference };
