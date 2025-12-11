const { body, validationResult } = require('express-validator');
const claimService = require('../services/claimService');
const policyRepo = require('../repositories/policyRepository');
const claimRepo = require('../repositories/claimRepository');

function claimValidators() {
  return [
    body('policy_id').isInt().withMessage('Policy required'),
    body('claim_date').isISO8601().withMessage('Valid date required'),
    body('claim_amount').isFloat({ gt: 0 }).withMessage('Valid amount required')
  ];
}

async function getNewClaim(req, res) {
  const { policyId } = req.params;
  const policy = await policyRepo.getPolicyById(policyId);
  if (!policy) return res.status(404).render('error', { message: 'Policy not found', error: {} });
  res.render('claimForm', { title: 'Submit Claim', policy, errors: [], old: {} });
}

// Render a selection page where the user picks which policy to file a claim for
async function getNewClaimSelection(req, res) {
  const userId = req.session.user.user_id;
  const policies = await policyRepo.getUserPolicies(userId);
  res.render('claims/select', { title: 'File a Claim', policies });
}

async function postClaim(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const policy = await policyRepo.getPolicyById(req.body.policy_id);
    return res.status(400).render('claimForm', { title: 'Submit Claim', policy, errors: errors.array(), old: req.body });
  }
  const { policy_id, claim_date, claim_amount, description } = req.body;
  await claimService.createClaim(Number(policy_id), req.session.user, { claim_date, claim_amount, description });
  res.redirect(`/policies/${policy_id}`);
}

async function getClaimsIndex(req, res) {
  const userId = req.session.user.user_id;
  const claims = await claimRepo.getClaimsByUser(userId);
  res.render('claims/index', { title: 'My Claims', claims });
}

module.exports = { claimValidators, getNewClaim, postClaim, getClaimsIndex, getNewClaimSelection };

