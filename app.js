const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const db = require('./db');
const path = require('path');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/dist'));
app.use(express.static(__dirname + '/public'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.use(
  session({
    secret: 'a1b55b19f1c68859bad585e655271b002614c013d2e3b80383060bcd807a1e94d2dca2d71b87e693ed06f788d0633da41e69efcd4e1f8207fbc745f96f128327',
    resave: false,
    saveUninitialized: true,
  })
);

const authRoutes = require('./routes/auth')(db, session);
const adminRoutes = require('./routes/admin')(db);
const vendorRoutes = require('./routes/vendor')(db);
const userRoutes = require('./routes/user')(db);
const apiRoutes = require('./routes/api')(db);

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/vendor', vendorRoutes);
app.use('/user', userRoutes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.redirect('/auth/login');
});

app.get('/login', (req, res) => {
  res.redirect('/auth/login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
