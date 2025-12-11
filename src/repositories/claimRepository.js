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

module.exports = { getClaimsByPolicyUser, insertClaim, logClaimHistory, getClaimsByUser };


