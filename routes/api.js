const express = require('express');
const { db } = require('../database/init');

const router = express.Router();

router.get('/products', (req, res) => {
  const products = db.getAll('products').sort((a, b) => a.sort_order - b.sort_order);
  res.json(products);
});

router.get('/sliders', (req, res) => {
  const sliders = db.filter('sliders', s => s.is_active).sort((a, b) => a.sort_order - b.sort_order);
  res.json(sliders);
});

router.get('/announcements', (req, res) => {
  const announcements = db.filter('announcements', a => a.is_active)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(announcements);
});

router.get('/partners', (req, res) => {
  const partners = db.filter('partners', p => p.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
  res.json(partners);
});

router.get('/categories', (req, res) => {
  const categories = db.getAll('categories').sort((a, b) => a.sort_order - b.sort_order);
  res.json(categories);
});

module.exports = router;
