const pool = require('../../config/db');

async function getInsuranceTypes() {
  const [rows] = await pool.query('SELECT * FROM insurance_type ORDER BY type_name');
  return rows;
}

async function getPolicyStatuses() {
  const [rows] = await pool.query('SELECT * FROM policy_status ORDER BY status_name');
  return rows;
}

module.exports = { getInsuranceTypes, getPolicyStatuses };

