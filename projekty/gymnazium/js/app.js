(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var header = document.querySelector('.site-header');
  var nav = document.getElementById('nav');
  var toggle = document.querySelector('.menu-toggle');

  /* ---- Bezpečné localStorage (súkromné okno ho môže blokovať) ---- */
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem('bilgym:' + k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('bilgym:' + k, JSON.stringify(v)); } catch (e) { /* nič */ } }
  };

  /* ---- Hlavička: linka po scrollnutí ---- */
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobilné menu ---- */
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 1181px)').addEventListener('change', function (mq) {
    if (mq.matches) setMenu(false);
  });

  /* ---- Planéty v hero: pri obmedzenom pohybe zastaviť ---- */
  var orbits = document.querySelector('.orbits');
  function syncOrbits() {
    if (!orbits || !orbits.pauseAnimations) return;
    if (reduceMotion.matches) orbits.pauseAnimations(); else orbits.unpauseAnimations();
  }
  syncOrbits();
  reduceMotion.addEventListener('change', syncOrbits);

  /* ---- Dátumy ---- */
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var LANG = document.documentElement.lang === 'en' ? 'en' : 'sk';
  function parseDate(s) { return new Date(s + 'T00:00:00'); }
  function daysUntil(s) { return Math.round((parseDate(s) - today) / 86400000); }

  /* =========================================================
     Plánovač prihlásenia – texty v slovenčine a angličtine
     ========================================================= */
  var DOD_URL = 'https://bilgym.sk/dni-otvorenych-dveri-2026-27/';
  var EPRIHLASKY = '<a href="https://eprihlasky.iedu.sk" target="_blank" rel="noopener">eprihlasky.iedu.sk</a>';
  var MAIL = '<a href="mailto:tajomnik@bilgym.sk">tajomnik@bilgym.sk</a>';
  var DOD_TIMES = ['090000', '120000'];

  var T = {
    sk: {
      locale: 'sk-SK',
      months: ['jan', 'feb', 'mar', 'apr', 'máj', 'jún', 'júl', 'aug', 'sep', 'okt', 'nov', 'dec'],
      dayDot: '.',
      inDays: function (n) { return n === 0 ? 'dnes' : n === 1 ? 'zajtra' : 'o ' + n + (n < 5 ? ' dni' : ' dní'); },
      next: 'Najbližšie · ', past: 'prebehlo', tba: 'termín upresníme',
      admissionsUrl: 'https://bilgym.sk/o-skole/prijimacky/',
      nameLabel: 'Ako sa voláš? ', nameLabelParent: 'Ako sa volá vaše dieťa? ',
      title: function (n) { return n ? n + ', toto je tvoja cesta na Bilgym.' : 'Tvoja cesta na Bilgym.'; },
      titleParent: function (n) { return n ? 'Cesta na Bilgym · ' + n : 'Cesta na Bilgym pre vaše dieťa'; },
      roles: {
        zs8: { sub: 'Ôsmaci a deviataci majú pri prijímačkách rovnaké podmienky – nikto nie je zvýhodnený.',
               apply: 'Prihlášku podáva zákonný zástupca elektronicky cez ' + EPRIHLASKY + '. Bilgym uveďte na prvom mieste.', mail: 'Poslať plán rodičom' },
        zs9: { sub: 'Výsledky Testovania 9 sa pri prijímaní nezohľadňujú – rozhodujú prijímacie testy.',
               apply: 'Prihlášku podáva zákonný zástupca elektronicky cez ' + EPRIHLASKY + '. Bilgym uveďte na prvom mieste.', mail: 'Poslať plán rodičom' },
        gym8: { sub: 'Z 8-ročného gymnázia sa hlásiš inak ako žiaci ZŠ – nie cez elektronický systém, ale e-mailom.',
                apply: 'Vyplnenú prihlášku a podpisy zákonných zástupcov naskenuj a pošli na ' + MAIL + '. Bilgym uveď na prvom mieste.', mail: 'Poslať plán rodičom' },
        rodic: { sub: 'Školné 2026/27 je 3 870 € ročne (zápisné 700 €). Ak by financie bránili v štúdiu, pozrite si <a href="https://bilgym.sk/pre-studentov/stipendia/" target="_blank" rel="noopener">štipendiá</a>.',
                 apply: 'Prihlášku podávate ako zákonný zástupca elektronicky cez ' + EPRIHLASKY + '. Bilgym uveďte na prvom mieste.', mail: 'Poslať si plán' }
      },
      steps: function (apply) {
        return [
          { date: '2026-10-18', title: 'Uzávierka prihlasovania na deň otvorených dverí', text: 'Na októbrový deň otvorených dverí sa treba prihlásiť vopred.', link: { href: DOD_URL, label: 'Prihlásiť sa na DOD' } },
          { date: '2026-10-22', time: DOD_TIMES, title: 'Deň otvorených dverí', text: '9:00 – 12:00 · Haanova 28, Petržalka' },
          { date: '2026-12-02', time: DOD_TIMES, title: 'Deň otvorených dverí Narnia+', text: '9:00 – 12:00 · prihlasovanie sa spúšťa niekoľko týždňov vopred' },
          { date: '2027-02-12', time: DOD_TIMES, title: 'Posledný deň otvorených dverí', text: '9:00 – 12:00 · posledná šanca pozrieť sa pred prihláškou' },
          { date: '2027-02-20', title: 'Podanie prihlášky', text: apply },
          { approx: 'koniec marca', title: 'Prijímacie skúšky', text: 'Domáca esej a písomné testy z angličtiny (A2), slovenčiny, matematiky a všeobecných študijných predpokladov. Presný termín škola ešte nezverejnila.' },
          { approx: 'polovica apríla', title: 'Výsledky', text: 'Zverejňujú sa na webe školy. Do prvého ročníka otvárame 6 tried po 17 študentov.' }
        ];
      },
      checks: [
        { id: 'profil', text: 'Prečítať si <a href="https://bilgym.sk/o-skole/prijimacky/" target="_blank" rel="noopener">profil absolventa a adepta Bilgymu</a>' },
        { id: 'dod', text: 'Prísť na deň otvorených dverí' },
        { id: 'aj', text: 'Precvičiť angličtinu na úrovni A2' },
        { id: 'sjm', text: 'Zopakovať slovenčinu a matematiku (kalkulačka len neprogramovateľná, bez zlomkov)' },
        { id: 'diplomy', text: 'Pripraviť diplomy zo súťaží a olympiád – sú za ne body navyše' },
        { id: 'prihlaska', text: 'Podať prihlášku s Bilgymom na prvom mieste' }
      ],
      mailSubject: 'Plán prihlásenia na Bilgym',
      mailIntro: 'Ahoj, toto je môj plán prihlásenia na Bilingválne gymnázium C. S. Lewisa:',
      mailIntroNeutral: 'Plán prihlásenia na Bilingválne gymnázium C. S. Lewisa:',
      more: 'Viac: ',
      icsFile: 'bilgym-prijimacky.ics',
      dodPast: 'Prebehlo', dodClosed: 'Registrácia uzavretá',
      icsDone: 'Stiahol sa súbor bilgym-prijimacky.ics. Otvor ho a termíny sa pridajú do kalendára.',
      icsEmpty: 'Všetky termíny tohto ročníka už prebehli. Nové zverejní škola na jeseň.',
      copied: 'Plán je skopírovaný. Vlož ho do správy rodičom.',
      resetDone: 'Údaje sú vymazané.'
    },
    en: {
      locale: 'en-GB',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      dayDot: '',
      inDays: function (n) { return n === 0 ? 'today' : n === 1 ? 'tomorrow' : 'in ' + n + ' days'; },
      next: 'Next · ', past: 'done', tba: 'date TBA',
      admissionsUrl: 'https://bilgym.sk/en/about-school/admissions/',
      nameLabel: 'What\'s your name? ', nameLabelParent: 'What\'s your child\'s name? ',
      title: function (n) { return n ? n + ', this is your path to Bilgym.' : 'Your path to Bilgym.'; },
      titleParent: function (n) { return n ? 'Path to Bilgym · ' + n : 'Your child\'s path to Bilgym'; },
      roles: {
        zs8: { sub: '8th and 9th graders apply on exactly the same terms – neither group has an advantage.',
               apply: 'A parent or legal guardian applies online at ' + EPRIHLASKY + '. List Bilgym as your first choice.', mail: 'Send the plan to my parents' },
        zs9: { sub: 'Testovanie 9 (national test) results don\'t count – the entrance tests decide.',
               apply: 'A parent or legal guardian applies online at ' + EPRIHLASKY + '. List Bilgym as your first choice.', mail: 'Send the plan to my parents' },
        gym8: { sub: 'Coming from an 8-year gymnázium, you apply by e-mail rather than through the online system.',
                apply: 'Scan the completed application form and your guardians\' signatures and e-mail them to ' + MAIL + '. List Bilgym as your first choice.', mail: 'Send the plan to my parents' },
        rodic: { sub: 'Tuition for 2026/27 is €3,870 a year (enrolment fee €700). If cost is a barrier, see our <a href="https://bilgym.sk/en/students/scholarship/" target="_blank" rel="noopener">scholarships</a>.',
                 apply: 'As the legal guardian, you apply online at ' + EPRIHLASKY + '. List Bilgym as the first choice.', mail: 'Send the plan to yourself' }
      },
      steps: function (apply) {
        return [
          { date: '2026-10-18', title: 'Open Day registration closes', text: 'You need to register in advance for the October Open Day.', link: { href: DOD_URL, label: 'Register (form in Slovak)' } },
          { date: '2026-10-22', time: DOD_TIMES, title: 'Open Day', text: '9:00 – 12:00 · Haanova 28, Petržalka' },
          { date: '2026-12-02', time: DOD_TIMES, title: 'Open Day Narnia+', text: '9:00 – 12:00 · registration opens a few weeks ahead' },
          { date: '2027-02-12', time: DOD_TIMES, title: 'Last Open Day', text: '9:00 – 12:00 · last chance to visit before applying' },
          { date: '2027-02-20', title: 'Application deadline', text: apply },
          { approx: 'late March', title: 'Entrance exams', text: 'Home essay and written tests in English (A2), Slovak, maths and general study aptitude. The school hasn\'t published the exact date yet.' },
          { approx: 'mid-April', title: 'Results', text: 'Published on the school website. We open 6 first-year classes of 17 students.' }
        ];
      },
      checks: [
        { id: 'profil', text: 'Read the <a href="https://bilgym.sk/en/about-school/admissions/" target="_blank" rel="noopener">graduate and applicant profile</a>' },
        { id: 'dod', text: 'Come to an Open Day' },
        { id: 'aj', text: 'Practise English at A2 level' },
        { id: 'sjm', text: 'Revise Slovak and maths (non-programmable calculator only, no fractions)' },
        { id: 'diplomy', text: 'Gather competition and olympiad certificates – they earn extra points' },
        { id: 'prihlaska', text: 'Submit the application with Bilgym as first choice' }
      ],
      mailSubject: 'My Bilgym application plan',
      mailIntro: 'Hi, here\'s my plan for applying to C. S. Lewis Bilingual High School:',
      mailIntroNeutral: 'Application plan for C. S. Lewis Bilingual High School:',
      more: 'More: ',
      icsFile: 'bilgym-admissions.ics',
      dodPast: 'Done', dodClosed: 'Registration closed',
      icsDone: 'bilgym-admissions.ics has downloaded. Open it to add the dates to your calendar.',
      icsEmpty: 'All dates for this year have passed. The school publishes new ones in the autumn.',
      copied: 'Plan copied. Paste it into a message to your parents.',
      resetDone: 'Your data has been cleared.'
    }
  }[LANG];

  var ROLES = T.roles;
  var CHECKS = T.checks;
  var ADMISSIONS_URL = T.admissionsUrl;
  function buildSteps(role) { return T.steps(ROLES[role].apply); }

  /* ---- Pás dní otvorených dverí: najbližší termín, prebehnuté a uzavreté ---- */
  var nextMarked = false;
  document.querySelectorAll('[data-dod] li').forEach(function (li) {
    var action = li.querySelector('.btn, .tag');
    function swapTag(text) {
      var tag = document.createElement('span');
      tag.className = 'tag is-closed';
      tag.textContent = text;
      if (action) action.replaceWith(tag);
    }
    if (daysUntil(li.getAttribute('data-date')) < 0) { li.classList.add('is-past'); swapTag(T.dodPast); return; }
    var reg = li.getAttribute('data-reg');
    if (reg && daysUntil(reg) < 0) swapTag(T.dodClosed);
    if (!nextMarked) { li.classList.add('is-next'); nextMarked = true; }
  });

  var planner = document.querySelector('[data-planner]');
  if (planner) {
    var nameInput = planner.querySelector('#pl-name');
    var nameLabel = planner.querySelector('[data-name-label]');
    var titleEl = planner.querySelector('[data-plan-title]');
    var subEl = planner.querySelector('[data-plan-sub]');
    var stepsEl = planner.querySelector('[data-plan-steps]');
    var checklistEl = planner.querySelector('[data-checklist]');
    var countEl = planner.querySelector('[data-check-count]');
    var barEl = planner.querySelector('[data-check-bar]');
    var shareBtn = planner.querySelector('[data-share]');
    var shareLabel = planner.querySelector('[data-share-label]');
    var statusEl = planner.querySelector('[data-status]');
    var resetBtn = planner.querySelector('[data-reset]');
    var icsBtn = planner.querySelector('[data-ics]');
    var ball = planner.querySelector('.ball');
    var ballShadow = planner.querySelector('.ball-shadow');
    var miniBall = planner.querySelector('.mini-ball');
    var ballNames = planner.querySelectorAll('[data-ball-name]');

    var statusTimer;
    function say(msg) {
      clearTimeout(statusTimer);
      statusEl.textContent = msg;
      statusTimer = setTimeout(function () { statusEl.textContent = ''; }, 6000);
    }

    // meno, rola a checklist sú zdieľané medzi SK a EN verziou
    var state = {
      name: (store.get('name') || '').toString().slice(0, 20),
      role: ROLES[store.get('role')] ? store.get('role') : 'zs9',
      checks: store.get('checks') || {}
    };
    nameInput.value = state.name;
    var roleInput = planner.querySelector('input[name="role"][value="' + state.role + '"]');
    if (roleInput) roleInput.checked = true;

    function renderTitle() {
      var n = state.name.trim();
      var parent = state.role === 'rodic';
      nameLabel.firstChild.nodeValue = parent ? T.nameLabelParent : T.nameLabel;
      titleEl.textContent = parent ? T.titleParent(n) : T.title(n);
      // dlhšie mená sa zmenšia, aby sa zmestili na loptičku
      var len = (n || 'Bilgym').length;
      ballNames.forEach(function (el) {
        el.textContent = n || 'Bilgym';
        el.style.setProperty('--fs', (len <= 6 ? 1.45 : len <= 9 ? 1.2 : len <= 12 ? 1 : .82) + 'rem');
      });
      subEl.innerHTML = ROLES[state.role].sub;
      shareLabel.textContent = ROLES[state.role].mail;
    }

    function futureEvents() {
      return buildSteps(state.role).filter(function (s) { return s.date && daysUntil(s.date) >= 0; });
    }

    function renderSteps() {
      var steps = buildSteps(state.role);
      var nextIndex = -1;
      steps.forEach(function (s, i) { if (nextIndex < 0 && s.date && daysUntil(s.date) >= 0) nextIndex = i; });
      stepsEl.innerHTML = steps.map(function (s, i) {
        var cls = 'plan-step', date, chip;
        if (s.date) {
          var d = parseDate(s.date), n = daysUntil(s.date);
          date = '<span class="d">' + d.getDate() + T.dayDot + '</span><span class="m">' + T.months[d.getMonth()] + ' ' + d.getFullYear() + '</span>';
          if (n < 0) { cls += ' is-past'; chip = T.past; }
          else { chip = (i === nextIndex ? T.next : '') + T.inDays(n); if (i === nextIndex) cls += ' is-next'; }
        } else {
          date = '<span class="approx">' + s.approx + '</span>';
          chip = T.tba;
        }
        return '<li class="' + cls + '"><div class="plan-date">' + date + '</div><div><h4>' + s.title +
          ' <span class="chip">' + chip + '</span></h4><p>' + s.text +
          (s.link ? ' <a href="' + s.link.href + '" target="_blank" rel="noopener">' + s.link.label + '</a>' : '') + '</p></div></li>';
      }).join('');
    }

    function renderChecklist() {
      checklistEl.innerHTML = CHECKS.map(function (c) {
        return '<li><label><input type="checkbox" data-check="' + c.id + '"' + (state.checks[c.id] ? ' checked' : '') + '>' +
          '<span class="box" aria-hidden="true"><svg><use href="#check"/></svg></span><span class="txt">' + c.text + '</span></label></li>';
      }).join('');
      updateProgress();
    }

    function updateProgress() {
      var done = CHECKS.filter(function (c) { return state.checks[c.id]; }).length;
      countEl.textContent = done + ' / ' + CHECKS.length;
      barEl.style.transform = 'scaleX(' + done / CHECKS.length + ')';
      return done;
    }

    function plainSteps() {
      return buildSteps(state.role).map(function (s) {
        var when = s.date ? parseDate(s.date).toLocaleDateString(T.locale) : s.approx + ' 2027';
        return '• ' + when + ' – ' + s.title + ': ' + s.text.replace(/<[^>]+>/g, '');
      });
    }

    function planMessage() {
      var n = state.name.trim();
      return {
        subject: T.mailSubject + (n ? ' – ' + n : ''),
        body: (n && state.role !== 'rodic' ? T.mailIntro : T.mailIntroNeutral) +
          '\n\n' + plainSteps().join('\n') + '\n\n' + T.more + ADMISSIONS_URL
      };
    }

    /* Poslať plán: zdieľanie v telefóne → kopírovanie → e-mail ako posledná možnosť */
    function openMail(msg) {
      window.location.href = 'mailto:?subject=' + encodeURIComponent(msg.subject) + '&body=' + encodeURIComponent(msg.body);
    }
    shareBtn.addEventListener('click', function () {
      var msg = planMessage();
      if (navigator.share) {
        navigator.share({ title: msg.subject, text: msg.body }).catch(function (err) {
          if (err && err.name !== 'AbortError') openMail(msg);
        });
      } else if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(msg.subject + '\n\n' + msg.body)
          .then(function () { say(T.copied); }, function () { openMail(msg); });
      } else {
        openMail(msg);
      }
    });

    resetBtn.addEventListener('click', function () {
      ['name', 'role', 'checks'].forEach(function (k) { try { localStorage.removeItem('bilgym:' + k); } catch (e) { /* nič */ } });
      state = { name: '', role: 'zs9', checks: {} };
      nameInput.value = '';
      lastBounced = '';
      planner.querySelector('input[name="role"][value="zs9"]').checked = true;
      renderTitle(); renderSteps(); renderChecklist();
      say(T.resetDone);
    });

    /* Loptička doskáče na miesto – raz po dopísaní mena (gravitácia: pád ease-in, odraz ease-out) */
    var ballAnim, shadowAnim;
    var FALL = 'cubic-bezier(0.11, 0, 0.5, 0)';   // easeInQuad
    var RISE = 'cubic-bezier(0.5, 1, 0.89, 1)';   // easeOutQuad
    function bounceBall() {
      if (ballAnim) ballAnim.cancel();
      if (shadowAnim) shadowAnim.cancel();
      if (!ball.animate) return;
      // na mobile je viditeľná malá loptička pri poli na meno
      var mini = miniBall && getComputedStyle(miniBall).display !== 'none';
      var target = mini ? miniBall : ball;
      var k = mini ? .3 : 1;   // menšia výška skoku pre malú loptičku
      if (reduceMotion.matches) {
        ballAnim = target.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease' });
        return;
      }
      ballAnim = target.animate([
        { transform: 'translateY(' + (-180 * k) + 'px) rotate(-70deg)', opacity: 0, easing: FALL },
        { transform: 'translateY(' + (-150 * k) + 'px) rotate(-62deg)', opacity: 1, offset: .08, easing: FALL },
        { transform: 'translateY(0) rotate(-18deg)', offset: .42, easing: RISE },
        { transform: 'translateY(' + (-54 * k) + 'px) rotate(-8deg)', offset: .62, easing: FALL },
        { transform: 'translateY(0) rotate(-2deg)', offset: .80, easing: RISE },
        { transform: 'translateY(' + (-14 * k) + 'px) rotate(0deg)', offset: .90, easing: FALL },
        { transform: 'translateY(0) rotate(0deg)' }
      ], { duration: mini ? 900 : 1100 });
      if (mini) return;
      shadowAnim = ballShadow.animate([
        { transform: 'scale(.3)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: .42 },
        { transform: 'scale(.6)', opacity: .6, offset: .62 },
        { transform: 'scale(1)', opacity: 1, offset: .80 },
        { transform: 'scale(.9)', opacity: .9, offset: .90 },
        { transform: 'scale(1)', opacity: 1 }
      ], { duration: 1100 });
    }

    var nameTimer, lastBounced = state.name.trim();
    nameInput.addEventListener('input', function () {
      state.name = nameInput.value.replace(/\s+/g, ' ').slice(0, 20);
      store.set('name', state.name.trim());
      renderTitle();
      clearTimeout(nameTimer);
      // odskok až keď človek dopíše, nie pri každom písmene
      nameTimer = setTimeout(function () {
        var n = state.name.trim();
        if (n && n !== lastBounced) { lastBounced = n; bounceBall(); }
      }, 650);
    });
    nameInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') nameInput.blur(); });

    planner.querySelectorAll('input[name="role"]').forEach(function (r) {
      r.addEventListener('change', function () {
        state.role = r.value;
        store.set('role', state.role);
        renderTitle();
        // krátke prelínanie, aby výmena obsahu nebola skoková
        stepsEl.classList.add('is-swapping');
        setTimeout(function () { renderSteps(); stepsEl.classList.remove('is-swapping'); }, reduceMotion.matches ? 0 : 160);
      });
    });

    checklistEl.addEventListener('change', function (e) {
      var id = e.target.getAttribute('data-check');
      if (!id) return;
      state.checks[id] = e.target.checked;
      store.set('checks', state.checks);
      var wasDone = countEl.textContent.indexOf(CHECKS.length + ' /') === 0;
      if (updateProgress() === CHECKS.length && !wasDone) bounceBall();
    });

    /* Export termínov do kalendára (.ics) – len budúce udalosti s presným dátumom */
    function icsDate(s) { return s.replace(/-/g, ''); }
    function icsText(s) { return s.replace(/<[^>]+>/g, '').replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n'); }
    icsBtn.addEventListener('click', function () {
      if (!futureEvents().length) { say(T.icsEmpty); return; }
      var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
      var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bilgym//Plan prihlasenia//SK', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
      buildSteps(state.role).forEach(function (s, i) {
        if (!s.date || daysUntil(s.date) < 0) return;
        var d = icsDate(s.date);
        lines.push('BEGIN:VEVENT', 'UID:bilgym-' + d + '-' + i + '@bilgym.sk', 'DTSTAMP:' + stamp);
        if (s.time) {
          lines.push('DTSTART:' + d + 'T' + s.time[0], 'DTEND:' + d + 'T' + s.time[1], 'LOCATION:' + icsText('Haanova 28, 851 04 Bratislava'));
        } else {
          var next = parseDate(s.date); next.setDate(next.getDate() + 1);
          var nd = next.getFullYear() + String(next.getMonth() + 1).padStart(2, '0') + String(next.getDate()).padStart(2, '0');
          lines.push('DTSTART;VALUE=DATE:' + d, 'DTEND;VALUE=DATE:' + nd);
        }
        lines.push('SUMMARY:' + icsText('Bilgym: ' + s.title), 'DESCRIPTION:' + icsText(s.text), 'URL:' + ADMISSIONS_URL, 'END:VEVENT');
      });
      lines.push('END:VCALENDAR');
      var blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = T.icsFile;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      say(T.icsDone);
    });

    renderTitle();
    renderSteps();
    renderChecklist();

    // prvý príchod k plánovaču: loptička doskáče raz
    if ('IntersectionObserver' in window) {
      var seen = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { bounceBall(); seen.disconnect(); }
      }, { threshold: .35 });
      seen.observe(planner.querySelector('.plan'));
    }
  }

  /* ---- Cesta piatimi ročníkmi: čiara sa kreslí podľa scrollu ---- */
  var journey = document.querySelector('.journey');
  if (journey) {
    var years = Array.prototype.slice.call(journey.querySelectorAll('.year'));
    var ticking = false;
    function updateJourney() {
      ticking = false;
      var vh = window.innerHeight;
      var r = journey.getBoundingClientRect();
      var p = reduceMotion.matches ? 1 : Math.min(1, Math.max(0, (vh * 0.82 - r.top) / (r.height + vh * 0.3)));
      journey.style.setProperty('--p', p.toFixed(3));
      years.forEach(function (y, i) { y.classList.toggle('is-lit', p >= i / (years.length - 1) - 0.001); });
    }
    // jedno meranie na snímku – lacné, netreba ďalší observer
    function requestJourney() { if (!ticking) { ticking = true; requestAnimationFrame(updateJourney); } }
    window.addEventListener('scroll', requestJourney, { passive: true });
    window.addEventListener('resize', requestJourney);
    updateJourney();
  }

  /* ---- Zvýraznenie aktívnej sekcie v navigácii ---- */
  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]:not(.btn)'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---- Slovenská typografia: jednopísmenové predložky a spojky neostanú na konci riadku ---- */
  if (LANG === 'sk' && document.createTreeWalker) {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) { return /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    });
    var node;
    while ((node = walker.nextNode())) {
      if (/(^|\s)[aikosuvzAIKOSUVZ]\s/.test(node.nodeValue)) {
        node.nodeValue = node.nodeValue.replace(/(^|\s)([aikosuvzAIKOSUVZ])\s+/g, '$1$2 ');
      }
    }
  }
})();
