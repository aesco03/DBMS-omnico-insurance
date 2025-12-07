const { body, validationResult } = require('express-validator');
const paymentService = require('../services/paymentService');

function paymentValidators() {
  return [
    body('amount').isFloat({ gt: 0 }).withMessage('Valid amount required'),
    body('payment_date').isISO8601().withMessage('Valid date required')
  ];
}

async function getPaymentHistory(req, res) {
  const { policyId } = req.params;
  const data = await paymentService.getPaymentHistory(Number(policyId), req.session.user);
  if (!data) return res.status(404).render('error', { message: 'Policy not found', error: {} });
  res.render('paymentHistory', { title: 'Payment History', ...data, errors: [], old: {} });
}

async function postPayment(req, res) {
  const { policyId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const data = await paymentService.getPaymentHistory(Number(policyId), req.session.user);
    return res.status(400).render('paymentHistory', { title: 'Payment History', ...data, errors: errors.array(), old: req.body });
  }
  const { amount, payment_date, method } = req.body;
  await paymentService.recordPayment(Number(policyId), req.session.user, { amount, payment_date, method });
  res.redirect(`/payments/${policyId}`);
}

module.exports = { paymentValidators, getPaymentHistory, postPayment };

