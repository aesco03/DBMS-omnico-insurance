const pool = require('../../config/db');
const reportService = require('../services/reportService');

async function getUsers(req, res) {
  const [rows] = await pool.query(
    `SELECT u.user_id, u.full_name, u.email, u.role, t.tier_name
     FROM client_info u
     LEFT JOIN tier t ON u.tier_id = t.tier_id
     ORDER BY u.user_id DESC`
  );
  res.render('adminUsers', { title: 'Admin – Users', users: rows });
}

async function getReports(req, res) {
  const now = new Date();
  const year = Number(req.query.year) || now.getFullYear();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const report = await reportService.generateMonthlyRevenueReport({ year, month });
  res.render('adminReports', { title: 'Admin – Reports', report });
}

module.exports = { getUsers, getReports };

