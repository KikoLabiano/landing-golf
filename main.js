/* Jon Aristu · Clases de golf en Pamplona
   Sin dependencias. Tres cosas: la bola que recorre la página, la barra superior y las apariciones. */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Barra superior + menú móvil ---------- */
  const topbar = $('#topbar');
  const toggle = $('#nav-toggle');
  const nav = $('#nav');
  const sticky = $('#sticky-cta');
  const contact = $('#contacto');

  const isMenuOpen = () => toggle.getAttribute('aria-expanded') === 'true';
  function setMenu(open, refocus) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.classList.add('has-toggled');
    nav.classList.toggle('is-open', open);
    if (!open && refocus) toggle.focus();
  }

  toggle.addEventListener('click', () => setMenu(!isMenuOpen()));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

  // Escape cierra y devuelve el foco al botón; Tab no se escapa del menú abierto
  document.addEventListener('keydown', e => {
    if (!isMenuOpen()) return;
    if (e.key === 'Escape') { setMenu(false, true); return; }
    if (e.key !== 'Tab') return;
    const focusables = [toggle, ...$$('a, button', nav)];
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // Un clic fuera también cierra
  document.addEventListener('click', e => {
    if (isMenuOpen() && !e.target.closest('#nav, #nav-toggle')) setMenu(false);
  });

  // Al volver a escritorio el menú móvil no debe quedarse abierto
  const wide = window.matchMedia('(min-width: 821px)');
  (wide.addEventListener ? wide.addEventListener.bind(wide, 'change') : wide.addListener.bind(wide))(e => { if (e.matches) setMenu(false); });

  const navLinks = $$('a[href^="#"]', nav).filter(a => !a.classList.contains('btn'));
  const navTargets = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  let currentNav = null;

  function navState() {
    // sección activa: la última cuyo inicio ya ha pasado la línea de la barra
    const line = window.scrollY + 120;
    let active = null;
    navTargets.forEach((sec, i) => { if (sec.offsetTop <= line) active = navLinks[i]; });
    if (active === currentNav) return;
    if (currentNav) currentNav.removeAttribute('aria-current');
    if (active) active.setAttribute('aria-current', 'true');
    currentNav = active;
  }

  function topbarState() {
    const y = window.scrollY;
    topbar.classList.toggle('is-solid', y > 24);
    const contactTop = contact.getBoundingClientRect().top;
    const show = y > window.innerHeight * 0.7 && contactTop > window.innerHeight * 0.6;
    sticky.classList.toggle('is-visible', show);
    // reserva sitio abajo para que el CTA fijo no se coma el pie
    document.body.classList.toggle('has-sticky-cta', show);
    navState();
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
    // el valor final ya está en un .sr-only; aquí solo se anima el span decorativo
    const out = el.querySelector('[aria-hidden="true"]') || el;
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    if (reduceMotion) { out.textContent = prefix + target.toFixed(decimals).replace('.', ','); return; }
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = target * eased;
      out.textContent = prefix + value.toFixed(decimals).replace('.', ',');
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

  /* ---------- Mapa: no se carga Google hasta que el usuario lo acepta ---------- */
  const mapBtn = $('#map-consent');
  if (mapBtn) {
    mapBtn.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.src = mapBtn.dataset.mapSrc;
      frame.title = mapBtn.dataset.mapTitle;
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      frame.allowFullscreen = true;
      frame.setAttribute('width', '600');
      frame.setAttribute('height', '420');
      mapBtn.replaceWith(frame);
    });
  }

  /* ---------- Formulario: validación en español y envío sin recargar ---------- */
  const form = $('#form-reserva');
  if (form) {
    const status = $('#form-status');
    const fields = [...form.elements].filter(el => el.name && el.name !== '_gotcha' && el.willValidate);

    const messages = {
      nombre: 'Dinos cómo te llamas.',
      email: 'Necesitamos un email válido para contestarte.',
      consentimiento: 'Marca la casilla para que podamos responderte.'
    };

    function errorFor(field) {
      if (field.validity.valid) return '';
      if (field.validity.valueMissing || field.validity.typeMismatch) {
        return messages[field.name] || 'Revisa este campo.';
      }
      return 'Revisa este campo.';
    }

    function showError(field, msg) {
      const slot = form.querySelector(`[data-error-for="${field.name}"]`);
      if (slot) slot.textContent = msg;
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (!msg) field.removeAttribute('aria-invalid');
    }

    fields.forEach(field => {
      field.addEventListener('blur', () => showError(field, errorFor(field)));
      field.addEventListener('input', () => { if (field.hasAttribute('aria-invalid')) showError(field, errorFor(field)); });
    });

    function setStatus(text, state) {
      status.textContent = text;
      if (state) status.dataset.state = state; else delete status.dataset.state;
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      setStatus('', null);

      let firstBad = null;
      fields.forEach(field => {
        const msg = errorFor(field);
        showError(field, msg);
        if (msg && !firstBad) firstBad = field;
      });
      if (firstBad) { firstBad.focus(); setStatus('Faltan datos por revisar.', 'error'); return; }

      // Sin endpoint configurado: no se pierde el mensaje, se abre el correo
      if (form.action.includes('TU_ID')) {
        setStatus('El formulario aún no está conectado. Escríbenos a hola@jonaristugolf.es o por WhatsApp y te contestamos igual.', 'error');
        return;
      }

      form.classList.add('is-sending');
      setStatus('Enviando…', null);
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        fields.forEach(field => showError(field, ''));
        setStatus('Recibido. Te contesto en menos de 24 horas para cerrar día y hora.', 'ok');
      } catch (err) {
        setStatus('No hemos podido enviarlo. Prueba por WhatsApp al 600 000 000 o escribe a hola@jonaristugolf.es.', 'error');
      } finally {
        form.classList.remove('is-sending');
      }
    });
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

  // Reconstruir cuesta un getTotalLength() y 24 getPointAtLength(): solo si la
  // geometría ha cambiado de verdad. El ResizeObserver saltaba en cada aparición.
  let lastW = 0, lastH = 0;
  function rebuildIfChanged() {
    const w = document.documentElement.clientWidth;
    const h = document.documentElement.scrollHeight;
    if (Math.abs(w - lastW) < 1 && Math.abs(h - lastH) < 8) return;
    lastW = w; lastH = h;
    rebuild();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', rebuild);
  window.addEventListener('load', build);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
  if ('ResizeObserver' in window) new ResizeObserver(rebuildIfChanged).observe(document.documentElement);
  build();
})();
