const paymentRepo = require('../repositories/paymentRepository');
const policyRepo = require('../repositories/policyRepository');

async function getPaymentHistory(policyId, sessionUser) {
  const policy = await policyRepo.getPolicyById(policyId);
  if (!policy) return null;
  if (sessionUser.role !== 'admin' && policy.user_id !== sessionUser.user_id) return null;
  const rows = await paymentRepo.getPaymentsByPolicyUser(policyId, policy.user_id);
  return { policy, payments: rows };
}

async function recordPayment(policyId, sessionUser, payload) {
  const policy = await policyRepo.getPolicyById(policyId);
  if (!policy) return null;
  if (sessionUser.role !== 'admin' && policy.user_id !== sessionUser.user_id) return null;
  const payment_id = await paymentRepo.insertPayment({
    policy_id: policyId,
    user_id: policy.user_id,
    amount: payload.amount,
    payment_date: payload.payment_date,
    method: payload.method || 'Card',
    status: payload.status || 'Completed'
  });
  await paymentRepo.logPaymentHistory({ payment_id, policy_id: policyId, user_id: policy.user_id, amount: payload.amount, status: 'Completed' });
  return payment_id;
}

module.exports = { getPaymentHistory, recordPayment };

