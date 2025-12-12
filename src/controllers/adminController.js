const pool = require('../../config/db');
const reportService = require('../services/reportService');
const claimRepo = require('../repositories/claimRepository');
const policyRepo = require('../repositories/policyRepository');

async function getUsers(req, res) {
  const [rows] = await pool.query(
    `SELECT u.user_id, u.full_name, u.email, u.role, t.tier_name
     FROM client_info u
     LEFT JOIN tier t ON u.tier_id = t.tier_id
     ORDER BY u.user_id DESC`
  );
  res.render('adminUsers', { title: 'Admin – Users', users: rows });
}

async function getReports(req, res) {
  const now = new Date();
  const year = Number(req.query.year) || now.getFullYear();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const report = await reportService.generateMonthlyRevenueReport({ year, month });
  res.render('adminReports', { title: 'Admin – Reports', report });
}

async function getPendingClaims(req, res) {
  const claims = await claimRepo.getSubmittedClaims();
  res.render('adminClaims', { title: 'Admin – Pending Claims', claims });
}

async function postUpdateClaim(req, res) {
  const { id } = req.params;
  const { action } = req.body;
  const claim = await claimRepo.getClaimById(Number(id));
  if (!claim) return res.status(404).render('error', { message: 'Claim not found', error: {} });
  const status = action === 'approve' ? 'Approved' : 'Rejected';
  await claimRepo.updateClaimStatus(Number(id), status);
  await claimRepo.logClaimHistory({ claim_id: Number(id), policy_id: claim.policy_id, user_id: claim.user_id, claim_status: status });
  res.redirect('/admin/claims');
}

async function getPendingPolicies(req, res) {
  const policies = await policyRepo.getPendingPolicies();
  res.render('adminPolicies', { title: 'Admin – Pending Policies', policies });
}

async function postUpdatePolicy(req, res) {
  const { id } = req.params;
  const { action } = req.body;
  const policy = await policyRepo.getPolicyById(Number(id));
  if (!policy) return res.status(404).render('error', { message: 'Policy not found', error: {} });
  const newStatus = action === 'approve' ? 1 : 3; // 1=Active, 3=Cancelled
  await policyRepo.updatePolicy(Number(id), { status_id: newStatus });
  await policyRepo.logPolicyHistory({ policy_id: Number(id), user_id: policy.user_id, status_id: newStatus, base_premium: policy.base_premium });
  res.redirect('/admin/policies');
}

module.exports = { getUsers, getReports, getPendingClaims, postUpdateClaim, getPendingPolicies, postUpdatePolicy };

