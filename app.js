const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const db = require('./db');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());


app.set('view engine', 'ejs');

app.use(
    session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: true,
    })
);

const authRoutes = require('./routes/auth')(db);
const adminRoutes = require('./routes/admin')(db);
const vendorRoutes = require('./routes/vendor')(db);
const userRoutes = require('./routes/user')(db);

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/vendor', vendorRoutes);
app.use('/user', userRoutes);

app.get('/', (req, res) => {
    res.redirect('/auth/login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
