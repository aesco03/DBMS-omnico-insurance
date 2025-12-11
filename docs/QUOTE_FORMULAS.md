# Quote Formulas (Example Implementation)

This document records the example formulas implemented in `utils/premiumCalculator.js`.
These are placeholders and should be replaced with official actuarial/business formulas.

## Auto Quote

- Inputs used: `vehicle_year`, `coverage_type`.
- Constants:
  - `baseRate = 300` (USD per year) — example base annual premium.
- Age factor:
  - `ageFactor = max(0.8, 1 + (currentYear - vehicle_year) * 0.02)`
  - Rationale: each year adds 2% until a floor is reached (older cars slightly cheaper after floor).
- Coverage adjustments:
  - If `coverage_type` contains `comprehensive` add $50.
  - If `coverage_type` contains `full` or `collision` add $30.
- Premium:
  - `premium = round(baseRate * ageFactor + coverageAdjustments, 2)`
- Suggested coverage limit (example):
  - `coverage_limit = round(premium * 100, 2)`

## Home Quote

- Inputs used: `property_value`, `deductible`.
- Constants:
  - `rate = 0.005` (0.5% of property value) — example base rate.
- Deductible adjustment:
  - `deductibleReduction = (deductible / 1000) * 0.0005 * property_value`
  - This is a small reduction proportional to deductible; tune as required.
- Premium:
  - `premium = round(max(0, property_value * rate - deductibleReduction), 2)`
- Suggested coverage limit:
  - `coverage_limit = round(property_value * 0.8, 2)` (80% of property value suggested)

## Security & UX Notes

- The server recomputes premiums on both the quote and the final confirm POST to prevent tampering.
- The UI shows computed values in a confirmation page before creating a policy.
- Only factual inputs are accepted from users; computed fields should never be trusted from the client.

## Next steps

- Replace these example formulas with your actuarial-approved logic.
- Consider adding rate tables, location risk multipliers, and tier-based discounts.
