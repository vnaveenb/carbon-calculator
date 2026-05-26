module.exports = function (store) {
  const express = require('express');
  const router = express.Router();
  const multer = require('multer');
  const upload = multer({ dest: 'uploads/' });
  const XLSX = require('xlsx');
  const path = require('path');

  function isVendor(req, res, next) {
    if (!req.session.userId) return res.redirect('/auth/login');
    const user = store.users.findById(req.session.userId);
    if (!user || user.role !== 'vendor') return res.redirect('/auth/login');
    res.locals.user = { id: user.id, username: user.username, email: user.email, role: user.role };
    next();
  }

  router.get('/welcome', isVendor, (req, res) => {
    res.render('vendorWelcome', { user: res.locals.user });
  });

  router.get('/action', isVendor, (req, res) => {
    res.render('vendorAction', { user: res.locals.user });
  });

  router.post('/upload-xls', isVendor, upload.single('xlsFile'), (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (rows.length === 0) {
        return res.status(400).json({ success: false, message: 'No data found in uploaded file' });
      }

      for (const row of rows) {
        const total_co2 = parseFloat(row.total_co2) || 0;
        store.products.addProduct({
          brand: row.brand || '',
          model: row.model || '',
          total_co2,
          chassis: parseFloat(row.chassis) || 0,
          storage_drive: parseFloat(row.storage_drive) || 0,
          power_supply_unit: parseFloat(row.power_supply_unit) || 0,
          battery: parseFloat(row.battery) || 0,
          soc: parseFloat(row.soc) || 0,
          display: parseFloat(row.display) || 0,
          packaging: parseFloat(row.packaging) || 0,
          optical_drive: parseFloat(row.optical_drive) || 0,
          end_of_life: parseFloat(row.end_of_life) || 0,
          transportation: parseFloat(row.transportation) || 0,
          device_usage: parseFloat(row.device_usage) || 0,
          source: 'vendor',
        });
      }

      res.status(200).json({ success: true, message: `Uploaded ${rows.length} records` });
    } catch (err) {
      console.error('XLS upload error:', err);
      res.status(500).json({ success: false, message: 'Upload failed' });
    }
  });

  router.get('/test.xlsx', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'test.xlsx'));
  });

  router.get('/fetch-data', isVendor, (req, res) => {
    const products = store.products.getAllProducts().filter(p => p.source === 'vendor');
    res.status(200).json(products);
  });

  router.post('/submit-emissions-data', isVendor, (req, res) => {
    const {
      brand = '', model = '', total_co2 = 0,
      transportation = 0, packaging = 0, display = 0, soc = 0,
      battery = 0, power_supply_unit = 0, optical_drive = 0,
      storage_drive = 0, chassis = 0, end_of_life = 0, device_usage = 0,
    } = req.body;

    const existing = store.products.getProductData(brand, model);
    if (existing) {
      return res.status(400).json({ success: false, message: 'A record with the same brand and model already exists' });
    }

    store.products.addProduct({
      brand, model,
      total_co2: parseFloat(total_co2) || 0,
      chassis: parseFloat(chassis) || 0,
      storage_drive: parseFloat(storage_drive) || 0,
      power_supply_unit: parseFloat(power_supply_unit) || 0,
      battery: parseFloat(battery) || 0,
      soc: parseFloat(soc) || 0,
      display: parseFloat(display) || 0,
      packaging: parseFloat(packaging) || 0,
      optical_drive: parseFloat(optical_drive) || 0,
      end_of_life: parseFloat(end_of_life) || 0,
      transportation: parseFloat(transportation) || 0,
      device_usage: parseFloat(device_usage) || 0,
      source: 'vendor',
    });

    res.status(200).json({ success: true, message: 'Emissions data submitted successfully' });
  });

  router.post('/update', isVendor, (req, res) => {
    const { brand, model, ...rest } = req.body;
    const product = store.products.getProductData(brand, model);
    if (!product) return res.status(404).json({ success: false, message: 'Record not found' });

    store.products.addProduct({ brand, model, ...rest });
    res.status(200).json({ success: true, message: 'Emissions data updated successfully' });
  });

  return router;
};
