const db = require('../config/db');
const httpError = require('../utils/httpError');

// All bookings/cancellations for one doctor use this lock, including the worker.
async function withDoctor(doctorId, action) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT id, name, consultation_fee FROM doctors WHERE id = ? FOR UPDATE', [doctorId]);
    if (!rows[0]) throw httpError(404, 'Doctor not found');
    const result = await action(rows[0], connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function find(id, connection = db) {
  const [rows] = await connection.execute('SELECT * FROM appointments WHERE id = ?', [id]);
  return rows[0];
}

async function findByReference(reference, connection) {
  const [rows] = await connection.execute('SELECT * FROM appointments WHERE appt_ref = ?', [reference]);
  return rows[0];
}

async function bookedForDay(doctorId, date, connection) {
  const [rows] = await connection.execute(
    'SELECT appointment_datetime FROM appointments WHERE doctor_id = ? AND status = ? AND DATE(appointment_datetime) = ? ORDER BY appointment_datetime',
    [doctorId, 'confirmed', date],
  );
  return rows.map(row => row.appointment_datetime);
}

async function create(data, connection) {
  const [result] = await connection.execute(
    'INSERT INTO appointments (appt_ref, patient_id, doctor_id, appointment_datetime, amount_paid, booked_on) VALUES (?, ?, ?, ?, ?, ?)',
    [data.appt_ref, data.patient_id, data.doctor_id, data.appointment_datetime, data.amount_paid, data.booked_on],
  );
  return find(result.insertId, connection);
}

async function cancel(id, refund, cancelledAt, connection) {
  await connection.execute('UPDATE appointments SET status = ?, cancelled_at = ?, refund_amount = ? WHERE id = ?', ['cancelled', cancelledAt, refund, id]);
  return find(id, connection);
}

module.exports = { withDoctor, find, findByReference, bookedForDay, create, cancel };
