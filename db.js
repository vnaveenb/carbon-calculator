const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const sslPath = path.join(__dirname, 'public', 'DigiCertGlobalRootCA.crt.pem');
const sslOptions = {
  ca: fs.readFileSync(sslPath),
  rejectUnauthorized: true
};

const pool = mysql.createPool({
  host: 'my-sql-server-project.mysql.database.azure.com',
  user: 'devloper',
  password: 'REDACTED_DB_PASSWORD',
  database: 'carbon_calculator',
  ssl: sslOptions
});

module.exports = pool.promise();


// mysql -u devloper  -h my-sql-server-project.mysql.database.azure.com -P 3306 

// SYSTEM mysql -u devloper -h my-sql-server-project.mysql.database.azure.com -P 3306 -p REDACTED_DB_PASSWORD

// Test-NetConnection -ComputerName my-sql-server-project.mysql.database.azure.com -Port 3306