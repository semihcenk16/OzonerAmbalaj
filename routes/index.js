const express = require('express');
const { db } = require('../database/init');

const router = express.Router();

router.get('/', (req, res) => {
  const sliders = db.filter('sliders', s => s.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const categories = db.getAll('categories').sort((a, b) => a.sort_order - b.sort_order).slice(0, 4);
  const announcements = db.filter('announcements', a => a.is_active)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3);
  res.render('pages/index', {
    title: "OZONER Endüstriyel & Ambalaj | 1988'den Beri Güven",
    activePage: 'home',
    sliders,
    categories,
    announcements
  });
});

router.get('/hakkimizda', (req, res) => {
  res.render('pages/hakkimizda', {
    title: 'Hakkımızda | OZONER Endüstriyel & Ambalaj',
    activePage: 'about'
  });
});

router.get('/urunler', (req, res) => {
  const { kategori, q } = req.query;
  const allCategories = db.getAll('categories').sort((a, b) => a.sort_order - b.sort_order);
  let products = db.getAll('products').sort((a, b) => a.sort_order - b.sort_order);
  const showCategories = !kategori && !q;

  if (q) {
    const lower = q.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      (p.description || '').toLowerCase().includes(lower) ||
      (p.category || '').toLowerCase().includes(lower) ||
      (p.short_name || '').toLowerCase().includes(lower)
    );
  } else if (kategori) {
    products = products.filter(p => p.category === kategori);
  }

  res.render('pages/urunler', {
    title: 'Ürün Kategorileri | OZONER Endüstriyel & Ambalaj',
    activePage: 'products',
    products,
    categories: allCategories.map(c => c.name),
    categoryList: allCategories,
    filterCategory: kategori || '',
    searchQuery: q || '',
    showCategories
  });
});

router.get('/urunler/:slug', (req, res) => {
  const product = db.find('products', p => p.slug === req.params.slug);
  if (!product) return res.status(404).render('pages/404', { title: 'Ürün Bulunamadı' });
  const related = db.getAll('products')
    .filter(p => p.category === product.category && p.id !== product.id)
    .sort((a, b) => a.sort_order - b.sort_order).slice(0, 3);
  res.render('pages/urun-detay', {
    title: `${product.name} | OZONER`,
    activePage: 'products',
    product,
    related
  });
});

router.get('/CozumOrtaklarimiz', (req, res) => res.redirect(301, '/cozum-ortaklarimiz'));

router.get('/cozum-ortaklarimiz', (req, res) => {
  const partners = db.filter('partners', p => p.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
  res.render('pages/cozum-ortaklarimiz', {
    title: 'Çözüm Ortaklarımız | OZONER Endüstriyel & Ambalaj',
    activePage: 'partners',
    partners
  });
});

router.get('/iletisim', (req, res) => {
  res.render('pages/iletisim', {
    title: 'İletişim | OZONER Endüstriyel & Ambalaj',
    activePage: 'contact',
    success: req.query.success === '1'
  });
});

router.post('/iletisim', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.render('pages/iletisim', {
      title: 'İletişim | OZONER Endüstriyel & Ambalaj',
      activePage: 'contact',
      error: 'Lütfen zorunlu alanları doldurun.',
      form: req.body
    });
  }
  db.insert('contact_messages', {
    name, email, subject: subject || '', message,
    created_at: new Date().toISOString()
  });
  res.redirect('/iletisim?success=1');
});

module.exports = router;
