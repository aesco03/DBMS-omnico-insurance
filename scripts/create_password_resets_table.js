const pool = require('../config/db');

async function main() {
  const sql = `
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES client_info(user_id) ON DELETE CASCADE
);
`;
  try {
    await pool.query(sql);
    console.log('password_resets table created or already exists.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating password_resets table:', err);
    process.exit(1);
  }
}

main();
