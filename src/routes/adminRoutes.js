const express = require('express');
const router = express.Router();
const { getUsers, getUserDetail, getReports } = require('../controllers/adminController');
const { getPendingClaims, postUpdateClaim, getPendingPolicies, postUpdatePolicy } = require('../controllers/adminController');

router.get('/users', getUsers);
router.get('/users/:userId', getUserDetail);
router.get('/reports', getReports);
router.get('/claims', getPendingClaims);
router.post('/claims/:id', postUpdateClaim);
router.get('/policies', getPendingPolicies);
router.post('/policies/:id', postUpdatePolicy);

module.exports = router;

