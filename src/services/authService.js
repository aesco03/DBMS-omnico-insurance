const bcrypt = require('bcrypt');
const clientRepo = require('../repositories/clientRepository');
const resetRepo = require('../repositories/resetRepository');
const crypto = require('crypto');
const emailService = require('./emailService');


async function authenticateUser(email, password) {
  const user = await clientRepo.findByEmail(email);
  if (!user) return null;
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return null;
  return user;
}

async function registerUser(payload) {
  const password_hash = await bcrypt.hash(payload.password, 10);
  const user_id = await clientRepo.createUser({ ...payload, password_hash });
  return user_id;
}

async function sendPasswordReset(email, baseUrl) {
  // email only
  let user = null;
  if (!email || !email.includes('@')) return;
  user = await clientRepo.findByEmail(email);
  if (!user) return; // do not reveal existence
  const token = crypto.randomBytes(24).toString('hex');
  const expires_at = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour
  await resetRepo.createReset({ user_id: user.user_id, token, expires_at });
  const resetUrl = `${baseUrl}/auth/reset/${token}`;
  // Send reset link via email
  await emailService.sendResetEmail(user.email, resetUrl, user.full_name);
}

async function resetPassword(token, newPassword) {
  const reset = await resetRepo.findByToken(token);
  if (!reset) throw new Error('Invalid or expired token');
  if (new Date(reset.expires_at) < new Date()) {
    throw new Error('Token expired');
  }
  const password_hash = await bcrypt.hash(newPassword, 10);
  await require('../../config/db').query('UPDATE client_info SET password_hash = ? WHERE user_id = ?', [password_hash, reset.user_id]);
  await resetRepo.deleteById(reset.id);
}

module.exports = { authenticateUser, registerUser, sendPasswordReset, resetPassword };

