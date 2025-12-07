function calculatePremium(base, tierDiscountRate) {
  const discount = (Number(tierDiscountRate || 0) / 100) * Number(base || 0);
  return Number(base || 0) - discount;
}

module.exports = { calculatePremium };

