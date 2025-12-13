const paymentRepo = require('../repositories/paymentRepository');

/**
 * Calculate the next payment due date for a policy
 * Payments start the month after the policy start date
 * @param {Date} startDate - Policy start date
 * @param {number} monthOffset - Which month payment (0 = first payment, 1 = second, etc.)
 * @returns {Date} The due date for this payment
 */
function calculatePaymentDueDate(startDate, monthOffset) {
  const start = new Date(startDate);
  // First payment is due the month after start date
  const dueDate = new Date(start.getFullYear(), start.getMonth() + 1 + monthOffset, start.getDate());
  return dueDate;
}

/**
 * Generate monthly payments for an active policy
 * Creates payment records for all months from start_date to end_date
 * @param {Object} policy - Policy object with policy_id, user_id, start_date, end_date, base_premium
 * @returns {Promise<number>} Number of payments created
 */
async function generatePaymentsForPolicy(policy) {
  const { policy_id, user_id, start_date, end_date, base_premium } = policy;
  
  const start = new Date(start_date);
  const end = new Date(end_date);
  
  // Calculate how many monthly payments are needed
  // First payment is due the month after start date
  let monthOffset = 0;
  let dueDate = calculatePaymentDueDate(start_date, monthOffset);
  let paymentsCreated = 0;
  
  // Generate payments until we exceed the end date
  while (dueDate <= end) {
    // Check if payment already exists for this due date
    const exists = await paymentRepo.getExistingPaymentsForPolicy(policy_id, dueDate.toISOString().split('T')[0]);
    
    if (!exists) {
      // Determine status: only the first payment should be Pending, others are Upcoming
      const today = new Date();
      const dueDateObj = new Date(dueDate);
      let status = 'Upcoming';
      
      // If this is the first payment (monthOffset === 0) and it's not in the past, mark as Pending
      if (monthOffset === 0 && dueDateObj >= today) {
        status = 'Pending';
      } else if (dueDateObj < today) {
        // Past due payments should be Overdue
        status = 'Overdue';
      }
      
      await paymentRepo.insertPayment({
        policy_id,
        user_id,
        amount: base_premium,
        payment_date: null, // Not paid yet
        due_date: dueDate.toISOString().split('T')[0],
        method: null,
        payment_option: 'Monthly',
        status: status
      });
      paymentsCreated++;
    }
    
    // Move to next month
    monthOffset++;
    dueDate = calculatePaymentDueDate(start_date, monthOffset);
  }
  
  return paymentsCreated;
}

/**
 * Generate payments for all active policies
 * This should be run periodically (e.g., daily or monthly) to ensure all active policies have payment records
 * @returns {Promise<Object>} Summary of payments generated
 */
async function generatePaymentsForAllActivePolicies() {
  const activePolicies = await paymentRepo.getActivePoliciesForPaymentGeneration();
  
  let totalPaymentsCreated = 0;
  const results = {
    policiesProcessed: 0,
    paymentsCreated: 0,
    errors: []
  };
  
  for (const policy of activePolicies) {
    try {
      const count = await generatePaymentsForPolicy(policy);
      results.policiesProcessed++;
      results.paymentsCreated += count;
      totalPaymentsCreated += count;
    } catch (error) {
      results.errors.push({
        policy_id: policy.policy_id,
        error: error.message
      });
      console.error(`Error generating payments for policy ${policy.policy_id}:`, error);
    }
  }
  
  return results;
}

/**
 * Generate payments for a specific policy (useful when a policy is activated)
 * @param {number} policyId - The policy ID to generate payments for
 * @returns {Promise<number>} Number of payments created
 */
async function generatePaymentsForPolicyById(policyId) {
  const pool = require('../../config/db');
  const [rows] = await pool.query(
    `SELECT policy_id, user_id, start_date, end_date, base_premium
     FROM policy_info
     WHERE policy_id = ? AND status_id = 1`,
    [policyId]
  );
  
  if (rows.length === 0) {
    throw new Error(`Policy ${policyId} not found or not active`);
  }
  
  return await generatePaymentsForPolicy(rows[0]);
}

module.exports = {
  generatePaymentsForPolicy,
  generatePaymentsForAllActivePolicies,
  generatePaymentsForPolicyById,
  calculatePaymentDueDate
};

