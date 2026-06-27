/**
 * Scrapes & syncs products from ozonerambalaj.com into data/*.json
 */
const fs = require('fs');
const path = require('path');

const BASE = 'https://ozonerambalaj.com';
const IMG = `${BASE}/Content/img`;

const CATEGORIES = [
  { name: 'Çöp Torbaları', slug: 'cop-torbalari', path: '/Urunler/cop-torbalar%C4%B1', group: 'Ambalaj Ürünleri', kategori: 1,
    description: 'Mini boydan endüstriyel battal boya kadar her hacme uygun dayanıklı torbalar.' },
  { name: 'Deterjan Grubu', slug: 'deterjan-grubu', path: '/Urunler/deterjan-grubu', group: 'Endüstriyel Temizlik Ürünleri', kategori: 2,
    description: 'Yüzey temizleyiciler, yağ çözücüler ve genel temizlik kimyasalları.' },
  { name: 'Mop Grubu', slug: 'mop-grubu', path: '/Urunler/mop-grubu', group: 'Endüstriyel Temizlik Ürünleri', kategori: 3,
    description: 'Mikrofiber, pamuklu ve endüstriyel mop çeşitleri ile etkili zemin temizliği.' },
  { name: 'Sap Çeşitleri', slug: 'sap-cesitleri', path: '/Urunler/sap-cesitleri', group: 'Endüstriyel Temizlik Ürünleri', kategori: 4,
    description: 'Alüminyum, teleskopik ve ahşap saplar ile ergonomik kullanım imkanı.' },
  { name: 'Eldiven Grubu', slug: 'eldiven-grubu', path: '/Urunler/eldiven-grubu', group: 'Endüstriyel Temizlik Ürünleri', kategori: 5,
    description: 'Nitril, lateks ve ev işleri için özel tasarlanmış koruyucu eldivenler.' },
  { name: 'Faraş Grubu', slug: 'faras-grubu', path: '/Urunler/faras-grubu', group: 'Endüstriyel Temizlik Ürünleri', kategori: 6,
    description: 'Hazneli, saplı ve pratik faraş takımları ile hijyenik çözüm.' },
  { name: 'Sünger ve Tel Grubu', slug: 'sunger-ve-tel-grubu', path: '/Urunler/sunger-ve-tel-grubu', group: 'Endüstriyel Temizlik Ürünleri', kategori: 7,
    description: 'Zorlu kirler için bulaşık telleri ve dayanıklı yüzey süngerleri.' },
  { name: 'Yersil Grubu', slug: 'yersil-grubu', path: '/Urunler/yersil-grubu', group: 'Endüstriyel Temizlik Ürünleri', kategori: 8,
    description: 'Farklı genişliklerde, endüstriyel tip kauçuk yersil çeşitleri.' },
  { name: 'Camsil Grubu', slug: 'camsil-grubu', path: '/Urunler/camsil-grubu', group: 'Endüstriyel Temizlik Ürünleri', kategori: 9,
    description: 'İz bırakmayan cam temizleme aparatları ve yedek lastikleri.' },
  { name: 'Fırça Çeşitleri', slug: 'firca-cesitleri', path: '/Urunler/firca-cesitleri', group: 'Endüstriyel Temizlik Ürünleri', kategori: 10,
    description: 'Yumuşak ve sert kıllı yer fırçaları, süpürgeler ve detay fırçaları.' },
  { name: 'Temizlik Setleri', slug: 'temizlik-setleri', path: '/Urunler/temizlik-setleri', group: 'Endüstriyel Temizlik Ürünleri', kategori: 11,
    description: 'Kova, mop ve sıkma aparatından oluşan profesyonel setler.' },
  { name: 'Kova Grubu', slug: 'kova-grubu', path: '/Urunler/kova-grubu', group: 'Endüstriyel Temizlik Ürünleri', kategori: 12,
    description: 'Ölçülü, sağlam ve ergonomik endüstriyel kova çeşitleri.' },
  { name: 'Endüstriyel Aparat Grubu', slug: 'endustriyel-aparat-grubu', path: '/Urunler/end%C3%BCstriyel-aparat-grubu', group: 'Aparatlar', kategori: 13,
    description: 'Kağıt havlu dispanserleri, sabunluklar ve hijyen üniteleri.' }
];

