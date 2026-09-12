/* Jon Aristu · Clases de golf en Pamplona
   Sin dependencias. Tres cosas: la bola que recorre la página, la barra superior y las apariciones. */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);

  /* ---------- Barra superior + menú móvil ---------- */
  const topbar = $('#topbar');
  const toggle = $('#nav-toggle');
  const nav = $('#nav');
  const sticky = $('#sticky-cta');
  const contact = $('#contacto');

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.classList.add('has-toggled');
    nav.classList.toggle('is-open', !open);
  });
  nav.addEventListener('click', e => {
    if (e.target.closest('a')) { toggle.setAttribute('aria-expanded', 'false'); toggle.classList.add('has-toggled'); nav.classList.remove('is-open'); }
  });

  function topbarState() {
    const y = window.scrollY;
    topbar.classList.toggle('is-solid', y > 24);
    const contactTop = contact.getBoundingClientRect().top;
    sticky.classList.toggle('is-visible', y > window.innerHeight * 0.7 && contactTop > window.innerHeight * 0.6);
  }
  topbarState();

  /* ---------- Apariciones ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    reveals.forEach(el => io.observe(el));
  }

  /* ---------- Contadores de las stats ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const DURATION = 1400; // misma duración para todos: distinta velocidad, mismo final
  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    if (reduceMotion) { el.textContent = prefix + target.toFixed(decimals).replace('.', ','); return; }
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = target * eased;
      el.textContent = prefix + value.toFixed(decimals).replace('.', ',');
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
    } else {
      const cio = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { animateCounter(en.target); cio.unobserve(en.target); } });
      }, { threshold: 0.6 });
      counters.forEach(el => cio.observe(el));
    }
  }

  /* ---------- La bola: del tee al hoyo ---------- */
  const course = $('.course');
  if (reduceMotion) { course.remove(); window.addEventListener('scroll', topbarState, { passive: true }); return; }

  const svg = $('#course-svg');
  const trail = $('.trail', svg);
  const done = $('.trail-done', svg);
  const ball = $('#ball');
  const dimples = $('#ball-dimples');
  const tee = $('#tee');
  const holeEl = $('#hole');
  const finishGreen = $('.finish__green');
  const waypoints = [...document.querySelectorAll('[data-waypoint]')];

  const FOCUS = 0.62; // la bola viaja a esta altura de la ventana
  let total = 0, startY = 0, endY = 0, endScroll = 1, built = false;
  let cur = 0, target = 0, raf = 0, inHole = false;
  const ballSize = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ball')) || 22;

  const center = el => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 + window.scrollX, y: r.top + r.height / 2 + window.scrollY };
  };

  // Curvas en S entre puntos: tangentes verticales, así la bola nunca se sale del ancho
  // y la Y es siempre creciente (necesario para buscar la posición por scroll)
  // Tramos rectos al bajar: la curvatura solo aparece cuando hay cambio de lado,
  // proporcional al desplazamiento horizontal y acotada para que la Y siga creciendo
  const CURVE = 0.9, SWING = 2.4;
  function toPath(p) {
    let d = `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1];
      const k = Math.min(Math.abs(b.x - a.x) * SWING, (b.y - a.y) * CURVE);
      d += ` C${a.x.toFixed(1)},${(a.y + k).toFixed(1)} ${b.x.toFixed(1)},${(b.y - k).toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
    }
    return d;
  }

  function build() {
    const W = document.documentElement.clientWidth;
    const H = document.documentElement.scrollHeight;
    const mobile = W < 900;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    course.style.height = H + 'px';

    const teeC = center(tee);
    const hero = tee.closest('section');
    const heroBottom = hero.getBoundingClientRect().bottom + window.scrollY;
    const pts = [teeC, { x: teeC.x, y: heroBottom + 30 }];
    waypoints.forEach((wrap, i) => {
      const section = wrap.closest('section') || wrap;
      const r = wrap.getBoundingClientRect();          // columna de contenido
      const sr = section.getBoundingClientRect();      // ancho total de la sección
      const top = r.top + window.scrollY, bottom = top + r.height;
      let x;
      if (mobile) {
        // en móvil y tablet la bola va pegada al margen, alternando lado en cada hoyo
        const g = Math.max(6, parseFloat(getComputedStyle(wrap).paddingLeft) / 2);
        x = wrap.dataset.waypoint === 'left' ? g : W - g;
      } else {
        x = wrap.dataset.waypoint === 'left' ? Math.max(28, sr.left + 30) : Math.min(W - 28, sr.right - 30);
      }
      // entra por el hueco superior, recorre el borde y sale por el hueco inferior.
      // el margen es proporcional: da altura al giro lateral para que sea curva y no codo
      const inset = Math.min(r.height * 0.22, 180);
      pts.push({ x, y: top + inset });
      pts.push({ x: x + (wrap.dataset.waypoint === 'left' ? 1 : -1) * (mobile ? 3 : 12), y: bottom - inset });
    });
    pts.push(center(holeEl));
    for (let i = 1; i < pts.length; i++) if (pts[i].y < pts[i - 1].y + 40) pts[i].y = pts[i - 1].y + 40;

    const d = toPath(pts);
    trail.setAttribute('d', d);
    done.setAttribute('d', d);
    total = done.getTotalLength();
    startY = pts[0].y;
    endY = pts[pts.length - 1].y;
    const maxScroll = H - window.innerHeight;
    endScroll = Math.max(1, Math.min(maxScroll, endY - window.innerHeight * FOCUS));
    built = true;
    target = lengthForScroll();
    cur = target;
    paint();
  }

  // Busca la longitud del trazado cuya Y corresponde al scroll actual
  function lengthForScroll() {
    // línea de foco: la bola acompaña al scroll a FOCUS de la ventana, del tee al hoyo
    const focus = window.scrollY + window.innerHeight * FOCUS;
    const endFocus = endScroll + window.innerHeight * FOCUS;
    const t = Math.min(1, Math.max(0, (focus - startY) / Math.max(1, endFocus - startY)));
    if (t >= 0.999) return total;
    const y = startY + t * (endY - startY);
    let lo = 0, hi = total;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (done.getPointAtLength(mid).y < y) lo = mid; else hi = mid;
    }
    return lo;
  }

  function paint() {
    const p = done.getPointAtLength(cur);
    const s = ballSize();
    const spin = (cur / (Math.PI * s)) * 360;
    const arrived = cur >= total - 1;
    const base = `translate(${(p.x - s / 2).toFixed(1)}px, ${(p.y - s / 2).toFixed(1)}px)`;
    // al llegar, se hunde en el hoyo (la transición la pone .ball.is-in)
    ball.style.transform = arrived ? base + ' translateY(10px) scale(.3)' : base;
    dimples.style.transform = `rotate(${spin.toFixed(0)}deg)`;
    done.style.strokeDasharray = `${cur} ${total + 10}`;

    if (arrived !== inHole) {
      inHole = arrived;
      ball.classList.toggle('is-in', arrived);
      holeEl.classList.toggle('is-in', arrived);
      finishGreen.classList.toggle('is-in', arrived);
    }
  }

  let last = 0;
  function tick(now) {
    const dt = last ? Math.min(100, now - last) : 16;
    last = now;
    const diff = target - cur;
    if (Math.abs(diff) < 0.4) { cur = target; paint(); raf = 0; last = 0; return; }
    cur += diff * (1 - Math.exp(-dt / 90));
    paint();
    raf = requestAnimationFrame(tick);
  }

  function onScroll() {
    topbarState();
    if (!built) return;
    target = lengthForScroll();
    if (!raf) raf = requestAnimationFrame(tick);
  }

  let rt;
  function rebuild() { clearTimeout(rt); rt = setTimeout(build, 120); }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', rebuild);
  window.addEventListener('load', build);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
  if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(document.body);
  build();
})();
