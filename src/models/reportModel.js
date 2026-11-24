const db = require('../config/db');

async function doctorStats(doctorId, now) {
  const today = now.slice(0, 10);
  const [summary] = await db.execute(
    `SELECT COALESCE(SUM(amount_paid - refund_amount), 0) AS revenue_collected,
      COALESCE(SUM(status = 'confirmed' AND appointment_datetime > ?), 0) AS upcoming_appointment_count,
      ROUND(COALESCE(SUM(status = 'confirmed' AND appointment_datetime >= ?
        AND appointment_datetime < DATE_ADD(?, INTERVAL 7 DAY)), 0) * 100 / 84, 2) AS utilization_percentage
     FROM appointments WHERE doctor_id = ?`,
    [now, today, today, doctorId],
  );
  const [days] = await db.execute(
    `WITH RECURSIVE days AS (
       SELECT CAST(? AS DATE) AS appointment_date
       UNION ALL SELECT appointment_date + INTERVAL 1 DAY FROM days
       WHERE appointment_date < DATE_ADD(CAST(? AS DATE), INTERVAL 6 DAY)
     )
     SELECT days.appointment_date, COUNT(a.id) AS appointment_count,
       ROUND(COUNT(a.id) * 100 / 12, 2) AS utilization_percentage
     FROM days LEFT JOIN appointments a ON a.doctor_id = ? AND a.status = 'confirmed'
       AND a.appointment_datetime >= days.appointment_date
       AND a.appointment_datetime < days.appointment_date + INTERVAL 1 DAY
     GROUP BY days.appointment_date ORDER BY days.appointment_date`,
    [today, today, doctorId],
  );
  return { doctor_id: doctorId, ...summary[0], appointments_per_day: days };
}

async function doctorsReport() {
  const [rows] = await db.execute(
    `SELECT d.id AS doctor_id, d.name, COUNT(a.id) AS total_appointments,
       COALESCE(SUM(a.status = 'confirmed'), 0) AS confirmed_appointments,
       COALESCE(SUM(a.amount_paid - a.refund_amount), 0) AS revenue_collected
     FROM doctors d LEFT JOIN appointments a ON a.doctor_id = d.id
     GROUP BY d.id, d.name ORDER BY d.id`,
  );
  return rows;
}

async function busyDays() {
  const [rows] = await db.execute(
    `SELECT d.id AS doctor_id, d.name, DATE(a.appointment_datetime) AS appointment_date,
       COUNT(a.id) AS appointment_count, ROUND(COUNT(a.id) * 100 / 12, 2) AS utilization_percentage
     FROM doctors d JOIN appointments a ON a.doctor_id = d.id
     WHERE a.status = ? GROUP BY d.id, d.name, DATE(a.appointment_datetime)
     HAVING COUNT(a.id) > ? ORDER BY appointment_date, doctor_id`,
    ['confirmed', 12 * 0.8],
  );
  return rows;
}

module.exports = { doctorStats, doctorsReport, busyDays };
