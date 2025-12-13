const pool = require('../../config/db');

async function getPaymentsByPolicyUser(policy_id, user_id) {
  const [rows] = await pool.query(
    `SELECT * FROM payment_info WHERE policy_id = ? AND user_id = ? ORDER BY due_date DESC, payment_date DESC`,
    [policy_id, user_id]
  );
  return rows;
}

async function insertPayment({ policy_id, user_id, amount, payment_date, due_date, method, payment_option, status }) {
  const [result] = await pool.query(
    `INSERT INTO payment_info (policy_id, user_id, amount, payment_date, due_date, method, payment_option, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [policy_id, user_id, amount, payment_date || null, due_date, method || null, payment_option || 'Monthly', status || 'Pending']
  );
  return result.insertId;
}

async function logPaymentHistory({ payment_id, policy_id, user_id, amount, status }) {
  await pool.query(
    `INSERT INTO payment_history (payment_id, policy_id, user_id, amount, status) VALUES (?, ?, ?, ?, ?)`,
    [payment_id, policy_id, user_id, amount, status]
  );
}

async function getPaymentsByUser(user_id) {
  // Update payment statuses first
  await updatePaymentStatuses();
  
  const [rows] = await pool.query(
    `SELECT pi.*, p.type_id
     FROM payment_info pi
     JOIN policy_info p ON pi.policy_id = p.policy_id
     WHERE pi.user_id = ?
     ORDER BY 
       CASE 
         WHEN pi.status = 'Pending' THEN 1
         WHEN pi.status = 'Completed' THEN 2
         WHEN pi.status = 'Upcoming' THEN 3
         WHEN pi.status = 'Overdue' THEN 4
         ELSE 5
       END,
       pi.due_date ASC, pi.payment_date DESC`,
    [user_id]
  );
  return rows;
}

// Update payment statuses: mark overdue payments and set next pending
async function updatePaymentStatuses() {
  const today = new Date().toISOString().split('T')[0];
  
  // Mark overdue payments (past due date, not paid)
  await pool.query(
    `UPDATE payment_info 
     SET status = 'Overdue'
     WHERE due_date < ? AND status IN ('Pending', 'Upcoming', 'Partially Paid') AND payment_date IS NULL`,
    [today]
  );
  
  // Mark all future unpaid payments as 'Upcoming' first
  await pool.query(
    `UPDATE payment_info 
     SET status = 'Upcoming'
     WHERE due_date >= ? AND status = 'Pending' AND payment_date IS NULL`,
    [today]
  );
  
  // For each policy, find the earliest upcoming payment and mark it as Pending
  // Get all policies with unpaid payments
  const [policies] = await pool.query(
    `SELECT DISTINCT policy_id 
     FROM payment_info 
     WHERE due_date >= ? AND payment_date IS NULL AND status IN ('Pending', 'Upcoming')`,
    [today]
  );
  
  for (const policy of policies) {
    // Get the earliest upcoming payment for this policy
    const [earliest] = await pool.query(
      `SELECT payment_id 
       FROM payment_info 
       WHERE policy_id = ? AND due_date >= ? AND payment_date IS NULL AND status IN ('Pending', 'Upcoming')
       ORDER BY due_date ASC 
       LIMIT 1`,
      [policy.policy_id, today]
    );
    
    if (earliest.length > 0) {
      // Mark this one as Pending
      await pool.query(
        `UPDATE payment_info SET status = 'Pending' WHERE payment_id = ?`,
        [earliest[0].payment_id]
      );
      
      // Mark all other future payments for this policy as Upcoming
      await pool.query(
        `UPDATE payment_info 
         SET status = 'Upcoming'
         WHERE policy_id = ? AND payment_id != ? AND due_date >= ? AND payment_date IS NULL`,
        [policy.policy_id, earliest[0].payment_id, today]
      );
    }
  }
}

// Get relevant payments: next pending, overdue, and recent paid
async function getRelevantPaymentsByUser(user_id, hideOverdue = true) {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
  
  // First, update payment statuses
  await updatePaymentStatuses();
  
  let query;
  let params;
  
  if (hideOverdue) {
    // Hide overdue payments
    query = `SELECT pi.*, p.type_id
     FROM payment_info pi
     JOIN policy_info p ON pi.policy_id = p.policy_id
     WHERE pi.user_id = ?
       AND pi.status != 'Overdue'
       AND (
         -- Next pending payment (only 1 per policy)
         (pi.status = 'Pending' AND pi.payment_date IS NULL)
         OR
         -- Recent paid payments (paid in last 30 days)
         (pi.payment_date >= ? AND pi.status = 'Completed')
       )
     ORDER BY 
       CASE 
         WHEN pi.status = 'Pending' THEN 1
         ELSE 2
       END,
       pi.due_date ASC, pi.payment_date DESC`;
    params = [user_id, thirtyDaysAgoStr];
  } else {
    // Show all relevant payments including overdue
    query = `SELECT pi.*, p.type_id
     FROM payment_info pi
     JOIN policy_info p ON pi.policy_id = p.policy_id
     WHERE pi.user_id = ?
       AND (
         -- Next pending payment (only 1 per policy)
         (pi.status = 'Pending' AND pi.payment_date IS NULL)
         OR
         -- Overdue payments
         (pi.status = 'Overdue')
         OR
         -- Recent paid payments (paid in last 30 days)
         (pi.payment_date >= ? AND pi.status = 'Completed')
       )
     ORDER BY 
       CASE 
         WHEN pi.status = 'Overdue' THEN 1
         WHEN pi.status = 'Pending' THEN 2
         ELSE 3
       END,
       pi.due_date ASC, pi.payment_date DESC`;
    params = [user_id, thirtyDaysAgoStr];
  }
  
  const [rows] = await pool.query(query, params);
  return rows;
}

// Get next pending payment for a policy (only 1 should be pending)
async function getUpcomingPaymentsByPolicy(policy_id, user_id) {
  const today = new Date().toISOString().split('T')[0];
  
  // Update payment statuses first
  await updatePaymentStatuses();
  
  const [rows] = await pool.query(
    `SELECT * FROM payment_info 
     WHERE policy_id = ? AND user_id = ? 
       AND status = 'Pending' 
       AND payment_date IS NULL
     ORDER BY due_date ASC
     LIMIT 1`,
    [policy_id, user_id]
  );
  return rows;
}

// Get all payments that can be paid (pending, overdue, partially paid)
async function getPayablePaymentsByPolicy(policy_id, user_id) {
  const today = new Date().toISOString().split('T')[0];
  
  // Update payment statuses first
  await updatePaymentStatuses();
  
  const [rows] = await pool.query(
    `SELECT * FROM payment_info 
     WHERE policy_id = ? AND user_id = ? 
       AND status IN ('Pending', 'Overdue', 'Partially Paid')
       AND payment_date IS NULL
     ORDER BY 
       CASE 
         WHEN status = 'Overdue' THEN 1
         WHEN status = 'Partially Paid' THEN 2
         WHEN status = 'Pending' THEN 3
         ELSE 4
       END,
       due_date ASC`,
    [policy_id, user_id]
  );
  return rows;
}

async function getActivePoliciesForPaymentGeneration() {
  // Get all active policies (status_id = 1) that haven't expired
  const [rows] = await pool.query(
    `SELECT p.policy_id, p.user_id, p.start_date, p.end_date, p.base_premium
     FROM policy_info p
     WHERE p.status_id = 1
       AND p.end_date >= CURDATE()
     ORDER BY p.start_date ASC`,
    []
  );
  return rows;
}

async function getExistingPaymentsForPolicy(policy_id, due_date) {
  // Check if a payment already exists for this policy and due date
  const [rows] = await pool.query(
    `SELECT payment_id FROM payment_info 
     WHERE policy_id = ? AND due_date = ?`,
    [policy_id, due_date]
  );
  return rows.length > 0;
}

async function aggregateMonthlyRevenue({ year, month }) {
  const [rows] = await pool.query(
    `SELECT SUM(amount) as total_revenue, COUNT(*) as payments_count
     FROM payment_info
     WHERE YEAR(payment_date) = ? AND MONTH(payment_date) = ? AND status = 'Completed'`,
    [year, month]
  );
  return rows[0] || { total_revenue: 0, payments_count: 0 };
}

module.exports = { 
  getPaymentsByPolicyUser, 
  insertPayment, 
  logPaymentHistory, 
  aggregateMonthlyRevenue, 
  getPaymentsByUser,
  getRelevantPaymentsByUser,
  getUpcomingPaymentsByPolicy,
  getPayablePaymentsByPolicy,
  updatePaymentStatuses,
  getActivePoliciesForPaymentGeneration,
  getExistingPaymentsForPolicy
};

