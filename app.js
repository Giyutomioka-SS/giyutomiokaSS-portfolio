/* Sumit Singh, portfolio. Vanilla JS + GSAP (ScrollTrigger, SplitText) + Lenis.
   Every effect checks prefers-reduced-motion and pointer type; content never
   depends on a script to be visible. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  const hasGsap = !!(G && ST);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const hexToRgb = (hex) => {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  if (hasGsap) {
    G.registerPlugin(ST);
    if (window.SplitText) G.registerPlugin(window.SplitText);
  }

  let lenis = null;

  /* ---------------- Theme ---------------- */
  function initTheme() {
    const btn = $('#theme-toggle');
    const knob = $('.tswitch__knob', btn);
    const meta = $('meta[name="theme-color"]');
    const sync = () => {
      const dark = root.getAttribute('data-theme') === 'dark';
      btn.setAttribute('aria-checked', String(dark));
      btn.setAttribute('aria-label', dark ? 'Dark mode on. Switch to light mode' : 'Light mode on. Switch to dark mode');
      if (meta) meta.setAttribute('content', css('--bg'));
    };
    sync();

    const apply = (next) => {
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
      sync();
      window.dispatchEvent(new CustomEvent('themechange'));
    };

    // a small burst of squares from the knob
    const sparks = (x, y) => {
      if (reduce) return;
      for (let i = 0; i < 8; i++) {
        const d = document.createElement('i');
        d.className = 'spark';
        d.style.left = x + 'px'; d.style.top = y + 'px';
        document.body.appendChild(d);
        const a = (i / 8) * Math.PI * 2 + Math.random() * .4;
        const dist = 26 + Math.random() * 22;
        d.animate([
          { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * dist}px, ${Math.sin(a) * dist}px) rotate(${180 + Math.random() * 180}deg) scale(.2)`, opacity: 0 },
        ], { duration: 560 + Math.random() * 200, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = () => d.remove();
      }
    };

    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      const kr = knob.getBoundingClientRect();
      // the knob will travel to the far side; start the reveal where it lands
      const travel = btn.getBoundingClientRect().width - kr.width - 8;
      const x = kr.left + kr.width / 2 + (next === 'light' ? travel : -travel);
      const y = kr.top + kr.height / 2;
      if (document.startViewTransition && !reduce) {
        const t = document.startViewTransition(() => apply(next));
        t.ready.then(() => {
          const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
            { duration: 800, easing: 'cubic-bezier(.76,0,.24,1)', pseudoElement: '::view-transition-new(root)' }
          );
        }).catch(() => {});
        t.finished.then(() => sparks(x, y)).catch(() => {});
      } else {
        root.classList.add('theme-fade');
        apply(next);
        sparks(x, y);
        setTimeout(() => root.classList.remove('theme-fade'), 600);
      }
    });
  }

  /* ---------------- Smooth scroll ---------------- */
  function initLenis() {
    if (reduce || !hasGsap || !window.Lenis) return;
    lenis = new window.Lenis({ duration: 1.2, smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add((t) => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }

  function scrollToTarget(hash) {
    const el = hash === '#top' ? 0 : $(hash);
    if (el === null) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.4 });
    else if (el === 0) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }

  /* ---------------- Loader ---------------- */
  function initLoader(onReveal) {
    const loader = $('#loader');
    try { sessionStorage.setItem('seen', '1'); } catch (e) { /* ignore */ }
    if (!loader || root.classList.contains('no-loader') || !hasGsap) {
      if (loader) loader.remove();
      onReveal();
      return;
    }
    root.classList.add('is-loading');
    if (lenis) lenis.stop();

    const bar = $('#loader-bar');
    const count = $('#loader-count');
    const L = 2 * Math.PI * 54;
    bar.style.strokeDasharray = L;
    bar.style.strokeDashoffset = L;
    const state = { v: 0 };
    const render = () => {
      bar.style.strokeDashoffset = L * (1 - state.v / 100);
      count.textContent = String(Math.round(state.v)).padStart(2, '0');
    };
    const crawl = G.to(state, { v: 88, duration: .6, ease: 'power2.out', onUpdate: render });

    const img = $('.hero__photo img');
    const imgReady = img && !img.complete ? new Promise((res) => { img.addEventListener('load', res, { once: true }); img.addEventListener('error', res, { once: true }); }) : Promise.resolve();
    const ready = Promise.all([document.fonts ? document.fonts.ready : null, imgReady, new Promise((r) => setTimeout(r, 350))]);
    const cap = new Promise((r) => setTimeout(r, 700));

    Promise.race([ready, cap]).then(() => {
      crawl.kill();
      G.to(state, {
        v: 100, duration: .2, ease: 'power2.out', onUpdate: render,
        onComplete: () => {
          G.timeline({ onComplete: () => loader.remove() })
            .to('.loader__box', { opacity: 0, scale: .94, duration: .25, ease: 'power2.in' }, 0)
            .to(loader, { yPercent: -100, duration: .7, ease: 'power4.inOut' }, .1)
            .add(() => {
              root.classList.remove('is-loading');
              if (lenis) lenis.start();
              onReveal();
            }, .2);
        },
      });
    });
  }

  /* ---------------- Cursor ---------------- */
  function initCursor() {
    if (!fine || reduce || !hasGsap) return;
    const host = $('#cursor');
    const N = 10;
    const head = document.createElement('i');
    head.className = 'head';
    const trail = Array.from({ length: N }, (_, i) => {
      const el = document.createElement('i');
      el.style.opacity = String(.5 * (1 - i / N));
      el.style.scale = String(1 - (i / N) * .55);
      host.appendChild(el);
      return { el, x: -100, y: -100 };
    });
    host.appendChild(head);
    root.classList.add('has-cursor');
    G.set(host, { opacity: 0 });
    let hovering = false;

    const p = { x: innerWidth / 2, y: innerHeight / 2 };
    const h = { x: p.x, y: p.y };
    let shown = false;
    window.addEventListener('pointermove', (e) => {
      p.x = e.clientX; p.y = e.clientY;
      if (!shown) { shown = true; G.to(host, { opacity: 1, duration: .3 }); }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { shown = false; G.to(host, { opacity: 0, duration: .3 }); });

    G.ticker.add((t, dt) => {
      const f = dt / 16.67;
      const k1 = 1 - Math.pow(.5, f);
      const k2 = 1 - Math.pow(.6, f);
      h.x += (p.x - h.x) * k1; h.y += (p.y - h.y) * k1;
      head.style.translate = `${h.x}px ${h.y}px`;
      let px = h.x, py = h.y;
      trail.forEach((s) => {
        s.x += (px - s.x) * k2; s.y += (py - s.y) * k2;
        s.el.style.translate = `${s.x}px ${s.y}px`;
        px = s.x; py = s.y;
      });
    });

    const sel = 'a, button, [data-cursor=hover], [data-proximity]';
    document.addEventListener('pointerover', (e) => {
      if (!e.target.closest(sel)) return;
      hovering = true;
      G.to(head, { scale: 2.6, rotation: 45, backgroundColor: 'rgba(0,0,0,0)', boxShadow: `inset 0 0 0 1.5px ${css('--accent')}`, duration: .35, ease: 'power3.out' });
      G.to(trail.map((s) => s.el), { autoAlpha: 0, duration: .2 });
    });
    document.addEventListener('pointerout', (e) => {
      if (!e.target.closest(sel) || (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(sel))) return;
      hovering = false;
      G.to(head, { scale: 1, rotation: 0, backgroundColor: css('--accent'), boxShadow: 'inset 0 0 0 0px rgba(0,0,0,0)', duration: .35, ease: 'power3.out' });
      trail.forEach((s, i) => G.to(s.el, { autoAlpha: .5 * (1 - i / N), duration: .3 }));
    });
    window.addEventListener('pointerdown', () => G.to(head, { scale: '*=0.7', duration: .15 }));
    window.addEventListener('pointerup', () => G.to(head, { scale: hovering ? 2.6 : 1, duration: .3 }));
  }

  /* ---------------- Nav + menu ---------------- */
  function initNav() {
    const nav = $('#nav');
    const burger = $('#burger');
    const menu = $('#menu');
    let lastY = scrollY;
    let open = false;

    const onScroll = () => {
      const y = scrollY;
      nav.classList.toggle('is-solid', y > 40);
      if (!open) {
        if (y < 80 || y < lastY - 3) nav.classList.remove('is-hidden');
        else if (y > lastY + 6) nav.classList.add('is-hidden');
      }
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const links = $$('.nav__links a, .menu a[data-scroll]');
    const setActive = (id) => links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        // the hero has no nav link, so landing on it clears every highlight
        setActive(en.target.id === 'hero' ? null : '#' + en.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => io.observe(s));
    window.addEventListener('scroll', () => { if (scrollY < innerHeight * .5) setActive(null); }, { passive: true });

    const setOpen = (v) => {
      open = v;
      burger.setAttribute('aria-expanded', String(v));
      burger.setAttribute('aria-label', v ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', String(!v));
      if (v) {
        menu.classList.add('is-open');
        if (lenis) lenis.stop();
        if (hasGsap && !reduce) {
          G.fromTo(menu, { clipPath: 'circle(0% at 92% 4%)' }, { clipPath: 'circle(150% at 92% 4%)', duration: .8, ease: 'power3.inOut' });
          G.fromTo($$('.menu a span'), { yPercent: 110 }, { yPercent: 0, duration: .8, stagger: .07, delay: .2, ease: 'expo.out' });
        } else menu.style.clipPath = 'none';
        setTimeout(() => { const f = $('.menu a'); if (f) f.focus({ preventScroll: true }); }, 50);
      } else {
        if (lenis) lenis.start();
        const done = () => { menu.classList.remove('is-open'); };
        if (hasGsap && !reduce) G.to(menu, { clipPath: 'circle(0% at 92% 4%)', duration: .6, ease: 'power3.inOut', onComplete: done });
        else { menu.style.clipPath = ''; done(); }
      }
    };
    burger.addEventListener('click', () => setOpen(!open));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { setOpen(false); burger.focus(); } });

    $$('[data-scroll]').forEach((a) => a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href');
      if (!hash || hash[0] !== '#') return;
      e.preventDefault();
      if (open) { setOpen(false); setTimeout(() => scrollToTarget(hash), 350); }
      else scrollToTarget(hash);
    }));
    const top = $('#to-top');
    if (top) top.addEventListener('click', () => scrollToTarget('#top'));
  }

  /* ---------------- Helpers ---------------- */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    return Array.from(text).map((c) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c === ' ' ? ' ' : c;
      el.appendChild(s);
      return s;
    });
  }

  /* ---------------- Hero ---------------- */
  let heroIntro = null;
  function initHero() {
    const name = $('#hero-name');
    const lines = $$('.hero__line', name);
    const chars = lines.flatMap(splitChars);
    const stage = $('.hero__stage');
    const photo = $('.hero__photo');

    const fit = () => {
      const mobile = innerWidth <= 760;
      const photoW = mobile ? 0 : photo.getBoundingClientRect().width;
      const gap = mobile ? 0 : parseFloat(getComputedStyle(stage).columnGap) || 0;
      const avail = stage.clientWidth - photoW - gap;
      name.style.fontSize = '100px';
      const widest = Math.max(...lines.map((l) => {
        l.style.display = 'inline-block';
        const w = l.getBoundingClientRect().width;
        l.style.display = '';
        return w;
      }));
      const heroH = $('#hero').clientHeight;
      const size = Math.floor(Math.min((avail / widest) * 100 * .98, mobile ? 400 : heroH * .27, 280));
      name.style.fontSize = size + 'px';
    };
    fit();
    if (document.fonts) document.fonts.ready.then(fit);
    window.addEventListener('resize', fit);

    // rotating roles
    const roles = $$('#roles li');
    if (!reduce && roles.length) {
      let i = 0;
      setInterval(() => {
        roles[i].classList.remove('is-active');
        i = (i + 1) % roles.length;
        roles[i].classList.add('is-active');
      }, 2600);
    }

    if (!hasGsap || reduce) return;

    G.set(chars, { yPercent: 110, opacity: 0 });
    G.set('[data-hero-fade]', { y: 20, opacity: 0 });
    G.set(photo, { clipPath: 'inset(100% 0% 0% 0%)' });
    G.set('#roles', { opacity: 0, y: 16 });
    G.set('#hero-bg', { opacity: 0 });

    heroIntro = G.timeline({ paused: true, defaults: { ease: 'power3.out' } })
      .to('#hero-bg', { opacity: 1, duration: 1.8, ease: 'power2.out' }, 0)
      .to('.hero__status', { y: 0, opacity: 1, duration: .7 }, .1)
      .to(chars, { yPercent: 0, opacity: 1, duration: .8, stagger: .035, ease: 'expo.out' }, .05)
      .to(photo, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut' }, .35)
      .fromTo($('img', photo), { scale: 1.25 }, { scale: 1, duration: 1.6, ease: 'expo.out' }, .35)
      .to('#roles', { y: 0, opacity: 1, duration: .8 }, .9)
      .to(['.hero__lede', '.hero__links', '.hero__ctas'], { y: 0, opacity: 1, duration: .8, stagger: .1 }, 1);

    // hero recedes while About rises over it (desktop sticky only)
    G.matchMedia().add('(min-width: 761px)', () => {
      G.set('#hero', { transformOrigin: '50% 100%' });
      G.to('.hero__inner', {
        scale: .92, yPercent: -10, ease: 'none',
        scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'top top', scrub: true },
      });
    });
  }
  const playHero = () => { if (heroIntro) heroIntro.play(); };

  /* ---------------- Silk shader (WebGL) ---------------- */
  const SILK_VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const SILK_FRAG = `
precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uLight;
uniform vec3 uLow; uniform vec3 uHigh; uniform vec3 uSpec;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*noise(p);p*=2.02;a*=.5;}return v;}
float cloth(vec2 p){float t=uTime*.12;vec2 w=p;
 for(int i=0;i<4;i++){float fi=float(i);w+=.5*vec2(sin(w.y*1.25+t+fi*1.9),cos(w.x*1.05-t*.8+fi*2.3));}
 return sin(w.x*1.6+w.y*1.1)*.75+fbm(w*.9)*.35;}
void main(){
 vec2 uv=gl_FragCoord.xy/uRes; float s=sqrt(uRes.x*uRes.y);
 vec2 p=(gl_FragCoord.xy-.5*uRes)/s*3.2;
 float e=.02; float h=cloth(p);
 vec3 n=normalize(vec3(-(cloth(p+vec2(e,0.))-h)/e*.55,-(cloth(p+vec2(0.,e))-h)/e*.55,1.));
 vec2 asp=uRes/s; float t=uTime;
 vec3 L=vec3((uLight-.5)*asp*3.2+vec2(.25*sin(t*.3),.2*cos(t*.25)),1.2);
 vec3 ld=normalize(L-vec3(p,0.)); vec3 hv=normalize(ld+vec3(0.,0.,1.));
 float diff=max(dot(n,ld),0.); float nh=max(dot(n,hv),0.);
 float shade=diff*.55+pow(nh,8.)*.45+pow(1.-n.z,2.)*.5;
 vec3 col=mix(uLow,uHigh,clamp(shade,0.,1.));
 col+=uSpec*pow(nh,90.)*.32;
 float vig=1.-.7*smoothstep(.3,1.,length((uv-.5)*vec2(1.,1.1)));
 col=mix(uLow,col,vig);
 gl_FragColor=vec4(col,1.);
}`;

  function initSilk(canvas, cutoff) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: true });
    if (!gl) return;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, SILK_VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, SILK_FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (n) => gl.getUniformLocation(prog, n);
    const uRes = u('uRes'), uTime = u('uTime'), uLight = u('uLight'), uLow = u('uLow'), uHigh = u('uHigh'), uSpec = u('uSpec');

    const setColors = () => {
      const c = (v) => hexToRgb(css(v)).map((x) => x / 255);
      gl.uniform3fv(uLow, c('--silk-low'));
      gl.uniform3fv(uHigh, c('--silk-high'));
      gl.uniform3fv(uSpec, c('--silk-spec'));
    };
    setColors();

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      const scale = Math.min(.55, Math.sqrt(550000 / (w * h)));
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();

    let time = 6, last = performance.now(), raf = 0, visible = false;
    const light = { x: .62, y: .55 }, target = { x: .62, y: .55 };
    const draw = () => {
      gl.uniform1f(uTime, time);
      gl.uniform2f(uLight, light.x, light.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now) => {
      raf = 0;
      const dt = Math.min((now - last) / 1000, .05); last = now;
      time += dt;
      light.x += (target.x - light.x) * .05; light.y += (target.y - light.y) * .05;
      draw();
      if (visible && !document.hidden && !(cutoff && scrollY > innerHeight * 1.1)) raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(loop); } };

    if (reduce) { draw(); }
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }).observe(canvas);
    if (fine) window.addEventListener('pointermove', (e) => { target.x = e.clientX / innerWidth; target.y = 1 - e.clientY / innerHeight; }, { passive: true });
    window.addEventListener('scroll', () => { if (visible) start(); }, { passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) start(); });
    window.addEventListener('resize', () => { resize(); draw(); });
    window.addEventListener('themechange', () => { setColors(); draw(); });
  }

  /* ---------------- Outline words that react to the cursor ---------------- */
  function initProximity() {
    $$('[data-proximity]').forEach((el) => {
      const chars = splitChars(el);
      if (!fine || reduce || !hasGsap) return;
      let active = false;
      const onMove = (e) => {
        chars.forEach((c) => {
          const r = c.getBoundingClientRect();
          const dx = r.left + r.width / 2 - e.clientX;
          const dy = r.top + r.height / 2 - e.clientY;
          const d = Math.hypot(dx, dy);
          const inf = clamp(1 - d / 200, 0, 1);
          if (inf > 0) {
            const a = Math.atan2(dy, dx);
            G.to(c, {
              x: Math.cos(a) * 14 * inf, y: Math.sin(a) * 10 * inf, scaleX: 1 + inf * .12, scaleY: 1 + inf * .08,
              rotation: Math.sin(a) * 3 * inf, color: inf > .25 ? css('--accent') : css('--bg'),
              duration: .35, ease: 'power3.out', overwrite: 'auto',
            });
          } else {
            G.to(c, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, color: css('--bg'), duration: .55, ease: 'power3.out', overwrite: 'auto' });
          }
        });
      };
      el.addEventListener('pointerenter', () => { active = true; });
      el.addEventListener('pointermove', (e) => { if (active) onMove(e); });
      el.addEventListener('pointerleave', () => {
        active = false;
        G.to(chars, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, color: css('--bg'), duration: .9, ease: 'elastic.out(1, 0.5)', overwrite: 'auto', clearProps: 'color' });
      });
    });
  }

  /* ---------------- Scroll reveals ---------------- */
  function initReveals() {
    if (!hasGsap || reduce) return;

    $$('[data-rise]').forEach((el) => {
      G.from(el, { y: 28, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });

    $$('[data-mask]').forEach((el) => {
      G.from(el, { yPercent: 110, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el.parentElement, start: 'top 88%', once: true } });
    });

    if (window.SplitText) {
      $$('[data-words]').forEach((p) => {
        const split = new window.SplitText(p, { type: 'words', wordsClass: 'w' });
        G.fromTo(split.words, { opacity: .18 }, {
          opacity: 1, stagger: .03, ease: 'none',
          scrollTrigger: { trigger: p, start: 'top 88%', end: 'top 50%', scrub: 1 },
        });
      });
    }

    $$('[data-count]').forEach((el) => {
      const to = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || '0', 10);
      const o = { v: 0 };
      el.textContent = (0).toFixed(dec);
      G.to(o, {
        v: to, duration: 1.8, ease: 'power3.out',
        onUpdate: () => { el.textContent = o.v.toFixed(dec); },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
  }

  /* ---------------- Experience: show all ---------------- */
  function initMore() {
    $$('[data-more]').forEach((btn) => {
      const list = btn.previousElementSibling;
      const total = $$('li', list).length;
      btn.addEventListener('click', () => {
        const open = list.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
        btn.textContent = open ? 'Show fewer' : `Show all ${total} results`;
        if (hasGsap) {
          if (open && !reduce) G.from($$('.is-extra', list), { y: 14, opacity: 0, duration: .5, stagger: .06, ease: 'power3.out' });
          ST.refresh();
        }
      });
    });
  }

  /* ---------------- Projects ---------------- */
  function initProjects() {
    const first = $('.proj');
    if (hasGsap && first) {
      G.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: first, start: 'top 90%', end: 'top 35%', scrub: true } })
        .to('#projects-head', { opacity: 0 }, 0)
        .fromTo('#projects-dim', { opacity: .25 }, { opacity: .8 }, 0);
    }

    // pill that follows the cursor over a project screen
    if (fine) {
      $$('[data-follow]').forEach((el) => {
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          el.style.setProperty('--px', `${e.clientX - r.left}px`);
          el.style.setProperty('--py', `${e.clientY - r.top}px`);
        });
      });
    }

    // Neer: the live phone
    const GOAL = 3000;
    let ml = 1250;
    const mlEl = $('#neer-ml'), pctEl = $('#neer-pct'), water = $('#neer-water'), log = $('#neer-log');
    if (!water) return;
    const fmt = (n) => n.toLocaleString('en-IN');
    const render = () => {
      const pct = ml / GOAL;
      // circle spans y=12..188; wave crest sits 10 units above the group's origin
      const level = 188 - pct * 176;
      water.style.transform = `translateY(${level - 10}px)`;
      mlEl.textContent = fmt(ml);
      pctEl.textContent = ml >= GOAL ? 'Goal reached' : `${Math.round(pct * 100)}%`;
    };
    render();
    $$('[data-add]').forEach((b) => b.addEventListener('click', () => {
      if (ml >= GOAL) { ml = 0; log.innerHTML = ''; render(); return; }
      const add = parseInt(b.dataset.add, 10);
      ml = Math.min(GOAL, ml + add);
      const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const li = document.createElement('li');
      li.className = 'is-new';
      li.innerHTML = `<span class="drop" aria-hidden="true"></span><b>${add} ml</b><em>${now}</em>`;
      log.prepend(li);
      while (log.children.length > 3) log.lastElementChild.remove();
      render();
    }));
  }

  /* ---------------- Skills: orbit ---------------- */
  const SKILLS = [
    { n: 'Kotlin', i: 'kotlin', c: '#7F52FF', l: 'Daily driver', d: 'My main language for everything Android, from coroutines to Compose.' },
    { n: 'Jetpack Compose', i: 'jetpackcompose', c: '#4285F4', l: 'In production', d: 'Declarative UI for new screens; I migrate XML when it pays off.' },
    { n: 'Android', i: 'android', c: '#3DDC84', l: 'In production', d: 'Native apps for field teams, consumers and SDK users since 2023.' },
    { n: 'Java', i: 'openjdk', c: '#E76F00', l: 'Working knowledge', d: 'Legacy modules, SDK internals and the odd backend tool.' },
    { n: 'Python', i: 'python', c: '#3776AB', l: 'Working knowledge', d: 'Scripts, automation, GenAI agents and MCP servers.' },
    { n: 'Firebase', i: 'firebase', c: '#FFCA28', l: 'In production', d: 'Auth, Firestore, FCM and Crashlytics in shipped apps.' },
    { n: 'Room & SQLite', i: 'sqlite', c: '#44A8E0', l: 'In production', d: 'Local databases behind offline-first sync.' },
    { n: 'Gradle', i: 'gradle', c: '#4DB6AC', l: 'Working knowledge', d: 'Build logic, product flavours and version catalogs.' },
    { n: 'Git', i: 'git', c: '#F05032', l: 'Daily driver', d: 'Clean history, careful reviews and open-source PRs on AnkiDroid.' },
    { n: 'GitHub Actions', i: 'githubactions', c: '#2088FF', l: 'Working knowledge', d: 'CI for tests, lint and release builds.' },
  ];

  function initOrbit() {
    const orbit = $('#orbit');
    const spin = $('#orbit-spin');
    const card = $('#orbit-card');
    if (!orbit) return;

    const nodes = SKILLS.map((s) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'orbit__node';
      b.setAttribute('aria-label', `${s.n}: ${s.l}`);
      b.innerHTML = `<span class="ico" style="--icon:url(assets/icons/${s.i}.svg);--brand:${s.c}" aria-hidden="true"></span>`;
      spin.appendChild(b);
      return b;
    });

    const layout = () => {
      const avail = orbit.parentElement.clientWidth;
      const size = clamp(Math.min(540, avail - 8, innerHeight - 160), 300, 540);
      orbit.style.setProperty('--size', size + 'px');
      const r = size * .41;
      const ns = Math.max(56, Math.round(76 * size / 540));
      nodes.forEach((n, i) => {
        const a = (i / nodes.length) * Math.PI * 2;
        n.style.left = `${size / 2 + Math.cos(a) * r}px`;
        n.style.top = `${size / 2 + Math.sin(a) * r}px`;
        n.style.width = n.style.height = ns + 'px';
        n.style.margin = `${-ns / 2}px 0 0 ${-ns / 2}px`;
      });
    };
    layout();
    window.addEventListener('resize', layout);

    let tweens = [];
    if (hasGsap && !reduce) {
      tweens = [
        G.to(spin, { rotation: 360, duration: 34, repeat: -1, ease: 'none' }),
        G.to(nodes, { rotation: -360, duration: 34, repeat: -1, ease: 'none' }),
      ];
      G.timeline({ scrollTrigger: { trigger: orbit, start: 'top 75%', once: true } })
        .from('.orbit__ring', { scale: .6, opacity: 0, duration: 1, stagger: .1, ease: 'power3.out' })
        .from('.orbit__core', { scale: 0, duration: .8, ease: 'back.out(1.7)' }, '-=.6')
        .from(nodes, { scale: 0, opacity: 0, duration: .7, stagger: .06, ease: 'back.out(1.6)' }, '-=.5');
    }

    let current = null;
    const show = (i) => {
      const s = SKILLS[i];
      current = i;
      nodes.forEach((n, k) => n.classList.toggle('is-on', k === i));
      $('.orbit__card-name', card).textContent = s.n;
      $('.orbit__card-level', card).textContent = s.l;
      $('.orbit__card-desc', card).textContent = s.d;
      if (hasGsap) {
        tweens.forEach((t) => G.to(t, { timeScale: 0, duration: .4, overwrite: true }));
        G.fromTo(card, { opacity: 0, y: 14, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: reduce ? 0 : .4, ease: 'power3.out', overwrite: true });
      } else card.style.opacity = 1;
    };
    const hide = () => {
      current = null;
      nodes.forEach((n) => n.classList.remove('is-on'));
      if (hasGsap) {
        G.to(card, { opacity: 0, y: 8, duration: .25, ease: 'power2.in', overwrite: true });
        tweens.forEach((t) => G.to(t, { timeScale: 1, duration: .6, overwrite: true }));
      } else card.style.opacity = 0;
    };
    nodes.forEach((n, i) => {
      n.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') show(i); });
      n.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hide(); });
      n.addEventListener('focus', () => show(i));
      n.addEventListener('blur', hide);
      n.addEventListener('click', (e) => { e.stopPropagation(); if (current === i) hide(); else show(i); });
    });
    $('#skills').addEventListener('click', () => { if (current !== null) hide(); });
  }

  /* ---------------- Skills: trees with pulses ---------------- */
  function initTrees() {
    const NS = 'http://www.w3.org/2000/svg';
    $$('[data-tree]').forEach((tree, ti) => {
      const svg = $('.tree__wires', tree);
      let tl = null, st = null;

      const build = () => {
        if (tl) tl.kill();
        if (st) st.kill();
        svg.innerHTML = '';
        const isRight = tree.classList.contains('tree--right') && innerWidth > 1240;
        const tr = tree.getBoundingClientRect();
        const node = $('.tree__node', tree).getBoundingClientRect();
        const x0 = node.left + node.width / 2 - tr.left;
        const y0 = node.bottom - tr.top + 2;
        const R = 12;
        svg.setAttribute('viewBox', `0 0 ${tr.width} ${tr.height}`);
        const chips = $$('.tree__list li', tree);
        const paths = chips.map((li) => {
          const r = li.getBoundingClientRect();
          const cy = r.top + r.height / 2 - tr.top;
          const xe = isRight ? r.right - tr.left : r.left - tr.left;
          const dir = isRight ? -1 : 1;
          const d = `M${x0} ${y0} V${cy - R} Q${x0} ${cy} ${x0 + dir * R} ${cy} H${xe}`;
          const base = document.createElementNS(NS, 'path');
          base.setAttribute('d', d); base.setAttribute('class', 'wire');
          svg.appendChild(base);
          return { d, li, L: base.getTotalLength() };
        });
        if (!hasGsap || reduce) return;
        tl = G.timeline({ repeat: -1, repeatDelay: 1.4, paused: true, delay: ti * .5 });
        paths.forEach(({ d, li, L }) => {
          const p = document.createElementNS(NS, 'path');
          p.setAttribute('d', d); p.setAttribute('class', 'pulse');
          p.style.strokeDasharray = `14 ${L + 14}`;
          p.style.strokeDashoffset = 14;
          svg.appendChild(p);
          const dur = L / 240;
          tl.fromTo(p, { strokeDashoffset: 14 }, { strokeDashoffset: -L, duration: dur, ease: 'none' }, 0);
          tl.add(() => { li.classList.add('flash'); setTimeout(() => li.classList.remove('flash'), 160); }, Math.max(0, dur - .06));
        });
        st = ST.create({ trigger: tree, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? tl.play() : tl.pause()) });
      };
      build();
      let to;
      window.addEventListener('resize', () => { clearTimeout(to); to = setTimeout(build, 200); });
      if (document.fonts) document.fonts.ready.then(build);
      if (hasGsap && !reduce) {
        G.from($$('.tree__title, .tree__list li', tree), { opacity: 0, y: 14, duration: .7, stagger: .05, ease: 'power3.out', scrollTrigger: { trigger: tree, start: 'top 85%', once: true } });
      }
    });
  }

  /* ---------------- Contact ---------------- */
  function initClock() {
    const el = $('#clock');
    if (!el) return;
    const f = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
    const tick = () => { el.textContent = f.format(new Date()); };
    tick();
    setInterval(tick, 1000);
  }

  function initTalk() {
    const wrap = $('#talk');
    const canvas = $('#talk-canvas');
    if (!wrap || !canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const PAD = 90;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let W = 0, H = 0, parts = [], pal = [];
    const state = { pull: reduce ? 1 : 0 };
    const mouse = { x: -9999, y: -9999 };
    let raf = 0, visible = false, t0 = performance.now();

    const readPal = () => { pal = [css('--ink'), css('--accent-ink'), css('--muted')]; };
    readPal();

    const build = () => {
      const w = wrap.clientWidth;
      const two = w < 700;
      const lines = two ? ["LET'S", 'TALK'] : ["LET'S TALK"];
      const font = (s) => `800 ${s}px Unbounded, "Arial Black", sans-serif`;
      const m = document.createElement('canvas').getContext('2d');
      m.font = font(100);
      const widest = Math.max(...lines.map((l) => m.measureText(l).width));
      const size = Math.min((w * .98 / widest) * 100, two ? 150 : 210);
      const lh = size * .92;
      const textH = lh * lines.length;
      wrap.style.height = `${Math.ceil(textH)}px`;
      W = w + PAD * 2; H = Math.ceil(textH) + PAD * 2;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';

      const off = document.createElement('canvas');
      off.width = W; off.height = H;
      const o = off.getContext('2d');
      o.fillStyle = '#fff'; o.font = font(size); o.textBaseline = 'top';
      lines.forEach((l, i) => o.fillText(l, PAD, PAD + i * lh + size * .04));
      const data = o.getImageData(0, 0, W, H).data;
      const gap = w < 700 ? 4 : 5;
      parts = [];
      for (let y = 0; y < H; y += gap) {
        for (let x = 0; x < W; x += gap) {
          if (data[(y * W + x) * 4 + 3] > 140) {
            const r = Math.random();
            parts.push({
              tx: x, ty: y, x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0,
              s: gap * (.62 + Math.random() * .3), c: r < .72 ? 0 : r < .92 ? 1 : 2, ph: Math.random() * 6.28,
            });
          }
        }
      }
      if (reduce) parts.forEach((p) => { p.x = p.tx; p.y = p.ty; });
      draw(0);
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = .28 + .72 * clamp(state.pull * 1.5, 0, 1);
      for (let c = 0; c < 3; c++) {
        ctx.fillStyle = pal[c];
        for (const p of parts) if (p.c === c) ctx.fillRect(p.x, p.y, p.s, p.s);
      }
    };

    const step = (now) => {
      raf = 0;
      const t = (now - t0) / 1000;
      const radius = clamp(W * .11, 90, 170);
      for (const p of parts) {
        const dl = (p.tx / W) * .5;
        const local = clamp((state.pull - dl) / .5, 0, 1);
        const k = .085 * local;
        const gx = p.tx + Math.sin(t * 1.3 + p.ph) * .8;
        const gy = p.ty + Math.cos(t * 1.1 + p.ph) * .8;
        p.vx += (gx - p.x) * k; p.vy += (gy - p.y) * k;
        if (local < 1) { p.vx += (Math.random() - .5) * .06; p.vy += (Math.random() - .5) * .06; }
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < radius && d > .01) { const f = Math.pow(1 - d / radius, 2) * 4.5; p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
        p.vx *= .86; p.vy *= .86;
        p.x += p.vx; p.y += p.vy;
      }
      draw(t);
      if (visible) raf = requestAnimationFrame(step);
    };

    build();
    root.classList.add('talk-on');
    if (document.fonts) document.fonts.ready.then(build);
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
    window.addEventListener('themechange', () => { readPal(); draw(0); });
    if (reduce) return;

    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(step);
    }).observe(canvas);
    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    canvas.addEventListener('pointerdown', (e) => {
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const reach = clamp(W * .11, 90, 170) * 1.8;
      for (const p of parts) {
        const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy);
        if (d < reach && d > .01) {
          const f = Math.pow(1 - d / reach, 2) * 26;
          p.vx += (dx / d) * f + (Math.random() - .5) * 3;
          p.vy += (dy / d) * f + (Math.random() - .5) * 3;
        }
      }
    });

    if (hasGsap) {
      G.to(state, { pull: 1, duration: 2.6, ease: 'power2.inOut', scrollTrigger: { trigger: wrap, start: 'top 80%', once: true } });
    } else state.pull = 1;
  }

  function initContactMotion() {
    if (!hasGsap || reduce) return;

    G.from('[data-blurb] > *', { y: 24, duration: .8, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '[data-blurb]', start: 'top 88%', once: true } });
    G.from('#cta-round', { scale: 0, rotation: -40, duration: 1.3, ease: 'elastic.out(1, 0.55)', scrollTrigger: { trigger: '#cta-round', start: 'top 92%', once: true } });
    G.timeline({ scrollTrigger: { trigger: '.rows', start: 'top 92%', once: true } })
      .from('.row__line', { scaleX: 0, duration: 1.1, stagger: .07, ease: 'expo.out' }, 0)
      .from('.row > a', { y: 18, duration: .7, stagger: .07, ease: 'power3.out' }, .15);
    G.from('[data-top]', { y: -12, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: '[data-top]', start: 'top 92%', once: true } });

    // circular text spins faster with scroll velocity
    const ring = G.to('.cta-round__ring', { rotation: 360, duration: 16, repeat: -1, ease: 'none', transformOrigin: '50% 50%' });

    // velocity marquee
    const track = $('#marquee-track');
    let x = 0, dir = 1, targetV = 0, smooth = 0, on = false;
    ST.create({
      trigger: '#marquee', start: 'top bottom', end: 'bottom top',
      onToggle: (s) => { on = s.isActive; },
      onUpdate: (s) => { targetV = s.getVelocity(); if (targetV) dir = Math.sign(targetV); },
    });
    const setX = G.quickSetter(track, 'xPercent');
    const setSkew = G.quickSetter(track, 'skewX', 'deg');
    G.ticker.add((t, dt) => {
      const v = lenis ? lenis.velocity * 60 : targetV;
      ring.timeScale(1 + Math.min(Math.abs(v) / 600, 5));
      if (!on) return;
      targetV *= .92;
      smooth += (targetV - smooth) * .12;
      x -= dir * (1.8 + Math.abs(smooth) * .012) * (dt / 1000);
      if (x <= -50) x += 50;
      if (x > 0) x -= 50;
      setX(x);
      setSkew(clamp(-smooth / 350, -9, 9));
    });
  }

  function initMagnets() {
    if (!fine || reduce || !hasGsap) return;
    $$('[data-magnet]').forEach((el) => {
      const s = parseFloat(el.dataset.magnet) || .3;
      const qx = G.quickTo(el, 'x', { duration: 1, ease: 'elastic.out(1, 0.4)' });
      const qy = G.quickTo(el, 'y', { duration: 1, ease: 'elastic.out(1, 0.4)' });
      window.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2 - (G.getProperty(el, 'x') || 0);
        const cy = r.top + r.height / 2 - (G.getProperty(el, 'y') || 0);
        const dx = e.clientX - cx, dy = e.clientY - cy;
        if (Math.hypot(dx, dy) < Math.max(r.width, r.height) * .9 + 40) { qx(dx * s); qy(dy * s); }
        else { qx(0); qy(0); }
      }, { passive: true });
    });
  }

  function initEmail() {
    $$('[data-email]').forEach((a) => a.addEventListener('click', (e) => {
      if (!fine || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const url = 'https://mail.google.com/mail/?view=cm&fs=1&to=sumitsinghkoranga7@gmail.com&su=' +
        encodeURIComponent('Hello Sumit') + '&body=' + encodeURIComponent('Hi Sumit,\n\n');
      const w = window.open(url, '_blank');
      if (w) { w.opener = null; e.preventDefault(); }
    }));
  }

  function initCopy() {
    $$('[data-copy]').forEach((b) => b.addEventListener('click', async (e) => {
      e.stopPropagation();
      const text = b.dataset.copy;
      const label = b.getAttribute('aria-label');
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand('copy'); } catch (er) { ok = false; }
        ta.remove();
      }
      if (!ok) return;
      b.classList.add('is-done');
      b.setAttribute('aria-label', 'Copied');
      setTimeout(() => { b.classList.remove('is-done'); b.setAttribute('aria-label', label); }, 1800);
    }));
  }

  /* ---------------- Scroll squeeze (desktop, velocity driven) ---------------- */
  function initSqueeze() {
    if (!fine || reduce || !hasGsap || !lenis || innerWidth < 900) return;
    const targets = $$('main > section:not([data-no-squeeze])');
    const q = targets.map((el) => ({
      el,
      sy: G.quickTo(el, 'scaleY', { duration: .45, ease: 'power3.out' }),
      sx: G.quickTo(el, 'scaleX', { duration: .45, ease: 'power3.out' }),
    }));
    let idle;
    lenis.on('scroll', () => {
      const amount = Math.min(Math.abs(lenis.velocity) / 30, 1) * .12;
      q.forEach(({ el, sy, sx }) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        el.style.transformOrigin = `50% ${innerHeight / 2 - r.top}px`;
        sy(1 - amount); sx(1 - amount * .35);
      });
      clearTimeout(idle);
      idle = setTimeout(() => q.forEach(({ sy, sx }) => { sy(1); sx(1); }), 150);
    });
  }

  /* ---------------- Footer ---------------- */
  function initFooter() {
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    initTheme();
    initLenis();
    initNav();
    initHero();
    $$('[data-silk]').forEach((c, i) => initSilk(c, i === 0));
    initProximity();
    initReveals();
    initMore();
    initProjects();
    initOrbit();
    initTrees();
    initClock();
    initTalk();
    initContactMotion();
    initMagnets();
    initEmail();
    initCopy();
    initSqueeze();
    initFooter();
    initCursor();
    initLoader(playHero);
    if (hasGsap) {
      if (document.fonts) document.fonts.ready.then(() => ST.refresh());
      window.addEventListener('load', () => ST.refresh());
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
