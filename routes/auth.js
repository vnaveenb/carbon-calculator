module.exports = function (db) {
  const express = require('express');
  const bcrypt = require('bcrypt');

  const router = express.Router();

  const passport = require('passport');
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  const FacebookStrategy = require('passport-facebook').Strategy;

  // Configure Passport strategies and sessions
  const googleClientId = 'your_google_client_id';
  const googleClientSecret = 'your_google_client_secret';
  const facebookAppId = 'your_facebook_app_id';
  const facebookAppSecret = 'your_facebook_app_secret';

  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: '/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        // Handle Google user authentication here
      }
    )
  );

  passport.use(
    new FacebookStrategy(
      {
        clientID: facebookAppId,
        clientSecret: facebookAppSecret,
        callbackURL: '/auth/facebook/callback',
        profileFields: ['id', 'displayName', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        // Handle Facebook user authentication here
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    const [rows] = await db.query('SELECT * FROM users_registration WHERE id = ?', [id]);
    const user = rows[0];
    done(null, user);
  });

  router.use(passport.initialize());
  router.use(passport.session());

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


router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login' }),
  (req, res) => {
    res.redirect(`/auth/redirect/${req.user.role}`);
  }
);

router.get(
  '/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/auth/login' }),
  (req, res) => {
    res.redirect(`/auth/redirect/${req.user.role}`);
  }
);

router.get('/redirect/:role', (req, res) => {
  const role = req.params.role;
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
      res.status(401).send('Invalid role');
  }
});






return router;
};