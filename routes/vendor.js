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
        brand, model, processor, ram, storage, screen_size, date, total_co2, transportation, packaging, display, soc, battery, power_supply_unit, optical_drive, storage_drive, chassis, end_of_life, device_usage
      } = row;

      let jsDate = XLSX.SSF.parse_date_code(date); 
      let mysqlDate = `${jsDate.y}-${jsDate.m < 10 ? '0' + jsDate.m : jsDate.m}-${jsDate.d < 10 ? '0' + jsDate.d : jsDate.d}`;

      await db.execute(
        'INSERT INTO ProductEmissions (brand, model, processor, ram, storage, screen_size, date, total_co2, transportation, packaging, display, soc, battery, power_supply_unit, optical_drive, storage_drive, chassis, end_of_life, device_usage, vendor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          brand, model, processor, ram, storage, screen_size, mysqlDate, total_co2, transportation, packaging, display, soc, battery, power_supply_unit, optical_drive, storage_drive, chassis, end_of_life, device_usage, vendorId
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
    const [rows] = await db.query('SELECT * FROM ProductEmissions WHERE vendor_id = ?', [req.session.userId]);
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
      brand = null, 
      model = null, 
      processor = null, 
      ram = null, 
      storage = null, 
      screen_size = null, 
      date = null, 
      total_co2 = null, 
      transportation = null, 
      packaging = null, 
      display = null, 
      soc = null, 
      battery = null, 
      power_supply_unit = null, 
      optical_drive = null, 
      storage_drive = null, 
      chassis = null, 
      end_of_life = null, 
      device_usage = null
  } = req.body;

    try {
      // Check if a record with the same brand, model, processor, ram, and storage already exists
      const [rows] = await db.execute(
        'SELECT * FROM ProductEmissions WHERE brand = ? AND model = ? AND processor = ? AND ram = ? AND storage = ?',
        [brand, model, processor, ram, storage]
      );

      if (rows.length > 0) {
        // If a record exists, return an error message
        res.status(400).json({ success: false, message: 'A record with the same brand, model, processor, ram, and storage already exists' });
      } else {
        // total_co2=null;
        // If no record exists, insert the new record
        const [result] = await db.execute(
          'INSERT INTO ProductEmissions (vendor_id,brand,model,processor,ram,storage,screen_size,date,total_co2,transportation,packaging,display,soc,battery,power_supply_unit,optical_drive,storage_drive,chassis,end_of_life,device_usage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [vendorId,brand,model,processor,ram,storage,screen_size,date,total_co2,transportation,packaging,display,soc,battery,power_supply_unit,optical_drive,storage_drive,chassis,end_of_life,device_usage]
        );

        res.status(200).json({ success: true, message: 'Emissions data submitted successfully' });
      }
    } catch (err) {
      console.error('Error submitting emissions data:', err);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/update', async (req, res) => {
  const {
    id, brand, model, processor, ram, storage, screen_size, end_of_life, device_usage, total_co2, transportation, packaging, display, soc, battery, power_supply_unit, optical_drive, storage_drive, chassis
  } = req.body;

  try {
    // Update the record
    const [result] = await db.execute(
      'UPDATE ProductEmissions SET end_of_life = ?, device_usage = ?, transportation = ?, packaging = ?, display = ?, soc = ?, battery = ?, power_supply_unit = ?, optical_drive = ?, storage_drive = ?, chassis = ? WHERE brand = ? AND model = ? AND processor = ? AND ram = ? AND storage = ? AND screen_size = ?',
      [end_of_life, device_usage, transportation, packaging, display, soc, battery, power_supply_unit, optical_drive, storage_drive, chassis, brand, model, processor, ram, storage, screen_size]
    );

    if (result.affectedRows === 0) {
      // If no record was updated, return an error message
      res.status(400).json({ success: false, message: 'No record found with the provided id' });
    } else {
      res.status(200).json({ success: true, message: 'Emissions data updated successfully' });
    }
  } catch (err) {
    console.error('Error updating emissions data:', err);
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
