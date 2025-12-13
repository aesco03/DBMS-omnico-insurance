const paymentRepo = require('../repositories/paymentRepository');
const policyRepo = require('../repositories/policyRepository');

async function getPaymentHistory(policyId, sessionUser, showAll = false) {
  const policy = await policyRepo.getPolicyById(policyId);
  if (!policy) return null;
  if (sessionUser.role !== 'admin' && policy.user_id !== sessionUser.user_id) return null;
  
  // Update payment statuses before fetching
  await paymentRepo.updatePaymentStatuses();
  
  let rows;
  if (showAll) {
    rows = await paymentRepo.getPaymentsByPolicyUser(policyId, policy.user_id);
  } else {
    // Show upcoming, pending, overdue, and partially paid - anything that can be paid
    rows = await paymentRepo.getPayablePaymentsByPolicy(policyId, policy.user_id);
  }
  
  return { policy, payments: rows };
}

async function recordPayment(policyId, sessionUser, payload) {
  const policy = await policyRepo.getPolicyById(policyId);
  if (!policy) return null;
  if (sessionUser.role !== 'admin' && policy.user_id !== sessionUser.user_id) return null;
  
  // If this is updating an existing pending payment, we need to update it instead of creating new
  // For now, we'll create a new payment record with the payment details
  const payment_id = await paymentRepo.insertPayment({
    policy_id: policyId,
    user_id: policy.user_id,
    amount: payload.amount,
    payment_date: payload.payment_date,
    due_date: payload.due_date || payload.payment_date, // Use payment_date as due_date if not specified
    method: payload.method || 'Card',
    payment_option: payload.payment_option || 'Monthly',
    status: payload.status || 'Completed'
  });
  await paymentRepo.logPaymentHistory({ payment_id, policy_id: policyId, user_id: policy.user_id, amount: payload.amount, status: payload.status || 'Completed' });
  return payment_id;
}

/**
 * Update an existing pending payment to mark it as paid
 * @param {number} paymentId - The payment ID to update
 * @param {Object} payload - Payment details (payment_date, method)
 * @returns {Promise<boolean>} Success status
 */
async function markPaymentAsPaid(paymentId, payload) {
  const pool = require('../../config/db');
  const paymentAmount = parseFloat(payload.amount);
  
  // Get the original payment details
  const [paymentRows] = await pool.query(
    `SELECT policy_id, user_id, amount, due_date FROM payment_info WHERE payment_id = ?`,
    [paymentId]
  );
  
  if (paymentRows.length === 0) {
    return false;
  }
  
  const originalPayment = paymentRows[0];
  const originalAmount = parseFloat(originalPayment.amount);
  const isPartialPayment = paymentAmount < originalAmount;
  
  if (isPartialPayment) {
    // Partial payment - update original payment with partial amount
    const remainingAmount = originalAmount - paymentAmount;
    
    // Update original payment to show partial payment
    await pool.query(
      `UPDATE payment_info 
       SET payment_date = ?, method = ?, status = 'Partially Paid', amount = ?
       WHERE payment_id = ?`,
      [payload.payment_date, payload.method || 'Card', paymentAmount, paymentId]
    );
    
    // Create a new payment record for the remaining balance
    const newDueDate = new Date(originalPayment.due_date);
    newDueDate.setDate(newDueDate.getDate() + 1); // Due tomorrow or adjust as needed
    
    await paymentRepo.insertPayment({
      policy_id: originalPayment.policy_id,
      user_id: originalPayment.user_id,
      amount: remainingAmount,
      payment_date: null,
      due_date: newDueDate.toISOString().split('T')[0],
      method: null,
      payment_option: 'Monthly',
      status: new Date(originalPayment.due_date) < new Date() ? 'Overdue' : 'Pending'
    });
    
    // Log history for partial payment
    await paymentRepo.logPaymentHistory({
      payment_id: paymentId,
      policy_id: originalPayment.policy_id,
      user_id: originalPayment.user_id,
      amount: paymentAmount,
      status: 'Partially Paid'
    });
  } else {
    // Full payment - mark as completed
    const [result] = await pool.query(
      `UPDATE payment_info 
       SET payment_date = ?, method = ?, status = 'Completed'
       WHERE payment_id = ? AND status IN ('Pending', 'Overdue', 'Partially Paid')`,
      [payload.payment_date, payload.method || 'Card', paymentId]
    );
    
    if (result.affectedRows > 0) {
      await paymentRepo.logPaymentHistory({
        payment_id: paymentId,
        policy_id: originalPayment.policy_id,
        user_id: originalPayment.user_id,
        amount: originalAmount,
        status: 'Completed'
      });
    }
  }
  
  // Update payment statuses to mark next payment as Pending
  await paymentRepo.updatePaymentStatuses();
  return true;
}

module.exports = { getPaymentHistory, recordPayment, markPaymentAsPaid };

