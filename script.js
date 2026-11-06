/* Taste of Africa - script.js
   Features: dark/light toggle, recipe filter, favorites (localStorage),
   ingredient scaler, contact form validation, newsletter signup. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- safe localStorage helpers ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  /* ---------- 1. Dark / light mode ---------- */
  const root = document.documentElement;
  const toggle = $('#theme-toggle');
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    store.set('toa-theme', t);
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(t === 'dark'));
      toggle.innerHTML = t === 'dark' ? '&#9728; Light' : '&#9790; Dark';
    }
  }
  setTheme(store.get('toa-theme', 'light'));
  if (toggle) toggle.addEventListener('click', () => setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  /* ---------- 2. Favorites (saved in localStorage) ---------- */
  const FAV_KEY = 'toa-favorites';
  const getFavs = () => store.get(FAV_KEY, []);
  function paintFavs() {
    const favs = getFavs();
    $$('.fav-btn').forEach(btn => {
      const on = favs.includes(btn.dataset.id);
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', String(on));
      const label = $('.fav-label', btn);
      if (label) label.textContent = on ? 'Saved' : 'Favorite';
    });
  }
  document.addEventListener('click', e => {
    const btn = e.target.closest('.fav-btn');
    if (!btn) return;
    const id = btn.dataset.id;
    const favs = getFavs();
    store.set(FAV_KEY, favs.includes(id) ? favs.filter(f => f !== id) : favs.concat(id));
    paintFavs();
    applyFilter();
  });

  /* ---------- 3. Recipe filter ---------- */
  const filterBtns = $$('.filter-btn');
  const cards = $$('#recipe-grid .recipe-card');
  let current = 'all';
  function applyFilter() {
    if (!filterBtns.length) return;
    const favs = getFavs();
    let shown = 0;
    cards.forEach(card => {
      const match = current === 'all' || (current === 'favorites' ? favs.includes(card.dataset.id) : card.dataset.region === current);
      card.classList.toggle('hidden', !match);
      if (match) shown++;
    });
    const status = $('#filter-status');
    if (status) status.textContent = 'Showing ' + shown + ' of ' + cards.length + ' recipes.';
    const none = $('#no-results');
    if (none) none.hidden = shown !== 0;
  }
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    current = btn.dataset.filter;
    filterBtns.forEach(b => { const on = b === btn; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    applyFilter();
  }));

  /* ---------- 4. Ingredient scaler ---------- */
  function fraction(n) {
    const r = Math.round(n * 100) / 100;
    const whole = Math.floor(r + 0.001);
    const f = Math.round((r - whole) * 100) / 100;
    const map = { 0.25: '\u00BC', 0.33: '\u2153', 0.5: '\u00BD', 0.67: '\u2154', 0.75: '\u00BE' };
    if (f === 0) return String(whole);
    if (map[f]) return (whole ? whole + ' ' : '') + map[f];
    return String(r);
  }
  const servings = $('#servings');
  if (servings) {
    const base = Number(servings.dataset.base) || 1;
    servings.addEventListener('input', () => {
      const s = Math.min(24, Math.max(1, Number(servings.value) || base));
      $$('.qty').forEach(q => { q.textContent = fraction(Number(q.dataset.base) * s / base); });
    });
  }

  /* ---------- 5. Contact form validation ---------- */
  const form = $('#contact-form');
  if (form) {
    const country = $('#country'), otherWrap = $('#other-wrap');
    country.addEventListener('change', () => { otherWrap.hidden = country.value !== 'other'; });
    const setError = (input, msg) => {
      $('#' + input.id + '-err').textContent = msg;
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    };
    form.addEventListener('submit', event => {
      event.preventDefault();
      const name = $('#name'), email = $('#email'), message = $('#message');
      const nameVal = name.value.trim(), msgVal = message.value.trim();
      let ok = true;
      setError(name, nameVal ? '' : 'Please enter your name.'); if (!nameVal) ok = false;
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      setError(email, emailOk ? '' : 'Please enter a valid email address.'); if (!emailOk) ok = false;
      const msgOk = msgVal.length > 20;
      setError(message, msgOk ? '' : 'Your message needs more than 20 characters (now ' + msgVal.length + ').'); if (!msgOk) ok = false;
      if (!ok) { const first = $('[aria-invalid="true"]', form); if (first) first.focus(); return; }
      form.hidden = true;
      const box = $('#confirmation');
      box.textContent = 'Thank you, ' + nameVal + '! We\u2019ve received your message.';
      box.hidden = false;
      box.focus();
    });
  }

  /* ---------- 6. Newsletter signup (footer) ---------- */
  const news = $('.newsletter-form');
  if (news) news.addEventListener('submit', e => {
    e.preventDefault();
    const input = $('input', news), msg = $('.form-msg', news);
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) { msg.textContent = 'Thanks for subscribing!'; input.value = ''; }
    else msg.textContent = 'Please enter a valid email address.';
  });

  paintFavs();
  applyFilter();

  /* ---------- 7. Video thumbnails (the player loads when clicked) ---------- */
  const isLocal = window.location.protocol === 'file:';
  const PLAY_ICON = '<svg viewBox="0 0 68 48" width="68" height="48" aria-hidden="true" focusable="false"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="red"/><path d="M45 24 27 14v20" fill="#fff"/></svg>';

  $$('.video').forEach(container => {
    const iframe = $('iframe', container);
    if (!iframe) return;
    const match = (iframe.getAttribute('src') || '').match(/embed\/([\w-]{11})/);
    if (!match) return;
    const vid = match[1];
    const title = iframe.getAttribute('title') || 'video';

    const thumb = document.createElement('a');
    thumb.className = 'video-thumb';
    thumb.style.setProperty('--thumb', 'url(https://img.youtube.com/vi/' + vid + '/hqdefault.jpg)');
    thumb.innerHTML = PLAY_ICON;

    if (isLocal) {
      /* Opened as a file: YouTube blocks embeds here, so link out to YouTube instead */
      thumb.href = 'https://www.youtube.com/watch?v=' + vid;
      thumb.target = '_blank';
      thumb.rel = 'noopener noreferrer';
      thumb.setAttribute('aria-label', 'Watch on YouTube (opens in a new tab): ' + title);
    } else {
      /* Hosted or localhost: load the real player only when the thumbnail is activated */
      thumb.href = '#';
      thumb.setAttribute('aria-label', 'Play video: ' + title);
      thumb.addEventListener('click', e => {
        e.preventDefault();
        const player = document.createElement('iframe');
        player.src = 'https://www.youtube.com/embed/' + vid + '?autoplay=1';
        player.title = title;
        player.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        player.referrerPolicy = 'strict-origin-when-cross-origin';
        player.allowFullscreen = true;
        container.replaceChildren(player);
        player.focus();
      });
    }
    container.replaceChildren(thumb);
  });
})();
