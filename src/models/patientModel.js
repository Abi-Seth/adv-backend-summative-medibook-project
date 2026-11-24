const db = require('../config/db');

async function list() {
  const [rows] = await db.execute('SELECT id, name, email, phone FROM patients ORDER BY id');
  return rows;
}

async function find(id, connection = db) {
  const [rows] = await connection.execute('SELECT id, name, email, phone FROM patients WHERE id = ?', [id]);
  return rows[0];
}

async function create(data) {
  const [result] = await db.execute('INSERT INTO patients (name, email, phone) VALUES (?, ?, ?)', [data.name, data.email, data.phone]);
  return find(result.insertId);
}

async function update(id, data) {
  const [result] = await db.execute('UPDATE patients SET name = ?, email = ?, phone = ? WHERE id = ?', [data.name, data.email, data.phone, id]);
  return result.affectedRows ? find(id) : undefined;
}

async function remove(id) {
  const [result] = await db.execute('DELETE FROM patients WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { list, find, create, update, remove };
