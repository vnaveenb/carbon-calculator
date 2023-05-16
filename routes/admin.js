module.exports = function (db) {
    
const express = require('express');
const router = express.Router();

//  admin route handlers and middlewares here


  // Middleware  for checking if the user is an admin
async function isAdmin(req, res, next) {
  try {
    const [rows] = await db.query('SELECT username, email, role FROM users_registration WHERE id = ?', [req.session.userId]);
    if (rows.length > 0 && rows[0].role === 'admin') {
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


router.get('/welcome', isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users_registration');
    res.render('adminWelcome', { users: rows, currentAdminId: req.session.userId, user: res.locals.user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

router.get('/action', isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM emissions_factor');
    const countries = [...new Set(rows.map(row => row.country))];  // Create a list of unique countries
    res.render('adminAction', { emissions: rows, countries: countries, user: res.locals.user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});


router.post('/api/emissions', isAdmin, async (req, res) => {
  const { country, component, emissions_factor } = req.body;
  console.log("inside emissions");

  try {
    await db.query('INSERT INTO emissions_factor (country, component, emissions_factor) VALUES (?, ?, ?)', [country, component, emissions_factor]);
    res.redirect('/admin/action');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

router.patch('/api/emissions/:country/:component', isAdmin, async (req, res) => {
  const { country, component } = req.params;
  const { emissions_factor } = req.body;

  console.log('Route parameters:', country, component);
  console.log('Request body:', emissions_factor);

  try {
    await db.query('UPDATE emissions_factor SET emissions_factor = ? WHERE country = ? AND component = ?', [emissions_factor, country, component]);
    res.sendStatus(200);
  } catch (error) {
    console.log('Error:', error);
    res.status(500).send('Internal server error');
  }
});






router.patch('/users/:userId/role', isAdmin, async (req, res) => {
  const { role } = req.body;
  const { userId } = req.params;

  try {
    if (role === 'admin' && req.session.userId == userId) {
      res.status(403).send('Cannot change own role');
      return;
    }

    await db.query('UPDATE users_registration SET role = ? WHERE id = ?', [role, userId]);

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

router.delete('/users/:userId', isAdmin, async (req, res) => {
  const { userId } = req.params;

  try {
    if (req.session.userId == userId) {
      res.status(403).send('Cannot delete self');
      return;
    }

    await db.query('DELETE FROM users_registration WHERE id = ?', [userId]);

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});








  return router;
};
