module.exports = function (store) {
  const express = require('express');
  const router = express.Router();
  const { countries } = require('countries-list');

  function ensureAccessible(req, res, next) {
    if (req.session.userId) {
      const user = store.users.findById(req.session.userId);
      if (user) {
        res.locals.user = { id: user.id, username: user.username, email: user.email, role: user.role };
        return next();
      }
    }
    res.locals.user = { username: 'Guest', email: '', role: 'guest', id: null };
    next();
  }

  function requireUser(req, res, next) {
    if (!req.session.userId) return res.redirect('/auth/login');
    const user = store.users.findById(req.session.userId);
    if (!user || user.role !== 'user') return res.redirect('/auth/login');
    res.locals.user = { id: user.id, username: user.username, email: user.email, role: user.role };
    next();
  }

  router.get('/welcome', requireUser, (req, res) => {
    res.render('userWelcome', { user: res.locals.user });
  });

  router.get('/actions', ensureAccessible, (req, res) => {
    res.render('userAction', { countries, user: res.locals.user });
  });

  router.get('/unique-brands', ensureAccessible, (req, res) => {
    res.json(store.products.getUniqueBrands());
  });

  router.get('/unique-models', ensureAccessible, (req, res) => {
    const { brand } = req.query;
    res.json(store.products.getModelsForBrand(brand || ''));
  });

  router.get('/chart-data', ensureAccessible, (req, res) => {
    const { brand, model, location, years, quantity } = req.query;
    const qty = parseFloat(quantity) || 1;
    const yrs = parseFloat(years) || 1;

    const product = store.products.getProductData(brand, model);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const factor = store.emissionsFactors.getFactor(location);

    const emissions = {
      transportation: +(product.transportation * qty).toFixed(2),
      packaging: +(product.packaging * qty).toFixed(2),
      display: +(product.display * qty).toFixed(2),
      soc: +(product.soc * qty).toFixed(2),
      battery: +(product.battery * qty).toFixed(2),
      power_supply_unit: +(product.power_supply_unit * qty).toFixed(2),
      optical_drive: +(product.optical_drive * qty).toFixed(2),
      storage_drive: +(product.storage_drive * qty).toFixed(2),
      chassis: +(product.chassis * qty).toFixed(2),
      end_of_life: +(product.end_of_life * qty * yrs).toFixed(2),
      device_usage: +(product.device_usage * qty * yrs * factor).toFixed(2),
      brand,
      model,
    };

    res.json(emissions);
  });

  router.post('/save-search', ensureAccessible, (req, res) => {
    const { brand, model, location, years, quantity, total_carbon_emissions } = req.body;

    if (res.locals.user.id) {
      store.users.addSearchHistory({
        user_id: res.locals.user.id,
        brand, model, location, years, quantity, total_carbon_emissions,
      });
    } else {
      if (!req.session.guestHistory) req.session.guestHistory = [];
      req.session.guestHistory.push({ brand, model, location, years, quantity, total_carbon_emissions });
    }

    res.status(200).send('Search saved');
  });

  router.get('/search-history', requireUser, (req, res) => {
    const history = store.users.getHistoryForUser(req.session.userId);
    res.json(history);
  });

  return router;
};
