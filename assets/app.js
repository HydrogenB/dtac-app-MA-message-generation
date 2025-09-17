(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const dateEl = $('#dateInput');
  const intervalEl = $('#intervalSelect');
  const gridEl = $('#timeGrid');
  const clearBtn = $('#clearBtn');
  const outputs = $('#outputs');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const midnightBtn = document.getElementById('midnightBtn');
  const slotLengthToggle = document.getElementById('slotLengthToggle');
  const datePretty = document.getElementById('datePretty');

  const outPreTH = $('#preTH');
  const outPreEN = $('#preEN');
  const outMaTH = $('#maTH');
  const outMaEN = $('#maEN');

  // Weekday names
  const WEEKDAY_TH = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const WEEKDAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Month names
  const MONTH_TH_ABBR = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // Correct Thai labels (override corrupted constants above)
  const WEEKDAY_TH_NEW = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const MONTH_TH_ABBR_NEW = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  function pad2(n) { return String(n).padStart(2, '0'); }

  // Dynamic time slots via interval (minutes)
  let currentSlotsPerDay = 48; // default 30 min
  let currentTimeLabels = [];
  let intervalMin = 30; // default
  function recomputeTimeConfig() {
    const minutesPerDay = 24 * 60;
    currentSlotsPerDay = Math.floor(minutesPerDay / intervalMin);
    currentTimeLabels = Array.from({ length: currentSlotsPerDay + 1 }, (_, i) => {
      const total = i * intervalMin;
      const h = Math.floor(total / 60);
      const m = total % 60;
      return `${pad2(h)}:${pad2(m)}`;
    });
  }

  // Label density control
  let labelStepOverride = null; // null = auto; otherwise hours per label: 1,2,3,6
  function computeSlotWidth() {
    const innerWidth = gridEl.clientWidth || gridEl.getBoundingClientRect().width || 0;
    if (!innerWidth) return 14; // fallback
    const hours = 48;
    const slotsPerHour = Math.max(1, Math.floor(60 / intervalMin));
    return Math.max(10, Math.floor((innerWidth - 2) / (hours * slotsPerHour)));
  }
  function defaultLabelStep(slotWidth) {
    if (slotWidth >= 28) return 1; // every hour
    if (slotWidth >= 20) return 2; // every 2 hours
    if (slotWidth >= 16) return 3; // every 3 hours
    return 6; // otherwise every 6 hours
  }

  function parseISODateOnly(isoDate) {
    // Construct as local date at noon to avoid TZ edge cases, then correct
    const [y, m, d] = isoDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const MONTH_EN_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function formatDateShort(d) {
    const dd = pad2(d.getDate());
    const mm = MONTH_EN_ABBR[d.getMonth()];
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd} ${mm} ${yy}`;
  }

  // New function for the template format: "24 Sep 2025 (Wed)"
  function formatDateTemplate(d) {
    const dd = d.getDate();
    const mm = MONTH_EN_ABBR[d.getMonth()];
    const yy = d.getFullYear();
    const weekday = WEEKDAY_EN[d.getDay()].slice(0, 3); // Get first 3 letters
    return `${dd} ${mm} ${yy} (${weekday})`;
  }

  function updatePrettyDate() {
    if (!dateEl || !datePretty || !dateEl.value) return;
    const d = parseISODateOnly(dateEl.value);
    datePretty.textContent = formatDateShort(d);
  }

  function formatThaiDate(d) {
    const weekday = WEEKDAY_TH_NEW[d.getDay()];
    const day = d.getDate();
    const month = MONTH_TH_ABBR_NEW[d.getMonth()];
    const beYear = d.getFullYear() + 543;
    return { weekdayTH: weekday, day, monthTH: month, yearBE: beYear };
  }

  function formatEnglishDate(d) {
    const weekday = WEEKDAY_EN[d.getDay()];
    const day = d.getDate();
    const month = MONTH_EN[d.getMonth()];
    const year = d.getFullYear();
    return { weekdayEN: weekday, day, monthEN: month, year };
  }

  function isCrossDay(startHHmm, endHHmm) {
    // Compare lexicographically; both are zero-padded HH:mm
    return endHHmm < startHHmm;
  }

  function buildMessages({ date, startTime, endTime, crossDay }) {
    const th = formatThaiDate(date);
    const en = formatEnglishDate(date);

    // Thai time phrase
    const thTimePhrase = crossDay
      ? `${startTime} น. – ${endTime} น. ของวันถัดไป`
      : `${startTime} – ${endTime} น.`;

    // English connector
    const enConnector = crossDay ? `until ${endTime} of the following day` : `to ${endTime}`;

    // Pre-MA
    const preTH = `เรียนลูกค้าที่เคารพ ดีแทคแอปจะปิดปรับปรุงเพื่อบริการที่ดียิ่งขึ้นในวัน${th.weekdayTH}ที่ ${th.day} ${th.monthTH} ${th.yearBE} เวลา ${thTimePhrase} ขออภัยในความไม่สะดวก`;

    const preEN = `Dear customers, please note that dtac app will be closed for upgrading the service on ${en.weekdayEN}, ${en.day} ${en.monthEN} ${en.year}, from ${startTime} ${enConnector}. We sincerely apologize for the inconvenience.`;

    // MA Mode (during)
    const maTH = `ดีแทคแอปกำลังปิดปรับปรุงระบบเพื่อบริการที่ดียิ่งขึ้นในวัน${th.weekdayTH}ที่ ${th.day} ${th.monthTH} ${th.yearBE} เวลา ${thTimePhrase} ขออภัยในความไม่สะดวก`;

    const maEN = `dtac app is now upgrading the service on ${en.weekdayEN}, ${en.day} ${en.monthEN} ${en.year}, from ${startTime} ${enConnector}. We sincerely apologize for the inconvenience.`;

    return { preTH, preEN, maTH, maEN, crossDay };
  }

  // Clean versions for correct Thai/EN output in combined snippet
  function buildMessages2({ date, startTime, endTime, crossDay }) {
    const th = formatThaiDate(date);
    const en = formatEnglishDate(date);
    const enConnector = crossDay ? `until ${endTime} next day` : `to ${endTime}`;
    const thRange = crossDay ? `${startTime} – ${endTime} ของวันถัดไป` : `${startTime} – ${endTime}`;

    const preTH = `เรียนลูกค้าที่เคารพ ดีแทคแอปจะปิดปรับปรุงเพื่อบริการที่ดียิ่งขึ้นในวัน${th.weekdayTH}ที่ ${th.day} ${th.monthTH} ${th.yearBE} เวลา ${thRange} ขออภัยในความไม่สะดวก`;
    const preEN = `Dear customers, please note that dtac app will be closed for upgrading the service on ${en.weekdayEN}, ${en.day} ${en.monthEN} ${en.year}, from ${startTime} ${enConnector}. We sincerely apologize for the inconvenience.`;
    const maTH = `ขณะนี้ dtac app กำลังปิดปรับปรุงเพื่อพัฒนาการให้บริการ ในวัน${th.weekdayTH}ที่ ${th.day} ${th.monthTH} ${th.yearBE} เวลา ${thRange} ขออภัยในความไม่สะดวก`;
    const maEN = `dtac app is now upgrading the service on ${en.weekdayEN}, ${en.day} ${en.monthEN} ${en.year}, from ${startTime} ${enConnector}. We sincerely apologize for the inconvenience.`;
    return { preTH, preEN, maTH, maEN, crossDay };
  }

  function buildTopics2({ date, startTime, endTime, crossDay }) {
    const th = formatThaiDate(date);
    const en = formatEnglishDate(date);
    const enRange = crossDay ? `${startTime}–${endTime} next day` : `${startTime}–${endTime}`;
    const thRange = crossDay ? `${startTime}–${endTime} ของวันถัดไป` : `${startTime}–${endTime}`;
    const topicPreEN = `dtac app maintenance – ${en.weekdayEN}, ${en.day} ${en.monthEN} ${en.year} (${enRange})`;
    const topicMaEN = `dtac app is under maintenance – ${en.day} ${en.monthEN} ${en.year} (${enRange})`;
    const topicPreTH = `ปิดปรับปรุง dtac app – ${th.weekdayTH} ${th.day} ${th.monthTH} ${th.yearBE} (${thRange})`;
    const topicMaTH = `dtac app กำลังปิดปรับปรุง – ${th.day} ${th.monthTH} ${th.yearBE} (${thRange})`;
    return { topicPreEN, topicMaEN, topicPreTH, topicMaTH };
  }

  function buildTopics({ date, startTime, endTime, crossDay }) {
    const th = formatThaiDate(date);
    const en = formatEnglishDate(date);

    const enRange = crossDay ? `${startTime} until ${endTime} (next day)` : `${startTime} to ${endTime}`;
    const thRange = crossDay ? `${startTime} � ${endTime} �ͧ�ѹ�Ѵ�` : `${startTime} � ${endTime}`;

    const topicPreEN = `dtac app maintenance – ${en.weekdayEN}, ${en.day} ${en.monthEN} ${en.year} (${enRange})`;
    const topicMaEN = `dtac app is under maintenance – ${en.day} ${en.monthEN} ${en.year} (${enRange})`;

    const topicPreTH = `�յ��Դ�Ѻ���к dtac app – ${th.weekdayTH} ${th.day} ${th.monthTH} ${th.yearBE} (${thRange})`;
    const topicMaTH = `dtac app ���ҧ�Դ�Ѻ���к – ${th.day} ${th.monthTH} ${th.yearBE} (${thRange})`;

    return { topicPreEN, topicMaEN, topicPreTH, topicMaTH };
  }

  function copyToClipboardById(id, button) {
    const el = document.getElementById(id);
    const text = (el?.textContent || '').trim();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      // Show toast notification
      showToast();
    }).catch(() => {/* ignore */});
  }

  function showToast() {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.classList.remove('hidden');
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 300);
    }, 2000);
  }

  function setTodayAsDefault() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = pad2(now.getMonth() + 1);
    const dd = pad2(now.getDate());
    dateEl.value = `${yyyy}-${mm}-${dd}`;
  }

  function clearOutputs() {
    outPreTH.textContent = '';
    outPreEN.textContent = '';
    outMaTH.textContent = '';
    outMaEN.textContent = '';
    outputs.classList.add('hidden');
    if (selectionFloat) selectionFloat.classList.add('hidden');
    const allPre = document.getElementById('allMessages');
    const allCard = document.getElementById('allMessagesCard');
    if (allPre) allPre.textContent = '';
    if (allCard) allCard.classList.add('hidden');
  }

  // Selection state across two days
  let selStart = null; // inclusive linear index across both days
  let selEnd = null;   // inclusive linear index across both days
  let dragging = false;
  let focusLin = 0;
  let keyboardAnchor = null;
  const selectionFloat = document.getElementById('selectionFloat');
  const sumDate = document.getElementById('sumDate');
  const sumTime = document.getElementById('sumTime');
  const sumSelection = document.getElementById('sumSelection');
  const hoverFloat = document.getElementById('hoverFloat');

  if (hoverFloat) {
    hoverFloat.classList.add('hover-tooltip');
  }
  if (selectionFloat) {
    selectionFloat.classList.add('selection-tooltip');
  }

  if (gridEl) {
    gridEl.setAttribute('role', 'grid');
  }

  function selectionEmpty() {
    return selStart === null || selEnd === null;
  }

  function totalColumns() {
    return currentSlotsPerDay * 2;
  }

  function clampFocusIndex(idx) {
    const total = totalColumns();
    if (total <= 0) return 0;
    if (idx < 0) return 0;
    if (idx >= total) return total - 1;
    return idx;
  }

  function updateFocusTarget(idx, { focus = false, scroll = false } = {}) {
    if (!gridEl) return null;
    const cells = gridEl.querySelectorAll('.hcell');
    if (!cells.length) { focusLin = 0; return null; }

    focusLin = clampFocusIndex(idx);
    let target = null;
    cells.forEach((cell) => {
      const lin = Number(cell.getAttribute('data-lin'));
      if (lin === focusLin) {
        cell.setAttribute('tabindex', '0');
        target = cell;
      } else {
        cell.setAttribute('tabindex', '-1');
      }
    });

    if (!target) {
      target = cells[0];
      focusLin = Number(target.getAttribute('data-lin')) || 0;
      target.setAttribute('tabindex', '0');
    }

    if (focus && target) {
      if (scroll) {
        target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
      target.focus({ preventScroll: !scroll });
    }

    return target;
  }

  function refreshFocusAfterBuild({ focus = false } = {}) {
    updateFocusTarget(focusLin, { focus, scroll: false });
  }

  function focusCellAt(idx, { scroll = true } = {}) {
    updateFocusTarget(idx, { focus: true, scroll });
  }

  function getBaseDates() {
    if (!dateEl.value) return null;
    const d1 = parseISODateOnly(dateEl.value); // selected date
    const d0 = new Date(d1); d0.setDate(d0.getDate() - 1); // previous day
    return { d0, d1 };
  }

  function linearToDaySlot(idx) {
    return { day: Math.floor(idx / currentSlotsPerDay), slot: idx % currentSlotsPerDay };
  }

  function buildGrid() {
    const dates = getBaseDates();
    if (!dates) {
      gridEl.innerHTML = '';
      focusLin = 0;
      keyboardAnchor = null;
      return;
    }
    const { d0, d1 } = dates;

    const header0 = `${WEEKDAY_EN[d0.getDay()]}, ${d0.getDate()} ${MONTH_EN[d0.getMonth()]} ${d0.getFullYear()}`;
    const header1 = `${WEEKDAY_EN[d1.getDay()]}, ${d1.getDate()} ${MONTH_EN[d1.getMonth()]} ${d1.getFullYear()}`;

    const totalCols = currentSlotsPerDay * 2;
    const parts = [];
    const hadFocus = gridEl.contains(document.activeElement);
    gridEl.setAttribute('aria-colcount', String(totalCols));
    gridEl.setAttribute('aria-rowcount', '1');
    parts.push(`<div class="tg-h" style="grid-template-columns: repeat(${totalCols}, var(--slot-w, 72px));">`);

    // Row 1: date headers spanning each day
    parts.push(`<div class="hdate" style="grid-column: 1 / span ${currentSlotsPerDay};">${header0}</div>`);
    parts.push(`<div class="hdate" style="grid-column: ${currentSlotsPerDay + 1} / span ${currentSlotsPerDay};">${header1}</div>`);

    // Row 2: time labels across all columns (0..totalCols-1)
    const slotWidth = computeSlotWidth();
    const step = labelStepOverride ?? defaultLabelStep(slotWidth);
    for (let c = 0; c < totalCols; c++) {
      const slotInDay = c % currentSlotsPerDay;
      const totalMin = slotInDay * intervalMin;
      const hour = Math.floor(totalMin / 60);
      const minutes = totalMin % 60;
      const fullHHmm = `${pad2(hour)}:${pad2(minutes)}`;
      // Reduce density: show hour number only at the hour (00..23), dot otherwise
      const isMajor = minutes === 0;
      const isMidnightBoundary = (c === currentSlotsPerDay) && isMajor;
      // Always show number every 3 hours for easier scanning
      const isTri = isMajor && (hour % 3 === 0);
      const showThis = isMidnightBoundary || isTri;
      const tick = showThis ? (isMidnightBoundary ? '00:00' : `${pad2(hour)}:00`) : '';
      const daySplit = (c === currentSlotsPerDay) ? ' day-split' : '';
      const extra = isMidnightBoundary ? ' midnight' : '';
      const triCls = isTri ? ' trihour' : '';
      const periodCls = (hour >= 6 && hour < 12) ? ' morning' : (hour >= 12 && hour < 18) ? ' afternoon' : ' evening';
      const cls = (isMajor ? 'htime major' : 'htime minor') + daySplit + extra + triCls + periodCls;
      const headerForCol = c < currentSlotsPerDay ? header0 : header1;
      parts.push(`<div class="${cls}" data-lin="${c}" title="${headerForCol} ${fullHHmm}">${tick}</div>`);
    }

    // Optional: "Now" marker across time+cell rows if today is visible
    const nowMarkerIndex = computeNowMarkerIndex(d0, d1);
    if (nowMarkerIndex != null) {
      parts.push(`<div class="now-line" style="grid-column: ${nowMarkerIndex + 1};"></div>`);
    }

    // Row 3: selection cells across all columns
    for (let c = 0; c < totalCols; c++) {
      const slotInDay = c % currentSlotsPerDay;
      const totalMin = slotInDay * intervalMin;
      const minutes = totalMin % 60;
      const isHour = minutes === 0;
      const daySplit = (c === currentSlotsPerDay) ? ' day-split' : '';
      const hourCls = isHour ? ' hour' : '';
      const headerForCol = c < currentSlotsPerDay ? header0 : header1;
      const hour = Math.floor(totalMin / 60);
      const fullHHmm = `${pad2(hour)}:${pad2(minutes)}`;
      const triCls = (isHour && (hour % 3 === 0)) ? ' trihour' : '';
      const periodCls = (hour >= 6 && hour < 12) ? ' morning' : (hour >= 12 && hour < 18) ? ' afternoon' : ' evening';
      parts.push(`<div class="hcell${hourCls}${daySplit}${triCls}${periodCls}" data-lin="${c}" role="gridcell" aria-label="${headerForCol} ${fullHHmm}" title="${headerForCol} ${fullHHmm}"></div>`);
    }
    parts.push('</div>');
    gridEl.innerHTML = parts.join('');
    refreshFocusAfterBuild({ focus: hadFocus });

    // Event delegation for pointer interactions (attach once)
    if (!buildGrid._attached) {
      gridEl.addEventListener('pointerdown', onPointerDown);
      gridEl.addEventListener('pointerover', onPointerOver);
      gridEl.addEventListener('pointermove', onPointerMoveHover);
      gridEl.addEventListener('pointerleave', onPointerLeaveHover);
      window.addEventListener('pointerup', onPointerUp);
      gridEl.addEventListener('keydown', onGridKeyDown);
      gridEl.addEventListener('focusin', onGridFocusIn);
      buildGrid._attached = true;
    }

    updateSelectionHighlight();
    updateSlotWidth();
    applyFocusBand();
    scrollToPreferredRegion();
  }

  // Keep midnight visible by default (center 00:00 of day 1)
  function scrollToPreferredRegion() {
    if (!gridEl) return;
    const targetIdx = currentSlotsPerDay; // 00:00 of day 1 (center split)
    const el = gridEl.querySelector(`.hcell[data-lin="${targetIdx}"]`);
    if (el) {
      el.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  }

  function onPointerDown(e) {
    const cell = e.target.closest('.hcell');
    if (!cell) return;
    const lin = Number(cell.getAttribute('data-lin'));
    dragging = true;
    // Hide hover tooltip while dragging selection
    if (hoverFloat) hoverFloat.classList.add('hidden');
    keyboardAnchor = null;
    focusCellAt(lin, { scroll: false });
    selStart = lin;
    selEnd = lin;
    updateSelectionHighlight();
    updateSelectionFloatClean(e);
    setHoverColumn(lin);
    if (selectionFloat) selectionFloat.classList.remove('hidden');

    // Simplified: removed temporary visual feedback
    e.preventDefault();
  }

  function onPointerOver(e) {
    const cell = e.target.closest('.hcell');
    const time = e.target.closest('.htime');
    const linEl = cell || time;
    if (!linEl) return;
    const lin = Number(linEl.getAttribute('data-lin'));
    if (dragging) {
      selEnd = lin;
      updateSelectionHighlight();
      updateSelectionFloatClean(e);
      // Add hover effect during selection
      cell.classList.add('selection-hover');
    } else {
      updateHoverFloat(e, lin);
    }
    setHoverColumn(lin);
  }

  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    // Normalize
    if (selStart !== null && selEnd !== null && selEnd < selStart) {
      const t = selStart; selStart = selEnd; selEnd = t;
    }
    keyboardAnchor = null;
    
    // Remove any temporary classes
    $$('.hcell').forEach(cell => {
      cell.classList.remove('selection-hover');
    });
    
    render();
    hideSelectionFloatSoon();
  }

  function onPointerMoveHover(e) {
    if (dragging) return; // selection tooltip handles during drag
    const cell = e.target.closest('.hcell');
    const time = e.target.closest('.htime');
    const linEl = cell || time;
    if (!linEl) { hideHoverFloat(); clearHoverColumn(); return; }
    const lin = Number(linEl.getAttribute('data-lin'));
    updateHoverFloat(e, lin);
    setHoverColumn(lin);
  }

  function onPointerLeaveHover() {
    hideHoverFloat();
    clearHoverColumn();
  }

  function positionTooltipRelativeToElement(tooltip, element, offsetX = 12, offsetY = 12) {
    if (!tooltip || !element) return;

    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // Calculate preferred position (right and below the element)
    let left = rect.right + offsetX;
    let top = rect.top + offsetY;

    // Adjust if tooltip would go off-screen
    if (left + tooltipRect.width > window.innerWidth) {
      // Try left side instead
      left = rect.left - tooltipRect.width - offsetX;
    }

    if (top + tooltipRect.height > window.innerHeight) {
      // Position above the element
      top = rect.top - tooltipRect.height - offsetY;
    }

    // Ensure tooltip stays within viewport bounds
    left = Math.max(12, Math.min(window.innerWidth - tooltipRect.width - 12, left));
    top = Math.max(12, Math.min(window.innerHeight - tooltipRect.height - 12, top));

    tooltip.style.position = 'fixed';
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  function updateHoverFloat(e, lin) {
    if (!hoverFloat) return;
    const base = getBaseDates();
    if (!base) { hoverFloat.classList.add('hidden'); return; }
    const { day, slot } = linearToDaySlot(lin);
    const d = new Date(day === 0 ? base.d0 : base.d1);
    const total = slot * intervalMin;
    const h = Math.floor(total / 60);
    const m = total % 60;
    const hhmm = `${pad2(h)}:${pad2(m)}`;
    const th = formatThaiDate(d);
    const en = formatEnglishDate(d);
    hoverFloat.textContent = `${th.day} ${th.monthTH} ${th.yearBE} • ${hhmm} | ${en.day} ${en.monthEN} ${en.year} • ${hhmm}`;
    // Use setTimeout to ensure tooltip dimensions are calculated after content is set
    setTimeout(() => positionTooltipRelativeToElement(hoverFloat, e.target), 0);
    hoverFloat.classList.remove('hidden');
  }

  function hideHoverFloat() {
    if (!hoverFloat) return;
    hoverFloat.classList.add('hidden');
  }

  // Column highlight helpers
  let lastHoverLin = null;
  function setHoverColumn(lin) {
    if (!gridEl) return;
    if (lastHoverLin === lin) return;
    clearHoverColumn();
    lastHoverLin = lin;
    const time = gridEl.querySelector(`.htime[data-lin="${lin}"]`);
    const cell = gridEl.querySelector(`.hcell[data-lin="${lin}"]`);
    if (time) time.classList.add('col-hover');
    if (cell) cell.classList.add('col-hover');
  }
  function clearHoverColumn() {
    if (!gridEl) return;
    gridEl.querySelectorAll('.col-hover').forEach(el => el.classList.remove('col-hover'));
    lastHoverLin = null;
  }

  // Compute the linear index for a vertical "now" marker if visible in either day
  function computeNowMarkerIndex(d0, d1) {
    const now = new Date();
    const sameDate = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    let dayOffset = null;
    if (sameDate(now, d0)) dayOffset = 0;
    else if (sameDate(now, d1)) dayOffset = 1;
    if (dayOffset == null) return null;
    const minutes = now.getHours() * 60 + now.getMinutes();
    const slot = Math.floor(minutes / intervalMin);
    const clamped = Math.max(0, Math.min(currentSlotsPerDay - 1, slot));
    return dayOffset * currentSlotsPerDay + clamped;
  }

  function updateSelectionHighlight() {
    // Clear previous selection states - simplified
    $$('.hcell').forEach((c) => {
      c.classList.remove('selected');
      c.removeAttribute('aria-selected');
    });

    if (selStart === null || selEnd === null) return;

    const a = Math.min(selStart, selEnd);
    const b = Math.max(selStart, selEnd);

    // Simplified: just mark cells as selected without position-specific classes
    for (let i = a; i <= b; i++) {
      const el = gridEl.querySelector(`.hcell[data-lin="${i}"]`);
      if (el) {
        el.classList.add('selected');
        el.setAttribute('aria-selected', 'true');
      }
    }
  }

  function onGridFocusIn(e) {
    const cell = e.target.closest('.hcell');
    if (!cell) return;
    const lin = Number(cell.getAttribute('data-lin'));
    if (Number.isNaN(lin)) return;
    updateFocusTarget(lin);
  }

  function applyKeyboardSelection(prevFocus, withShift) {
    if (!withShift) {
      if (keyboardAnchor !== null) {
        keyboardAnchor = focusLin;
        selStart = focusLin;
        selEnd = focusLin;
        updateSelectionHighlight();
        updateKeyboardSelectionVisuals();
        if (selectionFloat) selectionFloat.classList.add('hidden');
        render();
      }
      return;
    }

    const anchor = keyboardAnchor ?? prevFocus;
    keyboardAnchor = anchor;
    selStart = anchor;
    selEnd = focusLin;
    updateSelectionHighlight();
    updateKeyboardSelectionVisuals();
    if (selectionFloat) selectionFloat.classList.add('hidden');
    render();
  }

  function onGridKeyDown(e) {
    if (!gridEl) return;
    const total = totalColumns();
    if (total <= 0) return;
    const prev = focusLin;
    const key = e.key;

    const handledArrow = (() => {
      switch (key) {
        case 'ArrowRight':
          focusCellAt(focusLin + 1);
          return true;
        case 'ArrowLeft':
          focusCellAt(focusLin - 1);
          return true;
        case 'ArrowDown':
          focusCellAt(focusLin + currentSlotsPerDay);
          return true;
        case 'ArrowUp':
          focusCellAt(focusLin - currentSlotsPerDay);
          return true;
        default:
          return false;
      }
    })();

    if (handledArrow) {
      e.preventDefault();
      applyKeyboardSelection(prev, e.shiftKey);
      updateKeyboardSelectionVisuals();
      if (selectionFloat) selectionFloat.classList.add('hidden');
      return;
    }

    if (key === 'Home') {
      e.preventDefault();
      focusCellAt(0);
      applyKeyboardSelection(prev, e.shiftKey);
      updateKeyboardSelectionVisuals();
      if (selectionFloat) selectionFloat.classList.add('hidden');
      return;
    }

    if (key === 'End') {
      e.preventDefault();
      focusCellAt(total - 1);
      applyKeyboardSelection(prev, e.shiftKey);
      updateKeyboardSelectionVisuals();
      if (selectionFloat) selectionFloat.classList.add('hidden');
      return;
    }

    if (key === 'PageDown') {
      e.preventDefault();
      focusCellAt(focusLin + currentSlotsPerDay);
      applyKeyboardSelection(prev, e.shiftKey);
      updateKeyboardSelectionVisuals();
      if (selectionFloat) selectionFloat.classList.add('hidden');
      return;
    }

    if (key === 'PageUp') {
      e.preventDefault();
      focusCellAt(focusLin - currentSlotsPerDay);
      applyKeyboardSelection(prev, e.shiftKey);
      updateKeyboardSelectionVisuals();
      if (selectionFloat) selectionFloat.classList.add('hidden');
      return;
    }

    if (key === ' ' || key === 'Enter') {
      e.preventDefault();
      keyboardAnchor = focusLin;
      selStart = focusLin;
      selEnd = focusLin;
      updateSelectionHighlight();
      updateKeyboardSelectionVisuals();
      if (selectionFloat) selectionFloat.classList.add('hidden');
      render();
      return;
    }

    if (key === 'Escape') {
      e.preventDefault();
      keyboardAnchor = null;
      selStart = null;
      selEnd = null;
      updateKeyboardSelectionVisuals();
      if (selectionFloat) selectionFloat.classList.add('hidden');
      updateSelectionHighlight();
      render();
    }
  }

  function computeSelection() {
    if (selectionEmpty()) return null;
    const a = Math.min(selStart, selEnd);
    const b = Math.max(selStart, selEnd);
    const base = getBaseDates();
    if (!base) return null;
    const start = linearToDaySlot(a);
    const endExclusiveLinear = b + 1;
    const endDay = Math.floor(endExclusiveLinear / currentSlotsPerDay);
    const endSlot = endExclusiveLinear % currentSlotsPerDay;

    const startDate = new Date(base.d0);
    startDate.setDate(startDate.getDate() + start.day);
    const startTime = currentTimeLabels[start.slot] ?? (() => {
      const total = start.slot * intervalMin; const h = Math.floor(total/60), m = total % 60; return `${pad2(h)}:${pad2(m)}`;
    })();
    const endTime = currentTimeLabels[endSlot] ?? (() => {
      const total = endSlot * intervalMin; const h = Math.floor(total/60), m = total % 60; return `${pad2(h)}:${pad2(m)}`;
    })();
    const crossDay = endDay > start.day;

    return { date: startDate, startTime, endTime, crossDay };
  }

  function render() {
    const model = computeSelection();
    if (!model) { clearOutputs(); return; }

    const { preTH, preEN, maTH, maEN } = buildMessages2(model);
    const { topicPreEN, topicMaEN, topicPreTH, topicMaTH } = buildTopics2(model);

    // Add Pre-MA Announcement header to TH message
    outPreTH.textContent = `Pre-MA Announcement\nTH:\n${preTH}`;

    // Add Pre-MA Announcement header to EN message
    outPreEN.textContent = `Pre-MA Announcement\nEN:\n${preEN}`;

    // Add MA Mode header to TH message
    outMaTH.textContent = `MA Mode\nTH:\n${maTH}`;

    // Add MA Mode header to EN message
    outMaEN.textContent = `MA Mode\nEN:\n${maEN}`;

    outputs.classList.remove('hidden');
    updateCompactSummary2(model);

    // Update single combined snippet block with headers
    const allPre = document.getElementById('allMessages');
    const allCard = document.getElementById('allMessagesCard');
    if (allPre && allCard) {
      const parts = [
        `Pre-MA Announcement`,
        `TH:`,
        preTH,
        '',
        `EN:`,
        preEN,
        '',
        `MA Mode`,
        `TH:`,
        maTH,
        '',
        `EN:`,
        maEN
      ];
      allPre.textContent = parts.join('\n');
      allCard.classList.remove('hidden');
    }
  }

  function updateSlotWidth() {
    const inner = gridEl.querySelector('.tg-h');
    if (!inner) return;
    // Fit 48 hours (2 days) to container width regardless of interval
    const hours = 48; // 2 days
    const slotsPerHour = Math.max(1, Math.floor(60 / intervalMin));
    const cw = gridEl.clientWidth || inner.getBoundingClientRect().width;
    if (!cw) return;
    const slotWidth = Math.max(16, Math.floor((cw - 2) / (hours * slotsPerHour)));
    inner.style.setProperty('--slot-w', slotWidth + 'px');
  }

  // Emphasize 00:00 – 03:00 band (both days)
  function applyFocusBand() {
    const inner = gridEl.querySelector('.tg-h');
    if (!inner) return;
    const totalCols = currentSlotsPerDay * 2;
    const slotsPerHour = Math.max(1, Math.floor(60 / intervalMin));
    const start0 = 0; // 00:00 of day 0
    const end0 = 3 * slotsPerHour; // 03:00 of day 0
    const start1 = currentSlotsPerDay + 0; // 00:00 of day 1
    const end1 = currentSlotsPerDay + 3 * slotsPerHour; // 03:00 of day 1

    const timeCells = Array.from(inner.querySelectorAll('.htime'));
    const selCells = Array.from(inner.querySelectorAll('.hcell'));
    
    // Clear previous focus classes
    timeCells.forEach(cell => cell.classList.remove('focus', 'dim', 'focus-band', 'preferred'));
    selCells.forEach(cell => cell.classList.remove('focus', 'dim', 'focus-band', 'preferred'));
    
    for (let c = 0; c < totalCols; c++) {
      const inFocus = (c >= start0 && c < end0) || (c >= start1 && c < end1);
      const t = timeCells[c];
      const s = selCells[c];
      
      if (inFocus) {
        if (t) t.classList.add('preferred');
        if (s) s.classList.add('preferred');
      } else {
        // mild dim for non-preferred area
        if (t) t.classList.add('dim');
        if (s) s.classList.add('dim');
      }
    }
  }

  // Real-time rebuild grid on date change
  ['input', 'change'].forEach((evt) => {
    dateEl.addEventListener(evt, () => {
      selStart = null; selEnd = null;
      keyboardAnchor = null;
      focusLin = 0;
      updatePrettyDate();
      buildGrid();
      render();
    });
  });

  // Handle slot length toggle buttons
  function initSlotLengthToggle() {
    if (!slotLengthToggle) return;

    const buttons = slotLengthToggle.querySelectorAll('.slot-option');

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        buttons.forEach(btn => btn.classList.remove('active'));

        // Add active class to clicked button
        button.classList.add('active');

        // Update interval
        intervalMin = parseInt(button.dataset.value, 10) || 30;
        recomputeTimeConfig();

        // Clear selection and rebuild grid
        selStart = null;
        selEnd = null;
        keyboardAnchor = null;
        focusLin = 0;
        buildGrid();
        render();
      });
    });
  }

  // Rebuild grid when interval changes (if old dropdown still exists)
  if (intervalEl) {
    ['input', 'change'].forEach((evt) => {
      intervalEl.addEventListener(evt, () => {
        intervalMin = parseInt(intervalEl.value, 10) || 30;
        recomputeTimeConfig();
        selStart = null; selEnd = null;
        keyboardAnchor = null;
        focusLin = 0;
        buildGrid();
        render();
      });
    });
  }

  // Resize handler to keep grid compact across viewport changes
  window.addEventListener('resize', () => {
    updateSlotWidth();
    applyFocusBand();
  });

  // Zoom controls adjust label density (readability) without changing fit-to-width
  function adjustLabelStep(direction) {
    const slotW = computeSlotWidth();
    const steps = [1, 2, 3, 6];
    const current = labelStepOverride ?? defaultLabelStep(slotW);
    let idx = steps.indexOf(current);
    if (idx === -1) idx = steps.length - 1;
    if (direction === 'in') idx = Math.max(0, idx - 1); else idx = Math.min(steps.length - 1, idx + 1);
    labelStepOverride = steps[idx];
    buildGrid();
    render();
  }
  if (zoomInBtn) zoomInBtn.addEventListener('click', () => adjustLabelStep('in'));
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => adjustLabelStep('out'));

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      // Reset selection and outputs
      selStart = null; selEnd = null;
      keyboardAnchor = null;
      focusLin = 0;
      buildGrid();
      clearOutputs();
      render();
    });
  }

  // Copy buttons
  $$('.btn.ghost[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy');
      copyToClipboardById(targetId, btn);
    });
  });

  function updateSelectionFloat(e) {
    if (!selectionFloat) return;
    const model = computeSelection();
    if (!model) { selectionFloat.classList.add('hidden'); return; }
    const th = formatThaiDate(model.date);
    const en = formatEnglishDate(model.date);
    const crossTH = model.crossDay ? ' ของวันถัดไป' : '';
    const crossEN = model.crossDay ? ' next day' : '';
    selectionFloat.textContent = `${th.day} ${th.monthTH} ${th.yearBE} • ${model.startTime} – ${model.endTime}${crossTH} | ${en.day} ${en.monthEN} ${en.year} • ${model.startTime}–${model.endTime}${crossEN}`;
    setTimeout(() => positionTooltipRelativeToElement(selectionFloat, e.target), 0);
    selectionFloat.classList.remove('hidden');
  }

  // Clean separator/dash version for selection tooltip
  function updateSelectionFloatClean(e) {
    if (!selectionFloat) return;
    const model = computeSelection();
    if (!model) { selectionFloat.classList.add('hidden'); return; }
    const th = formatThaiDate(model.date);
    const en = formatEnglishDate(model.date);
    const crossTH = model.crossDay ? ' ของวันถัดไป' : '';
    const crossEN = model.crossDay ? ' next day' : '';
    selectionFloat.textContent = `${th.day} ${th.monthTH} ${th.yearBE} • ${model.startTime} – ${model.endTime}${crossTH} | ${en.day} ${en.monthEN} ${en.year} • ${model.startTime}–${model.endTime}${crossEN}`;
    setTimeout(() => positionTooltipRelativeToElement(selectionFloat, e.target), 0);
    selectionFloat.classList.remove('hidden');
  }

  function hideSelectionFloatSoon() {
    if (!selectionFloat) return;
    // Simplified: immediately hide without fade animation
    setTimeout(() => {
      selectionFloat.classList.add('hidden');
    }, 100);
  }

  function updateCompactSummary(model) {
    if (!sumDate || !sumTime || !sumSelection) return;
    const th = formatThaiDate(model.date);
    const en = formatEnglishDate(model.date);

    // Format as timeline: "Tuesday, 16 Sep 2025 · 12:30 – 19:00 next day"
    const a = Math.min(selStart ?? 0, selEnd ?? 0);
    const b = Math.max(selStart ?? 0, selEnd ?? 0);
    const slots = selectionEmpty() ? 0 : (b - a + 1);

    const templateDate = formatDateTemplate(model.date);
    const timeRange = model.crossDay ? `${model.startTime} – ${model.endTime} next day` : `${model.startTime} – ${model.endTime}`;
    const timelineText = `Maintenance Window: ${templateDate} ${timeRange}`;

    sumDate.textContent = timelineText;
    sumTime.textContent = ''; // Clear the separate time row
    sumSelection.textContent = ''; // Clear the separate selection row
  }

  function updateCompactSummary2(model) {
    if (!sumDate || !sumTime || !sumSelection) return;
    const en = formatEnglishDate(model.date);
    const a = Math.min(selStart ?? 0, selEnd ?? 0);
    const b = Math.max(selStart ?? 0, selEnd ?? 0);
    const slots = selectionEmpty() ? 0 : (b - a + 1);

    // Update to template format: "Maintenance Window: 24 Sep 2025 (Wed) 23:00 – 04:30 next day"
    const templateDate = formatDateTemplate(model.date);
    const timeRange = model.crossDay ? `${model.startTime} – ${model.endTime} next day` : `${model.startTime} – ${model.endTime}`;
    const timelineText = `Maintenance Window: ${templateDate} ${timeRange}`;

    sumDate.textContent = timelineText;
    sumTime.textContent = '';
    sumSelection.textContent = '';
  }

  // Initialize with enhanced features
  setTodayAsDefault();
  intervalMin = 30; // Default to 30 minutes
  recomputeTimeConfig();
  updatePrettyDate();
  clearOutputs();
  buildGrid();
  render();
  initSlotLengthToggle(); // Initialize the new toggle buttons

  // Quick pick: Select 00:00–03:00 on the selected date
  if (midnightBtn) {
    midnightBtn.addEventListener('click', () => {
      const slotsPerHour = Math.max(1, Math.floor(60 / intervalMin));
      const start = currentSlotsPerDay; // 00:00 of day 1 (the selected date)
      const end = 3 * slotsPerHour - 1; // inclusive end index
      selStart = start;
      selEnd = end;
      updateSelectionHighlight();
      render();
      // Scroll to view start cell
      const target = gridEl.querySelector(`.hcell[data-lin="${start}"]`);
      if (target) target.scrollIntoView({ inline: 'center', block: 'nearest' });
    });
  }
  
  // Removed loading animation MutationObserver for simpler UI
})();
