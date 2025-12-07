const express = require('express');
const router = express.Router();
const { claimValidators, getNewClaim, postClaim } = require('../controllers/claimController');

router.get('/new/:policyId', getNewClaim);
router.post('/', claimValidators(), postClaim);

module.exports = router;