const SLIDERS = [
  { title: 'Mop Grubu & Temizlik Bezleri', badge: 'PROFESYONEL ÇÖZÜMLER', description: 'Endüstriyel temizlik standartlarını yeniden tanımlayan yüksek kaliteli mop sistemleri ve mikrofiber teknolojileri.', image_url: `${IMG}/slider_mop.webp`, button_text: 'Ürünleri Keşfet', button_link: '/urunler?kategori=Mop%20Grubu' },
  { title: 'Temizlik Setleri', badge: 'KOMPLE ÇÖZÜMLER', description: 'Kova, mop ve sıkma aparatından oluşan profesyonel temizlik setleri ile verimliliği artırın.', image_url: `${IMG}/slider_set.webp`, button_text: 'Ürünleri İncele', button_link: '/urunler?kategori=Temizlik%20Setleri' },
  { title: 'Deterjan Grubu', badge: 'HİJYEN STANDARTLARI', description: 'Yüzey temizleyiciler, yağ çözücüler ve genel temizlik kimyasalları ile profesyonel hijyen.', image_url: `${IMG}/slider_deterjan.webp`, button_text: 'Ürünleri Keşfet', button_link: '/urunler?kategori=Deterjan%20Grubu' },
  { title: 'Çöp Torbaları', badge: 'AMBALAJ ÇÖZÜMLERİ', description: 'Mini boydan endüstriyel battal boya kadar her hacme uygun dayanıklı torbalar.', image_url: `${IMG}/slider_coptorbalari.webp`, button_text: 'Ürünleri İncele', button_link: '/urunler?kategori=%C3%87%C3%B6p%20Torbalar%C4%B1' },
  { title: 'Endüstriyel Aparatlar', badge: 'PROFESYONEL EKİPMAN', description: 'Kağıt havlu dispanserleri, sabunluklar ve hijyen üniteleri ile işletmenize profesyonel çözümler.', image_url: `${IMG}/slider_aparat.webp`, button_text: 'Ürünleri Keşfet', button_link: '/urunler?kategori=End%C3%BCstriyel%20Aparat%20Grubu' }
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
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').trim();
}

function stripTags(s) {
  return decodeHtml(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OzonerSync/1.0)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function parseProducts(html, category, categoryImage) {
  const products = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const cells = [...match[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c => stripTags(c[1]));
    if (cells.length < 1) continue;
    const shortName = cells[0];
    const spec = cells[1] || '';
    if (!shortName || /ürün adı|urun adi|açıklama/i.test(shortName)) continue;

    const name = spec ? `${shortName} — ${spec}` : shortName;
    products.push({
      name,
      short_name: shortName,
      description: spec || category.description,
      category: category.name,
      category_group: category.group,
      category_slug: category.slug,
      image_url: categoryImage,
      slug: slugify(`${category.slug}-${shortName}-${spec}`)
    });
  }
  return products;
}

async function main() {
  const allProducts = [];
  const categoryRecords = [];
  let productId = 1;

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const url = BASE + cat.path;
    const imageUrl = `${IMG}/kategori_${cat.kategori}.webp`;
    console.log(`Fetching ${cat.name}...`);

    const html = await fetchHtml(url);
    const parsed = parseProducts(html, cat, imageUrl);

    categoryRecords.push({
      id: i + 1,
      name: cat.name,
      slug: cat.slug,
      group: cat.group,
      description: cat.description,
      image_url: imageUrl,
      sort_order: i + 1,
      product_count: parsed.length
    });

    parsed.forEach((p, idx) => {
      allProducts.push({
        id: productId++,
        ...p,
        sort_order: idx + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    console.log(`  ${parsed.length} products`);
    await new Promise(r => setTimeout(r, 250));
  }

  const sliders = SLIDERS.map((s, i) => ({
    id: i + 1,
    ...s,
    subtitle: s.badge,
    sort_order: i + 1,
    is_active: 1
  }));

  const dataDir = path.join(__dirname, '..', 'data');
  fs.writeFileSync(path.join(dataDir, 'categories.json'), JSON.stringify(categoryRecords, null, 2));
  fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(allProducts, null, 2));
  fs.writeFileSync(path.join(dataDir, 'sliders.json'), JSON.stringify(sliders, null, 2));

  console.log(`\nSynced: ${categoryRecords.length} categories, ${allProducts.length} products, ${sliders.length} sliders`);
}

main().catch(err => { console.error(err); process.exit(1); });
