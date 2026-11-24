const httpError = require('./httpError');

// All API date/time strings use clinic local time: Africa/Kigali (UTC+02:00).
function clinicNow(date = new Date()) {
  return new Date(date.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
}

function parseDateTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    throw httpError(400, 'appointment_datetime must be YYYY-MM-DD HH:mm:ss in Kigali time');
  }
  const normalized = value.replace('T', ' ') + (value.length === 16 ? ':00' : '');
  const date = new Date(normalized.replace(' ', 'T') + '+02:00');
  if (!Number.isFinite(date.getTime()) || clinicNow(date) !== normalized || Number(normalized.slice(0, 4)) < 1000) {
    throw httpError(400, 'appointment_datetime must be a valid calendar date and time');
  }
  return { date, normalized };
}

function validateAppointmentTime(value, now = new Date()) {
  const { date, normalized } = parseDateTime(value);
  const hour = Number(normalized.slice(11, 13));
  const minute = Number(normalized.slice(14, 16));
  const second = Number(normalized.slice(17, 19));
  if (hour < 9 || hour >= 17 || minute % 30 !== 0 || second !== 0) {
    throw httpError(422, 'Appointments start every 30 minutes from 09:00 through 16:30');
  }
  if (date <= now) throw httpError(422, 'Appointments must be booked in the future');
  return normalized;
}

function validateDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw httpError(400, 'date must be YYYY-MM-DD');
  }
  parseDateTime(value + ' 09:00:00');
  return value;
}

module.exports = { clinicNow, parseDateTime, validateAppointmentTime, validateDate };
