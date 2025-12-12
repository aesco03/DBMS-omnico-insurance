const pool = require('../config/db');
const bcrypt = require('bcrypt');
const clientRepo = require('../src/repositories/clientRepository');

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
  const name = params.name || 'Admin';

  if (!email || !password) {
    console.error('Usage: node scripts/create_admin.js --email admin@example.com --password adminpass --name "Admin Name"');
    process.exit(1);
  }

  try {
    const existing = await clientRepo.findByEmail(email);
    if (existing) {
      console.error('A user with that email already exists.');
      process.exit(1);
    }
    const password_hash = await bcrypt.hash(password, 10);
    const id = await clientRepo.createUser({ full_name: name, email, password_hash, role: 'admin' });
    console.log('Admin user created with id', id);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
}

main();
