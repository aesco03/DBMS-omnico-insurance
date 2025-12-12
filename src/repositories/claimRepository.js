const pool = require('../../config/db');

async function getClaimsByPolicyUser(policy_id, user_id) {
  const [rows] = await pool.query(
    `SELECT * FROM claims WHERE policy_id = ? AND user_id = ? ORDER BY claim_date DESC`,
    [policy_id, user_id]
  );
  return rows;
}

async function insertClaim({ policy_id, user_id, claim_date, claim_amount, claim_status, description }) {
  const [result] = await pool.query(
    `INSERT INTO claims (policy_id, user_id, claim_date, claim_amount, claim_status, description)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [policy_id, user_id, claim_date, claim_amount, claim_status, description]
  );
  return result.insertId;
}

async function logClaimHistory({ claim_id, policy_id, user_id, claim_status }) {
  await pool.query(
    `INSERT INTO claim_history (claim_id, policy_id, user_id, claim_status) VALUES (?, ?, ?, ?)`,
    [claim_id, policy_id, user_id, claim_status]
  );
}

async function getClaimsByUser(user_id) {
  const [rows] = await pool.query(
    `SELECT c.*, p.type_id, p.user_id as policy_owner
     FROM claims c
     JOIN policy_info p ON c.policy_id = p.policy_id
     WHERE c.user_id = ?
     ORDER BY c.claim_date DESC`,
    [user_id]
  );
  return rows;
}

async function getSubmittedClaims() {
  const [rows] = await pool.query(
    `SELECT c.*, p.type_id, p.user_id as policy_owner, u.full_name, u.email
     FROM claims c
     JOIN policy_info p ON c.policy_id = p.policy_id
     JOIN client_info u ON c.user_id = u.user_id
     WHERE c.claim_status = 'Submitted'
     ORDER BY c.created_at DESC`
  );
  return rows;
}

async function getClaimById(claim_id) {
  const [rows] = await pool.query('SELECT * FROM claims WHERE claim_id = ?', [claim_id]);
  return rows[0] || null;
}

async function updateClaimStatus(claim_id, claim_status) {
  const [result] = await pool.query('UPDATE claims SET claim_status = ? WHERE claim_id = ?', [claim_status, claim_id]);
  return result.affectedRows;
}

module.exports = { getClaimsByPolicyUser, insertClaim, logClaimHistory, getClaimsByUser, getSubmittedClaims, getClaimById, updateClaimStatus };


