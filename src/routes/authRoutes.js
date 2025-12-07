const express = require('express');
const router = express.Router();
const { loginValidators, getLogin, postLogin, postLogout } = require('../controllers/authController');

router.get('/login', getLogin);
router.post('/login', loginValidators(), postLogin);
router.post('/logout', postLogout);

module.exports = router;

