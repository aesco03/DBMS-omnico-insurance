const express = require('express');
const router = express.Router();
const { getPolicyDetail, getNewPolicy, postNewPolicy, postConfirmPolicy } = require('../controllers/policyController');

// New quote route (keep before parameterized id route)
router.get('/new', getNewPolicy);
router.post('/new', postNewPolicy);
router.post('/confirm', postConfirmPolicy);

router.get('/:id', getPolicyDetail);

module.exports = router;

