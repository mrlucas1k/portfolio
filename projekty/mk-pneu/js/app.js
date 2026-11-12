/* MK PNEU – otváracie hodiny, sezóna prezúvania, menu, formulár */
(function () {
  'use strict';

  /* ---------- Otváracie hodiny ----------
     Sezóna prezúvania (podľa pôvodného webu): 15.3.–1.5. a 15.10.–1.12.
       sezóna:      Po–Pi 8–18, So 8–12
       mimo sezóny: Po–Pi 8–16 (po 16h iba telefonické objednávky)
     Ak sa hodiny zmenia, stačí upraviť SEASONS a HOURS. */
  var SEASONS = [
    { name: 'letná', title: 'Letné prezúvanie', from: [3, 15], to: [5, 1] },
    { name: 'zimná', title: 'Zimné prezúvanie', from: [10, 15], to: [12, 1] }
  ];
  var HOURS = {
    season:  { 1: [8, 18], 2: [8, 18], 3: [8, 18], 4: [8, 18], 5: [8, 18], 6: [8, 12] },
    regular: { 1: [8, 16], 2: [8, 16], 3: [8, 16], 4: [8, 16], 5: [8, 16] }
  };
  // Štátne sviatky SR, kedy sa nepracuje (bez 1.9. a 17.11., ktoré od 2025 nie sú dňom pracovného pokoja).
  var HOLIDAYS = ['1-1', '1-6', '5-1', '5-8', '7-5', '8-29', '9-15', '11-1', '12-24', '12-25', '12-26'];
  var DAY_IN = ['v nedeľu', 'v pondelok', 'v utorok', 'v stredu', 'vo štvrtok', 'v piatok', 'v sobotu'];

  function bratislavaNow() {
    try {
      return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Bratislava' }));
    } catch (e) { return new Date(); }
  }
  function md(d) { return (d.getMonth() + 1) * 100 + d.getDate(); }
  function seasonOf(d) {
    var v = md(d);
    for (var i = 0; i < SEASONS.length; i++) {
      var s = SEASONS[i];
      if (v >= s.from[0] * 100 + s.from[1] && v <= s.to[0] * 100 + s.to[1]) return s;
    }
    return null;
  }
  function easterSunday(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
        f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7,
        m = Math.floor((a + 11 * h + 22 * l) / 451), month = Math.floor((h + l - 7 * m + 114) / 31),
        day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
  }
  function isHoliday(d) {
    if (HOLIDAYS.indexOf((d.getMonth() + 1) + '-' + d.getDate()) !== -1) return true;
    var e = easterSunday(d.getFullYear());
    var diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - e) / 864e5);
    return diff === -2 || diff === 1; // Veľký piatok, Veľkonočný pondelok
  }
  function hoursFor(d) {
    if (isHoliday(d)) return null;
    var table = seasonOf(d) ? HOURS.season : HOURS.regular;
    return table[d.getDay()] || null;
  }
  function fmt(h) { return h + ':00'; }
  function dateSk(m, d) { return d + '. ' + m + '.'; }

  function renderStatus() {
    var now = bratislavaNow();
    var mins = now.getHours() * 60 + now.getMinutes();
    var today = hoursFor(now);
    var season = seasonOf(now);
    var statusEl = document.getElementById('status');
    var textEl = document.getElementById('status-text');
    var hintEl = document.getElementById('status-hint');
    if (!statusEl) return;

    if (today && mins >= today[0] * 60 && mins < today[1] * 60) {
      statusEl.dataset.state = 'open';
      textEl.textContent = 'Teraz otvorené, do ' + fmt(today[1]);
      hintEl.textContent = 'Defekt? Zavolajte 0905 646 400 a povieme vám, kedy môžete prísť.';
    } else {
      statusEl.dataset.state = 'closed';
      var next = null;
      for (var i = 0; i < 14 && !next; i++) {
        var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        var h = hoursFor(d);
        if (h && (i > 0 || mins < h[0] * 60)) next = { offset: i, day: d, hours: h };
      }
      var when = !next ? '' :
        next.offset === 0 ? 'dnes o ' + fmt(next.hours[0]) :
        next.offset === 1 ? 'zajtra o ' + fmt(next.hours[0]) :
        DAY_IN[next.day.getDay()] + ' o ' + fmt(next.hours[0]);
      textEl.textContent = 'Zatvorené' + (when ? ', otvárame ' + when : '');
      hintEl.textContent = season
        ? 'Počas sezóny prezúvania vás objednáme aj mimo otváracích hodín. Zavolajte.'
        : 'Objednať sa môžete telefonicky alebo cez formulár nižšie.';
    }

    // tabuľka hodín pre aktuálny režim
    var table = season ? HOURS.season : HOURS.regular;
    var rows = [
      { label: 'Pondelok – piatok', h: table[1], days: [1, 2, 3, 4, 5] },
      { label: 'Sobota', h: table[6], days: [6] },
      { label: 'Nedeľa', h: table[0], days: [0] }
    ];
    var dl = document.getElementById('hours');
    dl.innerHTML = '';
    rows.forEach(function (r) {
      var wrap = document.createElement('div');
      if (r.days.indexOf(now.getDay()) !== -1) wrap.className = 'is-today';
      var dt = document.createElement('dt'); dt.textContent = r.label;
      var dd = document.createElement('dd');
      dd.textContent = isHoliday(now) && r.days.indexOf(now.getDay()) !== -1 ? 'sviatok, zatvorené'
        : r.h ? fmt(r.h[0]) + ' – ' + fmt(r.h[1]) : 'zatvorené';
      wrap.appendChild(dt); wrap.appendChild(dd); dl.appendChild(wrap);
    });

    // sezóna
    var titleEl = document.getElementById('season-title');
    var seasonText = document.getElementById('season-text');
    if (season) {
      titleEl.textContent = season.title + ' práve beží';
      seasonText.innerHTML = 'Do <strong>' + dateSk(season.to[0], season.to[1]) + '</strong> máme predĺžené hodiny a objednávame aj mimo nich.';
    } else {
      var y = now.getFullYear(), upcoming = null;
      for (var k = 0; k < 2 && !upcoming; k++) {
        SEASONS.forEach(function (s) {
          var start = new Date(y + k, s.from[0] - 1, s.from[1]);
          if (start > now && (!upcoming || start < upcoming.start)) upcoming = { s: s, start: start };
        });
      }
      var days = Math.round((upcoming.start - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
      titleEl.textContent = upcoming.s.title + ' od ' + dateSk(upcoming.s.from[0], upcoming.s.from[1]);
      seasonText.innerHTML = (days <= 1 ? 'Začína <strong>zajtra</strong>.' : 'Začína o <strong>' + days + ' ' + (days < 5 ? 'dni' : 'dní') + '</strong>.') +
        ' Objednajte sa vopred, v sezóne býva plno.';
    }
  }

  /* ---------- Menu a hlavička ---------- */
  function initHeader() {
    var header = document.querySelector('.top');
    var btn = document.querySelector('.top__menu');
    var nav = document.getElementById('nav');
    function setOpen(open) {
      btn.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    }
    btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Formulár ---------- */
  function initForm() {
    var form = document.getElementById('form');
    if (!form) return;
    var msg = document.getElementById('form-msg');
    var submit = document.getElementById('f-submit');
    var select = document.getElementById('f-sluzba');
    var date = document.getElementById('f-termin');

    var n = bratislavaNow();
    date.min = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');

    // „Objednať …“ odkazy predvyplnia službu
    document.querySelectorAll('[data-service]').forEach(function (a) {
      a.addEventListener('click', function () {
        var v = a.getAttribute('data-service');
        for (var i = 0; i < select.options.length; i++) {
          if (select.options[i].text === v) { select.selectedIndex = i; break; }
        }
      });
    });

    var rules = {
      'f-meno': function (v) { return v.trim().length >= 2; },
      'f-tel': function (v) { return /^[+0-9][0-9 ()\/-]{5,19}$/.test(v.trim()) && v.replace(/\D/g, '').length >= 9; },
      'f-email': function (v) { return v.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      'f-sluzba': function (v) { return v !== ''; }
    };
    function check(id) {
      var el = document.getElementById(id);
      var ok = rules[id](el.value);
      var err = document.getElementById(id + '-err');
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (ok) el.removeAttribute('aria-describedby'); else el.setAttribute('aria-describedby', id + '-err');
      err.hidden = ok;
      return ok;
    }
    Object.keys(rules).forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener('blur', function () { if (el.value !== '' || el.getAttribute('aria-invalid') === 'true') check(id); });
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') check(id); });
    });

    function show(type, html) {
      msg.dataset.type = type;
      msg.innerHTML = html;
      msg.hidden = false;
    }
    var FALLBACK = 'Zavolajte nám prosím na <a href="tel:+421905646400">0905 646 400</a> alebo <a href="tel:+421911149799">0911 149 799</a>.';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(rules).forEach(function (id) { if (!check(id) && !firstBad) firstBad = id; });
      if (firstBad) { document.getElementById(firstBad).focus(); return; }

      submit.disabled = true;
      submit.textContent = 'Odosielam…';
      msg.hidden = true;

      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) { var e = new Error(res.j && res.j.message); e.fromServer = true; throw e; }
          var name = document.getElementById('f-meno').value.trim().split(' ')[0];
          form.reset();
          show('ok', 'Objednávka odoslaná. Ďakujeme, ' + escapeHtml(name) + ', ozveme sa vám s termínom, zvyčajne telefonicky.');
        })
        .catch(function (err) {
          show('err', 'Objednávku sa nepodarilo odoslať' + (err && err.fromServer && err.message ? ' (' + escapeHtml(err.message) + ')' : '') + '. ' + FALLBACK);
        })
        .then(function () {
          submit.disabled = false;
          submit.textContent = 'Odoslať objednávku';
          msg.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
    });

    // návrat zo send.php bez JavaScriptu
    var q = location.search;
    if (/odoslane=1/.test(q)) show('ok', 'Objednávka odoslaná. Ozveme sa vám s termínom.');
    else if (/chyba=1/.test(q)) show('err', 'Objednávku sa nepodarilo odoslať. ' + FALLBACK);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; });
  }

  document.getElementById('year').textContent = String(bratislavaNow().getFullYear());
  renderStatus();
  setInterval(renderStatus, 60 * 1000);
  initHeader();
  initForm();
})();
