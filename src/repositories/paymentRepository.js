const pool = require('../../config/db');

async function getPaymentsByPolicyUser(policy_id, user_id) {
  const [rows] = await pool.query(
    `SELECT * FROM payment_info WHERE policy_id = ? AND user_id = ? ORDER BY payment_date DESC`,
    [policy_id, user_id]
  );
  return rows;
}

async function insertPayment({ policy_id, user_id, amount, payment_date, method, status }) {
  const [result] = await pool.query(
    `INSERT INTO payment_info (policy_id, user_id, amount, payment_date, method, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [policy_id, user_id, amount, payment_date, method, status]
  );
  return result.insertId;
}

async function logPaymentHistory({ payment_id, policy_id, user_id, amount, status }) {
  await pool.query(
    `INSERT INTO payment_history (payment_id, policy_id, user_id, amount, status) VALUES (?, ?, ?, ?, ?)`,
    [payment_id, policy_id, user_id, amount, status]
  );
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

module.exports = { getPaymentsByPolicyUser, insertPayment, logPaymentHistory, aggregateMonthlyRevenue };

