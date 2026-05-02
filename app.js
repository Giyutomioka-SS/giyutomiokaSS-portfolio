'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ─────────────────────────────────────────────
  // FOOTER YEAR
  // ─────────────────────────────────────────────
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ─────────────────────────────────────────────
  // TYPEWRITER (Typed.js)
  // ─────────────────────────────────────────────
  const typewriterEl = document.getElementById('typewriter');
  if (typewriterEl && typeof Typed !== 'undefined') {
    new Typed('#typewriter', {
      strings: [
        'build Android apps that matter.',
        'love coding clean systems.',
        'contribute to open source.',
        'turn coffee into clean code.',
      ],
      typeSpeed: 45,
      backSpeed: 28,
      backDelay: 2200,
      startDelay: 600,
      loop: true,
      smartBackspace: true,
    });
  } else if (typewriterEl) {
    // Fallback if Typed.js CDN fails
    typewriterEl.textContent = 'build Android apps that matter.';
  }

  // ─────────────────────────────────────────────
  // INTERSECTION OBSERVER — REVEAL
  // ─────────────────────────────────────────────
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = el.dataset.delay ? el.dataset.delay + 'ms' : '0ms';
      el.style.setProperty('--delay', delay);
      el.classList.add('visible');
      revealObserver.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));

  // ─────────────────────────────────────────────
  // STAT COUNTERS
  // ─────────────────────────────────────────────
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animateCounter(el, target, duration) {
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      el.textContent = Math.round(easeOutQuart(progress) * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Stat counters
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.stat-number').forEach(el => {
        const target = parseInt(el.dataset.target, 10) || 0;
        animateCounter(el, target, 1400);
      });
      statObserver.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  const statsSection = document.querySelector('.about-stats');
  if (statsSection) statObserver.observe(statsSection);

  // ─────────────────────────────────────────────
  // NAV SCROLL SPY
  // ─────────────────────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + id);
      });
    });
  }, { threshold: 0.35 });

  sections.forEach(s => spyObserver.observe(s));

  // ─────────────────────────────────────────────
  // MOBILE NAV
  // ─────────────────────────────────────────────
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('nav-hamburger');

  hamburger.addEventListener('click', () => {
    const isOpen = navbar.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  // Close on nav link click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navbar.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // ─────────────────────────────────────────────
  // CUSTOM CURSOR (desktop only)
  // ─────────────────────────────────────────────
  if (window.matchMedia('(pointer: fine)').matches) {
    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');

    let mx = -100, my = -100; // mouse pos
    let rx = -100, ry = -100; // ring pos (lerped)
    let rafCursor;

    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`;
    });

    function lerpCursor() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.transform = `translate(calc(${rx}px - 50%), calc(${ry}px - 50%))`;
      rafCursor = requestAnimationFrame(lerpCursor);
    }

    lerpCursor();

    const hoverTargets = document.querySelectorAll('a, button, .bubble, .project-card');
    hoverTargets.forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
    });
  }

  // ─────────────────────────────────────────────
  // PARTICLE CANVAS (hero background)
  // ─────────────────────────────────────────────
  const canvas = document.getElementById('bg-dots');
  if (!canvas) return;

  // Skip canvas on mobile to save CPU
  if (window.matchMedia('(max-width: 768px)').matches) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  const GREEN = '61, 220, 132';
  const PARTICLE_COUNT = 55;
  const LINK_DIST = 130;
  const TARGET_FPS = 30;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

  let particles = [];
  let lastFrame = 0;
  let animFrame;

  function resizeCanvas() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function createParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 1.8 + 0.8,
      });
    }
  }

  function drawParticles(ts) {
    animFrame = requestAnimationFrame(drawParticles);

    const elapsed = ts - lastFrame;
    if (elapsed < FRAME_INTERVAL) return;
    lastFrame = ts - (elapsed % FRAME_INTERVAL);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update + draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;

      // Bounce off edges
      if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${GREEN}, 0.55)`;
      ctx.fill();

      // Connect nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < LINK_DIST) {
          const alpha = (1 - dist / LINK_DIST) * 0.25;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(${GREEN}, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
  }

  resizeCanvas();
  createParticles();
  animFrame = requestAnimationFrame(drawParticles);

  const ro = new ResizeObserver(() => {
    resizeCanvas();
    createParticles();
  });
  ro.observe(canvas.parentElement);

});
