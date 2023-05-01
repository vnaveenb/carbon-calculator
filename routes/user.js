module.exports = function (db) {
  const express = require('express');
  const router = express.Router();
  // user.js
  router.get('/welcome', isUser, (req, res) => {
    res.render('userWelcome');
  });

  // Middleware example for checking if the user is a regular user
  async function isUser(req, res, next) {
    try {
      const [rows] = await db.query('SELECT username, email, role FROM users_registration WHERE id = ?', [req.session.userId]);
      if (rows.length > 0 && rows[0].role === 'user') {
        res.locals.user = rows[0];
        // console.log("Details are :" +res.locals.user);
        next();
      } else {
        res.redirect('/login');
      }
    } catch (error) {
      console.error(error);
      res.redirect('/login');
    }
  }

  router.get('/actions', isUser, async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM carbon_emissions');
      res.render('userAction', { data: rows });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  });

  router.get('/unique-brands', isUser, async (req, res) => {
    const [rows] = await db.query('SELECT DISTINCT brand FROM carbon_emissions');
    res.json(rows.map(row => row.brand));
  });

  
  router.get('/unique-models', isUser, async (req, res) => {
    const brand = req.query.brand;
    const [rows] = await db.query('SELECT DISTINCT model FROM carbon_emissions WHERE brand = ?', [brand]);
    res.json(rows.map(row => row.model));
  });
  
  router.get('/unique-processors', isUser, async (req, res) => {
    const brand = req.query.brand;
    const model = req.query.model;
    const [rows] = await db.query('SELECT DISTINCT processor FROM carbon_emissions WHERE brand = ? AND model = ?', [brand, model]);
    res.json(rows.map(row => row.processor));
  });
  
  router.get('/unique-ram', isUser, async (req, res) => {
    const brand = req.query.brand;
    const model = req.query.model;
    const processor = req.query.processor;
    const [rows] = await db.query('SELECT DISTINCT ram FROM carbon_emissions WHERE brand = ? AND model = ? AND processor = ?', [brand, model, processor]);
    res.json(rows.map(row => row.ram));
  });
  
  router.get('/unique-storage', isUser, async (req, res) => {
    const brand = req.query.brand;
    const model = req.query.model;
    const processor = req.query.processor;
    const ram = req.query.ram;
    const [rows] = await db.query('SELECT DISTINCT storage FROM carbon_emissions WHERE brand = ? AND model = ? AND processor = ? AND ram = ?', [brand, model, processor, ram]);
    res.json(rows.map(row => row.storage));
  });
  
  router.get('/unique-screen-size', isUser, async (req, res) => {
    const brand = req.query.brand;
    const model = req.query.model;
    const processor = req.query.processor;
    const ram = req.query.ram;
    const storage = req.query.storage;
    const [rows] = await db.query('SELECT DISTINCT screen_size FROM carbon_emissions WHERE brand = ? AND model = ? AND processor = ? AND ram = ? AND storage = ?', [brand, model, processor, ram, storage]);
    res.json(rows.map(row => row.screen_size));
  });
  
  router.get('/unique-location', isUser, async (req, res) => {
    const brand = req.query.brand;
    const model = req.query.model;
    const processor = req.query.processor;
    const ram = req.query.ram;
    const storage = req.query.storage;
    const screen_size = req.query.screen_size;
    const [rows] = await db.query('SELECT DISTINCT location FROM carbon_emissions WHERE brand = ? AND model = ? AND processor = ? AND ram = ? AND storage = ? AND screen_size = ?', [brand, model, processor, ram, storage, screen_size]);
    res.json(rows.map(row => row.location));
  });



  router.post('/multi-chart-data', isUser, async (req, res) => {
    const formsData = req.body.formsData;
  
    try {
      const results = await Promise.all(formsData.map(async form => {
        const { brand, model, processor, ram, storage, location, screen_size, years, quantity } = form;
        const [rows] = await db.query(`
          SELECT
            end_of_life, product_use, transport, packaging, production, scope_2, scope_3
          FROM carbon_emissions
          WHERE
            brand = ? AND model = ? AND processor = ? AND ram = ? AND
            storage = ? AND screen_size = ? AND location = ?
        `, [brand, model, processor, ram, storage, screen_size, location]);
  
        if (rows.length > 0) {
          const row = rows[0];
          const emissions = {
            end_of_life: row.end_of_life * quantity * years,
            product_use: row.product_use * quantity,
            transport: row.transport * quantity,
            packaging: row.packaging * quantity,
            production: row.production * quantity,
            scope_2: row.scope_2 * quantity,
            scope_3: row.scope_3 * quantity,
          };
  
          return emissions;
        } else {
          throw new Error('Data not found');
        }
      }));
  
      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  });
  


  
  
  router.get('/chart-data', isUser, async (req, res) => {
    const { brand, model, processor, ram, storage, location, screen_size, years, quantity } = req.query;

  
    const [rows] = await db.query(`
      SELECT
        end_of_life, product_use, transport, packaging, production, scope_2, scope_3
      FROM carbon_emissions
      WHERE
        brand = ? AND model = ? AND processor = ? AND ram = ? AND
        storage = ? AND screen_size = ? AND location = ?
    `, [brand, model, processor, ram, storage, screen_size, location]);
  
    if (rows.length > 0) {
      const row = rows[0];
      console.log('Fetched rows from database:', rows);
      const emissions = {
        end_of_life: row.end_of_life * quantity*years,
        product_use: row.product_use * quantity,
        transport: row.transport * quantity,
        packaging: row.packaging * quantity,
        production: row.production * quantity,
        scope_2: row.scope_2 * quantity,
        scope_3: row.scope_3 * quantity,
      };
      
      console.log("Query Parameters:", req.query);
      console.log("Data fetched from database:", rows);

  
      res.json(emissions);
    } else {
      res.status(404).send('Data not found');
    }
  });
  



  return router;
};

