const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const path = require('path');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const policyRoutes = require('./src/routes/policyRoutes');
const claimRoutes = require('./src/routes/claimRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const { ensureAuthenticated, ensureRole } = require('./src/middleware/authMiddleware');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

app.use('/auth', authRoutes);
app.use('/dashboard', ensureAuthenticated, dashboardRoutes);
app.use('/policies', ensureAuthenticated, policyRoutes);
app.use('/claims', ensureAuthenticated, claimRoutes);
app.use('/payments', ensureAuthenticated, paymentRoutes);
app.use('/admin', ensureAuthenticated, ensureRole('admin'), adminRoutes);

app.get('/', (req, res) => {
  if (req.session.user) {
    if (req.session.user.role === 'admin') return res.redirect('/admin/users');
    return res.redirect('/dashboard');
  }
  res.redirect('/auth/login');
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OmniCoInsurance app running on http://localhost:${PORT}`);
});
