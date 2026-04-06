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

  /* ── ЦЕНОВАЯ МАТРИЦА ── */
  const PM = [
    {min:1,  max:9,  xs:250, s:390, m:650, l:1050,xl:1650},
    {min:10, max:29, xs:190, s:290, m:490, l:790, xl:1250},
    {min:30, max:99, xs:150, s:230, m:390, l:640, xl:1000},
    {min:100,max:299,xs:120, s:185, m:320, l:520, xl:820 },
    {min:300,max:9999,xs:95, s:150, m:260, l:420, xl:660 },
  ];
  const PP = [
    {min:1,  max:9,  p:290},{min:10,max:29, p:220},
    {min:30, max:99, p:175},{min:100,max:299,p:140},
    {min:300,max:9999,p:110},
  ];

  /* ── КОРЗИНА ── */
  let cart = [];
  let nextId = 1;

  /* ── СОСТОЯНИЕ ── */
  const st = {
    step:1, maxStep:6, editId:null,
    type:'embroidery', garment:'polo', garSurcharge:0,
    ownGarment:false, sizeKey:'xs',
    opt3d:false, optMetal:false,
    qty:1, deadline:'standard', deadSurcharge:0,
    patchType:'patch_std',
    hasFile:false, // false = нет файла, мы делаем; true = файл есть, запросим
  };

  /* ── DOM ── */
  const $ = id => document.getElementById(id);
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
  const customSize = $('kfCustomSize');
  const kfW        = $('kfW');
  const kfH        = $('kfH');
  const multiBlock = $('kfMultiBlock');
  const addNewBtn  = $('kfAddAndNewBtn');
  const saveBtn    = $('kfSaveItemBtn');
  const cartItems  = $('kfCartItems');
  const cartEmpty  = $('kfCartEmpty');
  const cartTotal  = $('kfCartTotal');
  const cartTotalV = $('kfCartTotalVal');
  const editBadge  = $('kfEditBadge');

  /* ── ТЕКСТЫ ШАГОВ ── */
  const STEPS = {
    embroidery:{
      1:{t:'Что нужно вышить?',d:'Выберите тип продукта.'},
      2:{t:'На что наносим?',d:'Тип изделия влияет на стоимость.'},
      3:{t:'Размер вышивки',d:'Выберите стандартный или введите свой размер.'},
      4:{t:'Количество',d:'Цена за штуку снижается с ростом тиража.'},
      5:{t:'Сроки',d:'Выберите удобный срок производства.'},
      6:{t:'Ваши контакты',d:'Пришлём точный расчёт и согласуем детали.'},
    },
    patches:{
      1:{t:'Что нужно вышить?',d:'Выберите тип продукта.'},
      '2b':{t:'Тип шеврона',d:'Конструкция и крепление.'},
      3:{t:'Размер шеврона',d:'Стандартный или свой размер.'},
      4:{t:'Количество',d:'Тираж влияет на цену за штуку.'},
      5:{t:'Сроки',d:'Выберите удобный срок производства.'},
      6:{t:'Ваши контакты',d:'Пришлём точный расчёт и согласуем детали.'},
    },
  };

  /* ── ВСПОМОГАТЕЛЬНЫЕ ── */
  function stepKey(){
    return (st.type==='patches' && st.step===2) ? '2b' : st.step;
  }
  function tier(qty, matrix){
    return matrix.find(t=>qty>=t.min&&qty<=t.max) || matrix[matrix.length-1];
  }
  function sizeKey(){
    const a=(parseFloat(kfW.value)||0)*(parseFloat(kfH.value)||0);
    if(a<=0)   return 'xs'; // ничего не введено — минимальная ставка
    if(a<=25)  return 'xs';
    if(a<=64)  return 's';
    if(a<=120) return 'm';
    if(a<=224) return 'l';
    return 'xl';
  }

  /* ── РЕНДЕР ШАГА ── */
  function renderStep(){
    const total = st.maxStep;
    stepLabel.textContent = 'Шаг '+st.step+' из '+total;
    progBar.style.width = (st.step/total*100)+'%';
    const k = stepKey();
    const txt = (STEPS[st.type]||STEPS.embroidery)[k]||{};
    stepTitle.textContent = txt.t||'';
    stepDesc.textContent  = txt.d||'';

    document.querySelectorAll('.kf-stage').forEach(s=>s.classList.remove('active'));
    const target = (st.type==='patches'&&st.step===2)
      ? document.querySelector('.kf-stage[data-step="2b"]')
      : document.querySelector('.kf-stage[data-step="'+st.step+'"]');
    if(target) target.classList.add('active');

    prevBtn.disabled = st.step===1;
    nextBtn.style.display  = st.step<total ? '' : 'none';
    submitBtn.style.display = st.step===total ? '' : 'none';

    // Мультизаказ-блок: показывать на шаге 4
    if(multiBlock) multiBlock.classList.toggle('show', st.step===4);

    // Скрыть «Стоимость позиции» на шаге 5+ при мультизаказе
    const priceBox = $('kfPriceBox');
    const hidePrice = st.step >= 5 && cart.length > 0;
    if(priceBox) priceBox.style.display = hidePrice ? 'none' : '';
    if(summaryEl) summaryEl.style.display = hidePrice ? 'none' : '';

    calcPrice();
  }

  /* ── РАСЧЁТ ── */
  function calcPrice(){
    const qty = st.qty;
    let unit = 0;

    if(st.type==='patches'){
      unit = tier(qty,PP).p;
      if(st.patchType==='patch_velcro') unit+=30;
      if(st.patchType==='patch_3d') unit=Math.round(unit*1.15);
    } else {
      const sk = sizeKey();
      const t  = tier(qty,PM);
      unit = t[sk]||t.s;
      let s=1;
      s += st.garSurcharge/100;
      if(st.opt3d)    s+=0.15;
      if(st.optMetal) s+=0.30;
      if(st.deadSurcharge) s+=st.deadSurcharge/100;
      if(st.ownGarment) s-=0.10;
      unit = Math.round(unit*s);
    }

    const sub   = unit*qty;
    const total = sub;

    if(st.step>=3){
      totalEl.textContent = total.toLocaleString('ru-RU');
      perUnitEl.innerHTML = '<strong>'+unit.toLocaleString('ru-RU')+' ₽</strong> за шт × '+qty+' шт';
      priceNote.textContent = '';
    } else {
      totalEl.textContent = '—';
      perUnitEl.textContent = '';
      priceNote.textContent = 'Выберите параметры — цена появится здесь';
    }

    renderSummary(unit, sub, total, qty);
    return {unit, sub, total, qty};
  }

  /* ── СВОДКА ── */
  const GN = {polo:'Поло / футболка',hoodie:'Худи / толстовка',jacket:'Куртка / жилет',
               cap:'Кепка / шапка',bag:'Сумка / рюкзак',other:'Иное изделие'};
  const SL = {xs:'XS до 5×5 см',s:'S до 8×8 см',m:'M до 12×10 см',
               l:'L до 16×14 см',xl:'XL до 22×18 см',custom:'Свой размер'};
  const PN = {patch_std:'Ткань + вышивка',patch_velcro:'С велкро (+30 ₽)',
               patch_thermo:'Термоклей',patch_3d:'3D-объём (+15%)'};

  function renderSummary(unit, sub, total, qty){
    const rows=[];
    if(st.type==='patches'){
      rows.push(['Тип','Шевроны / нашивки']);
      rows.push(['Конструкция',PN[st.patchType]||'']);
    } else {
      rows.push(['Тип','Вышивка на одежде']);
      if(st.step>=2) rows.push(['Изделие',GN[st.garment]||'']);
    }
    if(st.step>=3){
      const w=parseFloat(kfW.value)||0, h=parseFloat(kfH.value)||0;
      rows.push(['Размер', (w>0&&h>0) ? w+'×'+h+' см' : '—']);
    }
    if(st.step>=3 && st.opt3d)    rows.push(['Опция','3D-объём (+15%)']);
    if(st.step>=3 && st.optMetal) rows.push(['Опция','Металлик (+30%)']);
    if(st.step>=4) rows.push(['Кол-во',qty+' шт']);
    if(st.step>=4 && st.ownGarment) rows.push(['Скидка','Своё изделие −10%',true]);
    if(st.step>=5) rows.push(['Сроки',st.deadline==='urgent'?'Срочно, до 3 дн.':'Стандарт 5–12 дн.']);
    if(st.step>=5) rows.push(['Файл вышивки', st.hasFile?'Есть — запросим':'Нет — разрабатываем']);
    if(st.step>=3) rows.push(['Нанесение',sub.toLocaleString('ru-RU')+' ₽']);

    summaryEl.innerHTML = rows.map(r=>
      '<div class="kf-sum-row'+(r[2]?' kf-discount':'')+'">'+
      '<span class="kf-sum-key">'+r[0]+'</span>'+
      '<span class="kf-sum-val">'+r[1]+'</span></div>'
    ).join('');
  }

  /* ── КОРЗИНА ── */
  const MIN_ORDER = 2500;
  function itemLabel(){
    const name = st.type==='patches'
      ? (PN[st.patchType]||'Шеврон')
      : (GN[st.garment]||'Вышивка');
    const w = parseFloat(kfW.value)||0;
    const h = parseFloat(kfH.value)||0;
    const sz = (w>0 && h>0) ? w+'×'+h+' см' : 'размер не указан';
    return {name, meta: sz+' · '+st.qty+' шт'};
  }

  function addToCart(){
    const d = calcPrice();
    const lbl = itemLabel();
    const fileInfo = st.hasFile ? 'файл есть' : 'файла нет — разрабатываем';
    if(st.editId!==null){
      const idx = cart.findIndex(c=>c.id===st.editId);
      if(idx!==-1) cart[idx] = {id:st.editId,...lbl,unit:d.unit,qty:d.qty,sub:d.sub,hasFile:st.hasFile,fileInfo};
      st.editId = null;
    } else {
      cart.push({id:nextId++,...lbl,unit:d.unit,qty:d.qty,sub:d.sub,hasFile:st.hasFile,fileInfo});
    }
    renderCart();
    updateBadge();
  }

  function removeItem(id){
    cart = cart.filter(c=>c.id!==id);
    if(st.editId===id){st.editId=null;updateBadge();}
    renderCart();
  }

  function editItem(id){
    st.editId = id;
    st.step = 1;
    updateBadge();
    renderStep();
    document.getElementById('kfShell').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function resetNew(){
    st.editId=null; st.step=1;
    st.type='embroidery'; st.garment='polo'; st.garSurcharge=0;
    st.ownGarment=false;
    st.opt3d=false; st.optMetal=false;
    st.qty=1; st.deadline='standard'; st.deadSurcharge=0; st.patchType='patch_std';
    st.hasFile=false;
    // Сбросить UI
    const shell = document.getElementById('kfShell');
    shell.querySelectorAll('.kf-card-btn.active').forEach(b=>b.classList.remove('active'));
    shell.querySelectorAll('.kf-stage[data-step="1"] .kf-card-btn[data-value="embroidery"]').forEach(b=>b.classList.add('active'));
    shell.querySelectorAll('.kf-stage[data-step="2"] .kf-card-btn[data-value="polo"]').forEach(b=>b.classList.add('active'));
    if(kfW) kfW.value='';
    if(kfH) kfH.value='';
    // Сбросить кнопку файла вышивки
    if(digYes){digYes.classList.add('active');}
    if(digNo){digNo.classList.remove('active');}
    if(digHint) digHint.textContent='Мы подготовим программу для вышивальной машины — это входит в стоимость. Файл останется у нас для быстрого повторного заказа.';
    shell.querySelectorAll('.kf-pill').forEach(b=>b.classList.remove('active'));
    shell.querySelectorAll('.kf-stage[data-step="2"] .kf-pill[data-value="ours"]').forEach(b=>b.classList.add('active'));
    shell.querySelectorAll('.kf-stage[data-step="5"] .kf-card-btn[data-value="standard"]').forEach(b=>b.classList.add('active'));
    document.querySelectorAll('.kf-qty-btn').forEach(b=>b.classList.remove('active'));
    const b1 = document.querySelector('#kfQtyBtns .kf-qty-btn[data-qty="1"]');
    if(b1) b1.classList.add('active');
    qtySlider.value=1;
    updateBadge();
    updateQtyUI();
    // Сбросить блок «Стоимость позиции» в нейтральное состояние
    totalEl.textContent = '—';
    perUnitEl.textContent = '';
    priceNote.textContent = 'Выберите параметры — цена появится здесь';
    summaryEl.innerHTML = '';
    renderStep();
    document.getElementById('kfShell').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function updateBadge(){
    if(editBadge) editBadge.style.display = st.editId!==null ? '' : 'none';
  }

  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  function renderCart(){
    const has = cart.length>0;
    if(cartEmpty) cartEmpty.style.display = has?'none':'';
    if(cartTotal) cartTotal.style.display = has?'':'none';
    // Удалить старые карточки
    if(cartItems) [...cartItems.children].forEach(el=>{if(el!==cartEmpty)el.remove();});
    let grand=0;
    cart.forEach(item=>{
      grand += item.sub;
      const el = document.createElement('div');
      el.className='kf-cart-item'+(st.editId===item.id?' kf-cart-item-editing':'');
      el.innerHTML=
        '<div class="kf-cart-item-info">'+
        '<div class="kf-cart-item-name">'+esc(item.name)+'</div>'+
        '<div class="kf-cart-item-meta">'+esc(item.meta)+' · '+item.sub.toLocaleString('ru-RU')+' ₽</div>'+
        '<div class="kf-cart-item-meta" style="color:rgba(168,156,195,.6);margin-top:1px">'+esc(item.fileInfo||'')+'</div>'+
        '</div>'+
        '<button class="kf-cart-item-del" data-id="'+item.id+'" title="Удалить" type="button">×</button>';
      el.querySelector('.kf-cart-item-info').addEventListener('click',()=>editItem(item.id));
      el.querySelector('.kf-cart-item-del').addEventListener('click',e=>{e.stopPropagation();removeItem(item.id);});
      if(cartItems) cartItems.insertBefore(el, cartEmpty);
    });
    if(cartTotalV) cartTotalV.textContent = grand.toLocaleString('ru-RU')+' ₽';

    // Предупреждение о минимальной сумме
    const minWarn = $('kfMinWarn');
    if(minWarn && has){
      if(grand < MIN_ORDER){
        const diff = (MIN_ORDER - grand).toLocaleString('ru-RU');
        minWarn.style.display = '';
        minWarn.innerHTML =
          '<strong style="color:var(--red)">Минимальная сумма заказа — 2 500 ₽</strong><br>' +
          'Текущий итог: '+grand.toLocaleString('ru-RU')+' ₽ — не хватает '+diff+' ₽. ' +
          'Можно увеличить тираж, добавить ещё позицию или выбрать больший размер вышивки.';
      } else {
        minWarn.style.display = 'none';
      }
    } else if(minWarn){
      minWarn.style.display = 'none';
    }
  }

  /* ── ОБРАБОТЧИКИ ШАГОВ ── */
  const shell = document.getElementById('kfShell');

  // Шаг 1
  shell.querySelectorAll('.kf-stage[data-step="1"] .kf-card-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      shell.querySelectorAll('.kf-stage[data-step="1"] .kf-card-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      st.type=btn.dataset.value;
      calcPrice();
    });
  });

  // Шаг 2 — изделие
  shell.querySelectorAll('.kf-stage[data-step="2"] .kf-card-btn[data-value]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      shell.querySelectorAll('.kf-stage[data-step="2"] .kf-card-btn[data-value]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      st.garment=btn.dataset.value;
      st.garSurcharge=parseInt(btn.dataset.surcharge)||0;
      calcPrice();
    });
  });
  shell.querySelectorAll('.kf-stage[data-step="2"] .kf-pill').forEach(btn=>{
    btn.addEventListener('click',()=>{
      shell.querySelectorAll('.kf-stage[data-step="2"] .kf-pill').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      st.ownGarment=btn.dataset.value==='client';
      calcPrice();
    });
  });

  // Шаг 2b — шевроны
  shell.querySelectorAll('.kf-stage[data-step="2b"] .kf-card-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      shell.querySelectorAll('.kf-stage[data-step="2b"] .kf-card-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      st.patchType=btn.dataset.value;
      calcPrice();
    });
  });

  // Шаг 3 — размер (только ручной ввод)
  [kfW,kfH].forEach(inp=>{if(inp)inp.addEventListener('input',calcPrice);});

  // Шаг 3 — опции
  shell.querySelectorAll('.kf-stage[data-step="3"] .kf-pill[data-opt]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      btn.classList.toggle('active');
      if(btn.dataset.opt==='3d')      st.opt3d   =btn.classList.contains('active');
      if(btn.dataset.opt==='metallic')st.optMetal=btn.classList.contains('active');
      calcPrice();
    });
  });

  // Шаг 4 — количество
  document.getElementById('kfQtyBtns').addEventListener('click',e=>{
    const btn=e.target.closest('.kf-qty-btn');
    if(!btn)return;
    document.querySelectorAll('.kf-qty-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    st.qty=parseInt(btn.dataset.qty);
    qtySlider.value=Math.min(st.qty,500);
    updateQtyUI(); calcPrice();
  });
  qtySlider.addEventListener('input',()=>{
    st.qty=parseInt(qtySlider.value);
    document.querySelectorAll('.kf-qty-btn').forEach(b=>b.classList.remove('active'));
    const m=[...document.querySelectorAll('.kf-qty-btn')].find(b=>{
      const bq=parseInt(b.dataset.qty);
      return bq===300?st.qty>=300:bq===st.qty;
    });
    if(m)m.classList.add('active');
    updateQtyUI(); calcPrice();
  });

  // Шаг 5 — сроки
  shell.querySelectorAll('.kf-stage[data-step="5"] .kf-card-btn[data-value]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      shell.querySelectorAll('.kf-stage[data-step="5"] .kf-card-btn[data-value]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      st.deadline=btn.dataset.value;
      st.deadSurcharge=parseInt(btn.dataset.surcharge)||0;
      calcPrice();
    });
  });

  // Файл
  const fileInput = $('kfLeadFile');
  if(fileInput) fileInput.addEventListener('change',e=>{
    const f=e.target.files[0];
    $('kfFileName').textContent=f?f.name:'JPG, PNG, SVG, PDF, AI — можно прислать позже';
  });

  /* ── ФАЙЛ ВЫШИВКИ ── */
  const digYes  = $('kfDigYes');
  const digNo   = $('kfDigNo');
  const digHint = $('kfDigHint');
  if(digYes) digYes.addEventListener('click',()=>{
    digYes.classList.add('active'); digNo.classList.remove('active');
    st.hasFile = false;
    if(digHint) digHint.textContent = 'Мы подготовим программу для вышивальной машины — это входит в стоимость. Файл останется у нас для быстрого повторного заказа.';
  });
  if(digNo) digNo.addEventListener('click',()=>{
    digNo.classList.add('active'); digYes.classList.remove('active');
    st.hasFile = true;
    if(digHint) digHint.textContent = 'Отлично — после подтверждения заказа менеджер запросит ваш файл вышивки.';
  });

  /* ── НАВИГАЦИЯ ── */
  prevBtn.addEventListener('click',()=>{if(st.step>1){st.step--;renderStep();}});
  nextBtn.addEventListener('click',()=>{
    if(st.step<st.maxStep){
      // Если корзина уже не пуста и мы на шаге 4 — автосохранить позицию перед переходом
      if(st.step===4 && cart.length>0 && st.editId===null){
        addToCart();
      }
      st.step++;
      renderStep();
    }
  });

  /* ── МУЛЬТИЗАКАЗ ── */
  if(addNewBtn) addNewBtn.addEventListener('click',()=>{ addToCart(); resetNew(); });
  if(saveBtn)   saveBtn.addEventListener('click',()=>{
    addToCart();
    saveBtn.textContent='Сохранено ✓';
    setTimeout(()=>{saveBtn.textContent='Сохранить позицию';},1800);
  });

  /* ── ОТПРАВКА ── */
  submitBtn.addEventListener('click', async ()=>{
    const nameEl=$('kfLeadName'), phoneEl=$('kfLeadPhone');
    let ok=true;
    const ne=!nameEl.value.trim();
    nameEl.classList.toggle('kf-invalid',ne);
    $('kfLeadNameErr').classList.toggle('show',ne);
    if(ne)ok=false;
    const pe=!phoneEl.value.trim();
    phoneEl.classList.toggle('kf-invalid',pe);
    $('kfLeadPhoneErr').classList.toggle('show',pe);
    if(pe)ok=false;
    if(!ok)return;

    // Если корзина пуста — добавить текущую позицию
    if(cart.length===0 && st.step>=4) addToCart();

    const grand=cart.reduce((s,i)=>s+i.sub,0);
    if(grand < MIN_ORDER){
      const minWarn = $('kfMinWarn');
      if(minWarn){
        minWarn.style.display = '';
        const diff = (MIN_ORDER - grand).toLocaleString('ru-RU');
        minWarn.innerHTML =
          '<strong style="color:var(--red)">Минимальная сумма заказа — 2 500 ₽</strong><br>' +
          'Текущий итог: '+grand.toLocaleString('ru-RU')+' ₽ — не хватает '+diff+' ₽. ' +
          'Увеличьте тираж или добавьте ещё позицию.';
        minWarn.scrollIntoView({behavior:'smooth',block:'center'});
      }
      return;
    }
    const payload={
      org:  $('kfLeadOrg').value,
      name: nameEl.value, phone: phoneEl.value,
      email:$('kfLeadEmail').value,
      comment:$('kfLeadComment').value,
      items: cart.map(i=>({name:i.name,meta:i.meta,qty:i.qty,unit:i.unit,sub:i.sub,fileInfo:i.fileInfo||''})),
      grandTotal: grand,
      deadline: st.deadline,
    };
    let tgText = '🛒 *Заказ из конфигуратора Мируся*\n\n';
    tgText += '*Позиции:*\n';
    payload.items.forEach(function(i) {
      tgText += `• ${i.name} · ${i.meta} — ${i.sub.toLocaleString('ru-RU')} ₽\n`;
      if (i.fileInfo) tgText += `  _${i.fileInfo}_\n`;
    });
    tgText += `\n*Итого:* ${payload.grandTotal.toLocaleString('ru-RU')} ₽`;
    tgText += `\n*Сроки:* ${payload.deadline === 'urgent' ? 'Срочно' : 'Стандарт'}`;
    tgText += `\n\n👤 *Контакт:*`;
    if (payload.org)     tgText += `\nКомпания: ${payload.org}`;
    tgText += `\nИмя: ${payload.name}`;
    tgText += `\nТелефон: ${payload.phone}`;
    if (payload.email)   tgText += `\nEmail: ${payload.email}`;
    if (payload.comment) tgText += `\nКомментарий: ${payload.comment}`;
    tgText += `\n\n🕐 ${new Date().toLocaleString('ru-RU')}`;

    await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: tgText })
    });
    $('kfSubmitSuccess').classList.add('show');
    submitBtn.textContent='Заявка отправлена ✓';
    submitBtn.disabled=true;
  });

  /* ── QTY UI ── */
  const TIERS=[
    {min:1,  max:9,  note:'Единичный тираж — полная ставка'},
    {min:10, max:29, note:'Хорошая партия — скидка ~25%'},
    {min:30, max:99, note:'Корпоративный тираж — скидка ~40%'},
    {min:100,max:299,note:'Скидка ~55%, дигитайзинг бесплатно'},
    {min:300,max:9999,note:'Максимальная скидка'},
  ];
  function updateQtyUI(){
    qtyVal.textContent=st.qty+' шт';
    const hint=$('kfQtyTierHint');
    const t=TIERS.find(t=>st.qty>=t.min&&st.qty<=t.max);
    if(t&&hint){hint.innerHTML='<strong>'+st.qty+' шт:</strong> '+t.note+'.';hint.classList.add('show');}
    qtyDisc.textContent=st.qty>=100?'Дигитайзинг включён бесплатно.':'';
  }

  /* ── ИНИЦИАЛИЗАЦИЯ ── */
  const b1=document.querySelector('#kfQtyBtns .kf-qty-btn[data-qty="1"]');
  if(b1) b1.classList.add('active');
  updateQtyUI();
  updateBadge();
  renderStep();
  renderCart();

})();
