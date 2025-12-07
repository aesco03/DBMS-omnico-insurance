const pool = require('../../config/db');

async function findById(tier_id) {
  const [rows] = await pool.query('SELECT * FROM tier WHERE tier_id = ?', [tier_id]);
  return rows[0] || null;
}

module.exports = { findById };

