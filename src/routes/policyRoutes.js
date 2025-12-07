const express = require('express');
const router = express.Router();
const { getPolicyDetail } = require('../controllers/policyController');

router.get('/:id', getPolicyDetail);

module.exports = router;

