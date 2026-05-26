const products = require('./products');
const users = require('./users');
const emissionsFactors = require('./emissionsFactors');

products.init();

module.exports = { products, users, emissionsFactors };
