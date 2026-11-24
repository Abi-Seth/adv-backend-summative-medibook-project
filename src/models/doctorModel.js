const db = require('../config/db');

async function list() {
  const [rows] = await db.execute('SELECT id, name, specialty, consultation_fee, room FROM doctors ORDER BY id');
  return rows;
}

async function find(id) {
  const [rows] = await db.execute('SELECT id, name, specialty, consultation_fee, room FROM doctors WHERE id = ?', [id]);
  return rows[0];
}

async function create(data) {
  const [result] = await db.execute('INSERT INTO doctors (name, specialty, consultation_fee, room) VALUES (?, ?, ?, ?)', [data.name, data.specialty, data.consultation_fee, data.room]);
  return find(result.insertId);
}

async function update(id, data) {
  const [result] = await db.execute('UPDATE doctors SET name = ?, specialty = ?, consultation_fee = ?, room = ? WHERE id = ?', [data.name, data.specialty, data.consultation_fee, data.room, id]);
  return result.affectedRows ? find(id) : undefined;
}

async function remove(id) {
  const [result] = await db.execute('DELETE FROM doctors WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { list, find, create, update, remove };
