const mysql = require('mysql2/promise');
require('dotenv').config();

async function updatePassword() {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    dateStrings: true
  };
  
  if (process.env.DB_PASSWORD) {
    config.password = process.env.DB_PASSWORD;
  }

  const pool = mysql.createPool(config);
  
  const hash = '$2b$10$arziIt/elvuIzgPCkArIq.Zjb6VUv2ipi/LszvQ1k56c9OTBUCSSm';
  const email = 'test123@user.com';
  
  try {
    const connection = await pool.getConnection();
    const result = await connection.execute(
      'UPDATE client_info SET password_hash = ? WHERE email = ?',
      [hash, email]
    );
    console.log('Updated:', result[0].affectedRows, 'row(s)');
    connection.release();
    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updatePassword();
