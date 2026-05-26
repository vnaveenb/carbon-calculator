module.exports = function (store) {
  const express = require('express');
  const router = express.Router();

  function isAdmin(req, res, next) {
    if (!req.session.userId) return res.redirect('/auth/login');
    const user = store.users.findById(req.session.userId);
    if (!user || user.role !== 'admin') return res.redirect('/auth/login');
    res.locals.user = { id: user.id, username: user.username, email: user.email, role: user.role };
    next();
  }

  router.get('/welcome', isAdmin, (req, res) => {
    const users = store.users.getAllUsers();
    res.render('adminWelcome', { users, currentAdminId: req.session.userId, user: res.locals.user });
  });

  router.get('/action', isAdmin, (req, res) => {
    const emissions = store.emissionsFactors.getAllFactors();
    const countries = store.emissionsFactors.getUniqueCountries();
    res.render('adminAction', { emissions, countries, user: res.locals.user });
  });

  router.post('/api/emissions', isAdmin, (req, res) => {
    const { country, component, emissions_factor } = req.body;
    store.emissionsFactors.upsertFactor(country, component, emissions_factor);
    res.redirect('/admin/action');
  });

  router.patch('/api/emissions/:country/:component', isAdmin, (req, res) => {
    const { country, component } = req.params;
    const { emissions_factor } = req.body;
    store.emissionsFactors.upsertFactor(country, component, emissions_factor);
    res.sendStatus(200);
  });

  router.patch('/users/:userId/role', isAdmin, (req, res) => {
    const { role } = req.body;
    const { userId } = req.params;

    if (Number(userId) === req.session.userId) {
      return res.status(403).send('Cannot change own role');
    }

    const updated = store.users.updateRole(userId, role);
    if (!updated) return res.status(404).send('User not found');
    res.sendStatus(200);
  });

  router.delete('/users/:userId', isAdmin, (req, res) => {
    const { userId } = req.params;

    if (Number(userId) === req.session.userId) {
      return res.status(403).send('Cannot delete self');
    }

    const deleted = store.users.deleteUser(userId);
    if (!deleted) return res.status(404).send('User not found');
    res.sendStatus(200);
  });

  return router;
};
