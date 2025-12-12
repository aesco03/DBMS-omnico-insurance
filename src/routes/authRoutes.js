const express = require('express');
const router = express.Router();
const { loginValidators, getLogin, postLogin, postLogout, getSignup, signupValidators, postSignup, getForgot, postForgot, getReset, postReset, resetValidators, forgotValidators } = require('../controllers/authController');

router.get('/login', getLogin);
router.post('/login', loginValidators(), postLogin);
router.post('/logout', postLogout);

router.get('/signup', getSignup);
router.post('/signup', signupValidators(), postSignup);
router.get('/forgot', getForgot);
router.post('/forgot', forgotValidators(), postForgot);

router.get('/reset/:token', getReset);
router.post('/reset/:token', resetValidators(), postReset);

module.exports = router;

