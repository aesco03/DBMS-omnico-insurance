const policyService = require('../services/policyService');
const policyRepo = require('../repositories/policyRepository');
const premiumCalc = require('../../utils/premiumCalculator');

function validateQuoteFacts(typeNum, body) {
  const errors = [];
  switch (typeNum) {
    case 1: // Auto
      if (!body.vehicle_year) errors.push({ msg: 'Vehicle year is required for Auto quotes' });
      break;
    case 2: // Home
      if (!body.property_value) errors.push({ msg: 'Property value is required for Home quotes' });
      break;
    case 3: // Pet
      if (!body.pet_name) errors.push({ msg: 'Pet name is required for Pet quotes' });
      if (!body.species) errors.push({ msg: 'Species is required for Pet quotes' });
      break;
    case 4: // Renters
      if (!body.rental_address) errors.push({ msg: 'Rental address is required for Renters quotes' });
      if (!body.personal_property_value) errors.push({ msg: 'Personal property value is required for Renters quotes' });
      break;
    case 5: // Business
      if (!body.business_name) errors.push({ msg: 'Business name is required for Business quotes' });
      if (!body.annual_revenue) errors.push({ msg: 'Annual revenue is required for Business quotes' });
      break;
    case 6: // Health
      if (!body.provider) errors.push({ msg: 'Provider is required for Health quotes' });
      if (!body.health_person_name) errors.push({ msg: 'Person name is required for Health quotes' });
      break;
    case 7: // Life
      if (!body.beneficiary) errors.push({ msg: 'Beneficiary is required for Life quotes' });
      if (!body.life_person_name) errors.push({ msg: 'Person name is required for Life quotes' });
      break;
    default:
      break;
  }
  return errors;
}

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
    const typeNum = Number(type_id);
    const validationErrors = validateQuoteFacts(typeNum, req.body);
    if (validationErrors.length) {
      return res.status(400).render('policies/new', { title: 'Get a Quote', errors: validationErrors, old: req.body });
    }

    if (typeNum === 1) { // Auto
      derived = premiumCalc.computeAutoQuote({ vehicle_year: req.body.vehicle_year, coverage_type: req.body.auto_coverage_type });
    } else if (typeNum === 2) { // Home
      derived = premiumCalc.computeHomeQuote({ property_value: req.body.property_value, deductible: req.body.home_deductible });
    } else if (typeNum === 3) {
      derived = premiumCalc.computePetQuote({ age: req.body.pet_age });
    } else if (typeNum === 4) {
      derived = premiumCalc.computeRentersQuote({ personal_property_value: req.body.personal_property_value });
    } else if (typeNum === 5) {
      derived = premiumCalc.computeBusinessQuote({ annual_revenue: req.body.annual_revenue });
    } else if (typeNum === 6) {
      derived = premiumCalc.computeHealthQuote({ age: req.body.health_age });
    } else if (typeNum === 7) {
      derived = premiumCalc.computeLifeQuote({ age: req.body.life_age });
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
  const typeNum = Number(type_id);
  // Validate typeNum immediately before using it
  if (Number.isNaN(typeNum) || typeNum < 1 || typeNum > 7) {
    return res.status(400).render('error', { message: 'Invalid policy type', error: {} });
  }
  const validationErrors = validateQuoteFacts(typeNum, req.body);
  if (validationErrors.length) {
    return res.status(400).render('policies/new', { title: 'Get a Quote', errors: validationErrors, old: req.body });
  }

  if (typeNum === 1) {
    derived = premiumCalc.computeAutoQuote({ vehicle_year: req.body.vehicle_year, coverage_type: req.body.auto_coverage_type });
  } else if (typeNum === 2) {
    derived = premiumCalc.computeHomeQuote({ property_value: req.body.property_value, deductible: req.body.home_deductible });
  } else if (typeNum === 3) {
    derived = premiumCalc.computePetQuote({ age: req.body.pet_age });
  } else if (typeNum === 4) {
    derived = premiumCalc.computeRentersQuote({ personal_property_value: req.body.personal_property_value });
  } else if (typeNum === 5) {
    derived = premiumCalc.computeBusinessQuote({ annual_revenue: req.body.annual_revenue });
  } else if (typeNum === 6) {
    derived = premiumCalc.computeHealthQuote({ age: req.body.health_age });
  } else if (typeNum === 7) {
    derived = premiumCalc.computeLifeQuote({ age: req.body.life_age });
  }

  // Create base policy with computed premium as base_premium
  const base_premium = derived && typeof derived.premium === 'number' ? derived.premium : Number(derived.premium) || 0;

  let policy_id;
  try {
    // Ensure the insurance_type row exists (safety when DB seed wasn't applied)
    const typeNames = {1: 'Auto', 2: 'Home', 3: 'Pet', 4: 'Renters', 5: 'Business', 6: 'Health', 7: 'Life'};
    try {
      await policyRepo.ensureInsuranceType(typeNum, typeNames[typeNum]);
    } catch (e) {
      console.warn('ensureInsuranceType failed (continuing):', e && e.message);
    }
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
        coverage_type: req.body.auto_coverage_type,
        premium_amount: derived.premium
      });
    } else if (Number(type_id) === 2) {
      await policyRepo.createHomeDetail({
        policy_id,
        property_address: req.body.property_address,
        property_value: req.body.property_value ? Number(req.body.property_value) : null,
        coverage_limit: derived.coverage_limit,
        deductible: req.body.home_deductible ? Number(req.body.home_deductible) : null
      });
    } else if (Number(type_id) === 3) {
      await policyRepo.createPetDetail({
        policy_id,
        pet_name: req.body.pet_name,
        species: req.body.species,
        age: req.body.pet_age ? Number(req.body.pet_age) : null,
        deductible: req.body.pet_deductible ? Number(req.body.pet_deductible) : null,
        coverage_amount: req.body.pet_coverage_amount ? Number(req.body.pet_coverage_amount) : null,
        premium_amount: derived.premium || null
      });
    } else if (Number(type_id) === 4) {
      await policyRepo.createRentersDetail({
        policy_id,
        rental_address: req.body.rental_address,
        personal_property_value: req.body.personal_property_value ? Number(req.body.personal_property_value) : null,
        term: req.body.renters_term,
        deductible: req.body.renters_deductible ? Number(req.body.renters_deductible) : null,
        coverage_type: req.body.renters_coverage_type || null,
        coverage_amount: derived.coverage_limit || null,
        premium_amount: derived.premium || null
      });
    } else if (Number(type_id) === 5) {
      await policyRepo.createBusinessDetail({
        policy_id,
        business_name: req.body.business_name,
        business_type: req.body.business_type,
        industry: req.body.industry,
        annual_revenue: req.body.annual_revenue ? Number(req.body.annual_revenue) : null,
        number_of_employees: req.body.number_of_employees ? Number(req.body.number_of_employees) : null,
        business_address: req.body.business_address || null,
        contact_number: req.body.contact_number || null,
        contact_email: req.body.contact_email || null,
        deductible: req.body.business_deductible ? Number(req.body.business_deductible) : null,
        coverage_type: req.body.business_coverage_type || null,
        coverage_amount: derived.coverage_limit || null,
        premium_amount: derived.premium || null
      });
    } else if (Number(type_id) === 6) {
      await policyRepo.createHealthDetail({
        policy_id,
        provider: req.body.provider,
        person_name: req.body.health_person_name,
        plan: req.body.plan,
        age: req.body.health_age ? Number(req.body.health_age) : null,
        deductible: req.body.health_deductible ? Number(req.body.health_deductible) : null,
        coverage_amount: derived.coverage_limit || null,
        premium_amount: derived.premium || null
      });
    } else if (Number(type_id) === 7) {
      await policyRepo.createLifeDetail({
        policy_id,
        beneficiary: req.body.beneficiary,
        person_name: req.body.life_person_name,
        term: req.body.life_term,
        age: req.body.life_age ? Number(req.body.life_age) : null,
        deductible: req.body.life_deductible ? Number(req.body.life_deductible) : null,
        coverage_amount: derived.coverage_limit || null,
        premium_amount: derived.premium || null
      });
    }
  } catch (err) {
    console.error('Error creating policy detail after confirm:', err);
  }

  // Redirect to new policy page
  res.redirect(`/policies/${policy_id}`);
}

module.exports = { getPolicyDetail, getNewPolicy, postNewPolicy, postConfirmPolicy };

