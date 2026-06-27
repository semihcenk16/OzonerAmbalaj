fetch('https://ozonerambalaj.com/').then(r => r.text()).then(html => {
  const sliders = html.match(/slider[^"']*\.webp/gi);
  console.log('sliders:', sliders);
}).catch(console.error);
