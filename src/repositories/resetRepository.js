const pool = require('../../config/db');

async function createReset({ user_id, token, expires_at }) {
  const [result] = await pool.query(
    'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
    [user_id, token, expires_at]
  );
  return result.insertId;
}

async function findByToken(token) {
  const [rows] = await pool.query('SELECT * FROM password_resets WHERE token = ?', [token]);
  return rows[0] || null;
}

async function deleteById(id) {
  await pool.query('DELETE FROM password_resets WHERE id = ?', [id]);
}

module.exports = { createReset, findByToken, deleteById };
