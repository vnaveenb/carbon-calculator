module.exports = function (store) {
  const express = require('express');
  const bcrypt = require('bcrypt');
  const router = express.Router();

  router.get('/login', (req, res) => {
    res.render('login');
  });

  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = store.users.findByUsername(username);

      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      req.session.userId = user.id;
      req.session.role = user.role;
      res.json({ redirect: `/auth/redirect/${user.role}` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/register', async (req, res) => {
    try {
      const { username, email, password, role } = req.body;

      if (store.users.findByUsername(username)) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      if (store.users.findByEmail(email)) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      store.users.createUser({ username, email, passwordHash, role: role || 'user' });

      res.status(200).json({ success: 'Registration successful. You can now log in.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/auth/login'));
  });

  router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/auth/login'));
  });

  router.get('/redirect/:role', (req, res) => {
    const role = req.params.role;
    const redirects = { admin: '/admin/welcome', vendor: '/vendor/welcome', user: '/user/welcome' };
    res.redirect(redirects[role] || '/auth/login');
  });

  return router;
};
