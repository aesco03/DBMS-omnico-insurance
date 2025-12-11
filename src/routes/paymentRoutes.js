const express = require('express');
const router = express.Router();
const { paymentValidators, getPaymentHistory, postPayment, getPaymentsIndex, getMakePaymentSelection } = require('../controllers/paymentController');

router.get('/', getPaymentsIndex);
router.get('/make', getMakePaymentSelection);
router.get('/:policyId', getPaymentHistory);
router.post('/:policyId', paymentValidators(), postPayment);

module.exports = router;

