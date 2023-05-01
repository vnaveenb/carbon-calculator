module.exports = function (db) {
    
const express = require('express');
const router = express.Router();

// Your admin route handlers and middlewares here
// admin.js
router.get('/welcome', isAdmin, (req, res) => {
    res.render('adminWelcome');
  });
  
  router.get('/action', isAdmin, (req, res) => {
    res.render('adminAction');
  });


  // Middleware example for checking if the user is an admin
  // In admin.js
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


  return router;
};
