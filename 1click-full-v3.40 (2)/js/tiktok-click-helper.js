// ============================================================
// TikTok Click Helper — MAIN world script
// ============================================================
// รันใน MAIN world เพื่อเข้าถึง React internals
// รับคำสั่งจาก content script ผ่าน window.postMessage
// ============================================================

(function() {
  'use strict';

  console.log('[TikTok ClickHelper] MAIN world loaded');

  // ── รับคำสั่งจาก content script ──
  window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    if (!event.data || event.data.source !== 'tiktok-platform-cmd') return;

    const { action, payload, id } = event.data;
    let result = false;

    if (action === 'CLICK_BUTTON') {
      result = await clickButtonByLabel(payload.text);
    }

    if (action === 'CLICK_ELEMENT') {
      result = await clickElementByTextOrSelector(payload);
    }

    // คลิก Time item (ชั่วโมง/นาที) ใน dropdown
    if (action === 'CLICK_TIME_ITEM') {
      result = await clickTimeItem(payload.value, payload.column);
    }

    // คลิกวันที่ใน calendar
    if (action === 'CLICK_DATE_CELL') {
      result = await clickDateCell(payload.day);
    }

    // คลิก calendar nav (< หรือ >)
    if (action === 'CLICK_CALENDAR_NAV') {
      result = await clickCalendarNav(payload.direction);
    }

    // คลิก radio (Now / Schedule)
    if (action === 'CLICK_RADIO') {
      result = await clickRadio(payload.value);
    }

    // คลิก time/date input เพื่อเปิด dropdown
    if (action === 'CLICK_INPUT') {
      result = await clickInputByPattern(payload.pattern);
    }

    // ★ ตั้งเวลา/วันที่ Schedule โดยตรงผ่าน React fiber ★
    if (action === 'SET_SCHEDULE_DIRECT') {
      result = await setScheduleDirect(payload.time, payload.date);
    }

    // ★ Lock date value + fetch interception — absolute last resort ★
    if (action === 'LOCK_DATE_FALLBACK') {
      result = lockDateFallback(payload.targetDate, payload.currentDate);
    }

    // ★ Open calendar popup via React handlers ★
    if (action === 'OPEN_CALENDAR') {
      result = await openCalendarPopup();
    }

    // ★ PD-INSPIRED: DraftJS direct caption insertion (page context) ★
    if (action === 'SET_CAPTION_DRAFTJS') {
      result = await setCaptionViaDraftJS(payload.text);
    }

    // ★ PD-INSPIRED: Type hashtag via DraftJS (page context) ★
    if (action === 'TYPE_HASHTAG_DRAFTJS') {
      result = await typeHashtagInPageContext(payload.hashtag);
    }

    window.postMessage({ source: 'tiktok-platform-result', id, result }, '*');
  });

  // ── คลิกปุ่ม TUXButton จาก label text ──
  async function clickButtonByLabel(text) {
    console.log('[TikTok ClickHelper] clickButtonByLabel:', text);

    // หา .TUXButton-label ที่ text ตรง
    const labels = document.querySelectorAll('.TUXButton-label');
    for (const label of labels) {
      if (label.textContent.trim() !== text) continue;
      const btn = label.closest('button');
      if (!btn || btn.offsetParent === null) continue;

      console.log('[TikTok ClickHelper] Found button:', text, btn);

      // Scroll into view ก่อน
      btn.scrollIntoView({ block: 'center', behavior: 'instant' });
      await new Promise(r => setTimeout(r, 200));

      // วิธี 1: หา React __reactProps$ onClick โดยตรงบน button
      const propsClicked = callReactPropsOnClick(btn);
      if (propsClicked) {
        console.log('[TikTok ClickHelper] __reactProps$ onClick SUCCESS');
        return true;
      }

      // วิธี 2: หา onClick จาก __reactFiber$ traversal
      const fiberHandler = findReactFiberOnClick(btn);
      if (fiberHandler) {
        console.log('[TikTok ClickHelper] Found fiber onClick handler, calling...');
        try {
          const syntheticEvent = createSyntheticClickEvent(btn);
          fiberHandler(syntheticEvent);
          console.log('[TikTok ClickHelper] fiber onClick called SUCCESS');
          return true;
        } catch (e) {
          console.log('[TikTok ClickHelper] fiber onClick call error:', e);
        }
      }

      // วิธี 3: triggerReactClick — full pointer/mouse event sequence
      triggerReactClick(btn);

      // วิธี 4: triggerReactClick บน label + content
      triggerReactClick(label);
      const content = label.closest('.TUXButton-content');
      if (content) triggerReactClick(content);

      // วิธี 5: .click() ในบริบท MAIN world
      btn.click();
      console.log('[TikTok ClickHelper] All click methods fired for:', text);
      return true;
    }

    console.log('[TikTok ClickHelper] Button not found:', text);
    return false;
  }

  // ── หา __reactProps$ onClick โดยตรง ──
  function callReactPropsOnClick(el) {
    try {
      const keys = Object.keys(el);
      for (const key of keys) {
        if (key.startsWith('__reactProps$')) {
          const props = el[key];
          if (props && typeof props.onClick === 'function') {
            const syntheticEvent = createSyntheticClickEvent(el);
            props.onClick(syntheticEvent);
            return true;
          }
        }
      }
    } catch (e) {
      console.log('[TikTok ClickHelper] callReactPropsOnClick error:', e);
    }
    return false;
  }

  // ── traverse React fiber tree หา onClick handler ──
  function findReactFiberOnClick(el) {
    try {
      const keys = Object.keys(el);
      for (const key of keys) {
        if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
          let fiber = el[key];
          // traverse fiber tree ขึ้นไปหา onClick (สูงสุด 20 levels)
          for (let i = 0; i < 20 && fiber; i++) {
            if (fiber.memoizedProps && typeof fiber.memoizedProps.onClick === 'function') {
              return fiber.memoizedProps.onClick;
            }
            if (fiber.pendingProps && typeof fiber.pendingProps.onClick === 'function') {
              return fiber.pendingProps.onClick;
            }
            fiber = fiber.return;
          }
        }
      }
    } catch (e) {
      console.log('[TikTok ClickHelper] findReactFiberOnClick error:', e);
    }
    return null;
  }

  // ── สร้าง synthetic click event สำหรับ React handler ──
  // HTMLElement refs เป็น non-enumerable → ป้องกัน DataCloneError จาก TikTok IDB
  function createSyntheticClickEvent(el) {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const evt = Object.create(null);
    evt.type = 'click';
    evt.bubbles = true;
    evt.cancelable = true;
    evt.clientX = x;
    evt.clientY = y;
    evt.screenX = x;
    evt.screenY = y;
    evt.pageX = x + window.scrollX;
    evt.pageY = y + window.scrollY;
    evt.button = 0;
    evt.buttons = 0;
    evt.defaultPrevented = false;
    evt.eventPhase = 3;
    evt.isTrusted = true;
    Object.defineProperties(evt, {
      target: { get: () => el, enumerable: false },
      currentTarget: { get: () => el, enumerable: false },
      nativeEvent: { get: () => new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }), enumerable: false },
      preventDefault: { value: function() { evt.defaultPrevented = true; }, enumerable: false },
      stopPropagation: { value: function() {}, enumerable: false },
      isPropagationStopped: { value: function() { return false; }, enumerable: false },
      isDefaultPrevented: { value: function() { return evt.defaultPrevented; }, enumerable: false },
      persist: { value: function() {}, enumerable: false }
    });
    return evt;
  }

  // ── คลิก element จาก selector + optional text ──
  async function clickElementBySelector(selector, text) {
    console.log('[TikTok ClickHelper] clickElementBySelector:', selector, text);

    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      if (text && !el.textContent.includes(text)) continue;
      if (el.offsetParent === null) continue;

      const fiberClicked = triggerReactClick(el);
      if (fiberClicked) return true;

      el.click();
      return true;
    }
    return false;
  }

  // ── คลิก element จาก text + optional tag/toggleSelector ──
  async function clickElementByTextOrSelector(payload) {
    const { text, tag, selector, toggleSelector } = payload || {};
    console.log('[TikTok ClickHelper] clickElementByTextOrSelector:', text, tag, toggleSelector);

    // หา element ที่มี text ตรง
    const searchTag = tag || 'span, div, label';
    const elements = document.querySelectorAll(searchTag);
    for (const el of elements) {
      if (el.textContent.trim() !== text) continue;
      if (el.offsetParent === null) continue;

      // ถ้ามี toggleSelector — หา toggle ใกล้ๆ แล้วคลิก
      if (toggleSelector) {
        const container = el.closest('div');
        if (container) {
          const toggle = container.querySelector(toggleSelector);
          if (toggle) {
            triggerReactClick(toggle);
            toggle.click();
            console.log('[TikTok ClickHelper] Clicked toggle near:', text);
            return true;
          }
        }
      }

      // คลิก element เอง (หรือ parent ที่เป็น button/link)
      const clickTarget = el.closest('.more-btn, [data-e2e], button, a') || el;
      triggerReactClick(clickTarget);
      clickTarget.click();
      console.log('[TikTok ClickHelper] Clicked element:', text);
      return true;
    }

    // Fallback: ถ้ามี selector ลองใช้
    if (selector) {
      return await clickElementBySelector(selector, text);
    }

    console.log('[TikTok ClickHelper] Element not found:', text);
    return false;
  }

  // ── คลิก Time item (ชั่วโมง/นาที) ใน dropdown ──
  // ★ v2.62: ปรับปรุง selectors + เพิ่ม React __reactProps$ onClick ★
  async function clickTimeItem(value, column) {
    console.log('[TikTok ClickHelper] clickTimeItem:', value, column);
    const num = parseInt(value);
    const paddedValue = String(num).padStart(2, '0');

    // หา scroll columns ใน time picker — TikTok TUX components
    const scrollContainers = document.querySelectorAll(
      '[class*="scroll-container"], [class*="ScrollContainer"], [class*="time-picker"] [class*="column"], ' +
      '[class*="TimePicker"] > div, [class*="TUXTimePicker"] > div, [class*="tux-time"] > div, ' +
      '[class*="timepicker"] [class*="col"], [class*="time_picker"] > div'
    );

    console.log('[TikTok ClickHelper] scroll containers found:', scrollContainers.length);

    // วิธี 0 (NEW): หา containers ที่มี scroll area สูง — TikTok ใช้ div ที่ scrollable
    let scrollCols = [...scrollContainers];
    if (scrollCols.length < 2) {
      // หา scrollable div ที่อยู่ใน popup/dropdown
      const popups = document.querySelectorAll('[class*="popup"], [class*="Popup"], [class*="dropdown"], [class*="Dropdown"], [class*="floating"], [class*="Floating"], [class*="overlay"], [class*="panel"], [class*="Panel"]');
      for (const popup of popups) {
        if (popup.offsetParent === null) continue;
        const cols = popup.querySelectorAll('div');
        const scrollableCols = [...cols].filter(d => {
          if (d.childElementCount < 3) return false;
          const style = window.getComputedStyle(d);
          return (style.overflowY === 'auto' || style.overflowY === 'scroll' || d.scrollHeight > d.clientHeight + 10);
        });
        if (scrollableCols.length >= 2) {
          scrollCols = scrollableCols;
          console.log('[TikTok ClickHelper] Found scrollable cols in popup:', scrollableCols.length);
          break;
        }
      }
    }

    // วิธี 1: หาจาก scroll containers (ซ้าย = hour, ขวา = minute)
    if (scrollCols.length >= 2) {
      // Sort by x position เพื่อให้แน่ใจว่า column ถูก
      scrollCols.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
      const containerIdx = column === 'hour' ? 0 : (scrollCols.length > 2 ? 1 : scrollCols.length - 1);
      const container = scrollCols[containerIdx];
      const items = container.querySelectorAll('*');
      for (const item of items) {
        const text = (item.textContent || '').trim();
        if ((text === paddedValue || text === String(num)) && item.childElementCount === 0) {
          item.scrollIntoView({ block: 'center' });
          await new Promise(r => setTimeout(r, 300));
          // ลอง React props onClick ก่อน
          const propsClicked = callReactPropsOnClick(item);
          if (!propsClicked) triggerReactClick(item);
          console.log('[TikTok ClickHelper] Time item clicked from container:', text, 'propsClicked:', propsClicked);
          return true;
        }
      }
    }

    // วิธี 2: หาจาก all items แยกตาม x position
    const allEls = document.querySelectorAll(
      '[role="option"], [class*="item"], [class*="option"], [class*="cell"], [class*="Item"], [class*="Option"], ' +
      '[class*="TUX"] span, [class*="tux"] span'
    );
    const leftItems = [];
    const rightItems = [];
    let allVisibleItems = [];

    for (const item of allEls) {
      const text = (item.textContent || '').trim();
      if (!/^\d{1,2}$/.test(text)) continue;
      const rect = item.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      allVisibleItems.push({ el: item, text, num: parseInt(text), x: rect.left });
    }

    if (allVisibleItems.length > 0) {
      allVisibleItems.sort((a, b) => a.x - b.x);
      const midX = (allVisibleItems[0].x + allVisibleItems[allVisibleItems.length - 1].x) / 2;
      for (const item of allVisibleItems) {
        if (item.x <= midX) leftItems.push(item);
        else rightItems.push(item);
      }
    }

    const targetItems = column === 'hour' ? leftItems : rightItems;
    const match = targetItems.find(i => i.num === num);
    if (match) {
      match.el.scrollIntoView({ block: 'center' });
      await new Promise(r => setTimeout(r, 300));
      const propsClicked = callReactPropsOnClick(match.el);
      if (!propsClicked) triggerReactClick(match.el);
      console.log('[TikTok ClickHelper] Time item clicked via position:', match.text);
      return true;
    }

    // วิธี 3: Brute force — หาทุก element ที่มี text ตรง ใน popup area
    const allTextEls = document.querySelectorAll('div, span, li, td');
    for (const el of allTextEls) {
      const text = (el.textContent || '').trim();
      if ((text === paddedValue || text === String(num)) && el.childElementCount === 0) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const parent = el.closest('[class*="picker"], [class*="Picker"], [class*="dropdown"], [class*="Dropdown"], [class*="popup"], [class*="Popup"], [class*="overlay"], [class*="floating"], [class*="Floating"], [class*="panel"], [class*="Panel"]');
        if (!parent) continue;
        el.scrollIntoView({ block: 'center' });
        await new Promise(r => setTimeout(r, 300));
        const propsClicked = callReactPropsOnClick(el);
        if (!propsClicked) triggerReactClick(el);
        console.log('[TikTok ClickHelper] Time item clicked via brute force:', text);
        return true;
      }
    }

    console.log('[TikTok ClickHelper] Time item not found:', num, paddedValue, 'in', column);
    return false;
  }

  // ── คลิกวันที่ใน calendar ──
  async function clickDateCell(day) {
    console.log('[TikTok ClickHelper] clickDateCell:', day);
    const num = parseInt(day);

    const dayCells = document.querySelectorAll(
      'td, [role="gridcell"], [class*="day-span"], [class*="calendar"] div, [class*="Calendar"] div, [class*="calendar"] td, [class*="Calendar"] button, [class*="DatePicker"] div, [class*="DatePicker"] td, [class*="DatePicker"] span, [class*="TUXCalendar"] div, [class*="TUXCalendar"] td, [class*="date"] button'
    );

    // ★ เก็บ candidates ทั้งหมด แล้วเลือกตัวที่มี React onClick ★
    const candidates = [];
    for (const cell of dayCells) {
      const text = (cell.textContent || '').trim();
      if (text !== String(num)) continue;
      if (cell.childElementCount > 2) continue;
      if (cell.offsetParent === null) continue;
      const cls = (cell.className || '').toLowerCase();
      if (cls.includes('disabled') || cls.includes('outside') || cls.includes('other') || cls.includes('prev') || cls.includes('next')) continue;
      const rect = cell.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) continue;
      candidates.push(cell);
    }

    console.log('[TikTok ClickHelper] Date cell candidates:', candidates.length);

    // ★ เลือก candidate ที่มี React onClick ก่อน ★
    let bestCell = null;
    for (const cell of candidates) {
      let el = cell;
      for (let d = 0; d < 10 && el; d++) {
        const propsKey = Object.keys(el).find(k => k.startsWith('__reactProps$'));
        if (propsKey && el[propsKey]?.onClick) {
          bestCell = cell;
          break;
        }
        el = el.parentElement;
      }
      if (bestCell) break;
    }
    if (!bestCell && candidates.length > 0) bestCell = candidates[0];

    if (!bestCell) {
      console.log('[TikTok ClickHelper] Date cell not found:', num);
      return false;
    }

    console.log('[TikTok ClickHelper] Date cell found:', bestCell.tagName, bestCell.className?.substring(0, 60));

    // ★ วิธี 1: React __reactProps$ onClick ★
    let handlerCalled = callReactPropsOnClick(bestCell);
    if (!handlerCalled) {
      // ไล่ขึ้น parent
      let parent = bestCell.parentElement;
      for (let d = 0; d < 8 && parent && !handlerCalled; d++) {
        handlerCalled = callReactPropsOnClick(parent);
        parent = parent.parentElement;
      }
    }

    // ★ วิธี 2: React fiber onClick ★
    if (!handlerCalled) {
      const fiberHandler = findReactFiberOnClick(bestCell);
      if (fiberHandler) {
        try {
          const syntheticEvent = createSyntheticClickEvent(bestCell);
          fiberHandler(syntheticEvent);
          handlerCalled = true;
          console.log('[TikTok ClickHelper] Date cell clicked via fiber handler');
        } catch (e) {
          console.log('[TikTok ClickHelper] fiber handler error:', e);
        }
      }
    }

    // ★ วิธี 3: triggerReactClick (full pointer/mouse events) ★
    if (!handlerCalled) {
      triggerReactClick(bestCell);
      console.log('[TikTok ClickHelper] Date cell clicked via triggerReactClick');
    }

    return true;
  }

  // ── คลิก calendar nav (< หรือ >) ──
  async function clickCalendarNav(direction) {
    console.log('[TikTok ClickHelper] clickCalendarNav:', direction);
    // direction: 'next' หรือ 'prev'
    const btns = document.querySelectorAll('[class*="calendar"] button, [class*="Calendar"] button');
    
    // ปุ่ม nav มักเป็นปุ่มแรก (prev) และปุ่มสุดท้าย (next) ใน calendar header
    const navBtns = Array.from(btns).filter(b => {
      const text = (b.textContent || '').trim();
      return text === '<' || text === '>' || text === '‹' || text === '›' || 
             b.querySelector('svg') !== null;
    });

    if (direction === 'next' && navBtns.length > 0) {
      const btn = navBtns[navBtns.length - 1]; // สุดท้าย = next
      const clicked = triggerReactClick(btn);
      if (!clicked) btn.click();
      return true;
    }
    if (direction === 'prev' && navBtns.length > 0) {
      const btn = navBtns[0]; // แรก = prev
      const clicked = triggerReactClick(btn);
      if (!clicked) btn.click();
      return true;
    }
    return false;
  }

  // ── คลิก radio (Now / Schedule) ──
  // ★ v2.62: ปรับปรุง — หาจาก text label ก่อน แล้วเดินขึ้น parent หา radio/onClick ★
  async function clickRadio(value) {
    console.log('[TikTok ClickHelper] clickRadio:', value);

    // วิธี 1: หา input[type="radio"] ที่มี name หรือ value ตรง
    const radios = document.querySelectorAll('input[type="radio"]');
    for (const radio of radios) {
      // เช็คทั้ง value และ text ใกล้เคียง
      const parentText = (radio.closest('label') || radio.parentElement)?.textContent?.trim() || '';
      const isTarget = (value === 'schedule' && (radio.value === 'schedule' || parentText === 'Schedule'))
                    || (value === 'now' && (radio.value === 'now' || parentText === 'Now' || (radio.value !== 'schedule' && parentText !== 'Schedule')));
      if (!isTarget) continue;

      console.log('[TikTok ClickHelper] Found radio, value:', radio.value, 'parentText:', parentText);

      // คลิกหลายชั้น: radio circle → label → radio element
      const circle = radio.closest('span[class*="Radio__circle"]') || radio.closest('span[class*="Radio"]');
      const label = radio.closest('label');
      const container = circle || label || radio.parentElement;

      // ลอง React __reactProps$ onClick บน container + parents
      let handlerCalled = false;
      let el = container;
      for (let depth = 0; depth < 10 && el; depth++) {
        const propsClicked = callReactPropsOnClick(el);
        if (propsClicked) {
          handlerCalled = true;
          console.log('[TikTok ClickHelper] Radio React onClick called at depth:', depth, el.tagName);
          break;
        }
        el = el.parentElement;
      }

      if (!handlerCalled) {
        triggerReactClick(container);
        if (label && label !== container) triggerReactClick(label);
        if (!radio.checked) {
          triggerReactClick(radio);
          radio.click();
        }
      }

      console.log('[TikTok ClickHelper] Radio clicked:', value, 'checked:', radio.checked);
      return true;
    }

    // วิธี 2: หาจาก text label "Schedule" / "Now" แล้ว trigger React onClick
    const labels = document.querySelectorAll('span, label, div');
    for (const lbl of labels) {
      const text = (lbl.textContent || '').trim();
      if (!((value === 'schedule' && text === 'Schedule') || (value === 'now' && text === 'Now'))) continue;
      if (lbl.offsetParent === null) continue;
      // ตรวจว่าเป็น label ใน radio area (ไม่ใช่ header/title)
      const rect = lbl.getBoundingClientRect();
      if (rect.width > 300 || rect.height > 80) continue;

      console.log('[TikTok ClickHelper] Found label:', text);

      // เดินขึ้น parent เพื่อหา React onClick handler
      let handlerCalled = false;
      let el = lbl;
      for (let depth = 0; depth < 15 && el; depth++) {
        const propsClicked = callReactPropsOnClick(el);
        if (propsClicked) {
          handlerCalled = true;
          console.log('[TikTok ClickHelper] Label React onClick called at depth:', depth, el.tagName);
          break;
        }
        el = el.parentElement;
      }

      if (!handlerCalled) {
        triggerReactClick(lbl);
        lbl.click();
      }
      return true;
    }

    console.log('[TikTok ClickHelper] Radio not found:', value);
    return false;
  }

  // ── คลิก time/date input เพื่อเปิด dropdown ──
  // ★ v2.62: เพิ่ม fallback selectors + React __reactProps$ onClick ★
  async function clickInputByPattern(pattern) {
    console.log('[TikTok ClickHelper] clickInputByPattern:', pattern);
    const regex = new RegExp(pattern);

    // หา input จากหลาย selectors
    const selectors = [
      'input.TUXTextInputCore-input[readonly]',
      'input[readonly]',
      'input[class*="TUXTextInput"]',
      'input[class*="tux"]'
    ];

    for (const sel of selectors) {
      const inputs = document.querySelectorAll(sel);
      for (const inp of inputs) {
        if (!regex.test(inp.value)) continue;
        console.log('[TikTok ClickHelper] Found input matching pattern:', inp.value, 'class:', inp.className?.substring(0, 50));

        const container = inp.closest('div[class*="TUXTextInput"]')
          || inp.closest('div[class*="DatePicker"]')
          || inp.closest('div[class*="TimePicker"]')
          || inp.parentElement;

        // ลอง React __reactProps$ onClick บน container + parents
        let handlerCalled = false;
        let el = container;
        for (let depth = 0; depth < 10 && el; depth++) {
          const propsClicked = callReactPropsOnClick(el);
          if (propsClicked) {
            handlerCalled = true;
            console.log('[TikTok ClickHelper] Input React onClick called at depth:', depth, el.tagName);
            break;
          }
          el = el.parentElement;
        }

        if (!handlerCalled) {
          triggerReactClick(container);
          triggerReactClick(inp);
          container.click();
        }

        console.log('[TikTok ClickHelper] Input clicked:', inp.value, 'handlerCalled:', handlerCalled);
        return true;
      }
    }
    return false;
  }

  // ── คลิก element แบบ React-compatible ──
  // React 17+ delegate events ที่ root container
  // dispatch PointerEvent + MouseEvent ใน MAIN world จะ bubble ถึง root → React จะ process
  function triggerReactClick(element) {
    if (!element) return false;
    try {
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      const commonOpts = {
        bubbles: true, cancelable: true, composed: true, view: window,
        clientX: x, clientY: y, screenX: x, screenY: y,
        button: 0, buttons: 1
      };

      // Full pointer + mouse event sequence ที่ React จะ recognize
      element.dispatchEvent(new PointerEvent('pointerover', commonOpts));
      element.dispatchEvent(new PointerEvent('pointerenter', { ...commonOpts, bubbles: false }));
      element.dispatchEvent(new MouseEvent('mouseover', commonOpts));
      element.dispatchEvent(new MouseEvent('mouseenter', { ...commonOpts, bubbles: false }));
      element.dispatchEvent(new PointerEvent('pointerdown', commonOpts));
      element.dispatchEvent(new MouseEvent('mousedown', commonOpts));

      // Focus
      element.focus();

      element.dispatchEvent(new PointerEvent('pointerup', { ...commonOpts, buttons: 0 }));
      element.dispatchEvent(new MouseEvent('mouseup', { ...commonOpts, buttons: 0 }));

      // Click event — React ใช้ click event ที่ bubble ถึง root
      element.dispatchEvent(new PointerEvent('click', { ...commonOpts, buttons: 0 }));
      element.dispatchEvent(new MouseEvent('click', { ...commonOpts, buttons: 0 }));

      // Native .click() ด้วย
      element.click();

      console.log('[TikTok ClickHelper] triggerReactClick dispatched at:', x.toFixed(0), y.toFixed(0));
      return true;
    } catch (err) {
      console.error('[TikTok ClickHelper] triggerReactClick error:', err);
      return false;
    }
  }

  // ── ตั้ง Schedule โดยตรงผ่าน React fiber — ไม่ต้องเปิด dropdown/calendar ──
  async function setScheduleDirect(timeStr, dateStr) {
    console.log('[TikTok ClickHelper] setScheduleDirect:', timeStr, dateStr);
    let timeSet = false, dateSet = false;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    const nativeGetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').get;

    // Helper: สร้าง event object โดยใช้ Proxy — ไม่เปลี่ยน DOM value (ป้องกัน false positive)
    function makeChangeEvent(inputEl, newValue) {
      const proxyTarget = new Proxy(inputEl, {
        get(target, prop) {
          if (prop === 'value') return newValue;
          const val = Reflect.get(target, prop);
          return typeof val === 'function' ? val.bind(target) : val;
        }
      });
      return {
        target: proxyTarget,
        currentTarget: proxyTarget,
        type: 'change',
        bubbles: true,
        cancelable: true,
        defaultPrevented: false,
        isTrusted: true,
        nativeEvent: new Event('change', { bubbles: true }),
        preventDefault: function() {},
        stopPropagation: function() {},
        persist: function() {}
      };
    }

    // Helper: ลองเรียก handler — เช็คว่า React state เปลี่ยนจริง (ไม่ใช่แค่ DOM)
    async function tryHandler(handler, input, args, label, targetValue) {
      const origValue = nativeGetter.call(input);
      for (const arg of args) {
        try {
          // Reset value ก่อนทุกครั้งเพื่อให้ detect ได้ถูก
          nativeSetter.call(input, origValue);
          await new Promise(r => setTimeout(r, 50));

          if (Array.isArray(arg) && arg._multiArg) {
            handler(...arg);
          } else {
            handler(arg);
          }

          // รอ React re-render
          await new Promise(r => setTimeout(r, 500));
          const argType = Array.isArray(arg) && arg._multiArg ? 'multi-arg(' + arg.length + ')' : typeof arg === 'object' ? (arg?.target ? 'event' : 'object') : typeof arg;
          const currentVal = nativeGetter.call(input);
          console.log('[TikTok ClickHelper]', label, '— tried', argType, '→ value:', currentVal, '| target:', targetValue, '| orig:', origValue);

          if (currentVal === targetValue) {
            console.log('[TikTok ClickHelper] ✅ Handler updated React state!', label);
            return true;
          }
        } catch (e) {
          console.log('[TikTok ClickHelper]', label, 'error:', e.message);
        }
      }
      return false;
    }

    // Helper: ลองทุก handler ที่หาเจอ — ไล่ fiber depth จาก input + parent elements
    async function tryAllHandlers(input, targetValue, handlerNames, argsFn) {
      const tried = new Set();
      let el = input;
      for (let elDepth = 0; elDepth < 25 && el; elDepth++) {
        const keys = Object.keys(el);
        for (const key of keys) {
          if (!key.startsWith('__reactFiber$') && !key.startsWith('__reactInternalInstance$')) continue;
          let fiber = el[key];
          for (let fi = 0; fi < 40 && fiber; fi++) {
            const props = fiber.memoizedProps || fiber.pendingProps;
            if (props) {
              for (const name of handlerNames) {
                const fn = props[name];
                if (typeof fn === 'function' && !tried.has(fn)) {
                  tried.add(fn);
                  console.log('[TikTok ClickHelper] Trying', name, 'at el-depth:', elDepth, 'fiber-depth:', fi, el.tagName);
                  const args = argsFn(input, targetValue);
                  if (await tryHandler(fn, input, args, name + '@' + elDepth + '/' + fi, targetValue)) return true;
                }
              }
            }
            fiber = fiber.return;
          }
        }
        for (const key of keys) {
          if (!key.startsWith('__reactProps$')) continue;
          const props = el[key];
          if (!props) continue;
          for (const name of handlerNames) {
            const fn = props[name];
            if (typeof fn === 'function' && !tried.has(fn)) {
              tried.add(fn);
              console.log('[TikTok ClickHelper] Trying props.', name, 'at el-depth:', elDepth, el.tagName);
              const args = argsFn(input, targetValue);
              if (await tryHandler(fn, input, args, 'props.' + name + '@' + elDepth, targetValue)) return true;
            }
          }
        }
        el = el.parentElement;
      }
      return false;
    }

    // ── React state hook approach — walk fiber tree + scan for timestamps/ISO/nested ──
    async function setDateViaReactState(input, targetDate) {
      const fiberKey = Object.keys(input).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
      if (!fiberKey) { console.log('[TikTok ClickHelper] No fiber key found'); return false; }

      let fiber = input[fiberKey];
      const currentDate = nativeGetter.call(input);
      const dateObj = new Date(targetDate + 'T00:00:00');
      // Timestamp ranges for current date (for matching Unix timestamps)
      const curDayStart = new Date(currentDate + 'T00:00:00').getTime();
      const curDayEnd = curDayStart + 86400000;
      const dayOffset = new Date(targetDate + 'T00:00:00').getTime() - curDayStart;

      function isDateMatch(val) {
        if (typeof val === 'string') {
          if (/^\d{4}-\d{2}-\d{2}$/.test(val) && val === currentDate) return 'date-string';
          if (val.startsWith(currentDate)) return 'iso-string';
        }
        if (typeof val === 'number' && val > 1000000000 && val < 9999999999) {
          // Unix seconds
          const ms = val * 1000;
          if (ms >= curDayStart && ms < curDayEnd) return 'unix-sec';
        }
        if (typeof val === 'number' && val > 1000000000000 && val < 9999999999999) {
          // Unix milliseconds
          if (val >= curDayStart && val < curDayEnd) return 'unix-ms';
        }
        if (val instanceof Date) {
          if (val.getTime() >= curDayStart && val.getTime() < curDayEnd) return 'date-obj';
        }
        if (val && typeof val === 'object' && val.$d instanceof Date) {
          if (val.$d.getTime() >= curDayStart && val.$d.getTime() < curDayEnd) return 'dayjs';
        }
        return null;
      }

      function makeNewValue(val, matchType) {
        if (matchType === 'date-string') return targetDate;
        if (matchType === 'iso-string') return val.replace(currentDate, targetDate);
        if (matchType === 'unix-sec') return val + Math.round(dayOffset / 1000);
        if (matchType === 'unix-ms') return val + dayOffset;
        if (matchType === 'date-obj') return new Date(val.getTime() + dayOffset);
        if (matchType === 'dayjs') return targetDate;
        return targetDate;
      }

      // Deep scan: check any value or object keys for date matches
      function scanObject(val, maxDepth) {
        if (maxDepth <= 0 || val == null) return [];
        const matches = [];
        const mt = isDateMatch(val);
        if (mt) { matches.push({ val, matchType: mt, key: null }); return matches; }
        if (typeof val === 'object' && !Array.isArray(val) && !(val instanceof HTMLElement) && !(val instanceof Event)) {
          try {
            for (const k of Object.keys(val).slice(0, 50)) {
              const v = val[k];
              const vmt = isDateMatch(v);
              if (vmt) matches.push({ val: v, matchType: vmt, key: k, parentObj: val });
              if (typeof v === 'object' && v !== null && !(v instanceof HTMLElement) && maxDepth > 1) {
                for (const sub of scanObject(v, maxDepth - 1)) {
                  matches.push({ ...sub, parentKey: k });
                }
              }
            }
          } catch (e) {}
        }
        return matches;
      }

      const SKIP_TS_KEYS = new Set([
        'mediaEventTimeStamp', 'startedTimeStamp', 'fulfilledTimeStamp',
        'lastEditorPreviewVideoLoadedTimeStamp', 'timestamp', 'createdAt',
        'updatedAt', 'lastModified', 'responseTime', 'requestTime',
        'loadTime', 'renderTime', 'fetchTime', 'completedAt'
      ]);

      for (let depth = 0; depth < 80 && fiber; depth++) {
        // Function component hooks
        if (fiber.memoizedState) {
          let hook = fiber.memoizedState;
          let hookIdx = 0;
          while (hook) {
            const val = hook.memoizedState;
            if (val != null && typeof val !== 'boolean') {
              const rawMatches = scanObject(val, 3);
              const matches = rawMatches.filter(m => {
                if (!m.key) return true;
                return !SKIP_TS_KEYS.has(m.key) && !SKIP_TS_KEYS.has(m.parentKey);
              });
              for (const m of matches) {
                console.log('[TikTok ClickHelper] [scan] depth', depth, 'hook', hookIdx, '→', m.matchType, m.key || '', typeof m.val === 'string' ? m.val.substring(0, 40) : m.val);

                if (hook.queue && typeof hook.queue.dispatch === 'function') {
                  console.log('[TikTok ClickHelper] 🎯 Dispatching at depth', depth, 'hook', hookIdx, 'matchType:', m.matchType);
                  try {
                    if (m.key && m.parentObj) {
                      // Object with date key → update the key
                      const newObj = { ...m.parentObj, [m.key]: makeNewValue(m.val, m.matchType) };
                      hook.queue.dispatch(newObj);
                    } else {
                      hook.queue.dispatch(makeNewValue(val, m.matchType));
                    }
                    await new Promise(r => setTimeout(r, 800));
                    if (nativeGetter.call(input) === targetDate) {
                      console.log('[TikTok ClickHelper] ✅ Date set via state dispatch!');
                      return true;
                    }
                  } catch (e) { console.log('[TikTok ClickHelper] dispatch error:', e.message); }
                }
              }
            }
            hook = hook.next;
            hookIdx++;
          }
        }

        // Class component state
        if (fiber.stateNode && fiber.stateNode !== window && fiber.stateNode.state && typeof fiber.stateNode.setState === 'function') {
          const state = fiber.stateNode.state;
          const matches = scanObject(state, 3);
          for (const m of matches) {
            console.log('[TikTok ClickHelper] [scan-class] depth', depth, '→', m.matchType, m.key, typeof m.val === 'string' ? m.val.substring(0, 40) : m.val);
            try {
              if (m.key) {
                fiber.stateNode.setState({ [m.key]: makeNewValue(m.val, m.matchType) });
              }
              await new Promise(r => setTimeout(r, 800));
              if (nativeGetter.call(input) === targetDate) {
                console.log('[TikTok ClickHelper] ✅ Date set via class setState!');
                return true;
              }
            } catch (e) { console.log('[TikTok ClickHelper] setState error:', e.message); }
          }
        }

        fiber = fiber.return;
      }
      console.log('[TikTok ClickHelper] React state hook approach: no matching state found');
      return false;
    }

    // ── Open calendar popup via React handlers ──
    async function openCalendarPopup() {
      console.log('[TikTok ClickHelper] openCalendarPopup — finding date input...');
      const inputs = document.querySelectorAll('input.TUXTextInputCore-input[readonly], input[readonly]');
      let dateInput = null;
      for (const inp of inputs) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(inp.value)) { dateInput = inp; break; }
      }
      if (!dateInput) return { success: false, error: 'no date input' };

      const box = dateInput.closest('.TUXInputBox') || dateInput.closest('div[class*="InputBox"]') || dateInput.parentElement?.parentElement;
      const icon = dateInput.parentElement?.querySelector('[class*="leadingIcon"], [class*="Icon"], svg');
      const field = dateInput.closest('.TUXTextField') || dateInput.closest('div[class*="TextField"]');
      const core = dateInput.closest('.TUXTextInputCore') || dateInput.parentElement;
      const targets = [icon, box, core, field, dateInput].filter(Boolean);

      let opened = false;
      for (const el of targets) {
        if (opened) break;
        const keys = Object.keys(el);
        for (const key of keys) {
          if (opened) break;
          if (!key.startsWith('__reactProps$')) continue;
          const props = el[key];
          for (const handler of ['onClick', 'onMouseDown', 'onFocus', 'onPointerDown']) {
            if (typeof props?.[handler] === 'function') {
              try {
                const rect = el.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                const evt = Object.create(null);
                evt.type = handler.replace('on', '').toLowerCase();
                evt.bubbles = true; evt.cancelable = true; evt.clientX = x; evt.clientY = y;
                evt.button = 0; evt.isTrusted = true; evt.defaultPrevented = false;
                Object.defineProperties(evt, {
                  target: { get: () => dateInput, enumerable: false },
                  currentTarget: { get: () => el, enumerable: false },
                  nativeEvent: { get: () => new MouseEvent('click', { bubbles: true }), enumerable: false },
                  preventDefault: { value: () => {}, enumerable: false },
                  stopPropagation: { value: () => {}, enumerable: false },
                  persist: { value: () => {}, enumerable: false }
                });
                props[handler](evt);
                console.log('[TikTok ClickHelper] OPEN_CALENDAR: called', handler, 'on', el.tagName, el.className?.substring(0, 50));
                opened = true;
              } catch (e) { console.log('[TikTok ClickHelper] OPEN_CALENDAR handler error:', e.message); }
              break;
            }
          }
        }
        if (!opened) {
          for (const key of Object.keys(el)) {
            if (opened) break;
            if (!key.startsWith('__reactFiber$')) continue;
            let fiber = el[key];
            for (let fi = 0; fi < 15 && fiber; fi++) {
              const props = fiber.memoizedProps || fiber.pendingProps;
              for (const handler of ['onClick', 'onMouseDown', 'onFocus']) {
                if (typeof props?.[handler] === 'function') {
                  try {
                    const rect = el.getBoundingClientRect();
                    const evt = Object.create(null);
                    evt.type = 'click'; evt.bubbles = true; evt.clientX = rect.left + rect.width/2; evt.clientY = rect.top + rect.height/2;
                    evt.button = 0; evt.isTrusted = true; evt.defaultPrevented = false;
                    Object.defineProperties(evt, {
                      target: { get: () => dateInput, enumerable: false },
                      currentTarget: { get: () => el, enumerable: false },
                      nativeEvent: { get: () => new MouseEvent('click', { bubbles: true }), enumerable: false },
                      preventDefault: { value: () => {}, enumerable: false },
                      stopPropagation: { value: () => {}, enumerable: false },
                      persist: { value: () => {}, enumerable: false }
                    });
                    props[handler](evt);
                    console.log('[TikTok ClickHelper] OPEN_CALENDAR: fiber', handler, 'at depth', fi);
                    opened = true;
                  } catch (e) {}
                  break;
                }
              }
              fiber = fiber.return;
            }
          }
        }
      }

      if (!opened) {
        for (const el of targets) {
          triggerReactClick(el);
        }
        console.log('[TikTok ClickHelper] OPEN_CALENDAR: fallback triggerReactClick on all targets');
        opened = true;
      }

      return { success: opened, value: dateInput.value };
    }

    // ── Lock date value + Fetch Interception — ABSOLUTE LAST RESORT ──
    function lockDateFallback(targetValue, currentValue) {
      console.log('[TikTok ClickHelper] 🔒 LOCK_DATE_FALLBACK:', currentValue, '→', targetValue);
      const origDesc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

      const inputs = document.querySelectorAll('input.TUXTextInputCore-input[readonly], input[readonly]');
      let dateInput = null;
      for (const inp of inputs) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(origDesc.get.call(inp))) { dateInput = inp; break; }
      }
      if (!dateInput) { console.log('[TikTok ClickHelper] 🔒 No date input found'); return false; }

      origDesc.set.call(dateInput, targetValue);
      Object.defineProperty(dateInput, 'value', {
        get() { return targetValue; },
        set(v) { if (v === targetValue) origDesc.set.call(this, v); },
        configurable: true
      });

      // ── Fetch/XHR Interception — ONLY patch schedule-related fields ──
      const targetDayStart = new Date(targetValue + 'T00:00:00').getTime();
      const curDayStart = new Date(currentValue + 'T00:00:00').getTime();
      const dayOffsetSec = Math.round((targetDayStart - curDayStart) / 1000);
      const origFetch = window.fetch;
      const origXhrSend = XMLHttpRequest.prototype.send;

      const SCHEDULE_FIELDS = ['schedule_time', 'publish_time', 'scheduled_publish_time', 'publish_timestamp', 'schedule_publish_time'];

      function patchBody(body) {
        if (!body || typeof body !== 'string') return body;
        let patched = body;
        patched = patched.split(currentValue).join(targetValue);
        if (patched !== body) return patched;

        try {
          const parsed = JSON.parse(body);
          let modified = false;
          for (const field of SCHEDULE_FIELDS) {
            if (parsed[field] != null) {
              const v = parsed[field];
              if (typeof v === 'number' && v > 1000000000 && v < 9999999999) {
                console.log('[TikTok ClickHelper] 📡 Patched', field, '(sec):', v, '→', v + dayOffsetSec);
                parsed[field] = v + dayOffsetSec;
                modified = true;
              } else if (typeof v === 'number' && v > 1000000000000) {
                console.log('[TikTok ClickHelper] 📡 Patched', field, '(ms):', v, '→', v + dayOffsetSec * 1000);
                parsed[field] = v + dayOffsetSec * 1000;
                modified = true;
              } else if (typeof v === 'string' && v.includes(currentValue)) {
                parsed[field] = v.replace(currentValue, targetValue);
                modified = true;
              }
            }
          }
          if (modified) return JSON.stringify(parsed);
        } catch (e) {}

        return body;
      }

      window.fetch = async function(...args) {
        let [url, options] = args;
        if (options?.body && typeof options.body === 'string') {
          const patched = patchBody(options.body);
          if (patched !== options.body) {
            console.log('[TikTok ClickHelper] 📡 Fetch intercepted — schedule patched:', url?.toString()?.substring(0, 80));
            options = { ...options, body: patched };
            return origFetch.call(this, url, options);
          }
        }
        return origFetch.apply(this, args);
      };

      XMLHttpRequest.prototype.send = function(body) {
        if (body && typeof body === 'string') {
          const patched = patchBody(body);
          if (patched !== body) {
            console.log('[TikTok ClickHelper] 📡 XHR intercepted — schedule patched');
            return origXhrSend.call(this, patched);
          }
        }
        return origXhrSend.call(this, body);
      };

      console.log('[TikTok ClickHelper] 📡 Schedule interception active (old:', currentValue, '→ new:', targetValue, ')');

      setTimeout(() => {
        try { delete dateInput.value; } catch (e) {}
        window.fetch = origFetch;
        XMLHttpRequest.prototype.send = origXhrSend;
        console.log('[TikTok ClickHelper] 🔓 Date lock + interception removed');
      }, 60000);

      return true;
    }

    const inputs = document.querySelectorAll('input.TUXTextInputCore-input[readonly]');
    for (const input of inputs) {
      // ── Time input ──
      if (!timeSet && /^\d{1,2}:\d{2}$/.test(input.value) && timeStr) {
        console.log('[TikTok ClickHelper] Found time input:', input.value);
        const timeHandlerNames = ['onChange', 'onTimeChange', 'onSelect', 'onValueChange'];
        const makeTimeArgs = (inp, val) => [
          makeChangeEvent(inp, val),
          val,
          { target: { value: val } }
        ];
        timeSet = await tryAllHandlers(input, timeStr, timeHandlerNames, makeTimeArgs);
        if (!timeSet) {
          try {
            nativeSetter.call(input, timeStr);
            const tracker = input._valueTracker;
            if (tracker) tracker.setValue('');
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(r => setTimeout(r, 300));
            if (input.value === timeStr) { timeSet = true; console.log('[TikTok ClickHelper] Time set via nativeSetter+tracker'); }
          } catch (e) { console.log('[TikTok ClickHelper] nativeSetter time error:', e); }
        }
      }

      // ── Date input ──
      if (!dateSet && /^\d{4}-\d{2}-\d{2}$/.test(input.value) && dateStr) {
        console.log('[TikTok ClickHelper] Found date input:', input.value, '→ target:', dateStr);
        if (input.value === dateStr) {
          console.log('[TikTok ClickHelper] Date already matches target!');
          dateSet = true;
          continue;
        }

        const dateObj = new Date(dateStr + 'T00:00:00');
        const dayjsLike = {
          format: (f) => dateStr,
          toDate: () => dateObj,
          valueOf: () => dateObj.getTime(),
          toString: () => dateStr,
          toISOString: () => dateObj.toISOString(),
          $d: dateObj, $y: dateObj.getFullYear(), $M: dateObj.getMonth(), $D: dateObj.getDate(),
          $H: 0, $m: 0, $s: 0, $ms: 0, $W: dateObj.getDay(), $L: 'en',
          isValid: () => true,
          clone: function() { return this; },
          isSame: () => false, isBefore: () => false, isAfter: () => false,
          year: () => dateObj.getFullYear(), month: () => dateObj.getMonth(),
          date: () => dateObj.getDate(), day: () => dateObj.getDay(),
          hour: () => 0, minute: () => 0, second: () => 0,
          startOf: function() { return this; }, endOf: function() { return this; },
          add: function() { return this; }, subtract: function() { return this; },
          locale: function() { return this; },
          unix: () => Math.floor(dateObj.getTime() / 1000)
        };

        const multiArg1 = [dayjsLike, dateStr]; multiArg1._multiArg = true;
        const multiArg2 = [dateObj, dateStr]; multiArg2._multiArg = true;
        const multiArg3 = [dayjsLike]; multiArg3._multiArg = true;

        const dateHandlerNames = ['onChange', 'onDateChange', 'onSelect', 'onValueChange', 'onDateSelect', 'onPanelChange'];
        const makeDateArgs = (inp, val) => [
          multiArg1,
          multiArg2,
          dayjsLike,
          makeChangeEvent(inp, val),
          multiArg3,
          val,
          dateObj,
          { target: { value: val } },
        ];

        // Approach 1: Try React handlers
        dateSet = await tryAllHandlers(input, dateStr, dateHandlerNames, makeDateArgs);

        // Approach 2: React state hook walk
        if (!dateSet) {
          console.log('[TikTok ClickHelper] Trying React state hook approach...');
          dateSet = await setDateViaReactState(input, dateStr);
        }

        // Approach 3: nativeSetter + _valueTracker
        if (!dateSet) {
          try {
            nativeSetter.call(input, dateStr);
            const tracker = input._valueTracker;
            if (tracker) tracker.setValue('');
            input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            await new Promise(r => setTimeout(r, 600));
            if (nativeGetter.call(input) === dateStr) {
              dateSet = true;
              console.log('[TikTok ClickHelper] Date set via nativeSetter+tracker ✅');
            } else {
              console.log('[TikTok ClickHelper] nativeSetter: value still', nativeGetter.call(input));
            }
          } catch (e) { console.log('[TikTok ClickHelper] nativeSetter date error:', e); }
        }

        if (!dateSet) {
          console.log('[TikTok ClickHelper] All React approaches failed — calendar click needed');
        }
      }
    }

    console.log('[TikTok ClickHelper] setScheduleDirect result — timeSet:', timeSet, 'dateSet:', dateSet);
    return { timeSet, dateSet };
  }

  // ★★★ PD-INSPIRED: DraftJS direct caption insertion ★★★
  // เข้าถึง DraftJS editor state โดยตรงจาก page context (เหมือน PD's tiktok-injected.js)
  async function setCaptionViaDraftJS(text) {
    console.log('[TikTok ClickHelper] setCaptionViaDraftJS:', text?.substring(0, 50));
    
    // Method 1: Find DraftJS editor via React fiber
    const editors = document.querySelectorAll('[contenteditable="true"], .DraftEditor-root, [class*="DraftEditor"], .notranslate[role="textbox"]');
    for (const editor of editors) {
      if (editor.offsetParent === null) continue;
      const rect = editor.getBoundingClientRect();
      if (rect.height < 20 || rect.width < 100) continue;

      // Walk fiber tree to find editorState
      const fiberKey = Object.keys(editor).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
      if (!fiberKey) continue;

      let fiber = editor[fiberKey];
      for (let depth = 0; depth < 40 && fiber; depth++) {
        const props = fiber.memoizedProps || fiber.pendingProps;
        
        // Check for onChange handler + editorState (DraftJS pattern)
        if (props?.editorState && typeof props?.onChange === 'function') {
          console.log('[TikTok ClickHelper] Found DraftJS editorState at depth:', depth);
          try {
            const EditorState = props.editorState.constructor;
            const ContentState = props.editorState.getCurrentContent().constructor;

            // Create new content with the text
            const contentState = ContentState.createFromText(text);
            const newState = EditorState.createWithContent(contentState);
            
            // Copy selection to end
            const selectionState = newState.getSelection().merge({
              anchorOffset: text.length,
              focusOffset: text.length
            });
            const stateWithSelection = EditorState.forceSelection(newState, selectionState);
            
            props.onChange(stateWithSelection);
            console.log('[TikTok ClickHelper] DraftJS caption set via onChange!');
            return true;
          } catch (e) {
            console.log('[TikTok ClickHelper] DraftJS onChange error:', e.message);
          }
        }

        // Check for handleChange / onEditorStateChange
        if (props?.editorState) {
          for (const handler of ['handleChange', 'onEditorStateChange', 'handleEditorChange']) {
            if (typeof props[handler] === 'function') {
              try {
                const EditorState = props.editorState.constructor;
                const ContentState = props.editorState.getCurrentContent().constructor;
                const newContent = ContentState.createFromText(text);
                const newState = EditorState.createWithContent(newContent);
                props[handler](newState);
                console.log('[TikTok ClickHelper] DraftJS caption set via', handler);
                return true;
              } catch (e) {
                console.log('[TikTok ClickHelper]', handler, 'error:', e.message);
              }
            }
          }
        }

        fiber = fiber.return;
      }
    }

    // Method 2: Fallback — use execCommand on contenteditable
    const editableEl = document.querySelector('[contenteditable="true"].notranslate, [contenteditable="true"][role="textbox"], .DraftEditor-editorContainer [contenteditable="true"]');
    if (editableEl) {
      editableEl.focus();
      document.execCommand('selectAll', false, null);
      await new Promise(r => setTimeout(r, 100));
      document.execCommand('insertText', false, text);
      console.log('[TikTok ClickHelper] Caption inserted via execCommand fallback');
      return true;
    }

    console.log('[TikTok ClickHelper] setCaptionViaDraftJS failed — no editor found');
    return false;
  }

  // ★★★ PD-INSPIRED: Type hashtag via DraftJS ★★★
  // เหมือน PD's typeHashtagInPageContext — พิมพ์ # แล้วตามด้วย text
  async function typeHashtagInPageContext(hashtag) {
    console.log('[TikTok ClickHelper] typeHashtagInPageContext:', hashtag);

    const editor = document.querySelector('[contenteditable="true"].notranslate, [contenteditable="true"][role="textbox"], .DraftEditor-editorContainer [contenteditable="true"]');
    if (!editor) {
      console.log('[TikTok ClickHelper] No editor found for hashtag');
      return false;
    }

    editor.focus();
    await new Promise(r => setTimeout(r, 200));

    // Move cursor to end
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Type space then hashtag character by character (for DraftJS to recognize)
    const fullText = ' #' + hashtag;
    for (const char of fullText) {
      // Dispatch keydown, keypress, textInput, input events for each character
      editor.dispatchEvent(new KeyboardEvent('keydown', { key: char, code: 'Key' + char.toUpperCase(), bubbles: true }));
      editor.dispatchEvent(new KeyboardEvent('keypress', { key: char, code: 'Key' + char.toUpperCase(), bubbles: true }));
      document.execCommand('insertText', false, char);
      editor.dispatchEvent(new InputEvent('input', { data: char, inputType: 'insertText', bubbles: true }));
      await new Promise(r => setTimeout(r, 50));
    }

    console.log('[TikTok ClickHelper] Hashtag typed:', hashtag);
    return true;
  }

  // ── หา React handler จาก fiber tree ──
  function findReactHandler(element, handlerNames) {
    try {
      const keys = Object.keys(element);
      for (const key of keys) {
        if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
          let fiber = element[key];
          for (let i = 0; i < 30 && fiber; i++) {
            const props = fiber.memoizedProps || fiber.pendingProps;
            if (props) {
              for (const name of handlerNames) {
                if (typeof props[name] === 'function') {
                  console.log('[TikTok ClickHelper] Found handler:', name, 'at fiber depth:', i);
                  return props[name];
                }
              }
            }
            fiber = fiber.return;
          }
        }
      }
    } catch (e) {
      console.log('[TikTok ClickHelper] findReactHandler error:', e);
    }
    return null;
  }

})();
