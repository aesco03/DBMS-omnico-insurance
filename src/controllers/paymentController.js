const { body, validationResult } = require('express-validator');
const paymentService = require('../services/paymentService');
const paymentRepo = require('../repositories/paymentRepository');

function paymentValidators() {
  return [
    body('payment_id').notEmpty().withMessage('Please select a payment to pay'),
    body('amount').isFloat({ gt: 0 }).withMessage('Valid amount required'),
    body('payment_date').isISO8601().withMessage('Valid date required')
  ];
}

async function getPaymentHistory(req, res) {
  const { policyId } = req.params;
  const showAll = req.query.view === 'all';
  const data = await paymentService.getPaymentHistory(Number(policyId), req.session.user, showAll);
  if (!data) return res.status(404).render('error', { message: 'Policy not found', error: {} });
  res.render('paymentHistory', { title: 'Payment History', ...data, showAll, errors: [], old: {} });
}

async function postPayment(req, res) {
  const { policyId } = req.params;
  const showAll = req.query.view === 'all';
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const data = await paymentService.getPaymentHistory(Number(policyId), req.session.user, showAll);
    return res.status(400).render('paymentHistory', { title: 'Payment History', ...data, showAll, errors: errors.array(), old: req.body });
  }
  const { amount, payment_date, due_date, method, payment_id } = req.body;
  
  // If payment_id is provided, this is updating an existing pending payment
  if (payment_id) {
    await paymentService.markPaymentAsPaid(Number(payment_id), { 
      payment_date, 
      method, 
      amount: parseFloat(amount) 
    });
  } else {
    // Creating a new payment record
    await paymentService.recordPayment(Number(policyId), req.session.user, { 
      amount, 
      payment_date, 
      due_date: due_date || payment_date,
      method 
    });
  }
  // Preserve the view parameter when redirecting
  const redirectUrl = showAll ? `/payments/${policyId}?view=all` : `/payments/${policyId}`;
  res.redirect(redirectUrl);
}

async function getPaymentsIndex(req, res) {
  const userId = req.session.user.user_id;
  const showAll = req.query.view === 'all';
  // Default to hiding overdue (unless explicitly set to false)
  const hideOverdue = req.query.hide_overdue !== 'false';
  
  let payments;
  if (showAll) {
    payments = await paymentRepo.getPaymentsByUser(userId);
    // Filter overdue if hideOverdue is true
    if (hideOverdue) {
      payments = payments.filter(p => p.status !== 'Overdue');
    }
  } else {
    payments = await paymentRepo.getRelevantPaymentsByUser(userId, hideOverdue);
  }
  
  res.render('payments/index', { title: 'Payments & Billing', payments, showAll, hideOverdue });
}

// Render a selection page where the user picks a policy to make a payment for
async function getMakePaymentSelection(req, res) {
  const userId = req.session.user.user_id;
  const policies = await require('../repositories/policyRepository').getUserPolicies(userId);
  res.render('payments/select', { title: 'Make a Payment', policies });
}

module.exports = { paymentValidators, getPaymentHistory, postPayment, getPaymentsIndex, getMakePaymentSelection };


