const appointments = require('../models/appointmentModel');
const service = require('../services/appointmentService');
const { parseId, validateBooking } = require('../utils/validation');
const httpError = require('../utils/httpError');

async function get(req, res) {
  const appointment = await appointments.find(parseId(req.params.id));
  if (!appointment) throw httpError(404, 'Appointment not found');
  res.json(appointment);
}

async function book(req, res) { res.status(201).json(await service.book(validateBooking(req.body))); }

async function cancel(req, res) {
  const appointment = await service.cancel(parseId(req.params.id));
  res.json({ message: 'Appointment cancelled', refund_amount: appointment.refund_amount, appointment });
}

module.exports = { get, book, cancel };
