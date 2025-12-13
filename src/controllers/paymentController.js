const { body, validationResult } = require('express-validator');
const paymentService = require('../services/paymentService');
const paymentRepo = require('../repositories/paymentRepository');

function paymentValidators() {
  return [
    // payment_id is optional - if provided, we're updating an existing payment
    // if not provided, we're creating a new payment record
    body('payment_id').optional().notEmpty().withMessage('If selecting a payment, it must not be empty'),
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
  
  const { amount, payment_date, due_date, method, payment_id } = req.body;
  
  // Additional validation: if payment_id is provided, validate it exists
  // If not provided, ensure we have all required fields for creating a new payment
  const customErrors = [];
  
  if (payment_id) {
    // Validate that the payment exists and belongs to this policy
    const [paymentRows] = await require('../../config/db').query(
      'SELECT * FROM payment_info WHERE payment_id = ? AND policy_id = ?',
      [payment_id, policyId]
    );
    if (paymentRows.length === 0) {
      customErrors.push({
        msg: 'Selected payment not found or does not belong to this policy',
        param: 'payment_id'
      });
    }
  } else {
    // For new payments, due_date is required if not provided
    if (!due_date && !payment_date) {
      customErrors.push({
        msg: 'Due date is required when creating a new payment',
        param: 'due_date'
      });
    }
  }
  
  // Combine validation errors with custom errors
  const allErrors = errors.array().concat(customErrors);
  
  if (!errors.isEmpty() || customErrors.length > 0) {
    const data = await paymentService.getPaymentHistory(Number(policyId), req.session.user, showAll);
    return res.status(400).render('paymentHistory', { title: 'Payment History', ...data, showAll, errors: allErrors, old: req.body });
  }
  
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


