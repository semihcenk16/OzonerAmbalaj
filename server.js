const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'ozoner-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.isAdmin = !!(req.session && req.session.adminId);
  next();
});

app.use('/', require('./routes/index'));
app.use('/admin', require('./routes/admin'));
app.use('/api', require('./routes/api'));

app.use((req, res) => {
  res.status(404).render('pages/404', { title: 'Sayfa Bulunamadı' });
});

app.listen(PORT, HOST, () => {
  console.log(`OZONER web sitesi çalışıyor: http://${HOST}:${PORT}`);
  console.log(`Yönetim paneli: /admin/login`);
});
