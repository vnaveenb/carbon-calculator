const mysql = require('mysql2');

const pool = mysql.createPool({
  host: '<your_server_name>.mysql.database.azure.com',
  user: '<your_username>@<your_server_name>',
  password: '<your_password>',
  database: '<your_database_name>',
  port: 3306,
  ssl: true
});

module.exports = pool.promise();
