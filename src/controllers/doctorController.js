const doctors = require('../models/doctorModel');
const { parseId, validateDoctor } = require('../utils/validation');
const httpError = require('../utils/httpError');

async function list(req, res) { res.json(await doctors.list()); }

async function get(req, res) {
  const doctor = await doctors.find(parseId(req.params.id));
  if (!doctor) throw httpError(404, 'Doctor not found');
  res.json(doctor);
}

async function create(req, res) { res.status(201).json(await doctors.create(validateDoctor(req.body))); }

async function update(req, res) {
  const doctor = await doctors.update(parseId(req.params.id), validateDoctor(req.body));
  if (!doctor) throw httpError(404, 'Doctor not found');
  res.json(doctor);
}

async function remove(req, res) {
  if (!await doctors.remove(parseId(req.params.id))) throw httpError(404, 'Doctor not found');
  res.status(204).end();
}

module.exports = { list, get, create, update, remove };
