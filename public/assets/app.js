/* Alimat Group — progressive enhancement. The site works without JS; this adds filters, menu and form submit. */
(function () {
  'use strict';
  var LANGS = ['pl', 'uk', 'ru', 'en', 'es', 'pt', 'ro'];
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  // Root page: send visitor to saved or browser language.
  function rootRedirect() {
    if (!document.body.hasAttribute('data-autolang')) return;
    var saved = store.get('lang');
    var pick = LANGS.indexOf(saved) > -1 ? saved : null;
    if (!pick) {
      var prefs = navigator.languages || [navigator.language || ''];
      for (var i = 0; i < prefs.length && !pick; i++) {
        var code = String(prefs[i]).toLowerCase().slice(0, 2);
        if (code === 'ua') code = 'uk';
        if (LANGS.indexOf(code) > -1) pick = code;
      }
    }
    var link = pick && document.querySelector('a[data-lang="' + pick + '"]');
    if (link) location.replace(link.href);
  }

  function rememberLanguage() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-lang]');
      if (a) store.set('lang', a.getAttribute('data-lang'));
    });
  }

  function mobileMenu() {
    var btn = document.querySelector('.menu-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });
    // Submenu toggle (touch / keyboard); hover handled in CSS on desktop.
    document.querySelectorAll('.sub-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var li = b.parentNode;
        var open = li.classList.toggle('sub-open');
        b.setAttribute('aria-expanded', String(open));
      });
    });
    // Close language dropdown and submenus when clicking outside.
    document.addEventListener('click', function (e) {
      document.querySelectorAll('.has-sub.sub-open').forEach(function (li) {
        if (!li.contains(e.target)) { li.classList.remove('sub-open'); li.querySelector('.sub-btn').setAttribute('aria-expanded', 'false'); }
      });
      document.querySelectorAll('details.lang-switch[open]').forEach(function (d) {
        if (!d.contains(e.target)) d.removeAttribute('open');
      });
    });
  }

  function jobFilters() {
    var form = document.getElementById('job-filters');
    var grid = document.getElementById('job-grid');
    if (!form || !grid) return;
    var city = form.elements.city;
    var cat = form.elements.cat;
    var count = document.getElementById('jobs-count');
    var empty = document.getElementById('jobs-empty');
    var cards = grid.querySelectorAll('.job-card');
    var params = new URLSearchParams(location.search);

    function setIfOption(select, value) {
      if (value && Array.prototype.some.call(select.options, function (o) { return o.value === value; })) select.value = value;
    }
    setIfOption(city, params.get('city'));
    setIfOption(cat, params.get('cat'));

    function apply() {
      var shown = 0;
      cards.forEach(function (c) {
        var cc = c.getAttribute('data-city');
        var ok = (!city.value || cc === city.value || cc === '*') && (!cat.value || c.getAttribute('data-cat') === cat.value);
        c.hidden = !ok;
        if (ok) shown++;
      });
      count.textContent = count.getAttribute('data-template').replace('{n}', shown);
      empty.hidden = shown !== 0;
      var q = new URLSearchParams();
      if (city.value) q.set('city', city.value);
      if (cat.value) q.set('cat', cat.value);
      history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
    }
    form.addEventListener('change', apply);
    form.addEventListener('submit', function (e) { e.preventDefault(); apply(); });
    form.addEventListener('reset', function () { setTimeout(apply, 0); });
    apply();
  }

  function preselectJob() {
    var select = document.getElementById('apply-job');
    var job = new URLSearchParams(location.search).get('job');
    if (!select || !job) return;
    if (Array.prototype.some.call(select.options, function (o) { return o.value === job; })) select.value = job;
  }

  // Forms: validate, then POST to the configured endpoint, or hand over to WhatsApp if none is set.
  function forms() {
    document.querySelectorAll('form[data-form]').forEach(function (form) {
      var status = form.querySelector('.form-status');
      var submit = form.querySelector('[type="submit"]');
      form.elements.page.value = location.href;

      function setStatus(msg, kind) {
        status.textContent = msg;
        status.className = 'form-status' + (kind ? ' ' + kind : '');
      }

      function validate() {
        var firstBad = null;
        Array.prototype.forEach.call(form.elements, function (el) {
          if (!el.willValidate || el.type === 'hidden') return;
          var bad = !el.checkValidity();
          if (el.type === 'checkbox' || el.type === 'radio') { if (el.closest('.check')) el.closest('.check').classList.toggle('invalid', bad); }
          else el.setAttribute('aria-invalid', String(bad));
          if (bad && !firstBad) firstBad = el;
        });
        var file = form.querySelector('input[type="file"]');
        if (file && file.files[0] && file.files[0].size > Number(file.getAttribute('data-max'))) {
          setStatus(form.getAttribute('data-msg-file'), 'err');
          file.focus();
          return false;
        }
        if (firstBad) {
          if (firstBad.closest('details')) firstBad.closest('details').open = true;
          setStatus(form.getAttribute('data-msg-invalid'), 'err');
          firstBad.focus();
          return false;
        }
        return true;
      }

      function summary(data) {
        var lines = [];
        data.forEach(function (v, k) {
          if (typeof v !== 'string' || !v || ['form_type', 'lang', 'website', 'consent', 'page'].indexOf(k) > -1) return;
          if (k === 'job') {
            var opt = form.querySelector('select[name="job"] option:checked');
            v = opt ? opt.textContent : v;
          }
          lines.push(v);
        });
        var cv = form.querySelector('input[type="file"]');
        if (cv && cv.files[0]) lines.push(form.getAttribute('data-cv-line'));
        return lines.join('\n');
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (form.elements.website.value) return; // bot trap
        if (!validate()) return;
        var data = new FormData(form);
        var endpoint = form.getAttribute('action');

        var lead = { form_type: form.getAttribute('data-form'), job: (form.elements.job && form.elements.job.value) || '', channel: endpoint ? 'form' : 'whatsapp' };
        if (!endpoint) {
          track('generate_lead', lead);
          var hasCv = form.querySelector('input[type="file"]') && form.querySelector('input[type="file"]').files[0];
          setStatus(form.getAttribute(hasCv ? 'data-msg-wa-cv' : 'data-msg-wa'), 'ok');
          window.open('https://wa.me/' + form.getAttribute('data-wa') + '?text=' + encodeURIComponent(summary(data)), '_blank', 'noopener');
          return;
        }
        submit.disabled = true;
        setStatus(form.getAttribute('data-msg-sending'));
        fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            form.classList.add('sent');
            track('generate_lead', lead);
            setStatus(form.getAttribute('data-msg-ok'), 'ok');
            status.setAttribute('tabindex', '-1');
            status.focus();
          })
          .catch(function () { setStatus(form.getAttribute('data-msg-err'), 'err'); })
          .then(function () { submit.disabled = false; });
      });
    });
  }

  /**
   * Lead popup (quick application form).
   * - [data-apply] buttons (job slider) open it for a given job at any time.
   * - data-auto="1": opens by itself once per session — after 60 s of reading a job (visible time only),
   *   or on job lists after the visitor has scrolled through the offers. Never while the visitor
   *   is typing in another form or after a form was sent.
   */
  function leadPopup() {
    var dlg = document.getElementById('lead-pop');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    var ss = {
      get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return '1'; } },
      set: function (k) { try { sessionStorage.setItem(k, '1'); } catch (e) { /* ignore */ } },
    };

    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
    });
    document.addEventListener('submit', function (e) {
      if (e.target.matches && e.target.matches('form[data-form]')) ss.set('lead-sent');
    }, true);

    // Open for a specific job (slider "Apply" buttons).
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-apply]');
      if (!btn) return;
      var title = btn.getAttribute('data-apply');
      dlg.querySelector('input[name="job"]').value = title;
      dlg.querySelector('#lead-pop-t').textContent = dlg.getAttribute('data-t-job');
      var desc = dlg.querySelector('.lead-pop-d');
      desc.textContent = dlg.getAttribute('data-d-job') + ' ';
      var strong = document.createElement('strong');
      strong.textContent = title;
      desc.appendChild(strong);
      dlg.querySelector('.lead-pop-wa').href = btn.getAttribute('data-wa');
      ss.set('lead-pop');
      if (!dlg.open) { dlg.showModal(); track('apply_popup_open', { job: title, trigger: 'button' }); }
    });

    if (dlg.getAttribute('data-auto') !== '1' || ss.get('lead-pop') || ss.get('lead-sent')) return;
    var delay = Number(dlg.getAttribute('data-delay')) * 1000;
    var seen = 0, last = Date.now(), done = false;

    function busy() {
      var a = document.activeElement;
      return a && a.closest && a.closest('form') && !dlg.contains(a);
    }
    function open() {
      if (done || dlg.open) return;
      if (busy() || document.querySelector('form.sent')) { setTimeout(open, 15000); return; }
      done = true;
      ss.set('lead-pop');
      dlg.showModal();
      track('apply_popup_open', { trigger: 'auto' });
    }
    function tick() {
      if (done) return;
      if (!document.hidden) seen += Date.now() - last;
      last = Date.now();
      if (seen >= delay) open(); else setTimeout(tick, 1000);
    }
    document.addEventListener('visibilitychange', function () { last = Date.now(); });
    setTimeout(tick, 1000);

    if (dlg.getAttribute('data-mode') === 'list') {
      var grid = document.getElementById('job-grid') || document.querySelector('.job-grid');
      if (grid) {
        var onScroll = function () {
          var r = grid.getBoundingClientRect();
          // Bottom of the offers reached and at least 15 s on the page.
          if (r.bottom < window.innerHeight * 0.9 && seen + (Date.now() - last) > 15000) {
            window.removeEventListener('scroll', onScroll);
            open();
          }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
      }
    }
  }

  /** Job slider: arrows, dots, autoplay every 15 s (paused on hover/focus/touch, off with reduced motion). */
  function jobSlider() {
    document.querySelectorAll('.job-slider').forEach(function (root) {
      var track = root.querySelector('.js-track');
      var slides = track.children;
      var dotsBox = root.querySelector('.js-dots');
      if (!slides.length) return;
      var paused = false, timer;

      function step() { return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth; }
      function perView() { return Math.max(1, Math.round(track.clientWidth / step())); }
      function pages() { return Math.max(1, Math.ceil(slides.length - perView() + 1)); }
      function current() { return Math.round(track.scrollLeft / step()); }
      function go(i) {
        var n = pages();
        i = (i + n) % n;
        track.scrollTo({ left: i * step(), behavior: 'smooth' });
      }
      function renderDots() {
        var n = pages();
        if (dotsBox.children.length !== n) {
          dotsBox.innerHTML = '';
          for (var i = 0; i < n; i++) {
            var d = document.createElement('button');
            d.type = 'button';
            d.tabIndex = -1;
            d.addEventListener('click', go.bind(null, i));
            dotsBox.appendChild(d);
          }
        }
        var c = Math.min(current(), n - 1);
        Array.prototype.forEach.call(dotsBox.children, function (d, i) { d.classList.toggle('on', i === c); });
        root.classList.toggle('js-static', n < 2);
      }

      // "Full description": opens the slide-up panel (touch screens, keyboard); hover does it with CSS.
      root.addEventListener('click', function (e) {
        var panel = e.target.closest('.js-detail');
        if (panel && !e.target.closest('a')) { panel.parentNode.querySelector('.js-more').click(); return; }
        var b = e.target.closest('.js-more');
        if (!b) return;
        var slide = b.closest('.js-slide');
        var open = !slide.classList.contains('is-open');
        root.querySelectorAll('.js-slide.is-open').forEach(function (s) { s.classList.remove('is-open'); s.querySelector('.js-more').setAttribute('aria-expanded', 'false'); });
        slide.classList.toggle('is-open', open);
        b.setAttribute('aria-expanded', String(open));
      });
      root.querySelectorAll('.js-btn').forEach(function (b) {
        b.addEventListener('click', function () { go(current() + Number(b.getAttribute('data-dir'))); });
      });
      track.addEventListener('scroll', function () { window.requestAnimationFrame(renderDots); }, { passive: true });
      window.addEventListener('resize', renderDots);
      renderDots();

      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return;
      function pause() { paused = true; }
      function resume() { paused = false; }
      root.addEventListener('mouseenter', pause);
      root.addEventListener('mouseleave', resume);
      root.addEventListener('focusin', pause);
      root.addEventListener('focusout', resume);
      track.addEventListener('touchstart', function () { pause(); clearTimeout(timer); timer = setTimeout(resume, 10000); }, { passive: true });
      setInterval(function () {
        var dlg = document.getElementById('lead-pop');
        if (!paused && !document.hidden && !(dlg && dlg.open)) go(current() + 1);
      }, 15000);
    });
  }


  /** Conversion events for GTM (dataLayer), direct GA4/Ads (gtag) and Meta Pixel (fbq). No-ops when nothing is configured. */
  var META_EVENT = { generate_lead: 'Lead', contact: 'Contact' };
  function track(name, params) {
    var c = window.alimatConsent;
    if (!c) return;
    params = params || {};
    var data = { event: name };
    for (var k in params) data[k] = params[k];
    window.dataLayer.push(data);
    if (!c.cfg.gtm && (c.cfg.ga4 || c.cfg.ads)) window.gtag('event', name, params);
    if (window.fbq && META_EVENT[name]) window.fbq('track', META_EVENT[name], params);
  }
  window.alimatTrack = track;

  function trackClicks() {
    var METHODS = [[/^https:\/\/wa\.me\//, 'whatsapp'], [/^tel:/, 'phone'], [/^https:\/\/t\.me\//, 'telegram'], [/^viber:/, 'viber'], [/^mailto:/, 'email']];
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      for (var i = 0; i < METHODS.length; i++) {
        if (METHODS[i][0].test(href)) { track('contact', { method: METHODS[i][1] }); return; }
      }
    });
  }

  /** Cookie banner: shown until the visitor chooses; footer link "cookie settings" reopens it. */
  function cookieBanner() {
    var box = document.getElementById('cc');
    var c = window.alimatConsent;
    if (!box || !c) return;
    var opts = box.querySelector('.cc-opts');
    function show(detailed) {
      var saved = c.get();
      opts.elements.analytics.checked = !!(saved && saved.analytics);
      opts.elements.marketing.checked = !!(saved && saved.marketing);
      opts.hidden = !detailed;
      box.querySelector('[data-cc="settings"]').hidden = detailed;
      box.querySelector('[data-cc="save"]').hidden = !detailed;
      box.hidden = false;
    }
    function done(choice) { c.set(choice); box.hidden = true; }
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-cc]');
      if (!b) return;
      var act = b.getAttribute('data-cc');
      if (act === 'open') show(true);
      else if (act === 'settings') show(true);
      else if (act === 'accept') done({ analytics: true, marketing: true });
      else if (act === 'reject') done({ analytics: false, marketing: false });
      else if (act === 'save') done({ analytics: opts.elements.analytics.checked, marketing: opts.elements.marketing.checked });
    });
    if (!c.get()) show(false);
  }

  /**
   * Home hero banner: switches every 5 s. The 5 s timer is the CSS progress bar on the active dot
   * (animationend → next slide), so pausing is just animation-play-state: hover, keyboard focus,
   * touch, open quick-apply dialog. With reduced motion the bar never runs → no autoplay.
   */
  function heroBanner() {
    var root = document.querySelector('[data-hb]');
    if (!root) return;
    var slides = root.querySelectorAll('.hb-slide');
    var sets = root.querySelectorAll('.hb-set');
    var dots = root.querySelectorAll('.hb-dot');
    var n = slides.length, cur = 0, outTimer;
    if (n < 2) return;

    function load(i) {
      sets[(i + n) % n].querySelectorAll('img[data-src]').forEach(function (img) {
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
      });
    }
    function go(i) {
      i = (i + n) % n;
      if (i === cur) return;
      load(i);
      load(i + 1);
      var prev = sets[cur];
      prev.classList.remove('is-on');
      prev.classList.add('is-out');
      clearTimeout(outTimer);
      outTimer = setTimeout(function () { prev.classList.remove('is-out'); }, 650);
      sets[i].classList.remove('is-out');
      sets[i].classList.add('is-on');
      slides[cur].classList.remove('is-on');
      slides[i].classList.add('is-on');
      dots[cur].classList.remove('is-on');
      void dots[i].offsetWidth; // restart the progress animation
      dots[i].classList.add('is-on');
      cur = i;
    }
    // Next slide's photos load once the page is ready, so a switch never shows empty frames.
    if (document.readyState === 'complete') load(1);
    else window.addEventListener('load', function () { load(1); }, { once: true });

    root.addEventListener('animationend', function (e) {
      if (e.animationName === 'hb-progress' && !root.classList.contains('is-paused')) go(cur + 1);
    });
    dots.forEach(function (d) { d.addEventListener('click', function () { go(Number(d.getAttribute('data-go'))); }); });

    var holds = {};
    function hold(why, on) {
      if (on) holds[why] = 1; else delete holds[why];
      root.classList.toggle('is-paused', Object.keys(holds).length > 0);
    }
    root.addEventListener('mouseenter', function () { hold('hover', true); });
    root.addEventListener('mouseleave', function () { hold('hover', false); });
    root.addEventListener('focusin', function (e) { if (!e.target.classList.contains('hb-dot')) hold('focus', true); });
    root.addEventListener('focusout', function () { hold('focus', false); });
    var dlg = document.getElementById('lead-pop');
    if (dlg) {
      root.addEventListener('click', function (e) { if (e.target.closest('[data-apply]')) hold('dialog', true); });
      dlg.addEventListener('close', function () { hold('dialog', false); });
    }
    // Touch: swipe to change, and a short pause so the visitor can read.
    var x0 = null, touchTimer;
    root.addEventListener('touchstart', function (e) {
      x0 = e.touches[0].clientX;
      hold('touch', true);
      clearTimeout(touchTimer);
      touchTimer = setTimeout(function () { hold('touch', false); }, 8000);
    }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /**
   * Scroll reveal like the original site's entrance animations: blocks below the fold fade/slide in
   * once, children of the same list are staggered. Content already on screen is left untouched.
   */
  function reveal() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var groups = [
      ['.center-title, .block-head, .lead-c, .cv-banner, .emp-strip, .referral, .help-box, .job-slider .js-track', ''],
      ['.intl-stats > li, .intl-lists > div, .review-grid > li, .sections > li, .stats > li, .steps > li, .perks > li, .job-grid > *, .post-grid > *, .offices > li, .ticks > li, .emp-nums > li, .emp-brands > li, .emp-models > *, .emp-flow > li, .emp-inds > li, .emp-refs > li', 'stagger'],
      ['.why-row:not(.why-row-rev) .why-img, .why-row-rev .why-text, .here-text, .svc-split > :first-child, .emp-split > :first-child', 'rv-l'],
      ['.why-row:not(.why-row-rev) .why-text, .why-row-rev .why-img, .here-img, .svc-split > :last-child, .emp-split > :last-child', 'rv-r'],
    ];
    var fold = window.innerHeight;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        el.classList.add('in');
        // Drop the helper classes afterwards so hover transitions work normally.
        setTimeout(function () { el.classList.remove('rv', 'rv-l', 'rv-r', 'in'); el.style.removeProperty('--rv-i'); }, 1400);
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.12 });
    groups.forEach(function (g) {
      document.querySelectorAll(g[0]).forEach(function (el) {
        if (el.classList.contains('rv') || el.closest('.hero, .page-hero, .site-header, .site-footer, dialog, .cc')) return;
        if (el.getBoundingClientRect().top < fold) return;
        el.classList.add('rv');
        if (g[1] === 'stagger') {
          var i = Array.prototype.indexOf.call(el.parentNode.children, el);
          el.style.setProperty('--rv-i', String(i % 6));
        } else if (g[1]) el.classList.add(g[1]);
        io.observe(el);
      });
    });
  }

  function init() {
    rootRedirect();
    rememberLanguage();
    mobileMenu();
    jobFilters();
    preselectJob();
    forms();
    leadPopup();
    jobSlider();
    heroBanner();
    reveal();
    trackClicks();
    cookieBanner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
