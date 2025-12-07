const bcrypt = require('bcrypt');
const clientRepo = require('../repositories/clientRepository');

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

module.exports = { authenticateUser, registerUser };

