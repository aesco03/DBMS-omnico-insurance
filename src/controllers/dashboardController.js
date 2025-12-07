const policyService = require('../services/policyService');

async function getDashboard(req, res) {
  const policies = await policyService.getUserPolicies(req.session.user.user_id);
  res.render('dashboard', { title: 'Dashboard', policies });
}

module.exports = { getDashboard };

