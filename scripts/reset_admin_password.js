const clientRepo = require('../src/repositories/clientRepository');
const bcrypt = require('bcrypt');

async function main() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    if (key && value) params[key.replace(/^--/, '')] = value;
  }

  const email = params.email;
  const password = params.password;

  if (!email || !password) {
    console.error('Usage: node scripts/reset_admin_password.js --email admin@example.com --password admin');
    process.exit(1);
  }

  try {
    const user = await clientRepo.findByEmail(email);
    if (!user) {
      console.error('User not found for email:', email);
      process.exit(1);
    }

    const password_hash = await bcrypt.hash(password, 10);
    const updated = await clientRepo.updatePassword(user.user_id, password_hash);
    if (!updated) {
      console.error('Failed to update password.');
      process.exit(1);
    }

    // ensure role is admin
    if (user.role !== 'admin') {
      await require('../config/db').query('UPDATE client_info SET role = ? WHERE user_id = ?', ['admin', user.user_id]);
      console.log('User role updated to admin');
    }

    console.log('Password updated for user', email);
    process.exit(0);
  } catch (err) {
    console.error('Error resetting password:', err);
    process.exit(1);
  }
}

main();
