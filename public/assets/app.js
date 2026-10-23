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
    // Close language dropdown when clicking outside.
    document.addEventListener('click', function (e) {
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

        if (!endpoint) {
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
            setStatus(form.getAttribute('data-msg-ok'), 'ok');
            status.setAttribute('tabindex', '-1');
            status.focus();
          })
          .catch(function () { setStatus(form.getAttribute('data-msg-err'), 'err'); })
          .then(function () { submit.disabled = false; });
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
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
