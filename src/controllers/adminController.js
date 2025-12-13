const pool = require('../../config/db');
const reportService = require('../services/reportService');
const claimRepo = require('../repositories/claimRepository');
const policyRepo = require('../repositories/policyRepository');
const paymentScheduler = require('../services/paymentScheduler');

async function getUsers(req, res) {
  const search = req.query.search || '';
  let query;
  let params;
  
  if (search) {
    // Search by name, email, phone, or user_id
    query = `SELECT u.user_id, u.full_name, u.email, u.phone, u.role, t.tier_name
     FROM client_info u
     LEFT JOIN tier t ON u.tier_id = t.tier_id
     WHERE u.user_id LIKE ? 
        OR u.full_name LIKE ? 
        OR u.email LIKE ? 
        OR u.phone LIKE ?
     ORDER BY u.user_id DESC`;
    const searchPattern = `%${search}%`;
    params = [searchPattern, searchPattern, searchPattern, searchPattern];
  } else {
    query = `SELECT u.user_id, u.full_name, u.email, u.phone, u.role, t.tier_name
     FROM client_info u
     LEFT JOIN tier t ON u.tier_id = t.tier_id
     ORDER BY u.user_id DESC`;
    params = [];
  }
  
  const [rows] = await pool.query(query, params);
  res.render('adminUsers', { title: 'Admin – Users', users: rows, search });
}

async function getUserDetail(req, res) {
  const { userId } = req.params;
  const userRepo = require('../repositories/clientRepository');
  const paymentRepo = require('../repositories/paymentRepository');
  const claimRepo = require('../repositories/claimRepository');
  const policyRepo = require('../repositories/policyRepository');
  
  // Get user info
  const user = await userRepo.findById(Number(userId));
  if (!user) {
    return res.status(404).render('error', { message: 'User not found', error: {} });
  }
  
  // Get user's policies
  const policies = await policyRepo.getUserPolicies(Number(userId));
  
  // Get user's payments
  const payments = await paymentRepo.getPaymentsByUser(Number(userId));
  
  // Get user's claims
  const claims = await claimRepo.getClaimsByUser(Number(userId));
  
  // Get tier info if exists
  let tier = null;
  if (user.tier_id) {
    const [tierRows] = await pool.query('SELECT * FROM tier WHERE tier_id = ?', [user.tier_id]);
    tier = tierRows[0] || null;
  }
  
  res.render('adminUserDetail', { 
    title: `Admin – User: ${user.full_name}`, 
    user,
    tier,
    policies,
    payments,
    claims
  });
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
  
  // If policy is approved (activated), generate payment schedule
  if (newStatus === 1) {
    try {
      await paymentScheduler.generatePaymentsForPolicyById(Number(id));
      console.log(`Payment schedule generated for policy ${id}`);
    } catch (error) {
      console.error(`Error generating payments for policy ${id}:`, error);
      // Don't fail the request, just log the error
    }
  }
  
  res.redirect('/admin/policies');
}

module.exports = { getUsers, getUserDetail, getReports, getPendingClaims, postUpdateClaim, getPendingPolicies, postUpdatePolicy };

