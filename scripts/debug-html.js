const CATEGORIES = [
  '/Urunler/cop-torbalar%C4%B1',
  '/Urunler/deterjan-grubu',
  '/Urunler/mop-grubu',
  '/Urunler/sap-cesitleri',
  '/Urunler/eldiven-grubu',
  '/Urunler/faras-grubu',
  '/Urunler/sunger-ve-tel-grubu',
  '/Urunler/yersil-grubu',
  '/Urunler/camsil-grubu',
  '/Urunler/firca-cesitleri',
  '/Urunler/temizlik-setleri',
  '/Urunler/kova-grubu',
  '/Urunler/end%C3%BCstriyel-aparat-grubu'
];

async function main() {
  const html = await (await fetch('https://ozonerambalaj.com/Urunler')).text();
  const links = [...html.matchAll(/href=["']([^"']*Urunler[^"']*)["']/gi)].map(m => m[1]);
  const unique = [...new Set(links)];
  console.log('links:', unique.slice(0, 20));

  for (const path of CATEGORIES) {
    const h = await (await fetch('https://ozonerambalaj.com' + path)).text();
    const og = h.match(/property="og:image"\s+content="([^"]+)"/i);
    const title = h.match(/<h1[^>]*>([^<]+)/i);
    console.log(path, '->', og?.[1], title?.[1]?.trim());
    await new Promise(r => setTimeout(r, 200));
  }
}
main();
