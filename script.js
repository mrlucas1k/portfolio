(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Tmavý / svetlý režim ---------- */

  var themeButtons = document.querySelectorAll('[data-theme-toggle]');

  function applyTheme(theme, save) {
    root.setAttribute('data-theme', theme);
    var isDark = theme === 'dark';
    themeButtons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(isDark));
      btn.querySelector('.theme-label').textContent = isDark ? 'Svetlý režim' : 'Tmavý režim';
    });
    if (save) {
      try { localStorage.setItem('theme', theme); } catch (e) {}
    }
  }

  applyTheme(root.getAttribute('data-theme') || 'light', false);

  themeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    var saved = null;
    try { saved = localStorage.getItem('theme'); } catch (err) {}
    if (!saved) applyTheme(e.matches ? 'dark' : 'light', false);
  });

  /* ---------- Mobilné menu ---------- */

  var menuToggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('menu');
  var mobileQuery = window.matchMedia('(max-width: 759.98px)');

  function setMenu(open) {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Zavrieť menu' : 'Otvoriť menu');
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    if (open) menu.querySelector('a').focus();
  }

  menuToggle.addEventListener('click', function () {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  menu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      if (mobileQuery.matches) setMenu(false);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      setMenu(false);
      menuToggle.focus();
    }
  });

  mobileQuery.addEventListener('change', function (e) {
    if (!e.matches) setMenu(false);
  });

  /* ---------- Výpoveď O mne: slová sa rozsvietia pri posúvaní ---------- */

  var statement = document.querySelector('[data-words]');
  var words = [];
  if (statement && !reduceMotion) {
    var text = statement.textContent.trim();
    statement.setAttribute('aria-label', text);
    statement.textContent = '';
    // delí sa len na bežných medzerách, takže „v&nbsp;Benly“ ostane spolu a predložka nevisí na konci riadku
    text.split(/[ \t\r\n]+/).forEach(function (word) {
      var span = document.createElement('span');
      span.className = 'w';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = word;
      statement.appendChild(span);
      statement.appendChild(document.createTextNode(' '));
      words.push(span);
    });
  }

  function updateWords() {
    if (!words.length) return;
    var rect = statement.getBoundingClientRect();
    var vh = window.innerHeight;
    // 0 keď je text v spodnej časti okna, 1 keď sa dostane do hornej tretiny
    var progress = (vh * 0.85 - rect.top) / (vh * 0.85 - vh * 0.3 + rect.height * 0.4);
    progress = Math.max(0, Math.min(1, progress));
    var lit = Math.round(progress * words.length);
    words.forEach(function (w, i) { w.classList.toggle('on', i < lit); });
  }

  /* ---------- Veľké slovo v úvode sa posúva s rolovaním ---------- */

  var parallax = document.querySelector('[data-parallax]');

  function updateParallax() {
    if (!parallax || reduceMotion) return;
    var y = Math.min(window.scrollY, window.innerHeight);
    parallax.style.transform = 'translateX(' + (-y * 0.25) + 'px)';
  }

  /* ---------- Pás so zameraním sa posúva len spolu so stránkou ----------
     Sám od seba stojí, takže nejde o nekonečný pohyb, ktorý by sa musel dať zastaviť. */

  var marquee = document.querySelector('[data-marquee]');
  var marqueeGroup = marquee && marquee.firstElementChild;

  function updateMarquee() {
    if (!marquee || reduceMotion) return;
    var width = marqueeGroup.offsetWidth;
    if (!width) return;
    var offset = (window.scrollY * 0.5) % width;
    marquee.style.transform = 'translateX(' + (-offset) + 'px)';
  }

  /* ---------- Hlavička ---------- */

  var header = document.querySelector('.site-header');
  var ticking = false;

  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    header.style.setProperty('--progress', max > 0 ? Math.min(window.scrollY / max, 1) : 0);
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateParallax();
      updateMarquee();
      updateWords();
      ticking = false;
    });
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- Aktívna položka menu ---------- */

  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var sections = links
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  function setActive(id) {
    links.forEach(function (link) {
      var active = link.getAttribute('href') === '#' + id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Postupné zobrazenie ---------- */

  var reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { revealer.observe(el); });
  }

  /* ---------- Kopírovanie e-mailu ---------- */

  var status = document.querySelector('[data-copy-status]');

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(area);
      ok ? resolve() : reject();
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var label = btn.querySelector('[data-copy-label]');
    var timer;
    btn.addEventListener('click', function () {
      copyText(btn.getAttribute('data-copy')).then(function () {
        label.textContent = 'Skopírované';
        btn.classList.add('is-done');
        status.textContent = 'E-mail je skopírovaný.';
      }, function () {
        label.textContent = 'Nepodarilo sa';
        status.textContent = 'E-mail sa nepodarilo skopírovať.';
      });
      clearTimeout(timer);
      timer = setTimeout(function () {
        label.textContent = 'Kopírovať';
        btn.classList.remove('is-done');
      }, 2000);
    });
  });

  /* ---------- Rok v päte ---------- */

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
