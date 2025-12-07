const paymentRepo = require('../repositories/paymentRepository');

async function generateMonthlyRevenueReport({ year, month }) {
  const agg = await paymentRepo.aggregateMonthlyRevenue({ year, month });
  return {
    year,
    month,
    total_revenue: Number(agg.total_revenue || 0),
    payments_count: Number(agg.payments_count || 0)
  };
}

module.exports = { generateMonthlyRevenueReport };

