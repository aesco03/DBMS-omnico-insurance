const policyService = require('../services/policyService');
const policyRepo = require('../repositories/policyRepository');
const premiumCalc = require('../../utils/premiumCalculator');

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

// Handle quote submission — compute derived values and show confirm page
async function postNewPolicy(req, res) {
  const { type_id, start_date, end_date } = req.body;
  // require basic fields
  if (!type_id || !start_date || !end_date) {
    return res.status(400).render('policies/new', { title: 'Get a Quote', errors: [{ msg: 'Start date, end date and type are required' }], old: req.body });
  }

  // Compute derived values depending on type — ignore any client-provided premium/coverage fields
  let derived = {};
  try {
    if (Number(type_id) === 1) { // Auto
      derived = premiumCalc.computeAutoQuote({ vehicle_year: req.body.vehicle_year, coverage_type: req.body.coverage_type });
    } else if (Number(type_id) === 2) { // Home
      derived = premiumCalc.computeHomeQuote({ property_value: req.body.property_value, deductible: req.body.deductible });
    }
  } catch (err) {
    console.error('Error computing quote:', err);
    return res.status(500).render('error', { message: 'Error computing quote', error: {} });
  }

  // Render a confirmation page showing computed values (server is authoritative)
  res.render('policies/confirm', {
    title: 'Confirm Quote',
    facts: req.body,
    derived,
    type_id: Number(type_id),
    start_date,
    end_date
  });
}

// Create policy after user confirms the computed quote
async function postConfirmPolicy(req, res) {
  const { type_id, start_date, end_date } = req.body;
  if (!type_id || !start_date || !end_date) return res.status(400).render('error', { message: 'Invalid confirmation data', error: {} });

  const user_id = req.session.user.user_id;

  // Recompute on server to avoid tampering
  let derived = {};
  if (Number(type_id) === 1) {
    derived = premiumCalc.computeAutoQuote({ vehicle_year: req.body.vehicle_year, coverage_type: req.body.coverage_type });
  } else if (Number(type_id) === 2) {
    derived = premiumCalc.computeHomeQuote({ property_value: req.body.property_value, deductible: req.body.deductible });
  }

  // Create base policy with computed premium as base_premium
  const base_premium = derived && typeof derived.premium === 'number' ? derived.premium : Number(derived.premium) || 0;
  const typeNum = Number(type_id);
  if (Number.isNaN(typeNum)) return res.status(400).render('error', { message: 'Invalid policy type', error: {} });

  let policy_id;
  try {
    policy_id = await policyRepo.createPolicy({ user_id, type_id: typeNum, start_date, end_date, base_premium: Number(base_premium), status_id: 2 });
  } catch (err) {
    console.error('createPolicy error', { user_id, type_id: typeNum, start_date, end_date, base_premium, err });
    return res.status(500).render('error', { message: 'Failed to create policy', error: {} });
  }

  try {
    if (Number(type_id) === 1) {
      await policyRepo.createAutoDetail({
        policy_id,
        vehicle_make: req.body.vehicle_make,
        vehicle_model: req.body.vehicle_model,
        vehicle_year: req.body.vehicle_year ? Number(req.body.vehicle_year) : null,
        vehicle_vin: req.body.vehicle_vin,
        coverage_type: req.body.coverage_type,
        premium_amount: derived.premium
      });
    } else if (Number(type_id) === 2) {
      await policyRepo.createHomeDetail({
        policy_id,
        property_address: req.body.property_address,
        property_value: req.body.property_value ? Number(req.body.property_value) : null,
        coverage_limit: derived.coverage_limit,
        deductible: req.body.deductible ? Number(req.body.deductible) : null
      });
    }
  } catch (err) {
    console.error('Error creating policy detail after confirm:', err);
  }

  // Redirect to new policy page
  res.redirect(`/policies/${policy_id}`);
}

module.exports = { getPolicyDetail, getNewPolicy, postNewPolicy, postConfirmPolicy };

