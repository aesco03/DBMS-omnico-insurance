const express = require('express');
const router = express.Router();
const { claimValidators, getNewClaim, postClaim, getClaimsIndex, getNewClaimSelection } = require('../controllers/claimController');

router.get('/', getClaimsIndex);
router.get('/new', getNewClaimSelection);
router.get('/new/:policyId', getNewClaim);
router.post('/', claimValidators(), postClaim);

module.exports = router;

