module.exports = function (db) {
  const express = require('express');
  const bcrypt = require('bcrypt');
  const crypto = require('crypto');


  const router = express.Router();

  const passport = require('passport');
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  const FacebookStrategy = require('passport-facebook').Strategy;

  // Configure Passport strategies and sessions
  const googleClientId = 'your_google_client_id';
  const googleClientSecret = 'your_google_client_secret';
  const facebookAppId = 'your_facebook_app_id';
  const facebookAppSecret = 'your_facebook_app_secret';


  const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'naveenbusirajU@gmail.com',
    pass: 'iinlpijacxxfhrjw'
  }
});


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
      const [rows] = await db.query('SELECT id, password, role, email_verified FROM users_registration WHERE username = ?', [username]);
  
      if (rows.length === 0) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }
  
      const user = rows[0];
  
      if (!user.email_verified) {
        res.status(401).json({ error: 'Please verify your email before logging in' });
        return;
      }
  
      const passwordsMatch = await bcrypt.compare(password, user.password);
  
      if (passwordsMatch) {
        req.session.userId = user.id;
        req.session.role = user.role;
        res.locals.user = { id: user.id, username, role: user.role };
  
        res.json({ redirect: `/auth/redirect/${user.role}` });
      } else {
        res.status(401).json({ error: 'Invalid username or password' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if the user already exists
    const [userRows] = await db.query('SELECT id FROM users_registration WHERE username = ? OR email = ?', [username, email]);
    if (userRows.length > 0) {
      res.status(400).json({ error: 'User with the given username or email already exists' });
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate a verification token
    const verificationToken = crypto.randomBytes(64).toString('hex');

    // Insert the user into the database
    const [result] = await db.query('INSERT INTO users_registration (username, email, password, role, verification_token) VALUES (?, ?, ?, ?, ?)', [username, email, hashedPassword, role, verificationToken]);

    // Send a verification email
    const verificationUrl = `${req.protocol}://${req.get('host')}/auth/verify-email/${verificationToken}`;
    const mailOptions = {
      from: 'naveenbusiraju@gmail.com',
      to: email,
      subject: 'Verify your email',
      text: `Click the following link to verify your email address: ${verificationUrl}`,
      html: `Click <a href="${verificationUrl}">here</a> to verify your email address.`,
    };
    await transporter.sendMail(mailOptions);

    // res.status(200).send('Registration successful. Please check your email to verify your account.');
    res.status(200).json({ success: 'Registration successful. Please check your email to verify your account.' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});


async function sendWelcomeEmail(email, username) {
  const mailOptions = {
    from: 'your_email@example.com',
    to: email,
    subject: `Welcome to Our App ${username}`,
    text: `Hi ${username},\n\nThank you for registering at Our App. We're glad to have you on board!\n\nBest regards,\nThe Carbon Calculator Team`
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const [rows] = await db.query('SELECT id, role FROM users_registration WHERE verification_token = ?', [token]);

    if (rows.length === 0) {
      res.redirect('/auth/login?message=Verification token not found.');
      return;
    }

    const user = rows[0];
    await db.query('UPDATE users_registration SET email_verified = 1, verification_token = NULL WHERE id = ?', [user.id]);
    res.redirect('/auth/login?message=Email successfully verified. You can now log in.');
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