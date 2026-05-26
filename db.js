const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const sslPath = path.join(__dirname, 'public', 'DigiCertGlobalRootCA.crt.pem');
if (fs.existsSync(sslPath)) {
  poolConfig.ssl = {
    ca: fs.readFileSync(sslPath),
    rejectUnauthorized: true,
  };
}

const pool = mysql.createPool(poolConfig);

module.exports = pool.promise();


