/**
 * Scrapes product data from ozonerambalaj.com
 */
const fs = require('fs');
const path = require('path');

const BASE = 'https://ozonerambalaj.com';

const CATEGORIES = [
  { name: 'Çöp Torbaları', slug: 'cop-torbaları', path: '/Urunler/cop-torbalar%C4%B1', group: 'Ambalaj Ürünleri' },
  { name: 'Deterjan Grubu', slug: 'deterjan-grubu', path: '/Urunler/deterjan-grubu', group: 'Endüstriyel Temizlik Ürünleri' },
  { name: 'Mop Grubu', slug: 'mop-grubu', path: '/Urunler/mop-grubu', group: 'Endüstriyel Temizlik Ürünleri' },
  { name: 'Sap Çeşitleri', slug: 'sap-cesitleri', path: '/Urunler/sap-cesitleri', group: 'Endüstriyel Temizlik Ürünleri' },
  { name: 'Eldiven Grubu', slug: 'eldiven-grubu', path: '/Urunler/eldiven-grubu', group: 'Endüstriyel Temizlik Ürünleri' },
  { name: 'Faraş Grubu', slug: 'faras-grubu', path: '/Urunler/faras-grubu', group: 'Endüstriyel Temizlik Ürünleri' },
  { name: 'Sünger ve Tel Grubu', slug: 'sunger-ve-tel-grubu', path: '/Urunler/sunger-ve-tel-grubu', group: 'Endüstriyel Temizlik Ürünleri' },
  { name: 'Yersil Grubu', slug: 'yersil-grubu', path: '/Urunler/yersil-grubu', group: 'Endüstriyel Temizlik Ürünleri' },
  { name: 'Camsil Grubu', slug: 'camsil-grubu', path: '/Urunler/camsil-grubu', group: 'Endüstriyel Temizlik Ürünleri' },
  { name: 'Fırça Çeşitleri', slug: 'firca-cesitleri', path: '/Urunler/firca-cesitleri', group: 'Endüstriyel Temizlik Ürünleri' },
  { name: 'Temizlik Setleri', slug: 'temizlik-setleri', path: '/Urunler/temizlik-setleri', group: 'Endüstriyel Temizlik Ürünleri' },
  { name: 'Kova Grubu', slug: 'kova-grubu', path: '/Urunler/kova-grubu', group: 'Endüstriyel Temizlik Ürünleri' },
  { name: 'Endüstriyel Aparat Grubu', slug: 'endustriyel-aparat-grubu', path: '/Urunler/end%C3%BCstriyel-aparat-grubu', group: 'Aparatlar' }
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function stripTags(s) {
  return decodeHtml(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function resolveUrl(src) {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return 'https:' + src;
  if (src.startsWith('/')) return BASE + src;
  return BASE + '/' + src;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OzonerSync/1.0)' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function parseCategoryImage(html, categoryName) {
  // Category hero/header image
  const patterns = [
    /class="[^"]*kategori[^"]*"[^>]*style="[^"]*background-image:\s*url\(['"]?([^'")]+)/i,
    /<img[^>]+src=["']([^"']*kategori[^"']*)["']/i,
    /<img[^>]+src=["']([^"']*content\/img[^"']*)["']/i
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return resolveUrl(m[1]);
  }
  return '';
}

function parseProducts(html, category) {
  const products = [];
  const categoryImage = parseCategoryImage(html, category.name);

  // Table rows: product name + description columns
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const row = match[1];
    const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c => stripTags(c[1]));
    if (cells.length < 1) continue;

    const name = cells[0];
    const desc = cells[1] || '';

    if (!name || name.toLowerCase() === 'ürün adı' || name.toLowerCase() === 'urun adi') continue;
    if (!name || name.toLowerCase() === 'açıklama') continue;

    // Try to find image near product name in HTML
    let imageUrl = '';
    const nameEscaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 20);
    const imgNear = new RegExp(nameEscaped + '[\\s\\S]{0,500}?<img[^>]+src=["\']([^"\']+)["\']', 'i');
    const imgMatch = html.match(imgNear);
    if (imgMatch) imageUrl = resolveUrl(imgMatch[1]);

    const fullName = desc ? `${name} — ${desc}` : name;
    const productSlug = slugify(`${category.slug}-${name}-${desc}`);

    products.push({
      name: fullName,
      short_name: name,
      description: desc || `${category.name} ürünü`,
      category: category.name,
      category_group: category.group,
      image_url: imageUrl || categoryImage,
      slug: productSlug,
      category_slug: category.slug
    });
  }

  // Card/grid layout fallback
  if (products.length === 0) {
    const cardRegex = /<div[^>]*class="[^"]*(?:product|urun|card)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    // skip - table is primary on this site
  }

  return { products, categoryImage };
}

async function main() {
  const allProducts = [];
  const categoryMeta = [];

  for (const cat of CATEGORIES) {
    const url = BASE + cat.path;
    console.log('Fetching:', url);
    try {
      const html = await fetchHtml(url);
      const { products, categoryImage } = parseProducts(html, cat);

      categoryMeta.push({
        name: cat.name,
        slug: cat.slug,
        group: cat.group,
        image_url: categoryImage,
        product_count: products.length
      });

      // Use category image for all products in category if no individual image
      products.forEach(p => {
        if (!p.image_url && categoryImage) p.image_url = categoryImage;
        allProducts.push(p);
      });

      console.log(`  -> ${products.length} products, category img: ${categoryImage ? 'yes' : 'no'}`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  const outDir = path.join(__dirname, '..', 'data');
  fs.writeFileSync(path.join(outDir, 'scraped-products.json'), JSON.stringify(allProducts, null, 2));
  fs.writeFileSync(path.join(outDir, 'scraped-categories.json'), JSON.stringify(categoryMeta, null, 2));
  console.log(`\nTotal: ${allProducts.length} products across ${categoryMeta.length} categories`);
}

main().catch(console.error);
