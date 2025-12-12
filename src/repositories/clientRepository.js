const pool = require('../../config/db');

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM client_info WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findById(userId) {
  const [rows] = await pool.query('SELECT * FROM client_info WHERE user_id = ?', [userId]);
  return rows[0] || null;
}

async function createUser({ full_name, email, phone, address, city, state, password_hash, role = 'customer', tier_id = null }) {
  const [result] = await pool.query(
    'INSERT INTO client_info (full_name, email, phone, address, city, state, password_hash, role, tier_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [full_name, email, phone, address, city, state, password_hash, role, tier_id]
  );
  return result.insertId;
}

async function updatePassword(user_id, password_hash) {
  const [result] = await pool.query('UPDATE client_info SET password_hash = ? WHERE user_id = ?', [password_hash, user_id]);
  return result.affectedRows;
}

module.exports = { findByEmail, findById, createUser, updatePassword };

