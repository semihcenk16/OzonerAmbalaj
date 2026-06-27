const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const files = {
  admins: path.join(dataDir, 'admins.json'),
  products: path.join(dataDir, 'products.json'),
  sliders: path.join(dataDir, 'sliders.json'),
  announcements: path.join(dataDir, 'announcements.json'),
  contact_messages: path.join(dataDir, 'messages.json'),
  partners: path.join(dataDir, 'partners.json'),
  categories: path.join(dataDir, 'categories.json')
};

function read(table) {
  const file = files[table];
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function write(table, data) {
  fs.writeFileSync(files[table], JSON.stringify(data, null, 2), 'utf8');
}

function nextId(items) {
  return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const db = {
  getAll(table) {
    return read(table);
  },
  find(table, predicate) {
    return read(table).find(predicate);
  },
  filter(table, predicate) {
    return read(table).filter(predicate);
  },
  count(table, predicate) {
    const items = read(table);
    return predicate ? items.filter(predicate).length : items.length;
  },
  insert(table, record) {
    const items = read(table);
    const item = { id: nextId(items), ...record };
    items.push(item);
    write(table, items);
    return item;
  },
  update(table, id, updates) {
    const items = read(table);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates, id };
    write(table, items);
    return items[idx];
  },
  remove(table, id) {
    const items = read(table).filter(i => i.id !== id);
    write(table, items);
  }
};

function seedIfEmpty() {
  if (db.count('admins') === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    db.insert('admins', {
      username,
      password_hash: bcrypt.hashSync(password, 10)
    });
  }

  if (db.count('products') === 0) {
    const seedPath = path.join(dataDir, 'products.json');
    if (fs.existsSync(seedPath)) {
      const items = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      write('products', items);
    }
  }

  if (db.count('categories') === 0) {
    const seedPath = path.join(dataDir, 'categories.json');
    if (fs.existsSync(seedPath)) {
      const items = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      write('categories', items);
    }
  }

  if (db.count('sliders') === 0) {
    const seedPath = path.join(dataDir, 'sliders.json');
    if (fs.existsSync(seedPath)) {
      const items = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      write('sliders', items);
    }
  }

  if (db.count('announcements') === 0) {
    db.insert('announcements', {
      title: "1988'den Beri Güven",
      content: "Endüstriyel ambalaj ve temizlik çözümlerinde Bursa'nın öncü kuruluşu OZONER ile tanışın.",
      is_active: 1,
      created_at: new Date().toISOString()
    });
  }

  if (db.count('partners') === 0) {
    const partners = [
      { name: 'Unilever', slug: 'unilever', logo_url: '/images/partners/unilever.webp' },
      { name: 'Hayat', slug: 'hayat', logo_url: '/images/partners/hayat.webp' },
      { name: 'Focus', slug: 'focus', logo_url: '/images/partners/focus.webp' },
      { name: 'Domestos', slug: 'domestos', logo_url: '/images/partners/domestos.webp' },
      { name: 'Lipton', slug: 'lipton', logo_url: '/images/partners/lipton.webp' },
      { name: 'Nestle', slug: 'nestle', logo_url: '/images/partners/nestle.webp' },
      { name: 'Diversey', slug: 'diversey', logo_url: '/images/partners/diversey.webp' },
      { name: 'Dolphin', slug: 'dolphin', logo_url: '/images/partners/dolphin.webp' },
      { name: 'AkkaPlast', slug: 'akkaplast', logo_url: '/images/partners/akkaplast.webp' },
      { name: 'Lindera', slug: 'lindera', logo_url: '/images/partners/lindera.webp' },
      { name: 'Kurukahveci Mehmet Efendi', slug: 'kurukahveci-mehmet-efendi', logo_url: '/images/partners/kurukahveci-mehmet-efendi.webp' },
      { name: 'Cif', slug: 'cif', logo_url: '/images/partners/cif.webp' }
    ];
    partners.forEach((p, i) => {
      db.insert('partners', {
        ...p,
        sort_order: i + 1,
        is_active: 1,
        created_at: new Date().toISOString()
      });
    });
  }
}

seedIfEmpty();

module.exports = { db, slugify };
