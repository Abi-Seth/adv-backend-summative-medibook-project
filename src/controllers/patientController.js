const patients = require('../models/patientModel');
const { parseId, validatePatient } = require('../utils/validation');
const httpError = require('../utils/httpError');

async function list(req, res) { res.json(await patients.list()); }

async function get(req, res) {
  const patient = await patients.find(parseId(req.params.id));
  if (!patient) throw httpError(404, 'Patient not found');
  res.json(patient);
}

async function create(req, res) { res.status(201).json(await patients.create(validatePatient(req.body))); }

async function update(req, res) {
  const patient = await patients.update(parseId(req.params.id), validatePatient(req.body));
  if (!patient) throw httpError(404, 'Patient not found');
  res.json(patient);
}

async function remove(req, res) {
  if (!await patients.remove(parseId(req.params.id))) throw httpError(404, 'Patient not found');
  res.status(204).end();
}

module.exports = { list, get, create, update, remove };
