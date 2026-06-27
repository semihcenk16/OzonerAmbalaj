const express = require('express');
const bcrypt = require('bcryptjs');
const { db, slugify } = require('../database/init');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.adminId) return res.redirect('/admin');
  res.render('admin/login', { title: 'Yönetim Paneli Girişi', error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.find('admins', a => a.username === username);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.render('admin/login', { title: 'Yönetim Paneli Girişi', error: 'Kullanıcı adı veya şifre hatalı.' });
  }
  req.session.adminId = admin.id;
  req.session.adminUsername = admin.username;
  res.redirect('/admin');
});

router.get('/logout', requireAuth, (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

router.get('/', requireAuth, (req, res) => {
  const stats = {
    products: db.count('products'),
    sliders: db.count('sliders'),
    messages: db.count('contact_messages'),
    announcements: db.count('announcements'),
    partners: db.count('partners')
  };
  const recentMessages = db.getAll('contact_messages')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  res.render('admin/dashboard', { title: 'Yönetim Paneli', stats, recentMessages, username: req.session.adminUsername });
});

router.get('/urunler', requireAuth, (req, res) => {
  const products = db.getAll('products').sort((a, b) => a.sort_order - b.sort_order);
  const categories = db.getAll('categories').sort((a, b) => a.sort_order - b.sort_order).map(c => c.name);
  res.render('admin/products', { title: 'Ürün Yönetimi', products, categories, editProduct: null, username: req.session.adminUsername });
});

router.get('/urunler/duzenle/:id', requireAuth, (req, res) => {
  const products = db.getAll('products').sort((a, b) => a.sort_order - b.sort_order);
  const editProduct = db.find('products', p => p.id === parseInt(req.params.id));
  const categories = db.getAll('categories').sort((a, b) => a.sort_order - b.sort_order).map(c => c.name);
  res.render('admin/products', { title: 'Ürün Yönetimi', products, categories, editProduct, username: req.session.adminUsername });
});

router.post('/urunler', requireAuth, upload.single('image'), (req, res) => {
  const { name, description, category, image_url } = req.body;
  let imageUrl = image_url || '';
  if (req.file) imageUrl = '/uploads/' + req.file.filename;
  const maxOrder = Math.max(0, ...db.getAll('products').map(p => p.sort_order || 0));
  db.insert('products', {
    name, description, category, image_url: imageUrl,
    slug: slugify(name), sort_order: maxOrder + 1,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  });
  res.redirect('/admin/urunler');
});

router.post('/urunler/:id', requireAuth, upload.single('image'), (req, res) => {
  const { name, description, category, image_url } = req.body;
  const id = parseInt(req.params.id);
  const existing = db.find('products', p => p.id === id);
  if (!existing) return res.redirect('/admin/urunler');
  let imageUrl = image_url || existing.image_url;
  if (req.file) imageUrl = '/uploads/' + req.file.filename;
  db.update('products', id, {
    name, description, category, image_url: imageUrl,
    slug: slugify(name), updated_at: new Date().toISOString()
  });
  res.redirect('/admin/urunler');
});

router.post('/urunler/:id/sil', requireAuth, (req, res) => {
  db.remove('products', parseInt(req.params.id));
  res.redirect('/admin/urunler');
});

router.get('/slider', requireAuth, (req, res) => {
  const sliders = db.getAll('sliders').sort((a, b) => a.sort_order - b.sort_order);
  res.render('admin/sliders', { title: 'Slider Yönetimi', sliders, editSlider: null, username: req.session.adminUsername });
});

router.get('/slider/duzenle/:id', requireAuth, (req, res) => {
  const sliders = db.getAll('sliders').sort((a, b) => a.sort_order - b.sort_order);
  const editSlider = db.find('sliders', s => s.id === parseInt(req.params.id));
  res.render('admin/sliders', { title: 'Slider Yönetimi', sliders, editSlider, username: req.session.adminUsername });
});

router.post('/slider', requireAuth, upload.single('image'), (req, res) => {
  const { title, subtitle, description, badge, button_text, button_link, image_url, is_active } = req.body;
  let imageUrl = image_url || '';
  if (req.file) imageUrl = '/uploads/' + req.file.filename;
  const maxOrder = Math.max(0, ...db.getAll('sliders').map(s => s.sort_order || 0));
  db.insert('sliders', {
    title, subtitle, description, image_url: imageUrl, badge,
    button_text, button_link, sort_order: maxOrder + 1,
    is_active: is_active ? 1 : 0
  });
  res.redirect('/admin/slider');
});

router.post('/slider/:id', requireAuth, upload.single('image'), (req, res) => {
  const { title, subtitle, description, badge, button_text, button_link, image_url, is_active } = req.body;
  const id = parseInt(req.params.id);
  const existing = db.find('sliders', s => s.id === id);
  if (!existing) return res.redirect('/admin/slider');
  let imageUrl = image_url || existing.image_url;
  if (req.file) imageUrl = '/uploads/' + req.file.filename;
  db.update('sliders', id, {
    title, subtitle, description, image_url: imageUrl, badge,
    button_text, button_link, is_active: is_active ? 1 : 0
  });
  res.redirect('/admin/slider');
});

router.post('/slider/:id/sil', requireAuth, (req, res) => {
  db.remove('sliders', parseInt(req.params.id));
  res.redirect('/admin/slider');
});

router.get('/duyurular', requireAuth, (req, res) => {
  const announcements = db.getAll('announcements').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.render('admin/announcements', { title: 'Duyuru Yönetimi', announcements, username: req.session.adminUsername });
});

router.post('/duyurular', requireAuth, (req, res) => {
  const { title, content, is_active } = req.body;
  db.insert('announcements', {
    title, content, is_active: is_active ? 1 : 0,
    created_at: new Date().toISOString()
  });
  res.redirect('/admin/duyurular');
});

router.post('/duyurular/:id/sil', requireAuth, (req, res) => {
  db.remove('announcements', parseInt(req.params.id));
  res.redirect('/admin/duyurular');
});

router.get('/cozum-ortaklari', requireAuth, (req, res) => {
  const partners = db.getAll('partners').sort((a, b) => a.sort_order - b.sort_order);
  res.render('admin/partners', {
    title: 'Çözüm Ortakları Yönetimi',
    partners,
    editPartner: null,
    username: req.session.adminUsername
  });
});

router.get('/cozum-ortaklari/duzenle/:id', requireAuth, (req, res) => {
  const partners = db.getAll('partners').sort((a, b) => a.sort_order - b.sort_order);
  const editPartner = db.find('partners', p => p.id === parseInt(req.params.id));
  res.render('admin/partners', {
    title: 'Çözüm Ortakları Yönetimi',
    partners,
    editPartner,
    username: req.session.adminUsername
  });
});

router.post('/cozum-ortaklari', requireAuth, upload.single('logo'), (req, res) => {
  const { name, logo_url, is_active } = req.body;
  let imageUrl = logo_url || '';
  if (req.file) imageUrl = '/uploads/' + req.file.filename;
  const maxOrder = Math.max(0, ...db.getAll('partners').map(p => p.sort_order || 0));
  db.insert('partners', {
    name,
    logo_url: imageUrl,
    sort_order: maxOrder + 1,
    is_active: is_active ? 1 : 0,
    created_at: new Date().toISOString()
  });
  res.redirect('/admin/cozum-ortaklari');
});

router.post('/cozum-ortaklari/:id', requireAuth, upload.single('logo'), (req, res) => {
  const { name, logo_url, is_active } = req.body;
  const id = parseInt(req.params.id);
  const existing = db.find('partners', p => p.id === id);
  if (!existing) return res.redirect('/admin/cozum-ortaklari');
  let imageUrl = logo_url || existing.logo_url;
  if (req.file) imageUrl = '/uploads/' + req.file.filename;
  db.update('partners', id, {
    name,
    logo_url: imageUrl,
    is_active: is_active ? 1 : 0
  });
  res.redirect('/admin/cozum-ortaklari');
});

router.post('/cozum-ortaklari/:id/sil', requireAuth, (req, res) => {
  db.remove('partners', parseInt(req.params.id));
  res.redirect('/admin/cozum-ortaklari');
});

router.get('/mesajlar', requireAuth, (req, res) => {
  const messages = db.getAll('contact_messages').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.render('admin/messages', { title: 'İletişim Mesajları', messages, username: req.session.adminUsername });
});

module.exports = router;
