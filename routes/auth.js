module.exports = function (db) {

const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();

router.get('/login', (req, res) => {
  res.render('login');
});


router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.query('SELECT id, password, role FROM users_registration WHERE username = ?', [username]);

    if (rows.length === 0) {
      res.status(401).send('Invalid username or password');
      return;
    }

    const user = rows[0];
    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (passwordsMatch) {
      req.session.userId = user.id;
      req.session.role = user.role;
      res.locals.user = { id: user.id, username, role: user.role };

      switch (user.role) {
        case 'admin':
          res.redirect('/admin/welcome');
          break;
        case 'vendor':
          res.redirect('/vendor/welcome');
          break;
        case 'user':
          res.redirect('/user/welcome');
          break;
        default:
          res.status(401).send('Invalid role');
      }
    } else {
      res.status(401).send('Invalid username or password');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if the user already exists
    const [userRows] = await db.query('SELECT id FROM users_registration WHERE username = ? OR email = ?', [username, email]);
    if (userRows.length > 0) {
      res.status(400).send('User with the given username or email already exists');
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the user into the database
    const [result] = await db.query('INSERT INTO users_registration (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, role]);

    // Log the user in by storing their user ID and role in the session
    req.session.userId = result.insertId;
    req.session.role = role;

    // Redirect the user to the appropriate welcome page based on their role
    switch (role) {
      case 'admin':
        res.redirect('/admin/welcome');
        break;
      case 'vendor':
        res.redirect('/vendor/welcome');
        break;
      case 'user':
        res.redirect('/user/welcome');
        break;
      default:
        res.status(400).send('Invalid role');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});



router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal server error');
    } else {
      res.redirect('/auth/login');
    }
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/auth/login');
});





return router;
};