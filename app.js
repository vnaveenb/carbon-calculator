const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const store = require('./store');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/dist'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.use(
  session({
    secret: process.env.SESSION_SECRET || (() => { throw new Error('SESSION_SECRET env var is required'); })(),
    resave: false,
    saveUninitialized: true,
  })
);

const authRoutes = require('./routes/auth')(store);
const adminRoutes = require('./routes/admin')(store);
const vendorRoutes = require('./routes/vendor')(store);
const userRoutes = require('./routes/user')(store);

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/vendor', vendorRoutes);
app.use('/user', userRoutes);

app.get('/', (req, res) => {
  res.render('welcome');
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
