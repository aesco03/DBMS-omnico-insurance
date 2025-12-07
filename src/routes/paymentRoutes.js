const express = require('express');
const router = express.Router();
const { paymentValidators, getPaymentHistory, postPayment } = require('../controllers/paymentController');

router.get('/:policyId', getPaymentHistory);
router.post('/:policyId', paymentValidators(), postPayment);

module.exports = router;

