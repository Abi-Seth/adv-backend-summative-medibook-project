const service = require('../services/waitlistService');
const doctors = require('../models/doctorModel');
const { parseId, validateBooking } = require('../utils/validation');
const { validateDate } = require('../utils/time');
const httpError = require('../utils/httpError');

async function join(req, res) {
  const entry = await service.join(validateBooking(req.body));
  res.status(201).json({ message: 'Added to waitlist', entry });
}

async function list(req, res) {
  const doctorId = parseId(req.params.doctorId, 'doctor_id');
  const date = validateDate(req.query.date);
  if (!await doctors.find(doctorId)) throw httpError(404, 'Doctor not found');
  res.json(await service.list(doctorId, date));
}

module.exports = { join, list };
