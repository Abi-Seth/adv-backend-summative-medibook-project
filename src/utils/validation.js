const httpError = require('./httpError');
const { validateAppointmentTime } = require('./time');

function parseId(value, field = 'id') {
  if (!['number', 'string'].includes(typeof value) || !/^[1-9]\d*$/.test(String(value)) || Number(value) > 4294967295) {
    throw httpError(400, field + ' must be a positive integer');
  }
  return Number(value);
}

function text(value, field, max) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw httpError(400, field + ' is required and must be at most ' + max + ' characters');
  }
  return value.trim();
}

function money(value, field) {
  if (!['number', 'string'].includes(typeof value) || !/^\d+(\.\d{1,2})?$/.test(String(value)) || Number(value) > 99999999.99) {
    throw httpError(400, field + ' must be a non-negative amount with at most two decimal places');
  }
  return Number(value).toFixed(2);
}

function bodyObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw httpError(400, 'A JSON object is required');
}

function validatePatient(body) {
  bodyObject(body);
  const email = text(body.email, 'email', 150).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError(400, 'email must be a valid email address');
  const phone = text(body.phone, 'phone', 30);
  if (!/^\+?[\d ()-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7) throw httpError(400, 'phone must contain at least seven digits');
  return { name: text(body.name, 'name', 100), email, phone };
}

function validateDoctor(body) {
  bodyObject(body);
  return {
    name: text(body.name, 'name', 100),
    specialty: text(body.specialty, 'specialty', 100),
    consultation_fee: money(body.consultation_fee, 'consultation_fee'),
    room: text(body.room, 'room', 20),
  };
}

function validateBooking(body, now = new Date()) {
  bodyObject(body);
  const data = {
    patient_id: parseId(body.patient_id, 'patient_id'),
    doctor_id: parseId(body.doctor_id, 'doctor_id'),
    appointment_datetime: validateAppointmentTime(body.appointment_datetime, now),
  };
  if (body.amount_paid !== undefined) data.amount_paid = money(body.amount_paid, 'amount_paid');
  return data;
}

module.exports = { parseId, text, money, bodyObject, validatePatient, validateDoctor, validateBooking };
