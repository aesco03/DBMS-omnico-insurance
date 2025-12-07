const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');

function loginValidators() {
  return [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ];
}

async function getLogin(req, res) {
  res.render('login', { title: 'Login', errors: [], old: {} });
}

async function postLogin(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('login', { title: 'Login', errors: errors.array(), old: req.body });
  }
  const { email, password } = req.body;
  const user = await authService.authenticateUser(email, password);
  if (!user) {
    return res.status(401).render('login', { title: 'Login', errors: [{ msg: 'Invalid credentials' }], old: { email } });
  }
  req.session.user = { user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role };
  res.redirect('/dashboard');
}

async function postLogout(req, res) {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
}

module.exports = { loginValidators, getLogin, postLogin, postLogout };

