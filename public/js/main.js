// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileNav = document.getElementById('mobileNav');
if (mobileMenuBtn && mobileNav) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('hidden');
    mobileMenuBtn.textContent = mobileNav.classList.contains('hidden') ? 'menu' : 'close';
  });
}

// Hero slider
(function initSlider() {
  const slides = document.querySelectorAll('#hero-slider .slide');
  const dots = document.querySelectorAll('.slider-dot');
  if (!slides.length) return;

  let current = 0;
  let timer;

  function goTo(index) {
    slides[current].classList.remove('opacity-100', 'z-10');
    slides[current].classList.add('opacity-0', 'z-0');
    if (dots[current]) {
      dots[current].classList.remove('bg-primary');
      dots[current].classList.add('bg-white/30');
    }
    current = index;
    slides[current].classList.remove('opacity-0', 'z-0');
    slides[current].classList.add('opacity-100', 'z-10');
    if (dots[current]) {
      dots[current].classList.remove('bg-white/30');
      dots[current].classList.add('bg-primary');
    }
  }

  function next() {
    goTo((current + 1) % slides.length);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      clearInterval(timer);
      timer = setInterval(next, 5000);
    });
  });

  if (slides.length > 1) {
    timer = setInterval(next, 5000);
  }
})();

// Announcement ticker
(function initTicker() {
  const items = document.querySelectorAll('.announcement-item');
  if (items.length <= 1) return;

  let idx = 0;
  setInterval(() => {
    items[idx].classList.add('hidden');
    idx = (idx + 1) % items.length;
    items[idx].classList.remove('hidden');
  }, 4000);
})();

// Smooth scroll for in-page anchors only
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
