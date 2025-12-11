const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
};

// Only add password if it's provided and not empty
if (process.env.DB_PASSWORD) {
  config.password = process.env.DB_PASSWORD;
}

const pool = mysql.createPool(config);

module.exports = pool;
