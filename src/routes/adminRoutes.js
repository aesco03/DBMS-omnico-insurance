const express = require('express');
const router = express.Router();
const { getUsers, getReports } = require('../controllers/adminController');

router.get('/users', getUsers);
router.get('/reports', getReports);

module.exports = router;

