(function () {
  const WORKER_URL = 'https://mirusya-tg.ip-khaidarov.workers.dev';
  const ptTrack = document.getElementById('ptTrack');
  const ptProgress = document.getElementById('ptProgress');
  const ptCurEl = document.getElementById('ptCur');
  const ptPrev = document.getElementById('ptPrev');
  const ptNext = document.getElementById('ptNext');
  const ptCards = ptTrack ? ptTrack.querySelectorAll('.pt-card') : [];
  const ptCount = ptCards.length;

  function updatePortfolioUI() {
    if (!ptTrack) return;
    const scrollLeft = ptTrack.scrollLeft;
    const maxScroll = ptTrack.scrollWidth - ptTrack.clientWidth;
    const pct = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    if (ptProgress) ptProgress.style.width = (pct * 100) + '%';
    const cardW = ptCards[0] ? ptCards[0].offsetWidth + 2 : 1;
    const idx = Math.min(Math.round(scrollLeft / cardW), Math.max(ptCount - 1, 0));
    if (ptCurEl) ptCurEl.textContent = String(idx + 1).padStart(2, '0');
    if (ptPrev) ptPrev.classList.toggle('disabled', scrollLeft < 10);
    if (ptNext) ptNext.classList.toggle('disabled', scrollLeft >= maxScroll - 10);
  }

  window.scrollPortfolio = function (dir) {
    if (!ptTrack || !ptCards[0]) return;
    const cardW = ptCards[0].offsetWidth + 2;
    try {
      ptTrack.scrollBy({ left: dir * cardW, behavior: 'smooth' });
    } catch (err) {
      ptTrack.scrollLeft += dir * cardW;
    }
  };

  if (ptTrack) {
    ptTrack.addEventListener('scroll', updatePortfolioUI, { passive: true });
    updatePortfolioUI();
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;

    ptTrack.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX;
      scrollStart = ptTrack.scrollLeft;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      ptTrack.scrollLeft = scrollStart - (e.pageX - startX);
    });

    window.addEventListener('mouseup', () => {
      isDown = false;
    });
  }
  let pageLocked = false;
  let lockedScrollY = 0;
  let menuOpen = false;

  function syncPageLock() {
    const shouldLock = menuOpen;
    if (shouldLock && !pageLocked) {
      lockedScrollY = window.scrollY || window.pageYOffset || 0;
      document.documentElement.classList.add('menu-open');
      document.body.classList.add('menu-open');
      document.body.style.top = '-' + lockedScrollY + 'px';
      pageLocked = true;
      return;
    }
    if (!shouldLock && pageLocked) {
      document.documentElement.classList.remove('menu-open');
      document.body.classList.remove('menu-open');
      document.body.style.top = '';
      pageLocked = false;
      window.scrollTo(0, lockedScrollY);
    }
  }

  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');

  window.openMobileMenu = function () {
    if (!burger || !mobileMenu) return;
    burger.classList.add('active');
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Закрыть меню');
    menuOpen = true;
    syncPageLock();
  };

  window.closeMobileMenu = function () {
    if (!burger || !mobileMenu) return;
    burger.classList.remove('active');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    menuOpen = false;
    syncPageLock();
  };

  if (burger && mobileMenu) {
    let lastToggleAt = 0;
    const handleToggle = function (e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const now = Date.now();
      if (now - lastToggleAt < 350) return;
      lastToggleAt = now;
      if (mobileMenu.classList.contains('open')) {
        window.closeMobileMenu();
      } else {
        window.openMobileMenu();
      }
    };

    burger.addEventListener('click', handleToggle, { passive: false });
    burger.addEventListener('touchend', handleToggle, { passive: false });

    mobileMenu.addEventListener('click', function (e) {
      if (e.target === mobileMenu) window.closeMobileMenu();
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        window.closeMobileMenu();
      });
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) {
      window.closeMobileMenu();
    }
  });

  const els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        setTimeout(function () {
          entry.target.classList.add('visible');
        }, i * 60);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    els.forEach(function (el) { obs.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('visible'); });
  }

  window.toggleFaq = function (el) {
    const item = el.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(function (i) {
      i.classList.remove('open');
    });
    if (!isOpen) item.classList.add('open');
  };

  window.handleForm = async function(e) {
    e.preventDefault();
    const form = e.target;

    const nameInput  = form.querySelector('input[placeholder="Как вас зовут?"]');
    const phoneInput = form.querySelector('input[placeholder="+7 (___) ___-__-__"]');
    let hasError = false;

    [nameInput, phoneInput].forEach(function(field) {
      if (!field) return;
      const wrap  = field.closest('.fgroup');
      const error = wrap ? wrap.querySelector('.form-field-error') : null;
      const empty = !field.value || !field.value.trim();
      field.classList.toggle('input-error', empty);
      if (error) error.classList.toggle('show', empty);
      if (empty) hasError = true;
    });

    if (hasError) return;

    const fields = form.querySelectorAll('input, textarea, select');
    let text = '📬 *Новая заявка с сайта Мируся*\n\n';
    fields.forEach(function(f) {
      if (f.value && f.value.trim() && f.type !== 'file' && f.type !== 'hidden') {
        const label = f.closest('.fgroup')?.querySelector('label')?.textContent || f.placeholder || '';
        if (label) text += `*${label}:* ${f.value.trim()}\n`;
      }
    });
    text += `\n🕐 ${new Date().toLocaleString('ru-RU')}`;

    const btn = form.querySelector('button[type="submit"]');
    const origText = btn.textContent;
    btn.textContent = 'Отправляем...';
    btn.disabled = true;

    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const json = await res.json();

      if (json.ok) {
        form.querySelector('.form-success')?.classList.add('show');
        btn.textContent = 'Заявка отправлена ✓';
        btn.style.background = '#1a6b1a';
      } else {
        throw new Error('error');
      }
    } catch(err) {
      btn.textContent = origText;
      btn.disabled = false;
      alert('Ошибка отправки, попробуйте позже или позвоните нам.');
    }
  };

  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  window.addEventListener('scroll', function () {
    const y = window.scrollY || window.pageYOffset || 0;
    let cur = '';
    sections.forEach(function (s) {
      if (y >= s.offsetTop - 80) cur = s.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + cur);
    });
  }, { passive: true });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 960 && mobileMenu && mobileMenu.classList.contains('open')) {
      window.closeMobileMenu();
    }
  }, { passive: true });
})();
(function(){
  'use strict';
  const WORKER_URL = 'https://mirusya-tg.ip-khaidarov.workers.dev';

  const DENSITY = {
    embroidery: 150,
    patches: 170
  };

  const RATE = {
    embroidery: [
      { min: 1, max: 10, rate: 45 },
      { min: 11, max: 30, rate: 40 },
      { min: 31, max: 50, rate: 35 },
      { min: 51, max: 100, rate: 32 },
      { min: 101, max: 500, rate: 28 },
      { min: 501, max: 99999, rate: 23 }
    ],
    patches: [
      { min: 1, max: 10, rate: 42 },
      { min: 11, max: 30, rate: 38 },
      { min: 31, max: 50, rate: 33 },
      { min: 51, max: 100, rate: 30 },
      { min: 101, max: 500, rate: 26 },
      { min: 501, max: 99999, rate: 22 }
    ]
  };

  const SMALL_MIN = {
    embroidery: { under100: 220, over100: 170 },
    patches: { under100: 240, over100: 180 }
  };

  const MIN_ORDER = 2500;

  let cart = [];
  let nextId = 1;

  function createDefaultState() {
    return {
      step: 1,
      maxStep: 5,
      editId: null,
      type: 'embroidery',
      qty: 1,
      deadline: 'standard',
      deadSurcharge: 0,
      patchType: 'patch_std',
      opt3d: false,
      optMetal: false
    };
  }

  const st = createDefaultState();

  const $ = id => document.getElementById(id);
  const shell      = $('kfShell');
  const stepLabel  = $('kfStepLabel');
  const progBar    = $('kfProgressBar');
  const stepTitle  = $('kfStepTitle');
  const stepDesc   = $('kfStepDesc');
  const prevBtn    = $('kfPrevBtn');
  const nextBtn    = $('kfNextBtn');
  const submitBtn  = $('kfSubmitBtn');
  const totalEl    = $('kfTotalPrice');
  const perUnitEl  = $('kfPerUnit');
  const priceNote  = $('kfPriceNote');
  const summaryEl  = $('kfSummaryList');
  const successEl  = $('kfSubmitSuccess');
  const qtySlider  = $('kfQtySlider');
  const qtyVal     = $('kfQtyVal');
  const qtyDisc    = $('kfQtyDiscount');
  const kfW        = $('kfW');
  const kfH        = $('kfH');
  const kfPatchW   = $('kfPatchW');
  const kfPatchH   = $('kfPatchH');
  const cartItems  = $('kfCartItems');
  const cartEmpty  = $('kfCartEmpty');
  const cartTotal  = $('kfCartTotal');
  const cartTotalV = $('kfCartTotalVal');
  const editBadge  = $('kfEditBadge');

  const STEPS = {
    embroidery: {
      1: { t: 'Что рассчитываем?', d: 'Выберите направление — калькулятор подстроится под вашу задачу.' },
      2: { t: 'Размер и опции', d: 'Укажите размер вышивки и дополнительные нюансы.' },
      3: { t: 'Количество', d: 'Чем больше тираж, тем ниже ориентировочная стоимость за штуку.' },
      4: { t: 'Сроки', d: 'Выберите стандартный или приоритетный запуск.' },
      5: { t: 'Ваши контакты', d: 'Пришлём расчёт и согласуем детали заказа.' }
    },
    patches: {
      1: { t: 'Что рассчитываем?', d: 'Выберите направление — калькулятор подстроится под вашу задачу.' },
      '2b': { t: 'Размер и конструкция', d: 'Укажите размер шеврона и вариант исполнения.' },
      3: { t: 'Количество', d: 'Чем больше тираж, тем ниже ориентировочная стоимость за штуку.' },
      4: { t: 'Сроки', d: 'Выберите стандартный или приоритетный запуск.' },
      5: { t: 'Ваши контакты', d: 'Пришлём расчёт и согласуем детали заказа.' }
    }
  };

  const PATCH_NAMES = {
    patch_std: 'Шеврон / нашивка',
    patch_velcro: 'Шеврон с велкро',
    patch_thermo: 'Шеврон с термоклеем',
    patch_3d: '3D-шеврон'
  };

  const PATCH_SUMMARY = {
    patch_std: 'Ткань + вышивка',
    patch_velcro: 'Велкро (+30 ₽/шт)',
    patch_thermo: 'Термоклей',
    patch_3d: '3D-патч (+15%)'
  };

  const TIERS = [
    { min: 1, max: 10, note: 'Малый тираж — базовая ставка' },
    { min: 11, max: 30, note: 'Стартовый опт — цена за штуку ниже' },
    { min: 31, max: 50, note: 'Оптовая ставка — хороший баланс цены и объёма' },
    { min: 51, max: 100, note: 'Хороший тираж — стоимость за штуку снижается заметнее' },
    { min: 101, max: 500, note: 'Крупный тираж — выгоднее по цене за единицу' },
    { min: 501, max: 99999, note: 'Максимально выгодная ставка по тиражу' }
  ];

  function stepKey() {
    return st.type === 'patches' && st.step === 2 ? '2b' : st.step;
  }

  function getActiveSizeEls() {
    return st.type === 'patches' ? [kfPatchW, kfPatchH] : [kfW, kfH];
  }

  function getCurrentSize() {
    const [wEl, hEl] = getActiveSizeEls();
    return {
      w: parseFloat(wEl && wEl.value) || 0,
      h: parseFloat(hEl && hEl.value) || 0
    };
  }

  function roundUp500(n) {
    return Math.ceil(n / 500) * 500;
  }

  function round10(n) {
    return Math.round(n / 10) * 10;
  }

  function estimateStitches(type, w, h) {
    if (w <= 0 || h <= 0) return 0;
    return roundUp500(w * h * DENSITY[type]);
  }

  function getRate(type, qty) {
    const row = RATE[type].find(t => qty >= t.min && qty <= t.max);
    return row ? row.rate : RATE[type][RATE[type].length - 1].rate;
  }

  function getCurrentOptionsLabel() {
    const labels = [];
    if (st.type === 'embroidery') {
      if (st.opt3d) labels.push('3D-объём');
      if (st.optMetal) labels.push('металлизированная нить');
    } else {
      labels.push(PATCH_SUMMARY[st.patchType] || 'Шеврон / нашивка');
    }
    if (st.deadline === 'urgent') labels.push('срочный запуск');
    return labels.join(' · ');
  }

  function calcPrice() {
    const qty = st.qty;
    const size = getCurrentSize();
    const stitches = estimateStitches(st.type, size.w, size.h);
    let unit = 0;

    if (stitches > 0) {
      const rate = getRate(st.type, qty);
      unit = (stitches / 1000) * rate;

      if (stitches <= 3500) {
        const smallMin = qty < 100 ? SMALL_MIN[st.type].under100 : SMALL_MIN[st.type].over100;
        unit = Math.max(unit, smallMin);
      }

      if (st.type === 'embroidery') {
        if (st.opt3d) unit *= 1.20;
        if (st.optMetal) unit *= 1.25;
      } else {
        if (st.patchType === 'patch_velcro') unit += 30;
        if (st.patchType === 'patch_3d') unit *= 1.15;
      }

      if (st.deadSurcharge) unit *= 1 + (st.deadSurcharge / 100);
      unit = round10(unit);
    }

    const sub = unit * qty;
    const total = sub;

    if (st.step >= 2 && stitches > 0) {
      totalEl.textContent = total.toLocaleString('ru-RU');
      perUnitEl.innerHTML = '<strong>' + unit.toLocaleString('ru-RU') + ' ₽</strong> за шт × ' + qty + ' шт';
      priceNote.textContent = 'Предварительный расчёт по размеру, тиражу и выбранным опциям.';
    } else {
      totalEl.textContent = '—';
      perUnitEl.textContent = '';
      priceNote.textContent = 'Укажите размер — калькулятор покажет ориентировочную стоимость';
    }

    renderSummary({ unit, sub, total, qty, stitches, size });
    return { unit, sub, total, qty, stitches, size };
  }

  function renderSummary(data) {
    if (!summaryEl) return;

    const rows = [];
    rows.push(['Тип', st.type === 'patches' ? 'Шевроны / нашивки' : 'Вышивка на одежде']);

    if (data.size.w > 0 && data.size.h > 0) {
      rows.push(['Размер', data.size.w + '×' + data.size.h + ' см']);
    }

    if (st.type === 'patches') {
      rows.push(['Конструкция', PATCH_SUMMARY[st.patchType] || 'Ткань + вышивка']);
    } else {
      const opts = [];
      if (st.opt3d) opts.push('3D-объём (+20%)');
      if (st.optMetal) opts.push('Металлизированная нить (+25%)');
      if (opts.length) rows.push(['Опции', opts.join(', ')]);
    }

    if (st.step >= 3) rows.push(['Кол-во', data.qty + ' шт']);
    if (st.step >= 4) rows.push(['Сроки', st.deadline === 'urgent' ? 'Срочный запуск (+30%)' : 'Стандартные сроки']);
    if (data.sub > 0) rows.push(['Нанесение', data.sub.toLocaleString('ru-RU') + ' ₽']);

    summaryEl.innerHTML = rows.map(r =>
      '<div class="kf-sum-row">' +
      '<span class="kf-sum-key">' + r[0] + '</span>' +
      '<span class="kf-sum-val">' + r[1] + '</span></div>'
    ).join('');
  }

  function itemLabel() {
    const size = getCurrentSize();
    const name = st.type === 'patches' ? (PATCH_NAMES[st.patchType] || 'Шеврон / нашивка') : 'Вышивка на одежде';
    const meta = (size.w > 0 && size.h > 0 ? size.w + '×' + size.h + ' см' : 'размер не указан') + ' · ' + st.qty + ' шт';
    return { name, meta, details: getCurrentOptionsLabel() };
  }

  function updateBadge() {
    if (editBadge) editBadge.style.display = st.editId !== null ? '' : 'none';
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderCart() {
    const has = cart.length > 0;
    if (cartEmpty) cartEmpty.style.display = has ? 'none' : '';
    if (cartTotal) cartTotal.style.display = has ? '' : 'none';
    if (cartItems) {
      [...cartItems.children].forEach(el => {
        if (el !== cartEmpty) el.remove();
      });
    }

    let grand = 0;
    cart.forEach(item => {
      grand += item.sub;
      const el = document.createElement('div');
      el.className = 'kf-cart-item' + (st.editId === item.id ? ' kf-cart-item-editing' : '');
      el.innerHTML =
        '<div class="kf-cart-item-info">' +
        '<div class="kf-cart-item-name">' + esc(item.name) + '</div>' +
        '<div class="kf-cart-item-meta">' + esc(item.meta) + ' · ' + item.sub.toLocaleString('ru-RU') + ' ₽</div>' +
        (item.details ? '<div class="kf-cart-item-meta" style="color:rgba(168,156,195,.6);margin-top:1px">' + esc(item.details) + '</div>' : '') +
        '</div>' +
        '<button class="kf-cart-item-del" data-id="' + item.id + '" title="Удалить" type="button">×</button>';

      el.querySelector('.kf-cart-item-info').addEventListener('click', () => editItem(item.id));
      el.querySelector('.kf-cart-item-del').addEventListener('click', e => {
        e.stopPropagation();
        removeItem(item.id);
      });
      if (cartItems) cartItems.insertBefore(el, cartEmpty);
    });

    if (cartTotalV) cartTotalV.textContent = grand.toLocaleString('ru-RU') + ' ₽';

    const minWarn = $('kfMinWarn');
    if (minWarn && has) {
      if (grand < MIN_ORDER) {
        const diff = (MIN_ORDER - grand).toLocaleString('ru-RU');
        minWarn.style.display = '';
        minWarn.innerHTML =
          '<strong style="color:var(--red)">Минимальная сумма заказа — 2 500 ₽</strong><br>' +
          'Текущий итог: ' + grand.toLocaleString('ru-RU') + ' ₽ — не хватает ' + diff + ' ₽. ' +
          'Можно увеличить тираж, добавить ещё позицию или выбрать больший размер.';
      } else {
        minWarn.style.display = 'none';
      }
    } else if (minWarn) {
      minWarn.style.display = 'none';
    }
  }

  function syncTypeUI() {
    if (!shell) return;
    shell.querySelectorAll('.kf-stage[data-step="1"] .kf-card-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === st.type);
    });
  }

  function syncEmbroideryOptionsUI() {
    if (!shell) return;
    shell.querySelectorAll('.kf-stage[data-step="2"] .kf-pill[data-opt]').forEach(btn => {
      const active = (btn.dataset.opt === '3d' && st.opt3d) || (btn.dataset.opt === 'metallic' && st.optMetal);
      btn.classList.toggle('active', !!active);
    });
  }

  function syncPatchUI() {
    if (!shell) return;
    shell.querySelectorAll('.kf-stage[data-step="2b"] .kf-card-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === st.patchType);
    });
  }

  function syncDeadlineUI() {
    if (!shell) return;
    shell.querySelectorAll('.kf-stage[data-step="4"] .kf-card-btn[data-value]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === st.deadline);
    });
  }

  function syncQtyButtonsUI() {
    document.querySelectorAll('.kf-qty-btn').forEach(b => b.classList.remove('active'));
    const m = [...document.querySelectorAll('.kf-qty-btn')].find(b => {
      const bq = parseInt(b.dataset.qty, 10);
      return bq === 300 ? st.qty >= 300 : bq === st.qty;
    });
    if (m) m.classList.add('active');
    if (qtySlider) qtySlider.value = Math.min(st.qty, 500);
  }

  function updateQtyUI() {
    if (qtyVal) qtyVal.textContent = st.qty + ' шт';
    const hint = $('kfQtyTierHint');
    const t = TIERS.find(row => st.qty >= row.min && st.qty <= row.max);
    if (t && hint) {
      hint.innerHTML = '<strong>' + st.qty + ' шт:</strong> ' + t.note + '.';
      hint.classList.add('show');
    }
    if (qtyDisc) qtyDisc.textContent = 'Чем больше тираж, тем ниже ориентировочная стоимость за штуку.';
  }

  function syncUIFromState() {
    syncTypeUI();
    syncEmbroideryOptionsUI();
    syncPatchUI();
    syncDeadlineUI();
    syncQtyButtonsUI();
    updateQtyUI();
  }

  function renderStep() {
    const total = st.maxStep;
    if (stepLabel) stepLabel.textContent = 'Шаг ' + st.step + ' из ' + total;
    if (progBar) progBar.style.width = (st.step / total * 100) + '%';

    const k = stepKey();
    const txt = (STEPS[st.type] || STEPS.embroidery)[k] || {};
    if (stepTitle) stepTitle.textContent = txt.t || '';
    if (stepDesc) stepDesc.textContent = txt.d || '';

    document.querySelectorAll('.kf-stage').forEach(s => s.classList.remove('active'));
    const target = st.type === 'patches' && st.step === 2
      ? document.querySelector('.kf-stage[data-step="2b"]')
      : document.querySelector('.kf-stage[data-step="' + st.step + '"]');
    if (target) target.classList.add('active');

    if (prevBtn) prevBtn.disabled = st.step === 1;
    if (nextBtn) nextBtn.style.display = st.step < total ? '' : 'none';
    if (submitBtn) submitBtn.style.display = st.step === total ? '' : 'none';


    const priceBox = $('kfPriceBox');
    const hidePrice = st.step >= 4 && cart.length > 0;
    if (priceBox) priceBox.style.display = hidePrice ? 'none' : '';
    if (summaryEl) summaryEl.style.display = hidePrice ? 'none' : '';

    calcPrice();
  }

  function addToCart() {
    const d = calcPrice();
    if (!d.size.w || !d.size.h) return false;

    const lbl = itemLabel();
    const item = {
      id: st.editId !== null ? st.editId : nextId++,
      type: st.type,
      patchType: st.patchType,
      opt3d: st.opt3d,
      optMetal: st.optMetal,
      qty: d.qty,
      deadline: st.deadline,
      deadSurcharge: st.deadSurcharge,
      w: d.size.w,
      h: d.size.h,
      unit: d.unit,
      sub: d.sub,
      name: lbl.name,
      meta: lbl.meta,
      details: lbl.details
    };

    if (st.editId !== null) {
      const idx = cart.findIndex(c => c.id === st.editId);
      if (idx !== -1) cart[idx] = item;
      st.editId = null;
    } else {
      cart.push(item);
    }

    renderCart();
    updateBadge();
    return true;
  }

  function removeItem(id) {
    cart = cart.filter(c => c.id !== id);
    if (st.editId === id) {
      st.editId = null;
      updateBadge();
    }
    renderCart();
  }

  function loadItemToState(item) {
    st.editId = item.id;
    st.type = item.type;
    st.patchType = item.patchType || 'patch_std';
    st.opt3d = !!item.opt3d;
    st.optMetal = !!item.optMetal;
    st.qty = item.qty || 1;
    st.deadline = item.deadline || 'standard';
    st.deadSurcharge = item.deadSurcharge || 0;
    if (kfW) kfW.value = item.type === 'embroidery' ? item.w : '';
    if (kfH) kfH.value = item.type === 'embroidery' ? item.h : '';
    if (kfPatchW) kfPatchW.value = item.type === 'patches' ? item.w : '';
    if (kfPatchH) kfPatchH.value = item.type === 'patches' ? item.h : '';
    st.step = 1;
    syncUIFromState();
    updateBadge();
    renderStep();
    $('kfShell').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function editItem(id) {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    loadItemToState(item);
  }

  function resetNew() {
    const fresh = createDefaultState();
    Object.keys(fresh).forEach(key => { st[key] = fresh[key]; });
    if (kfW) kfW.value = '';
    if (kfH) kfH.value = '';
    if (kfPatchW) kfPatchW.value = '';
    if (kfPatchH) kfPatchH.value = '';
    syncUIFromState();
    updateBadge();
    totalEl.textContent = '—';
    perUnitEl.textContent = '';
    priceNote.textContent = 'Укажите размер — калькулятор покажет ориентировочную стоимость';
    if (summaryEl) summaryEl.innerHTML = '';
    renderStep();
    $('kfShell').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (shell) {
    shell.querySelectorAll('.kf-stage[data-step="1"] .kf-card-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        st.type = btn.dataset.value;
        syncTypeUI();
        calcPrice();
        renderStep();
      });
    });

    shell.querySelectorAll('.kf-stage[data-step="2"] .kf-pill[data-opt]').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        if (btn.dataset.opt === '3d') st.opt3d = btn.classList.contains('active');
        if (btn.dataset.opt === 'metallic') st.optMetal = btn.classList.contains('active');
        calcPrice();
      });
    });

    shell.querySelectorAll('.kf-stage[data-step="2b"] .kf-card-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        st.patchType = btn.dataset.value;
        syncPatchUI();
        calcPrice();
      });
    });

    shell.querySelectorAll('.kf-stage[data-step="4"] .kf-card-btn[data-value]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.deadline = btn.dataset.value;
        st.deadSurcharge = parseInt(btn.dataset.surcharge, 10) || 0;
        syncDeadlineUI();
        calcPrice();
      });
    });
  }

  [kfW, kfH, kfPatchW, kfPatchH].forEach(inp => {
    if (inp) inp.addEventListener('input', calcPrice);
  });

  const qtyBtns = $('kfQtyBtns');
  if (qtyBtns) {
    qtyBtns.addEventListener('click', e => {
      const btn = e.target.closest('.kf-qty-btn');
      if (!btn) return;
      st.qty = parseInt(btn.dataset.qty, 10);
      syncQtyButtonsUI();
      updateQtyUI();
      calcPrice();
    });
  }

  if (qtySlider) {
    qtySlider.addEventListener('input', () => {
      st.qty = parseInt(qtySlider.value, 10);
      syncQtyButtonsUI();
      updateQtyUI();
      calcPrice();
    });
  }

  const fileInput = $('kfLeadFile');
  if (fileInput) {
    fileInput.addEventListener('change', e => {
      const f = e.target.files[0];
      $('kfFileName').textContent = f ? f.name : 'JPG, PNG, SVG, PDF, AI — можно прислать позже';
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (st.step > 1) {
        st.step--;
        renderStep();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (st.step < st.maxStep) {
        if (st.step === 3 && cart.length > 0 && st.editId === null) {
          addToCart();
        }
        st.step++;
        renderStep();
      }
    });
  }



  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const nameEl = $('kfLeadName');
      const phoneEl = $('kfLeadPhone');
      let ok = true;

      const nameEmpty = !nameEl.value.trim();
      nameEl.classList.toggle('kf-invalid', nameEmpty);
      $('kfLeadNameErr').classList.toggle('show', nameEmpty);
      if (nameEmpty) ok = false;

      const phoneEmpty = !phoneEl.value.trim();
      phoneEl.classList.toggle('kf-invalid', phoneEmpty);
      $('kfLeadPhoneErr').classList.toggle('show', phoneEmpty);
      if (phoneEmpty) ok = false;

      if (!ok) return;

      if (cart.length === 0 && st.step >= 3) addToCart();

      const grand = cart.reduce((sum, item) => sum + item.sub, 0);
      if (grand < MIN_ORDER) {
        const minWarn = $('kfMinWarn');
        if (minWarn) {
          minWarn.style.display = '';
          const diff = (MIN_ORDER - grand).toLocaleString('ru-RU');
          minWarn.innerHTML =
            '<strong style="color:var(--red)">Минимальная сумма заказа — 2 500 ₽</strong><br>' +
            'Текущий итог: ' + grand.toLocaleString('ru-RU') + ' ₽ — не хватает ' + diff + ' ₽. ' +
            'Увеличьте тираж или добавьте ещё позицию.';
          minWarn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      const payload = {
        org: $('kfLeadOrg').value,
        name: nameEl.value,
        phone: phoneEl.value,
        email: $('kfLeadEmail').value,
        comment: $('kfLeadComment').value,
        items: cart.map(i => ({
          name: i.name,
          meta: i.meta,
          qty: i.qty,
          unit: i.unit,
          sub: i.sub,
          details: i.details || ''
        })),
        grandTotal: grand,
        deadline: st.deadline
      };

      let tgText = '🛒 *Заказ из конфигуратора Мируся*\n\n';
      tgText += '*Позиции:*\n';
      payload.items.forEach(i => {
        tgText += `• ${i.name} · ${i.meta} — ${i.sub.toLocaleString('ru-RU')} ₽\n`;
        if (i.details) tgText += `  _${i.details}_\n`;
      });
      tgText += `\n*Итого:* ${payload.grandTotal.toLocaleString('ru-RU')} ₽`;
      tgText += `\n*Сроки:* ${payload.deadline === 'urgent' ? 'Срочно' : 'Стандарт'}`;
      tgText += '\n\n👤 *Контакт:*';
      if (payload.org) tgText += `\nКомпания: ${payload.org}`;
      tgText += `\nИмя: ${payload.name}`;
      tgText += `\nТелефон: ${payload.phone}`;
      if (payload.email) tgText += `\nEmail: ${payload.email}`;
      if (payload.comment) tgText += `\nКомментарий: ${payload.comment}`;
      tgText += `\n\n🕐 ${new Date().toLocaleString('ru-RU')}`;

      await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: tgText })
      });

      if (successEl) successEl.classList.add('show');
      submitBtn.textContent = 'Заявка отправлена ✓';
      submitBtn.disabled = true;
    });
  }

  const initialQtyBtn = document.querySelector('#kfQtyBtns .kf-qty-btn[data-qty="1"]');
  if (initialQtyBtn) initialQtyBtn.classList.add('active');
  syncUIFromState();
  updateBadge();
  renderStep();
  renderCart();

})();
