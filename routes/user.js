module.exports = function (db) {
  const express = require('express');
  const router = express.Router();
  const countries = require('countries-list').countries;

  const pdfMake = require('pdfmake');
  const { createCanvas, loadImage } = require('canvas');

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
      res.render('userAction', { data: rows,countries });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  });

  router.get('/unique-brands', isUser, async (req, res) => {
    const [rows] = await db.query('SELECT DISTINCT brand FROM productemissions');
    res.json(rows.map(row => row.brand));
  });

  
  router.get('/unique-models', isUser, async (req, res) => {
    const brand = req.query.brand;
    const [rows] = await db.query('SELECT DISTINCT model FROM productemissions WHERE brand = ?', [brand]);
    res.json(rows.map(row => row.model));
  });

  router.get('/unique-models-api', async (req, res) => {
    const brand = req.query.brand;
    const [rows] = await db.query('SELECT DISTINCT model FROM productemissions WHERE brand = ?', [brand]);
    res.json(rows.map(row => row.model));
  });
  
  
  router.get('/unique-processors', isUser, async (req, res) => {
    const brand = req.query.brand;
    const model = req.query.model;
    const [rows] = await db.query('SELECT DISTINCT processor FROM productemissions WHERE brand = ? AND model = ?', [brand, model]);
    res.json(rows.map(row => row.processor));
  });
  
  router.get('/unique-ram', isUser, async (req, res) => {
    const brand = req.query.brand;
    const model = req.query.model;
    const processor = req.query.processor;
    const [rows] = await db.query('SELECT DISTINCT ram FROM productemissions WHERE brand = ? AND model = ? AND processor = ?', [brand, model, processor]);
    res.json(rows.map(row => row.ram));
  });
  
  router.get('/unique-storage', isUser, async (req, res) => {
    const brand = req.query.brand;
    const model = req.query.model;
    const processor = req.query.processor;
    const ram = req.query.ram;
    const [rows] = await db.query('SELECT DISTINCT storage FROM productemissions WHERE brand = ? AND model = ? AND processor = ? AND ram = ?', [brand, model, processor, ram]);
    res.json(rows.map(row => row.storage));
  });
  
  router.get('/unique-screen-size', isUser, async (req, res) => {
    const brand = req.query.brand;
    const model = req.query.model;
    const processor = req.query.processor;
    const ram = req.query.ram;
    const storage = req.query.storage;
    const [rows] = await db.query('SELECT DISTINCT screen_size FROM productemissions WHERE brand = ? AND model = ? AND processor = ? AND ram = ? AND storage = ?', [brand, model, processor, ram, storage]);
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
    console.log("Multi Chart data");
    try {
      const results = await Promise.all(formsData.map(async form => {
        const { brand, model, processor, ram, storage, location, screen_size, years, quantity } = form;
        const [rows] = await db.query(`
          SELECT
            end_of_life, product_use, transport, packaging, production, scope_2, scope_3
          FROM carbon_emissions
          WHERE
            brand = ? AND model = ? AND processor = ? AND ram = ? AND
            storage = ? AND screen_size = ?
        `, [brand, model, processor, ram, storage, screen_size]);
  
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
    console.log("TEST");
    const [rows] = await db.query(`
      SELECT
        brand, model, transportation, packaging, display, soc, battery, power_supply_unit, optical_drive, storage_drive, chassis, end_of_life, device_usage
      FROM productemissions
      WHERE
        brand = ? AND model = ? AND processor = ? AND ram = ? AND
        storage = ? AND screen_size = ? 
    `, [brand, model, processor, ram, storage, screen_size]);
  
    if (rows.length > 0) {
      const row = rows[0];
  
      // Fetch the emissions factor for the selected country
      const [emissionRows] = await db.query(`
        SELECT component, emissions_factor
        FROM emissions_factor
        WHERE country = ?
      `, [location]);
  
      // Create an object mapping the components to their emission factors
      const countryEmissionFactors = emissionRows.reduce((acc, { component, emissions_factor }) => {
        acc[component] = emissions_factor;
        return acc;
      }, {});
  
      const emissions = {
        transportation: row.transportation * quantity * (countryEmissionFactors.transportation || 1),
        packaging: row.packaging * quantity * (countryEmissionFactors.packaging || 1),
        display: row.display * quantity * (countryEmissionFactors.production || 1),
        soc: row.soc * quantity * (countryEmissionFactors.production || 1),
        battery: row.battery * quantity * (countryEmissionFactors.production || 1),
        power_supply_unit: row.power_supply_unit * quantity * (countryEmissionFactors.power_supply_unit || 1),
        optical_drive: row.optical_drive * quantity * (countryEmissionFactors.optical_drive || 1),
        storage_drive: row.storage_drive * quantity * (countryEmissionFactors.storage_drive || 1),
        chassis: row.chassis * quantity * (countryEmissionFactors.chasis || 1),
        end_of_life: row.end_of_life * quantity * years * (countryEmissionFactors.end_of_life || 1),
        device_usage: row.device_usage * quantity * (countryEmissionFactors.device_usage || 1),
        brand: brand,
        model: model,
      };
  
  
      res.json(emissions);
    } else {
      res.status(404).send('Data not found');
    }
  });


// Save user's search details
router.post('/save-search', isUser, async (req, res) => {
  const { brand, model, processor, ram, storage, location, screen_size, years, quantity, total_carbon_emissions } = req.body;
  const user_id = req.session.userId;
  console.log(total_carbon_emissions);

  try {
    await db.query(`
      INSERT INTO user_searches 
      (user_id, brand, model, processor, ram, storage, location, screen_size, years, quantity, total_carbon_emissions) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [user_id, brand, model, processor, ram, storage, location, screen_size, years, quantity, total_carbon_emissions]);

    res.status(200).send('Search saved successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});





router.get('/search-history', isUser, async (req, res) => {
  const user_id = req.session.userId;

  try {
    const [rows] = await db.query(`
      SELECT user_id, brand, model, processor, ram, storage, location, screen_size, years, quantity, total_carbon_emissions
      FROM user_searches
      WHERE user_id = ?
    `, [user_id]);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});


  







router.post('/download', async (req, res) => {
  const { tableData, pieChartData, barChartData } = req.body;

  // Convert the charts to images
  const pieChartImage = await chartToImage(pieChartData);
  const barChartImage = await chartToImage(barChartData);

  // Create the PDF document
  const docDefinition = {
    content: [
      { text: 'Carbon Emission Report', style: 'header' },
      { image: pieChartImage },
      { image: barChartImage },
      { table: { body: tableData }, layout: 'lightHorizontalLines' },
    ],
  };

  const pdfDoc = pdfMake.createPdf(docDefinition);
  pdfDoc.getBase64((base64String) => {
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment;filename=report.pdf',
    });
    const download = Buffer.from(base64String, 'base64');
    res.end(download);
  });
});

async function chartToImage(chartData) {
  const canvas = createCanvas(400, 400);
  const ctx = canvas.getContext('2d');
  new Chart(ctx, chartData);  // Assuming chartData includes the type, data, and options
  return canvas.toDataURL().split(';base64,')[1];
}

module.exports = router;

  



  return router;
};

