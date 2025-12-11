const policyService = require('../services/policyService');
const policyRepo = require('../repositories/policyRepository');

async function getPolicyDetail(req, res) {
  const { id } = req.params;
  const data = await policyService.getPolicyDetails(Number(id), req.session.user);
  if (!data) return res.status(404).render('error', { message: 'Policy not found', error: {} });
  res.render('policyDetail', { title: 'Policy Detail', ...data });
}

// Render a minimal Get a Quote form
async function getNewPolicy(req, res) {
  res.render('policies/new', { title: 'Get a Quote', errors: [], old: {} });
}

// Handle minimal quote submission and create a policy record
async function postNewPolicy(req, res) {
  const { type_id, start_date, end_date, base_premium } = req.body;
  // very minimal validation
  if (!type_id || !start_date || !end_date || !base_premium) {
    return res.status(400).render('policies/new', { title: 'Get a Quote', errors: [{ msg: 'All fields are required' }], old: req.body });
  }
  const user_id = req.session.user.user_id;
  const policy_id = await policyRepo.createPolicy({ user_id, type_id: Number(type_id), start_date, end_date, base_premium: Number(base_premium), status_id: 1 });
  // redirect to the new policy page
  res.redirect(`/policies/${policy_id}`);
}

module.exports = { getPolicyDetail, getNewPolicy, postNewPolicy };

