(() => {
  'use strict';

  /* ---------- Dáta (cenník platný od 1. 5. 2022) ---------- */
  // Trvania sú odhady pre ukážku rezervácie – treba potvrdiť s Erikou.
  const LENGTHS = ['Krátke', 'Stredné', 'Dlhé'];
  const SERVICES = {
    damy: [
      { id: 'damy-strih', name: 'Strih', prices: [9, 12, 14], dur: [45, 60, 60] },
      { id: 'damy-fukana', name: 'Fúkaná', prices: [8, 10, 12], dur: [30, 45, 45] },
      { id: 'damy-vodova', name: 'Vodová ondulácia', prices: [8, 10, 12], dur: [45, 45, 60] },
      { id: 'damy-trvala', name: 'Trvalá ondulácia', prices: [18, 22, 24], dur: [120, 120, 150] },
      { id: 'damy-farbenie', name: 'Farbenie', prices: [18, 22, 24], dur: [90, 120, 120] },
      { id: 'damy-vlastna', name: 'Farbenie vlastnou farbou', prices: [10, 12, 14], dur: [60, 90, 90] },
      { id: 'damy-melir', name: 'Melír', prices: [24, 26, 30], dur: [120, 120, 150] },
      { id: 'damy-odfarbovanie', name: 'Odfarbovanie', prices: [null, 40, 50], dur: [null, 150, 180] },
      { id: 'damy-zehlenie', name: 'Žehlenie vlasov komplet', price: 15, dur: 60 }
    ],
    pani: [
      { id: 'pani-zakladny', name: 'Pánsky strih – základný', price: 8, dur: 30 },
      { id: 'pani-zlozity', name: 'Pánsky strih – zložitý', price: 12, dur: 45 },
      { id: 'pani-brada', name: 'Strih brady a fúzov', price: 3, dur: 15 }
    ],
    deti: [
      { id: 'deti-strih', name: 'Strih detí do 5 rokov', price: 6, dur: 30 }
    ]
  };
  const EXTRAS = [
    ['Sušenie vlasov – krátke', 1.5], ['Sušenie vlasov – stredné a dlhé', 2.5],
    ['Umývanie vlasov', 1.5], ['Balzam na vlasy', 1.5], ['Regeneračný zábal', 2],
    ['Gél na vlasy', 1], ['Tužidlo na vlasy', 1], ['Lak na vlasy', 1]
  ];

  const OPEN_MIN = 14 * 60, CLOSE_MIN = 18 * 60, SLOT = 30;
  const SLOT_COUNT = (CLOSE_MIN - OPEN_MIN) / SLOT;
  const DAYS_AHEAD = 15; // pracovné dni
  const STORE_KEY = 'erika-demo-bookings';
  const DOW_SHORT = ['Ne', 'Po', 'Ut', 'St', 'Št', 'Pi', 'So'];
  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'máj', 'jún', 'júl', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const DOW_LONG =['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const euro = (p) => (Number.isInteger(p) ? p : p.toFixed(2).replace('.', ',')) + ' €';
  const hhmm = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
  const durText = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`);
  const findService = (id) => Object.values(SERVICES).flat().find((s) => s.id === id);
  const groupOf = (id) => Object.keys(SERVICES).find((g) => SERVICES[g].some((s) => s.id === id));

  // Aktuálny čas v Bratislave (nezávisle od časového pásma návštevníka)
  const nowBA = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Bratislava' }));
  const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const isWorkday = (d) => d.getDay() >= 1 && d.getDay() <= 5;

  /* ---------- Hlavička, menu, mobilná lišta ---------- */
  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toggle = $('.menu-toggle');
  const nav = $('.nav');
  const setMenu = (open) => { nav.classList.toggle('is-open', open); toggle.setAttribute('aria-expanded', String(open)); };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('.nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Logo vráti na úvod (sticky hlavička sa nedá použiť ako cieľ kotvy)
  $$('.js-top').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    setMenu(false);
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    history.replaceState(null, '', location.pathname + location.search);
  }));

  // Galéria – zväčšenie fotky
  const lightbox = $('#lightbox');
  if (lightbox && lightbox.showModal) {
    const lbImg = $('img', lightbox);
    $$('.g-item').forEach((b) => b.addEventListener('click', () => {
      lbImg.src = b.dataset.full;
      lbImg.alt = $('img', b).alt;
      lightbox.showModal();
    }));
    $('.lb-close', lightbox).addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.close(); });
  }

  const mobileBar = $('.mobile-bar');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => mobileBar.classList.toggle('is-hidden', entry.isIntersecting), { threshold: 0.05 })
      .observe($('#rezervacia'));
  }

  /* ---------- Otvorené / zatvorené + hodiny ---------- */
  (function openStatus() {
    const now = nowBA();
    const day = now.getDay();
    const min = now.getHours() * 60 + now.getMinutes();
    const el = $('#open-status');
    const text = $('.status-text', el);
    let open = false, msg;
    if (isWorkday(now) && min < OPEN_MIN) msg = 'Zatvorené · dnes otvárame o 14:00';
    else if (isWorkday(now) && min < CLOSE_MIN) { open = true; msg = 'Práve otvorené · do 18:00'; }
    else msg = `Zatvorené · otvárame ${day >= 1 && day <= 4 ? 'zajtra' : 'v pondelok'} o 14:00`;
    el.classList.toggle('is-open', open);
    text.textContent = msg;

    const body = $('#hours-body');
    [1, 2, 3, 4, 5, 6, 0].forEach((d) => {
      const tr = document.createElement('tr');
      const closed = d === 0 || d === 6;
      if (closed) tr.className = 'closed';
      if (d === day) tr.classList.add('today');
      tr.innerHTML = `<td>${DOW_LONG[d]}</td><td>${closed ? 'Zatvorené' : '14:00 – 18:00'}</td>`;
      body.appendChild(tr);
    });
  })();

  /* ---------- Cenník ---------- */
  (function priceList() {
    $('#price-damy').innerHTML = SERVICES.damy.map((s) => s.prices
      ? `<tr><td>${s.name}</td>${s.prices.map((p) => (p == null ? '<td class="na">—</td>' : `<td>${euro(p)}</td>`)).join('')}</tr>`
      : `<tr><td>${s.name}</td><td colspan="3">${euro(s.price)}</td></tr>`).join('');
    $('#price-pani').innerHTML = [...SERVICES.pani, ...SERVICES.deti]
      .map((s) => `<tr><td>${s.name}</td><td>${euro(s.price)}</td></tr>`).join('');
    $('#price-ine').innerHTML = EXTRAS.map(([n, p]) => `<tr><td>${n}</td><td>${euro(p)}</td></tr>`).join('');

    const tabs = $$('.price-tabs [role="tab"]');
    const select = (tab) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        $('#' + t.getAttribute('aria-controls')).hidden = !on;
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        select(next); next.focus();
      });
    });
  })();

  /* ---------- Rezervácia (ukážka) ---------- */
  const state = { group: 'damy', serviceId: null, length: null, date: null, slot: null };

  const loadBookings = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; } };
  const saveBooking = (b) => { try { localStorage.setItem(STORE_KEY, JSON.stringify([...loadBookings(), b])); } catch { /* bez úložiska */ } };

  // Deterministicky "obsadené" sloty, aby ukážka pôsobila realisticky
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

  function busySlots(key, dayIndex) {
    const r = rng(hash(key));
    const p = dayIndex < 2 ? 0.4 : 0.2;
    const busy = Array.from({ length: SLOT_COUNT }, () => r() < p);
    loadBookings().filter((b) => b.date === key).forEach((b) => { for (let i = b.slot; i < b.slot + b.n; i++) busy[i] = true; });
    return busy;
  }

  const current = () => {
    const s = findService(state.serviceId);
    if (!s) return null;
    const dur = s.prices ? s.dur[state.length] : s.dur;
    const price = s.prices ? s.prices[state.length] : s.price;
    return { s, dur, price, n: Math.ceil(dur / SLOT), label: s.prices ? `${s.name} · ${LENGTHS[state.length].toLowerCase()} vlasy` : s.name };
  };

  function freeStarts(key, dayIndex, n, isToday) {
    const busy = busySlots(key, dayIndex);
    const now = nowBA();
    const cutoff = isToday ? now.getHours() * 60 + now.getMinutes() + 60 : -1;
    return busy.map((_, i) => {
      if (i + n > SLOT_COUNT) return false;
      if (OPEN_MIN + i * SLOT < cutoff) return false;
      for (let j = i; j < i + n; j++) if (busy[j]) return false;
      return true;
    });
  }

  function upcomingDays() {
    const days = [];
    const d = nowBA();
    d.setHours(12, 0, 0, 0);
    const todayKey = dateKey(d);
    while (days.length < DAYS_AHEAD) {
      if (isWorkday(d)) days.push({ date: new Date(d), key: dateKey(d), isToday: dateKey(d) === todayKey });
      d.setDate(d.getDate() + 1);
    }
    return days;
  }

  const els = {
    form: $('#booking-form'),
    services: $('#service-options'),
    lengthWrap: $('#length-wrap'),
    lengths: $('#length-options'),
    dates: $('#date-options'),
    times: $('#time-options'),
    timeEmpty: $('#time-empty'),
    stepDate: $('#step-date'), stepTime: $('#step-time'), stepContact: $('#step-contact'), stepService: $('#step-service'),
    confirm: $('#confirm'), hint: $('#summary-hint'),
    summary: $('#summary'), success: $('#success')
  };

  function renderServices() {
    $$('.seg-btn[data-group]').forEach((b) => {
      const on = b.dataset.group === state.group;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    els.services.innerHTML = SERVICES[state.group].map((s) => {
      const p = s.prices ? `od ${euro(Math.min(...s.prices.filter((x) => x != null)))}` : euro(s.price);
      return `<div class="opt"><input type="radio" name="service" id="sv-${s.id}" value="${s.id}" ${s.id === state.serviceId ? 'checked' : ''}>
        <label for="sv-${s.id}"><span>${s.name}</span><span class="price">${p}</span></label></div>`;
    }).join('');
    renderLengths();
  }

  function renderLengths() {
    const s = findService(state.serviceId);
    els.lengthWrap.hidden = !(s && s.prices);
    if (!s || !s.prices) return;
    els.lengths.innerHTML = s.prices.map((p, i) => p == null ? '' :
      `<button type="button" class="seg-btn ${state.length === i ? 'is-active' : ''}" data-length="${i}" aria-pressed="${state.length === i}">${LENGTHS[i]} · ${euro(p)}</button>`).join('');
  }

  function renderDates() {
    const c = current();
    els.stepDate.disabled = !c;
    if (!c) { els.dates.innerHTML = ''; return; }
    const days = upcomingDays();
    els.dates.innerHTML = days.map((d, idx) => {
      const free = freeStarts(d.key, idx, c.n, d.isToday).some(Boolean);
      if (!free && state.date === d.key) { state.date = null; state.slot = null; }
      const label = d.isToday ? 'Dnes' : DOW_SHORT[d.date.getDay()];
      return `<button type="button" class="date-btn ${state.date === d.key ? 'is-active' : ''}" data-date="${d.key}" data-idx="${idx}" ${free ? '' : 'disabled'}
        role="radio" aria-checked="${state.date === d.key}" aria-label="${DOW_LONG[d.date.getDay()]} ${d.date.getDate()}. ${d.date.getMonth() + 1}.${free ? '' : ' – obsadené'}">
        <span class="dw">${label}</span><span class="dd">${d.date.getDate()}</span>
        <span class="${free ? 'dm' : 'full'}">${free ? MONTHS[d.date.getMonth()] : 'plno'}</span></button>`;
    }).join('');
  }

  function renderTimes() {
    const c = current();
    els.stepTime.disabled = !(c && state.date);
    els.timeEmpty.hidden = true;
    if (!c || !state.date) { els.times.innerHTML = ''; return; }
    const days = upcomingDays();
    const idx = days.findIndex((d) => d.key === state.date);
    const starts = freeStarts(state.date, idx, c.n, days[idx].isToday);
    if (state.slot != null && !starts[state.slot]) state.slot = null;
    els.times.innerHTML = starts.map((ok, i) => i + c.n > SLOT_COUNT ? '' :
      `<button type="button" class="time-btn ${state.slot === i ? 'is-active' : ''}" data-slot="${i}" ${ok ? '' : 'disabled'}
        role="radio" aria-checked="${state.slot === i}" aria-label="${hhmm(OPEN_MIN + i * SLOT)}${ok ? '' : ' – obsadené'}">${hhmm(OPEN_MIN + i * SLOT)}</button>`).join('');
  }

  function whenText(key, slot) {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return `${DOW_SHORT[date.getDay()]} ${d}. ${m}. o ${hhmm(OPEN_MIN + slot * SLOT)}`;
  }

  function renderSummary() {
    const c = current();
    $('#s-service').textContent = c ? c.label : '—';
    $('#s-dur').textContent = c ? `cca ${durText(c.dur)}` : '—';
    $('#s-price').textContent = c ? euro(c.price) : '—';
    $('#s-when').textContent = state.date && state.slot != null ? whenText(state.date, state.slot) : '—';

    const ready = c && state.date && state.slot != null;
    els.stepContact.disabled = !ready;
    els.confirm.disabled = !ready;
    els.hint.textContent = !c ? 'Vyberte službu.' : !state.date ? 'Vyberte deň.' : state.slot == null ? 'Vyberte čas.' : 'Vyplňte meno a telefón a potvrďte.';

    els.stepService.classList.toggle('is-done', !!c);
    els.stepDate.classList.toggle('is-done', !!(c && state.date));
    els.stepTime.classList.toggle('is-done', !!ready);
  }

  const renderAll = () => { renderDates(); renderTimes(); renderSummary(); };

  const revealNext = (el) => {
    if (window.matchMedia('(max-width: 1024px)').matches) {
      requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    }
  };

  function selectService(id) {
    const s = findService(id);
    state.serviceId = id;
    state.length = s.prices ? s.prices.findIndex((p) => p != null) : null;
    renderLengths();
    renderAll();
  }

  // Udalosti
  $$('.seg-btn[data-group]').forEach((b) => b.addEventListener('click', () => {
    if (state.group === b.dataset.group) return;
    state.group = b.dataset.group;
    state.serviceId = null; state.length = null;
    renderServices(); renderAll();
  }));

  els.services.addEventListener('change', (e) => {
    if (e.target.name !== 'service') return;
    selectService(e.target.value);
    if (!findService(e.target.value).prices) revealNext(els.stepDate);
  });

  els.lengths.addEventListener('click', (e) => {
    const b = e.target.closest('[data-length]');
    if (!b) return;
    state.length = Number(b.dataset.length);
    renderLengths(); renderAll();
    revealNext(els.stepDate);
  });

  els.dates.addEventListener('click', (e) => {
    const b = e.target.closest('[data-date]');
    if (!b || b.disabled) return;
    state.date = b.dataset.date;
    state.slot = null;
    renderAll();
    revealNext(els.stepTime);
  });

  els.times.addEventListener('click', (e) => {
    const b = e.target.closest('[data-slot]');
    if (!b || b.disabled) return;
    state.slot = Number(b.dataset.slot);
    renderTimes(); renderSummary();
    revealNext(els.stepContact);
  });

  // Odkazy zo sekcie Služby predvyberú službu
  $$('[data-preset]').forEach((a) => a.addEventListener('click', () => {
    const id = a.dataset.preset;
    state.group = groupOf(id);
    state.serviceId = id;
    state.date = null; state.slot = null;
    renderServices();
    selectService(id);
  }));

  /* Validácia a potvrdenie */
  function validate() {
    const name = els.form.elements.name;
    const phone = els.form.elements.phone;
    let ok = true;
    const setErr = (input, msg) => {
      const field = input.closest('.field');
      field.classList.toggle('has-error', !!msg);
      $('.err', field).textContent = msg || '';
      input.setAttribute('aria-invalid', String(!!msg));
      if (msg && ok) { input.focus(); ok = false; }
    };
    setErr(name, name.value.trim().length < 3 ? 'Napíšte prosím svoje meno.' : '');
    const digits = phone.value.replace(/[^\d+]/g, '');
    setErr(phone, /^(\+421|0)\d{9}$/.test(digits) ? '' : 'Zadajte telefón v tvare 0905 123 456 alebo +421…');
    return ok;
  }

  let lastBooking = null;

  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const c = current();
    if (!c || !state.date || state.slot == null || !validate()) return;

    lastBooking = {
      date: state.date, slot: state.slot, n: c.n, dur: c.dur, label: c.label, price: c.price,
      name: els.form.elements.name.value.trim(), phone: els.form.elements.phone.value.trim()
    };
    saveBooking({ date: lastBooking.date, slot: lastBooking.slot, n: lastBooking.n });

    $('#success-text').textContent =
      `${lastBooking.label}, ${whenText(lastBooking.date, lastBooking.slot)}. Cena ${euro(lastBooking.price)}. ` +
      'Ak by ste nemohli prísť, dajte prosím vedieť na 0905 814 786.';
    els.summary.hidden = true;
    els.success.hidden = false;
    els.success.focus();
    els.form.querySelectorAll('fieldset').forEach((f) => { f.disabled = true; });
  });

  ['name', 'phone'].forEach((n) => els.form.elements[n].addEventListener('input', (e) => {
    const field = e.target.closest('.field');
    if (field.classList.contains('has-error')) { field.classList.remove('has-error'); $('.err', field).textContent = ''; }
  }));

  $('#again').addEventListener('click', () => {
    Object.assign(state, { serviceId: null, length: null, date: null, slot: null });
    els.form.reset();
    els.stepService.disabled = false;
    els.success.hidden = true;
    els.summary.hidden = false;
    renderServices(); renderAll();
    $('#rezervacia').scrollIntoView({ behavior: 'smooth' });
  });

  $('#ics').addEventListener('click', () => {
    if (!lastBooking) return;
    const [y, m, d] = lastBooking.date.split('-');
    const start = OPEN_MIN + lastBooking.slot * SLOT;
    const end = start + lastBooking.dur;
    const t = (min) => `${y}${m}${d}T${String(Math.floor(min / 60)).padStart(2, '0')}${String(min % 60).padStart(2, '0')}00`;
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kadernictvo Erika//SK', 'BEGIN:VEVENT',
      `UID:${Date.now()}@kadernictvo-erika`,
      `DTSTART;TZID=Europe/Bratislava:${t(start)}`, `DTEND;TZID=Europe/Bratislava:${t(end)}`,
      `SUMMARY:Kaderníctvo Erika – ${lastBooking.label}`,
      'LOCATION:Andrusovova 5\\, 851 01 Bratislava',
      'DESCRIPTION:Tel. +421 905 814 786',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    a.download = 'kadernictvo-erika.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  renderServices();
  renderAll();
})();
