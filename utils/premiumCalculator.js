// Simple premium calculator with example formulas.
// Replace these formulas with your official business logic as needed.

function round(n) {
  return Math.round(n * 100) / 100;
}

function computeAutoQuote(facts = {}) {
  // facts: { vehicle_year, coverage_type }
  const currentYear = new Date().getFullYear();
  const baseRate = 300; // base annual rate in USD
  const year = Number(facts.vehicle_year) || currentYear;
  // older cars slightly cheaper after a floor
  const ageFactor = Math.max(0.8, 1 + (currentYear - year) * 0.02);
  let premium = baseRate * ageFactor;
  // coverage adjustments
  const cov = (facts.coverage_type || '').toLowerCase();
  if (cov.includes('comprehensive')) premium += 50;
  if (cov.includes('full') || cov.includes('collision')) premium += 30;

  premium = round(premium);

  // derive a suggested coverage limit (example: premium * 100)
  const coverage_limit = round(premium * 100);

  return { premium, coverage_limit };
}

function computeHomeQuote(facts = {}) {
  // facts: { property_value, deductible }
  const propertyValue = Number(facts.property_value) || 0;
  // base rate is a percentage of property value (example: 0.5%)
  const rate = 0.005;
  let premium = propertyValue * rate;

  // deductible reduces premium slightly (example: each $1000 deductible reduces 0.05% of property value)
  const deductible = Number(facts.deductible) || 0;
  if (deductible > 0) {
    const deductibleReduction = (deductible / 1000) * 0.0005 * propertyValue; // tiny reduction
    premium = Math.max(0, premium - deductibleReduction);
  }

  premium = round(premium);

  // default coverage limit suggestion (e.g., 80% of property value)
  const coverage_limit = round(propertyValue * 0.8);

  return { premium, coverage_limit };
}

function computePetQuote(facts = {}) {
  // facts: { age }
  const base = 100;
  const age = Number(facts.age) || 0;
  const ageFactor = age > 8 ? 1.2 : 1;
  const premium = round(base * ageFactor);
  const coverage_limit = round(premium * 20);
  return { premium, coverage_limit };
}

function computeRentersQuote(facts = {}) {
  // facts: { personal_property_value }
  const value = Number(facts.personal_property_value) || 0;
  const rate = 0.002; // 0.2%
  const premium = round(value * rate);
  const coverage_limit = round(value);
  return { premium, coverage_limit };
}

function computeBusinessQuote(facts = {}) {
  // facts: { annual_revenue }
  const revenue = Number(facts.annual_revenue) || 0;
  const rate = 0.001; // 0.1% of revenue as placeholder
  const premium = round(revenue * rate + 200); // base + revenue factor
  const coverage_limit = round(revenue * 0.5);
  return { premium, coverage_limit };
}

function computeHealthQuote(facts = {}) {
  // facts: { age }
  const age = Number(facts.age) || 0;
  const base = 200;
  const ageFactor = 1 + Math.max(0, (age - 30) * 0.01);
  const premium = round(base * ageFactor);
  const coverage_limit = round(premium * 50);
  return { premium, coverage_limit };
}

function computeLifeQuote(facts = {}) {
  // facts: { age }
  const age = Number(facts.age) || 0;
  const base = 150;
  const ageFactor = 1 + Math.max(0, (age - 40) * 0.02);
  const premium = round(base * ageFactor);
  const coverage_limit = round(premium * 100);
  return { premium, coverage_limit };
}

module.exports = {
  computeAutoQuote,
  computeHomeQuote,
  computePetQuote,
  computeRentersQuote,
  computeBusinessQuote,
  computeHealthQuote,
  computeLifeQuote
};
