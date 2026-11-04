document.getElementById('year').textContent = new Date().getFullYear();

// ===== SCROLL PROGRESS BAR =====
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
document.body.prepend(progressBar);
window.addEventListener('scroll', () => {
  const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (totalHeight > 0) {
    progressBar.style.width = (window.scrollY / totalHeight * 100) + '%';
  }
}, { passive: true });

// ===== AMBIENT PARTICLES =====
const particleBox = document.createElement('div');
particleBox.className = 'ambient-particles';
document.body.prepend(particleBox);
for (let i = 0; i < 14; i++) {
  const p = document.createElement('div');
  p.className = 'particle';
  p.style.left = (Math.random() * 96 + 2) + '%';
  p.style.animationDuration = (10 + Math.random() * 14) + 's';
  p.style.animationDelay = (Math.random() * 10) + 's';
  const sz = 2.5 + Math.random() * 3.5;
  p.style.width = sz + 'px';
  p.style.height = sz + 'px';
  p.style.background = i % 2 === 0 ? 'var(--purple)' : 'var(--lime)';
  particleBox.appendChild(p);
}

// nav scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// mobile menu
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  mobileMenu.classList.toggle('open');
  document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
});
function closeMenu() {
  hamburger.classList.remove('active');
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}
window.closeMenu = closeMenu;
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMenu);
});

// scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
revealEls.forEach(el => revealObs.observe(el));

// skill bar
const bars = document.querySelectorAll('.skill-bar-fill');
const barObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.style.width = e.target.dataset.width + '%'; barObs.unobserve(e.target); }
  });
}, { threshold: 0.5 });
bars.forEach(b => barObs.observe(b));

// smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const t = document.querySelector(a.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// active nav
const secs = document.querySelectorAll('section[id]');
const nLinks = document.querySelectorAll('.nav-links a:not(.nav-contact)');
window.addEventListener('scroll', () => {
  let cur = '';
  secs.forEach(s => { if (window.scrollY >= s.offsetTop - 200) cur = s.id; });
  nLinks.forEach(l => { l.style.color = l.getAttribute('href') === '#' + cur ? 'var(--purple)' : ''; });
});

// ===== 3D PARALLAX & TILT (Desktop only) =====
if (window.matchMedia('(pointer: fine)').matches) {
  const heroVisual = document.querySelector('.hero-visual');
  if (heroVisual) {
    heroVisual.addEventListener('mousemove', (e) => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const robot = heroVisual.querySelector('.robot-container');
      const code = heroVisual.querySelector('.hero-code');
      const badge = heroVisual.querySelector('.curious-badge');
      if (robot) robot.style.transform = `rotate(-3deg) translate(${x * 14}px, ${y * 12}px)`;
      if (code) code.style.transform = `rotate(2deg) translate(${x * -12}px, ${y * -10}px)`;
      if (badge) badge.style.transform = `translate(${x * 18}px, ${y * 16}px)`;
    });
    heroVisual.addEventListener('mouseleave', () => {
      const robot = heroVisual.querySelector('.robot-container');
      const code = heroVisual.querySelector('.hero-code');
      const badge = heroVisual.querySelector('.curious-badge');
      if (robot) robot.style.transform = '';
      if (code) code.style.transform = '';
      if (badge) badge.style.transform = '';
    });
  }

  // 3D Tilt on Interest Cards
  document.querySelectorAll('.interest-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;
      const rotY = ((x - midX) / midX) * 7;
      const rotX = ((midY - y) / midY) * 7;
      card.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ===== SKILL TAG RIPPLE EFFECT =====
document.querySelectorAll('.skill-tag').forEach(tag => {
  tag.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = (e.clientX - rect.left - 15) + 'px';
    ripple.style.top = (e.clientY - rect.top - 15) + 'px';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});
