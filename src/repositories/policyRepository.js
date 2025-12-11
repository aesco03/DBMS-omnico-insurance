const pool = require('../../config/db');

async function getUserPolicies(userId) {
  const [rows] = await pool.query(
    `SELECT p.*, it.type_name, ps.status_name
     FROM policy_info p
     JOIN insurance_type it ON p.type_id = it.type_id
     JOIN policy_status ps ON p.status_id = ps.status_id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC`,
    [userId]
  );
  return rows;
}

async function getPolicyById(policyId) {
  const [rows] = await pool.query(
    `SELECT p.*, it.type_name, ps.status_name
     FROM policy_info p
     JOIN insurance_type it ON p.type_id = it.type_id
     JOIN policy_status ps ON p.status_id = ps.status_id
     WHERE p.policy_id = ?`,
    [policyId]
  );
  return rows[0] || null;
}

async function getPolicyWithDetails(policyId) {
  const policy = await getPolicyById(policyId);
  if (!policy) return null;
  if (policy.type_name === 'Auto') {
    const [rows] = await pool.query('SELECT * FROM auto_policy_detail WHERE policy_id = ?', [policyId]);
    policy.details = rows[0] || null;
  } else if (policy.type_name === 'Home') {
    const [rows] = await pool.query('SELECT * FROM home_policy_detail WHERE policy_id = ?', [policyId]);
    policy.details = rows[0] || null;
  } else {
    policy.details = null;
  }
  return policy;
}

async function createPolicy({ user_id, type_id, start_date, end_date, base_premium, status_id }) {
  const [result] = await pool.query(
    `INSERT INTO policy_info (user_id, type_id, start_date, end_date, base_premium, status_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user_id, type_id, start_date, end_date, base_premium, status_id]
  );
  return result.insertId;
}

async function createAutoDetail({ policy_id, vehicle_make, vehicle_model, vehicle_year, vehicle_vin, coverage_type, premium_amount }) {
  await pool.query(
    `INSERT INTO auto_policy_detail (policy_id, vehicle_make, model, year, vin, coverage_type, premium_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [policy_id, vehicle_make || null, vehicle_model || null, vehicle_year || null, vehicle_vin || null, coverage_type || null, premium_amount || null]
  );
}

async function createHomeDetail({ policy_id, property_address, property_value, coverage_limit, deductible }) {
  await pool.query(
    `INSERT INTO home_policy_detail (policy_id, property_address, property_value, coverage_limit, deductible)
     VALUES (?, ?, ?, ?, ?)`,
    [policy_id, property_address || null, property_value || null, coverage_limit || null, deductible || null]
  );
}

async function updatePolicy(policy_id, payload) {
  const fields = [];
  const values = [];
  for (const key of ['start_date', 'end_date', 'base_premium', 'status_id']) {
    if (payload[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(payload[key]);
    }
  }
  if (!fields.length) return 0;
  values.push(policy_id);
  const [result] = await pool.query(`UPDATE policy_info SET ${fields.join(', ')} WHERE policy_id = ?`, values);
  return result.affectedRows;
}

async function logPolicyHistory({ policy_id, user_id, status_id, base_premium }) {
  await pool.query(
    `INSERT INTO policy_history (policy_id, user_id, status_id, base_premium) VALUES (?, ?, ?, ?)`,
    [policy_id, user_id, status_id, base_premium]
  );
}

module.exports = {
  getUserPolicies,
  getPolicyById,
  getPolicyWithDetails,
  createPolicy,
  createAutoDetail,
  createHomeDetail,
  updatePolicy,
  logPolicyHistory
};

