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
  // helper to safely query a detail table and gracefully handle missing-table errors
  async function safeDetailQuery(table) {
    try {
      const [rows] = await pool.query(`SELECT * FROM ${table} WHERE policy_id = ?`, [policyId]);
      return rows[0] || null;
    } catch (err) {
      if (err && err.code === 'ER_NO_SUCH_TABLE') {
        console.warn(`Detail table missing: ${table} — returning null details for policy ${policyId}`);
        return null;
      }
      throw err;
    }
  }

  if (policy.type_name === 'Auto') {
    policy.details = await safeDetailQuery('auto_policy_detail');
  } else if (policy.type_name === 'Home') {
    policy.details = await safeDetailQuery('home_policy_detail');
  } else if (policy.type_name === 'Pet') {
    policy.details = await safeDetailQuery('pet_policy_detail');
  } else if (policy.type_name === 'Renters') {
    policy.details = await safeDetailQuery('renters_policy_detail');
  } else if (policy.type_name === 'Business') {
    policy.details = await safeDetailQuery('business_policy_detail');
  } else if (policy.type_name === 'Health') {
    policy.details = await safeDetailQuery('health_policy_detail');
  } else if (policy.type_name === 'Life') {
    policy.details = await safeDetailQuery('life_policy_detail');
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

// Ensure an insurance_type row exists for a given id; if not, insert a sensible default name.
async function ensureInsuranceType(type_id, type_name) {
  const [rows] = await pool.query('SELECT type_id FROM insurance_type WHERE type_id = ?', [type_id]);
  if (rows && rows.length) return true;
  // insert with provided name or fallback
  const name = type_name || `Type ${type_id}`;
  await pool.query('INSERT INTO insurance_type (type_id, type_name) VALUES (?, ?)', [type_id, name]);
  return true;
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

async function createPetDetail({ policy_id, pet_name, species, age, deductible, coverage_amount, premium_amount }) {
  await pool.query(
    `INSERT INTO pet_policy_detail (policy_id, pet_name, species, age, deductible, coverage_amount, premium_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [policy_id, pet_name || null, species || null, age || null, deductible || null, coverage_amount || null, premium_amount || null]
  );
}

async function createRentersDetail({ policy_id, rental_address, personal_property_value, term, deductible, coverage_type, coverage_amount, premium_amount }) {
  await pool.query(
    `INSERT INTO renters_policy_detail (policy_id, rental_address, personal_property_value, term, deductible, coverage_type, coverage_amount, premium_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [policy_id, rental_address || null, personal_property_value || null, term || null, deductible || null, coverage_type || null, coverage_amount || null, premium_amount || null]
  );
}

async function createBusinessDetail({ policy_id, business_name, business_type, industry, annual_revenue, number_of_employees, business_address, contact_number, contact_email, deductible, coverage_type, coverage_amount, premium_amount }) {
  await pool.query(
    `INSERT INTO business_policy_detail (policy_id, business_name, business_type, industry, annual_revenue, number_of_employees, business_address, contact_number, contact_email, deductible, coverage_type, coverage_amount, premium_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [policy_id, business_name || null, business_type || null, industry || null, annual_revenue || null, number_of_employees || null, business_address || null, contact_number || null, contact_email || null, deductible || null, coverage_type || null, coverage_amount || null, premium_amount || null]
  );
}

async function createHealthDetail({ policy_id, provider, person_name, plan, age, deductible, coverage_amount, premium_amount }) {
  await pool.query(
    `INSERT INTO health_policy_detail (policy_id, provider, person_name, plan, age, deductible, coverage_amount, premium_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [policy_id, provider || null, person_name || null, plan || null, age || null, deductible || null, coverage_amount || null, premium_amount || null]
  );
}

async function createLifeDetail({ policy_id, beneficiary, person_name, term, age, deductible, coverage_amount, premium_amount }) {
  await pool.query(
    `INSERT INTO life_policy_detail (policy_id, beneficiary, person_name, term, age, deductible, coverage_amount, premium_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [policy_id, beneficiary || null, person_name || null, term || null, age || null, deductible || null, coverage_amount || null, premium_amount || null]
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

async function getPendingPolicies() {
  const [rows] = await pool.query(
    `SELECT p.*, it.type_name, ps.status_name, u.full_name, u.email
     FROM policy_info p
     JOIN insurance_type it ON p.type_id = it.type_id
     JOIN policy_status ps ON p.status_id = ps.status_id
     JOIN client_info u ON p.user_id = u.user_id
     WHERE p.status_id = 2
     ORDER BY p.created_at DESC`
  );
  return rows;
}

module.exports = {
  getUserPolicies,
  getPolicyById,
  getPolicyWithDetails,
  createPolicy,
  createAutoDetail,
  createHomeDetail,
  createPetDetail,
  createRentersDetail,
  createBusinessDetail,
  createHealthDetail,
  createLifeDetail,
  ensureInsuranceType,
  updatePolicy,
  logPolicyHistory
  ,getPendingPolicies
};

