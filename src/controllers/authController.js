const { body, validationResult, oneOf } = require('express-validator');
const authService = require('../services/authService');
const clientRepo = require('../repositories/clientRepository');
const resetRepo = require('../repositories/resetRepository');
const crypto = require('crypto');

function loginValidators() {
  return [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ];
}

async function getLogin(req, res) {
  res.render('login', { title: 'Login', errors: [], old: {}, query: req.query });
}

async function getSignup(req, res) {
  res.render('signup', { title: 'Sign Up', errors: [], old: {} });
}

async function postLogin(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('login', { title: 'Login', errors: errors.array(), old: req.body, query: req.query });
  }
  const { email, password } = req.body;
  const user = await authService.authenticateUser(email, password);
  if (!user) {
    return res.status(401).render('login', { title: 'Login', errors: [{ msg: 'Invalid credentials' }], old: { email }, query: req.query });
  }
  req.session.user = { user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role };
  if (user.role === 'admin') {
    return res.redirect('/admin/users');
  }
  res.redirect('/dashboard');
}

async function postLogout(req, res) {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
}

function signupValidators() {
  return [
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirm_password').custom((value, { req }) => {
      if (value !== req.body.password) throw new Error('Passwords do not match');
      return true;
    })
  ];
}

async function postSignup(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('signup', { title: 'Sign Up', errors: errors.array(), old: req.body });
  }
  const { full_name, email, phone, address, city, state, password } = req.body;
  const existing = await clientRepo.findByEmail(email);
  if (existing) {
    return res.status(400).render('signup', { title: 'Sign Up', errors: [{ msg: 'Email already registered' }], old: req.body });
  }
  await authService.registerUser({ full_name, email, phone, address, city, state, password });
  res.redirect('/auth/login?created=1');
}

async function getForgot(req, res) {
  res.render('forgot', { title: 'Forgot Password', errors: [], old: {} });
}

async function postForgot(req, res) {
  const errors = validationResult(req);
  const { email } = req.body;
  if (!errors.isEmpty()) {
    return res.status(400).render('forgot', { title: 'Forgot Password', errors: errors.array(), old: req.body });
  }
  try {
    await authService.sendPasswordReset(email, req.protocol + '://' + req.get('host'));
    res.render('forgot', { title: 'Forgot Password', errors: [], old: {}, success: 'If an account exists, a reset link was sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).render('forgot', { title: 'Forgot Password', errors: [{ msg: 'Unable to process request' }], old: req.body });
  }
}

function forgotValidators() {
  return [
    body('email').isEmail().withMessage('Please enter a valid email'),
  ];
}

function resetValidators() {
  return [ body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'), body('confirm_password').custom((value, { req }) => { if (value !== req.body.password) throw new Error('Passwords do not match'); return true; }) ];
}

async function getReset(req, res) {
  const { token } = req.params;
  const reset = await resetRepo.findByToken(token);
  if (!reset || new Date(reset.expires_at) < new Date()) {
    return res.status(400).render('error', { message: 'Invalid or expired reset token', error: {} });
  }
  res.render('reset', { title: 'Reset Password', token, errors: [], old: {} });
}

async function postReset(req, res) {
  const errors = validationResult(req);
  const { token } = req.params;
  if (!errors.isEmpty()) {
    return res.status(400).render('reset', { title: 'Reset Password', token, errors: errors.array(), old: req.body });
  }
  try {
    await authService.resetPassword(token, req.body.password);
    res.redirect('/auth/login?reset=1');
  } catch (err) {
    console.error(err);
    res.status(400).render('reset', { title: 'Reset Password', token, errors: [{ msg: err.message }], old: {} });
  }
}

module.exports = { loginValidators, getLogin, postLogin, postLogout, getSignup, signupValidators, postSignup, getForgot, postForgot, forgotValidators, getReset, postReset, resetValidators };


