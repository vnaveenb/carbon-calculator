module.exports = function (db) {


const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const XLSX = require('xlsx');

const path = require('path');


router.post('/upload-xls', upload.single('xlsFile'), async (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheet_name_list = workbook.SheetNames;
    const results = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data found in the uploaded file. Please upload a file with data.',
      });
    }
    
    const vendorId = req.session.userId;

    const promises = results.map(async (row) => {
      const {
        brand, location, end_of_life, product_use, transport,
        packaging, production, scope_2, scope_3, model,
        screen_size, processor, ram, storage
      } = row;

      await db.execute(
        'INSERT INTO carbon_emissions (vendor_id, brand, location, end_of_life, product_use, transport, packaging, production, scope_2, scope_3, model, screen_size, processor, ram, storage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          vendorId, brand, location, end_of_life, product_use, transport,
          packaging, production, scope_2, scope_3, model,
          screen_size, processor, ram, storage
        ]
      );
    });

    await Promise.all(promises);

    res.status(200).json({ success: true, message: 'Emissions data submitted successfully' });
  } catch (err) {
    console.error('Error submitting emissions data:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});




router.get('/test.xlsx', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'test.xlsx'));
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






 router.get('/welcome', isVendor, (req, res) => {
    res.render('vendorWelcome');
  });
  
  router.get('/action', isVendor, (req, res) => {
    res.render('vendorAction');
  });

  
  router.post('/submit-emissions-data', async (req, res) => {
    const vendorId = req.session.userId;

    const {
      brand,model,processor,ram,storage,location,end_of_life,product_use,transport,packaging,production,scope_2,scope_3,screen_size
    } = req.body;

    try {
      const [result] = await db.execute(
        'INSERT INTO carbon_emissions (vendor_id,brand,model,processor,ram,storage,location,end_of_life,product_use,transport,packaging,production,scope_2,scope_3,screen_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          vendorId,brand,model,processor,ram,storage,location,end_of_life,product_use,transport,packaging,production,scope_2,scope_3,screen_size
        ]
      );

      res.status(200).json({ success: true, message: 'Emissions data submitted successfully' });
    } catch (err) {
      console.error('Error submitting emissions data:', err);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });

async function isVendor(req, res, next) {
  try {
    const [rows] = await db.query('SELECT username, email, role FROM users_registration WHERE id = ?', [req.session.userId]);
    if (rows.length > 0 && rows[0].role === 'vendor') {
      res.locals.user = rows[0];
      next();
    } else {
      res.redirect('/auth/login');
    }
  } catch (error) {
    console.error(error);
    res.redirect('/auth/login');
  }
}


      return router;
    };
