const claimRepo = require('../repositories/claimRepository');
const policyRepo = require('../repositories/policyRepository');

async function createClaim(policyId, sessionUser, payload) {
  const policy = await policyRepo.getPolicyById(policyId);
  if (!policy) return null;
  if (sessionUser.role !== 'admin' && policy.user_id !== sessionUser.user_id) return null;
  const claim_id = await claimRepo.insertClaim({
    policy_id: policyId,
    user_id: policy.user_id,
    claim_date: payload.claim_date,
    claim_amount: payload.claim_amount,
    claim_status: 'Submitted',
    description: payload.description || null
  });
  await claimRepo.logClaimHistory({ claim_id, policy_id: policyId, user_id: policy.user_id, claim_status: 'Submitted' });
  return claim_id;
}

async function getClaimsForPolicy(policyId, sessionUser) {
  const policy = await policyRepo.getPolicyById(policyId);
  if (!policy) return null;
  if (sessionUser.role !== 'admin' && policy.user_id !== sessionUser.user_id) return null;
  const rows = await claimRepo.getClaimsByPolicyUser(policyId, policy.user_id);
  return { policy, claims: rows };
}

module.exports = { createClaim, getClaimsForPolicy };

