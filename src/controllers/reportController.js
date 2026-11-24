const reports = require('../models/reportModel');
const doctors = require('../models/doctorModel');
const { parseId } = require('../utils/validation');
const { clinicNow } = require('../utils/time');
const httpError = require('../utils/httpError');

async function doctorStats(req, res) {
  const id = parseId(req.params.id);
  if (!await doctors.find(id)) throw httpError(404, 'Doctor not found');
  // Revenue is net of refunds. Overall utilization covers today plus six days.
  res.json(await reports.doctorStats(id, clinicNow()));
}

async function doctorsReport(req, res) { res.json(await reports.doctorsReport()); }
async function busyDays(req, res) { res.json(await reports.busyDays()); }

module.exports = { doctorStats, doctorsReport, busyDays };
