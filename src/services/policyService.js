const policyRepo = require('../repositories/policyRepository');
const claimRepo = require('../repositories/claimRepository');
const paymentRepo = require('../repositories/paymentRepository');

async function getUserPolicies(userId) {
  return policyRepo.getUserPolicies(userId);
}

async function getPolicyDetails(policyId, sessionUser) {
  const policy = await policyRepo.getPolicyWithDetails(policyId);
  if (!policy) return null;
  if (sessionUser.role !== 'admin' && policy.user_id !== sessionUser.user_id) return null;
  const claims = await claimRepo.getClaimsByPolicyUser(policyId, policy.user_id);
  const payments = await paymentRepo.getPaymentsByPolicyUser(policyId, policy.user_id);
  return { policy, claims, payments };
}

module.exports = { getUserPolicies, getPolicyDetails };

