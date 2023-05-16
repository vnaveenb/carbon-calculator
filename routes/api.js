const express = require('express');
const router = express.Router();

module.exports = function (db) {
  router.get('/unique-models-api', async (req, res) => {
    const brand = req.query.brand;
    const [rows] = await db.query('SELECT DISTINCT model FROM carbon_emissions WHERE brand = ?', [brand]);
    res.json(rows.map(row => row.model));
  });

  router.get('/unique-brands', async (req, res) => {
    const [rows] = await db.query('SELECT DISTINCT brand FROM carbon_emissions');
    res.json(rows.map(row => row.brand));
  });

  router.get('/fetch-data', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT vendor_id, brand, location, end_of_life, product_use, transport, packaging, production, scope_2, scope_3, model, screen_size, processor, ram, storage FROM carbon_emissions WHERE vendor_id = ?', [req.session.userId]);
      res.status(200).json(rows);
    } catch (err) {
      console.error('Error fetching data:', err);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });


  // Add any other API routes here

  return router;
};
