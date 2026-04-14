/* ===================================================
   ePortfolio – script.js
   Interactive effects, animations, and dynamics
   =================================================== */

(function () {
  'use strict';

  /* ── Utility ── */
  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);


  /* ─────────────────────────────────────────
     1. CUSTOM CURSOR
  ───────────────────────────────────────── */
  const cursor         = qs('#cursor');
  const cursorFollower = qs('#cursorFollower');

  if (window.matchMedia('(hover: hover)').matches) {
    let fx = 0, fy = 0;   // follower position (lerped)
    let mx = 0, my = 0;   // actual mouse position

    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top  = my + 'px';
    });

    document.addEventListener('mousedown', () => cursorFollower.classList.add('click'));
    document.addEventListener('mouseup',   () => cursorFollower.classList.remove('click'));

    // Smooth follower lerp
    function animateCursor() {
      fx += (mx - fx) * 0.15;
      fy += (my - fy) * 0.15;
      cursorFollower.style.left = fx + 'px';
      cursorFollower.style.top  = fy + 'px';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover state on interactive elements
    const hoverEls = qsa('a, button, .skill-card, .project-card');
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', () => cursorFollower.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursorFollower.classList.remove('hover'));
    });
  }


  /* ─────────────────────────────────────────
     2. PARTICLE CANVAS
  ───────────────────────────────────────── */
  const canvas = qs('#particleCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H, particles = [];
  let mouse = { x: -1000, y: -1000 };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  class Particle {
    constructor() { this.reset(true); }

    reset(initial = false) {
      this.x  = Math.random() * W;
      this.y  = initial ? Math.random() * H : H + 10;
      this.r  = Math.random() * 1.8 + 0.4;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = -(Math.random() * 0.5 + 0.2);
      this.alpha = Math.random() * 0.5 + 0.1;
      this.targetAlpha = this.alpha;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Subtle mouse repulsion
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120 * 0.4;
        this.x += (dx / dist) * force;
        this.y += (dy / dist) * force;
      }

      if (this.y < -10) this.reset();
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124, 107, 255, ${this.alpha})`;
      ctx.fill();
    }
  }

  // Create particles
  const PARTICLE_COUNT = 80;
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const alpha = (1 - dist / 100) * 0.08;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(124, 107, 255, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(animateParticles);
  }
  animateParticles();


  /* ─────────────────────────────────────────
     3. SCROLL-TRIGGERED FADE-IN
     (defined before onScroll so the function
      reference is available when called)
  ───────────────────────────────────────── */
  const fadeEls = qsa('.fade-in');

  function checkFadeIns() {
    const threshold = window.innerHeight * 0.88;
    fadeEls.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < threshold) {
        el.classList.add('visible');
      }
    });
  }

  // Use IntersectionObserver for better performance if available
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    fadeEls.forEach(el => io.observe(el));
  } else {
    checkFadeIns();
  }


  /* ─────────────────────────────────────────
     4. SKILL BAR ANIMATION
  ───────────────────────────────────────── */
  const skillFills = qsa('.skill-fill');
  let skillsAnimated = false;

  function animateSkillBars() {
    if (skillsAnimated) return;
    skillFills.forEach(fill => {
      const rect = fill.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        const target = fill.dataset.width || 0;
        fill.style.width = target + '%';
        fill.dataset.animated = 'true';
      }
    });
    // Mark as animated once every bar has been triggered
    if (skillFills.every(f => f.dataset.animated === 'true')) {
      skillsAnimated = true;
    }
  }

  // Also use IO for skill bars
  if ('IntersectionObserver' in window) {
    const skillIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const fill = entry.target.querySelector('.skill-fill');
          if (fill) fill.style.width = fill.dataset.width + '%';
          skillIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    qsa('.skill-card').forEach(card => skillIO.observe(card));
  }


  /* ─────────────────────────────────────────
     5. HEADER – scroll styling
  ───────────────────────────────────────── */
  const header = qs('#header');

  function onScroll() {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    // Trigger fade-in elements (fallback for no IO)
    checkFadeIns();
    // Animate skill bars when in view
    animateSkillBars();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load


  /* ─────────────────────────────────────────
     6. MOBILE NAV
  ───────────────────────────────────────── */
  const hamburger = qs('#hamburger');
  const mobileNav = qs('#mobileNav');

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  qsa('[data-close]').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });



  /* ─────────────────────────────────────────
     7. SMOOTH SCROLL (for anchor links)
     (replaces default CSS smooth-scroll to
      respect the fixed header offset)
  ───────────────────────────────────────── */
  qsa('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id = anchor.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const headerHVar = getComputedStyle(document.documentElement)
        .getPropertyValue('--header-h').trim();
      const offset = parseFloat(headerHVar) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });


  /* ─────────────────────────────────────────
     8. TILT EFFECT on project cards
  ───────────────────────────────────────── */
  qsa('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect  = card.getBoundingClientRect();
      const cx    = rect.left + rect.width  / 2;
      const cy    = rect.top  + rect.height / 2;
      const rx    = clamp((e.clientY - cy) / (rect.height / 2), -1, 1) * 6;
      const ry    = clamp((e.clientX - cx) / (rect.width  / 2), -1, 1) * -6;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });


  /* ─────────────────────────────────────────
     9. HERO TEXT – subtle parallax
  ───────────────────────────────────────── */
  const heroContent = qs('.hero-content');
  if (heroContent) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.25}px)`;
        heroContent.style.opacity   = 1 - scrolled / (window.innerHeight * 0.75);
      }
    }, { passive: true });
  }


  /* ─────────────────────────────────────────
     10. TYPING EFFECT on hero eyebrow
  ───────────────────────────────────────── */
  const eyebrow = qs('.hero-eyebrow');
  if (eyebrow) {
    const phrases = [
      'Hello, world 👋',
      'Welcome to my portfolio ✨',
      'Nice to meet you 🤝',
    ];
    let phraseIndex = 0;
    let charIndex   = 0;
    let deleting    = false;
    let typingDelay = 80;

    function type() {
      const phrase = phrases[phraseIndex];
      if (deleting) {
        eyebrow.textContent = phrase.substring(0, charIndex--);
        typingDelay = 40;
      } else {
        eyebrow.textContent = phrase.substring(0, charIndex++);
        typingDelay = 80;
      }

      if (!deleting && charIndex === phrase.length + 1) {
        deleting = true;
        typingDelay = 1800; // pause before deleting
      } else if (deleting && charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typingDelay = 400;
      }

      setTimeout(type, typingDelay);
    }

    // Start typing after hero animation completes
    setTimeout(type, 1200);
  }


  /* ─────────────────────────────────────────
     11. ACTIVE NAV LINK on scroll
  ───────────────────────────────────────── */
  const sections  = qsa('section[id]');
  const navLinks  = qsa('.nav-link');

  function setActiveNav() {
    const scrollMid = window.scrollY + window.innerHeight / 3;
    sections.forEach(section => {
      const top    = section.offsetTop;
      const bottom = top + section.offsetHeight;
      if (scrollMid >= top && scrollMid < bottom) {
        navLinks.forEach(link => {
          const isMatch = link.getAttribute('href') === '#' + section.id;
          link.style.color = isMatch ? 'var(--clr-text)' : '';
        });
      }
    });
  }

  window.addEventListener('scroll', setActiveNav, { passive: true });
  setActiveNav();


  /* ─────────────────────────────────────────
     12. PAGE LOAD – staggered reveal on
         skill / portfolio cards
  ───────────────────────────────────────── */
  // Give each fade-in group within a grid a small stagger offset
  qsa('.skills-grid, .portfolio-grid').forEach(grid => {
    qsa('.fade-in', grid).forEach((el, i) => {
      el.style.transitionDelay = (i * 0.1) + 's';
    });
  });

})();
