const policyService = require('../services/policyService');

async function getPolicyDetail(req, res) {
  const { id } = req.params;
  const data = await policyService.getPolicyDetails(Number(id), req.session.user);
  if (!data) return res.status(404).render('error', { message: 'Policy not found', error: {} });
  res.render('policyDetail', { title: 'Policy Detail', ...data });
}

module.exports = { getPolicyDetail };

