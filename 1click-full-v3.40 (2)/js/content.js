// TikTok Product Scraper - Content Script
// สำหรับ TikTok Studio - Add product links modal
// รองรับ React re-render, pagination ทุกหน้า, ไม่ซ้ำ, ไม่ loop ค้าง

(function() {
  'use strict';

  // ป้องกัน script ถูก inject ซ้ำ
  if (window.__TIKTOK_SCRAPER_LOADED__) {
    console.log('[TikTok Scraper] Already loaded, skipping...');
    return;
  }
  window.__TIKTOK_SCRAPER_LOADED__ = true;

  const STATE = {
    isRunning: false,
    isStopped: false,
    products: new Map(),
    currentPage: 1,
    totalPages: 0,
    retryCount: 0,
    maxRetries: 3
  };

  // Selectors สำหรับ TikTok Studio / Seller Center / Showcase
  const SELECTORS = {
    // Modal container
    modal: '[class*="Modal"], [class*="modal"], [role="dialog"], [class*="Drawer"], [class*="drawer"]',
    
    // Product table/list
    productTable: 'table, [class*="Table"], [class*="table"], [class*="arco-table"]',
    productRow: 'table tbody tr, [class*="TableRow"], [class*="table-row"], [class*="arco-table-body"] tr',
    
    // Product data cells
    productName: 'td:nth-child(1), [class*="ProductName"], [class*="product-name"], [class*="product_name"]',
    productId: 'td:nth-child(2), [class*="ProductId"], [class*="product-id"], [class*="product_id"]',
    productPrice: 'td:nth-child(3), [class*="Price"], [class*="price"]',
    productStock: 'td:nth-child(4), [class*="Stock"], [class*="stock"]',
    productStatus: 'td:nth-child(5), [class*="Status"], [class*="status"]',
    productImage: 'img, [class*="Image"] img, [class*="image"] img',
    
    // Pagination (Arco Design + generic)
    pagination: '[class*="Pagination"], [class*="pagination"], [class*="arco-pagination"], nav',
    paginationButtons: '[class*="Pagination"] button, [class*="pagination"] button, [class*="arco-pagination"] li, nav button',
    nextPageBtn: '[class*="Pagination"] button:last-child, [aria-label*="next"], [class*="next"], button[class*="Next"], [class*="arco-pagination-next"]',
    prevPageBtn: '[class*="Pagination"] button:first-child, [aria-label*="prev"], [class*="prev"], [class*="arco-pagination-prev"]',
    pageNumbers: '[class*="Pagination"] button:not(:first-child):not(:last-child), [class*="pagination"] li:not(:first-child):not(:last-child), [class*="arco-pagination-item"]',
    
    // Loading
    loadingIndicator: '[class*="Loading"], [class*="loading"], [class*="Spinner"], [class*="spinner"], [class*="arco-spin"]'
  };

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ★ simulateRealClick — เหมือนคนคลิกจริง (PointerEvent + MouseEvent ครบ sequence) ★
  // จำลองจาก v3.04 content-tiktok-platform.js เพื่อให้ React จับ event ได้
  function simulateRealClick(el) {
    if (!el) return;
    try {
      el.focus();
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const eventOpts = {
        bubbles: true, cancelable: true, composed: true,
        clientX: x, clientY: y, screenX: x, screenY: y,
        view: window, button: 0, buttons: 1
      };
      el.dispatchEvent(new PointerEvent('pointerover', eventOpts));
      el.dispatchEvent(new MouseEvent('mouseover', eventOpts));
      el.dispatchEvent(new PointerEvent('pointerenter', eventOpts));
      el.dispatchEvent(new MouseEvent('mouseenter', eventOpts));
      el.dispatchEvent(new PointerEvent('pointerdown', eventOpts));
      el.dispatchEvent(new MouseEvent('mousedown', eventOpts));
      el.dispatchEvent(new PointerEvent('pointerup', { ...eventOpts, buttons: 0 }));
      el.dispatchEvent(new MouseEvent('mouseup', { ...eventOpts, buttons: 0 }));
      el.dispatchEvent(new MouseEvent('click', { ...eventOpts, buttons: 0 }));
      el.click();
      console.log('[TikTok Auto] simulateRealClick on:', (el.textContent || el.tagName)?.substring(0, 50));
    } catch (err) {
      console.error('[TikTok Auto] simulateRealClick error:', err);
      try { el.click(); } catch (e) {}
    }
  }

  // ★ sendToMainWorld — ส่งคำสั่งไป tiktok-click-helper.js (MAIN world) ผ่าน postMessage ★
  // tiktok-click-helper.js จะรับ action ผ่าน source: 'tiktok-platform-cmd' แล้วคลิกผ่าน React internals
  let _mainWorldMsgId = 0;
  function sendToMainWorld(action, payload) {
    return new Promise((resolve) => {
      const id = `cmd_${++_mainWorldMsgId}_${Date.now()}`;
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler);
        console.log(`[TikTok Auto] MAIN world timeout for: ${action}`);
        resolve(false);
      }, 8000);
      function handler(event) {
        if (event.source !== window) return;
        if (!event.data || event.data.source !== 'tiktok-platform-result') return;
        if (event.data.id !== id) return;
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        resolve(event.data.result);
      }
      window.addEventListener('message', handler);
      window.postMessage({ source: 'tiktok-platform-cmd', action, payload, id }, '*');
    });
  }

  // ★ waitForElement — poll หา element จนเจอหรือ timeout (ตรงกับ v3.04) ★
  async function waitForElement(selectorOrFn, timeoutMs = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const el = typeof selectorOrFn === 'function' ? selectorOrFn() : document.querySelector(selectorOrFn);
      if (el && el.offsetParent !== null) return el;
      await delay(500);
    }
    return null;
  }

  // ★ Set Input Value (React-compatible) — จาก v3.04 ★
  function setNativeInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (setter) {
      setter.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ★ Find button by label text — จาก v3.04 ★
  function findButtonByText(text) {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const btnText = (btn.textContent || '').trim();
      if (btnText === text || btnText.includes(text)) {
        if (btn.offsetParent !== null && btn.getAttribute('aria-disabled') !== 'true') {
          return btn;
        }
      }
    }
    return null;
  }

  // ★ Find TUXButton by label text (สำหรับ modal TikTok) — จาก v3.04 ★
  function findTUXButtonByText(text) {
    const labels = document.querySelectorAll('.TUXButton-label');
    for (const label of labels) {
      if (label.textContent.trim() === text) {
        const btn = label.closest('button');
        if (btn && btn.offsetParent !== null && btn.getAttribute('aria-disabled') !== 'true') {
          return btn;
        }
      }
    }
    const primaryBtns = document.querySelectorAll('button.TUXButton--primary, button[class*="TUXButton--primary"]');
    for (const btn of primaryBtns) {
      const btnText = (btn.textContent || '').trim();
      if (btnText === text && btn.offsetParent !== null) {
        return btn;
      }
    }
    return findButtonByText(text);
  }

  // ★ ส่งคำสั่งคลิกไป background ให้ใช้ chrome.scripting.executeScript (MAIN world) — จาก v3.04 ★
  function execClickButton(text) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'EXEC_CLICK_BUTTON', text }, (resp) => {
        if (chrome.runtime.lastError) {
          console.log('[TikTok Auto] execClickButton error:', chrome.runtime.lastError.message);
          resolve(false);
        } else {
          resolve(resp?.success || false);
        }
      });
    });
  }

  // ── Retry wrapper (v3.04) ──
  async function retryAction(fn, maxRetries, delayMs) {
    for (let i = 0; i < maxRetries; i++) {
      const result = await fn();
      if (result) return true;
      if (i < maxRetries - 1) await delay(delayMs);
    }
    return false;
  }

  // (waitForElement ใช้ v3.04 version ที่ line 114 — รองรับทั้ง selector string และ function)

  // รอ loading เสร็จ
  async function waitForLoading() {
    await delay(300);
    let attempts = 0;
    while (attempts < 20) {
      const loading = document.querySelector(SELECTORS.loadingIndicator);
      if (!loading || getComputedStyle(loading).display === 'none' || getComputedStyle(loading).visibility === 'hidden') {
        break;
      }
      await delay(200);
      attempts++;
    }
    await delay(500); // รอ React render
  }

  // หา product table จาก modal หรือ page
  function findProductTable() {
    // ลองหาใน modal/drawer ก่อน
    const modals = document.querySelectorAll('[role="dialog"], [class*="Modal"], [class*="modal"], [class*="Drawer"], [class*="drawer"]');
    console.log('[TikTok Scraper] Found modals/drawers:', modals.length);
    for (const modal of modals) {
      if (modal.offsetParent === null && getComputedStyle(modal).display === 'none') continue;
      console.log('[TikTok Scraper] Modal classes:', modal.className?.substring?.(0, 100), 'children:', modal.children.length);
      // Arco Design table
      const arcoTable = modal.querySelector('[class*="arco-table"], [class*="arco-list"]');
      if (arcoTable) {
        console.log('[TikTok Scraper] Found arco-table in modal');
        const innerTable = arcoTable.querySelector('table');
        return innerTable || arcoTable;
      }
      const table = modal.querySelector('table');
      if (table) {
        console.log('[TikTok Scraper] Found <table> in modal');
        return table;
      }
    }
    
    // ลองหาใน page (Arco Design + native table)
    const arcoPage = document.querySelector('[class*="arco-table"], [class*="arco-list"]');
    if (arcoPage) {
      console.log('[TikTok Scraper] Found arco-table in page');
      const innerTable = arcoPage.querySelector('table');
      return innerTable || arcoPage;
    }
    const pageTable = document.querySelector('table');
    if (pageTable) {
      console.log('[TikTok Scraper] Found <table> in page');
      return pageTable;
    }
    
    // Debug: dump ทุก element ที่น่าจะเป็น product container
    console.log('[TikTok Scraper] No <table> found. Dumping candidate containers...');
    const candidates = document.querySelectorAll(
      '[class*="product"], [class*="Product"], [class*="showcase"], [class*="Showcase"], ' +
      '[class*="goods"], [class*="Goods"], [class*="arco-table"], [class*="arco-list"], ' +
      '[data-testid*="product"], [data-e2e*="product"]'
    );
    candidates.forEach((el, i) => {
      if (i < 15) console.log(`[TikTok Scraper] Candidate ${i}: <${el.tagName}> class="${el.className?.substring?.(0, 80)}" children=${el.children.length}`);
    });
    
    return null;
  }

  // ดึงข้อมูลจาก row
  function extractProductFromRow(row) {
    try {
      const cells = row.querySelectorAll('td');
      if (cells.length < 3) return null;

      // หารูปภาพ
      const imgEl = row.querySelector('img');
      const image = imgEl?.src || '';

      // หาชื่อสินค้า (cell แรกที่มี text)
      let name = '';
      let productId = '';
      let price = '';
      let stock = '';
      let status = '';

      // Cell 1: ชื่อสินค้า + รูป
      const cell1 = cells[0];
      if (cell1) {
        // หา text ที่ไม่ใช่ตัวเลขล้วน
        const textNodes = cell1.querySelectorAll('span, div, p');
        for (const node of textNodes) {
          const text = node.textContent?.trim();
          if (text && text.length > 5 && !/^\d+$/.test(text)) {
            name = text;
            break;
          }
        }
        if (!name) {
          name = cell1.textContent?.trim().split('\n')[0] || '';
        }
      }

      // Cell 2: Product ID
      if (cells[1]) {
        productId = cells[1].textContent?.trim() || '';
      }

      // Cell 3: Price
      if (cells[2]) {
        price = cells[2].textContent?.trim() || '';
      }

      // Cell 4: Stock
      if (cells[3]) {
        stock = cells[3].textContent?.trim() || '';
      }

      // Cell 5: Status
      if (cells[4]) {
        status = cells[4].textContent?.trim() || '';
      }

      if (!name && !productId) return null;

      // สร้าง unique ID
      const id = productId || btoa(encodeURIComponent(name)).slice(0, 20);

      return {
        id: id,
        productId: productId,
        name: name,
        price: price,
        stock: stock,
        status: status,
        image: image,
        url: window.location.href
      };
    } catch (error) {
      console.error('[TikTok Scraper] Error extracting row:', error);
      return null;
    }
  }

  // ดึงสินค้าจาก div-based product list (fallback เมื่อไม่มี <table>)
  function extractProductFromDiv(el) {
    try {
      const imgEl = el.querySelector('img');
      const image = imgEl?.src || '';
      
      // หาข้อความทั้งหมดใน element (ใช้ Set ป้องกันซ้ำ)
      const seen = new Set();
      const allTexts = [];
      el.querySelectorAll('span, div, p, a, h3, h4, label').forEach(node => {
        if (node.children.length > 2) return;
        const t = node.textContent?.trim();
        if (t && t.length > 1 && !seen.has(t)) {
          seen.add(t);
          allTexts.push(t);
        }
      });
      
      let name = '';
      let price = '';
      let productId = '';
      
      for (const t of allTexts) {
        if (/^[฿$￥¥₫₱]/.test(t) || /^\d+[.,]\d{2}$/.test(t) || /THB|USD|VND|PHP|\$/.test(t) || /฿\s?\d/.test(t)) {
          if (!price) price = t;
        } else if (/^\d{5,}$/.test(t)) {
          if (!productId) productId = t;
        } else if (t.length > 3 && !name && !/^\d+$/.test(t)) {
          name = t;
        }
      }
      
      if (!name) return null;
      
      const id = productId || btoa(encodeURIComponent(name)).slice(0, 20);
      return { id, productId: productId || id, name, price, stock: '', status: '', image, url: window.location.href };
    } catch (e) {
      return null;
    }
  }

  // ดึงสินค้าจากหน้าปัจจุบัน
  async function scrapeCurrentPage() {
    await waitForLoading();

    const table = findProductTable();
    
    let newProducts = 0;
    
    if (table) {
      // ★ Method 1: <table> based ★
      const rows = table.querySelectorAll('tbody tr');
      console.log(`[TikTok Scraper] Table found, rows: ${rows.length}`);

      rows.forEach(row => {
        const product = extractProductFromRow(row);
        if (product && product.name && !STATE.products.has(product.id)) {
          STATE.products.set(product.id, product);
          newProducts++;
        }
      });

      console.log(`[TikTok Scraper] Page ${STATE.currentPage}: Found ${rows.length} rows, ${newProducts} new products`);
    } else {
      // ★ Method 2: Div-based fallback — หา product items จาก modal/page ★
      console.log('[TikTok Scraper] No table — trying div-based scraping...');
      
      // หา modal ก่อน
      let container = null;
      const modals = document.querySelectorAll('[role="dialog"], [class*="Modal"], [class*="modal"]');
      for (const m of modals) {
        if (m.children.length > 0) { container = m; break; }
      }
      if (!container) container = document.body;
      
      // หา product rows — ลอง pattern ต่างๆ (TikTok Seller Center / Showcase / Studio)
      const selectors = [
        // TikTok Arco Design components
        '[class*="arco-table-body"] tr',
        '[class*="arco-table"] [class*="row"]',
        '[class*="arco-list"] [class*="item"]',
        '[class*="arco-list-item"]',
        // TikTok specific data attributes
        '[data-testid*="product"]', '[data-e2e*="product"]',
        '[data-testid*="goods"]', '[data-e2e*="goods"]',
        // Product card/item patterns
        '[class*="product-item"]', '[class*="productItem"]', '[class*="ProductItem"]',
        '[class*="product-card"]', '[class*="productCard"]', '[class*="ProductCard"]',
        '[class*="product_item"]', '[class*="product_card"]',
        '[class*="showcase-item"]', '[class*="showcaseItem"]',
        '[class*="goods-item"]', '[class*="goodsItem"]', '[class*="GoodsItem"]',
        // TikTok Shop specific
        '[class*="ProductList"] > div', '[class*="productList"] > div',
        '[class*="GoodsList"] > div', '[class*="goodsList"] > div',
        '[class*="product-list"] > div', '[class*="goods-list"] > div',
      ];
      
      let productEls = [];
      for (const sel of selectors) {
        productEls = container.querySelectorAll(sel);
        if (productEls.length > 0) {
          console.log(`[TikTok Scraper] Found ${productEls.length} items with selector: ${sel}`);
          break;
        }
      }
      
      // ถ้ายังหาไม่เจอ ลองหา element ที่มี img + text (product-like)
      if (productEls.length === 0) {
        console.log('[TikTok Scraper] No product items found with known selectors. Trying img+text heuristic...');
        const allImgs = container.querySelectorAll(
          'img[src*="tiktok"], img[src*="product"], img[src*="image"], ' +
          'img[src*="tiktokcdn"], img[src*="byteimg"], img[src*="ibytedtos"]'
        );
        console.log(`[TikTok Scraper] Found ${allImgs.length} product-like images`);
        
        const imgParents = new Set();
        allImgs.forEach(img => {
          let parent = img.parentElement;
          for (let i = 0; i < 4 && parent && parent !== container; i++) {
            const textLen = parent.textContent?.trim().length || 0;
            if (parent.children.length >= 2 && textLen > 5) {
              imgParents.add(parent);
              break;
            }
            parent = parent.parentElement;
          }
        });
        productEls = Array.from(imgParents);
        console.log(`[TikTok Scraper] Heuristic found ${productEls.length} product-like containers`);
        
        // Debug: dump first elements
        productEls.slice(0, 3).forEach((el, i) => {
          console.log(`[TikTok Scraper] Heuristic[${i}]: <${el.tagName}> class="${el.className?.substring?.(0, 60)}" text="${el.textContent?.substring?.(0, 50)}"`);
        });
      }
      
      // Extract products
      productEls.forEach(el => {
        const product = extractProductFromDiv(el);
        if (product && product.name && !STATE.products.has(product.id)) {
          STATE.products.set(product.id, product);
          newProducts++;
        }
      });
      
      console.log(`[TikTok Scraper] Div-based: ${newProducts} new products from ${productEls.length} elements`);
    }
    
    return newProducts;
  }

  // หาจำนวนหน้าทั้งหมดจาก pagination
  function getTotalPages() {
    let maxPage = 1;
    
    // หาจาก modal ก่อน
    const modals = document.querySelectorAll('[role="dialog"], [class*="Modal"], [class*="modal"]');
    
    for (const modal of modals) {
      const buttons = modal.querySelectorAll('button, [role="button"], li');
      buttons.forEach(btn => {
        const text = btn.textContent?.trim();
        const num = parseInt(text);
        if (!isNaN(num) && num > maxPage) {
          maxPage = num;
        }
      });
    }
    
    // ถ้าหาไม่เจอใน modal ลองหาจากทั้งหน้า
    if (maxPage === 1) {
      const allButtons = document.querySelectorAll('button, [role="button"], li');
      allButtons.forEach(btn => {
        const text = btn.textContent?.trim();
        const num = parseInt(text);
        if (!isNaN(num) && num > maxPage && num < 1000) { // ไม่เอาตัวเลขที่ใหญ่เกินไป
          maxPage = num;
        }
      });
    }

    console.log(`[TikTok Scraper] Total pages detected: ${maxPage}`);
    return maxPage;
  }

  // หาปุ่ม Next (ปุ่มที่มี SVG arrow icon)
  function findNextButton() {
    console.log('[TikTok Scraper] Looking for next button (SVG arrow)...');
    
    // หา SVG ที่มี path ลูกศรขวา (>)
    const svgs = document.querySelectorAll('svg');
    let nextBtn = null;
    
    for (const svg of svgs) {
      // ตรวจสอบว่า SVG มี path ที่เป็นลูกศรขวา
      const path = svg.querySelector('path');
      if (path) {
        const d = path.getAttribute('d') || '';
        // ลูกศรขวาจะมี pattern ที่ไปทางขวา (เช่น L...R หรือ arrow right)
        // หรือดูจาก viewBox และ width/height
        const viewBox = svg.getAttribute('viewBox');
        const width = svg.getAttribute('width');
        
        // ปุ่ม > มักจะมี width น้อยกว่า >> 
        if (width && parseInt(width) < 20) {
          // หา parent ที่เป็น button หรือ li
          const parent = svg.closest('button, li, a, [role="button"]');
          if (parent && !parent.disabled) {
            // ตรวจสอบว่าไม่ใช่ปุ่ม < (prev)
            const rect = svg.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();
            
            // เก็บไว้เป็น candidate
            if (!nextBtn) {
              nextBtn = parent;
              console.log('[TikTok Scraper] Found SVG arrow button:', parent.tagName, parent.className);
            }
          }
        }
      }
    }
    
    // ถ้าหาจาก SVG ไม่เจอ ลองหาจาก pagination container
    if (!nextBtn) {
      // หา pagination container
      const paginationContainers = document.querySelectorAll('ul, nav, [class*="pagination"], [class*="Pagination"]');
      
      for (const container of paginationContainers) {
        const items = container.querySelectorAll('li, button');
        if (items.length > 3) {
          // น่าจะเป็น pagination - หา item สุดท้ายหรือรองสุดท้าย
          const lastItem = items[items.length - 1];
          const secondLast = items[items.length - 2];
          
          // ปุ่ม > มักจะเป็นรองสุดท้าย (สุดท้ายคือ >>)
          if (secondLast && !secondLast.disabled) {
            const text = secondLast.textContent?.trim();
            // ถ้าไม่มี text หรือ text ไม่ใช่ตัวเลข น่าจะเป็นปุ่ม >
            if (!text || isNaN(parseInt(text))) {
              nextBtn = secondLast;
              console.log('[TikTok Scraper] Found pagination next button:', secondLast.tagName);
              break;
            }
          }
        }
      }
    }
    
    if (!nextBtn) {
      console.log('[TikTok Scraper] No next button found');
    }
    
    return nextBtn;
  }

  // ตรวจสอบว่ามีหน้าถัดไปหรือไม่
  function hasNextPage() {
    const nextBtn = findNextButton();
    if (!nextBtn) return false;
    
    return !nextBtn.disabled && 
           !nextBtn.classList.contains('disabled') &&
           nextBtn.getAttribute('aria-disabled') !== 'true';
  }

  // Simulate click แบบต่างๆ
  function simulateClick(element) {
    console.log('[TikTok Scraper] Simulating click on:', element.tagName, element.className);
    
    // Method 1: Direct click
    try {
      element.click();
    } catch (e) {}
    
    // Method 2: MouseEvent
    try {
      const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window });
      const mouseUp = new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window });
      const click = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
      
      element.dispatchEvent(mouseDown);
      element.dispatchEvent(mouseUp);
      element.dispatchEvent(click);
    } catch (e) {}
    
    // Method 3: PointerEvent (for React)
    try {
      const pointerDown = new PointerEvent('pointerdown', { bubbles: true, cancelable: true });
      const pointerUp = new PointerEvent('pointerup', { bubbles: true, cancelable: true });
      
      element.dispatchEvent(pointerDown);
      element.dispatchEvent(pointerUp);
    } catch (e) {}
    
    // Method 4: Focus and Enter key
    try {
      element.focus();
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    } catch (e) {}
  }

  // ไปหน้าถัดไป
  async function goToNextPage() {
    const nextBtn = findNextButton();
    if (!nextBtn) {
      console.log('[TikTok Scraper] Next button not found');
      return false;
    }

    try {
      console.log('[TikTok Scraper] Clicking next page button...');
      
      // ลองหลายวิธีในการคลิก
      simulateClick(nextBtn);
      
      await delay(2500);
      await waitForLoading();
      await delay(1500);
      
      STATE.currentPage++;
      STATE.retryCount = 0;
      console.log(`[TikTok Scraper] Now on page ${STATE.currentPage}`);
      return true;
    } catch (error) {
      console.error('[TikTok Scraper] Error navigating:', error);
      STATE.retryCount++;
      return STATE.retryCount < STATE.maxRetries;
    }
  }

  // คลิกไปหน้าที่ต้องการ
  async function goToPage(pageNum) {
    console.log(`[TikTok Scraper] Trying to go to page ${pageNum}`);
    
    // หาทุก element ที่มีเลขหน้านั้น
    const allElements = document.querySelectorAll('li, button, a, span, div');
    
    for (const el of allElements) {
      const text = el.textContent?.trim();
      // ต้องเป็นเลขหน้าตรงๆ ไม่ใช่ส่วนหนึ่งของ text อื่น
      if (text === String(pageNum)) {
        console.log(`[TikTok Scraper] Found page ${pageNum} element:`, el.tagName, el.className);
        simulateClick(el);
        await delay(2500);
        await waitForLoading();
        await delay(1500);
        STATE.currentPage = pageNum;
        return true;
      }
    }
    
    console.log(`[TikTok Scraper] Page ${pageNum} button not found`);
    return false;
  }

  // คลิกเลขหน้าโดยตรง
  async function clickPageNumber(pageNum) {
    console.log(`[TikTok Scraper] Clicking page number ${pageNum}`);
    
    // หา pagination container ก่อน (ul ที่มี li หลายตัวเป็นเลข)
    const uls = document.querySelectorAll('ul');
    
    for (const ul of uls) {
      const lis = ul.querySelectorAll('li');
      let numberCount = 0;
      let targetLi = null;
      
      lis.forEach(li => {
        const text = li.textContent?.trim();
        const num = parseInt(text);
        if (!isNaN(num)) {
          numberCount++;
          if (num === pageNum) {
            targetLi = li;
          }
        }
      });
      
      // ถ้า ul นี้มีเลขหลายตัว น่าจะเป็น pagination
      if (numberCount >= 3 && targetLi) {
        console.log(`[TikTok Scraper] Found pagination, clicking page ${pageNum}`);
        simulateClick(targetLi);
        await delay(2500);
        await waitForLoading();
        await delay(1500);
        return true;
      }
    }
    
    // ถ้าหาไม่เจอใน ul ลองหาจาก li/button ทั่วไป
    const allElements = document.querySelectorAll('li, button, a');
    for (const el of allElements) {
      const text = el.textContent?.trim();
      if (text === String(pageNum)) {
        console.log(`[TikTok Scraper] Clicking element with page ${pageNum}:`, el.tagName);
        simulateClick(el);
        await delay(2500);
        await waitForLoading();
        await delay(1500);
        return true;
      }
    }
    
    return false;
  }

  // Main scraping function - ดึงทุกหน้า
  async function startScraping() {
    if (STATE.isRunning) {
      console.log('[TikTok Scraper] Already running');
      return;
    }
    
    STATE.isRunning = true;
    STATE.isStopped = false;
    STATE.products.clear();
    STATE.currentPage = 1;
    STATE.retryCount = 0;

    sendMessage('status', { status: 'running', message: 'เริ่มดึงข้อมูล...' });

    try {
      // รอให้หน้าโหลด
      await delay(1000);

      STATE.totalPages = getTotalPages();
      console.log(`[TikTok Scraper] Starting scrape, total pages: ${STATE.totalPages}`);
      
      sendMessage('progress', { current: 0, total: STATE.totalPages });

      // ไปหน้าแรกก่อน (ถ้าไม่ได้อยู่หน้าแรก)
      await goToPage(1);
      STATE.currentPage = 1;

      // Loop ผ่านทุกหน้า - ใช้วิธีคลิกเลขหน้าโดยตรง
      for (let page = 1; page <= STATE.totalPages && !STATE.isStopped; page++) {
        console.log(`[TikTok Scraper] Scraping page ${page}/${STATE.totalPages}`);
        
        // ถ้าไม่ใช่หน้าแรก ให้คลิกไปหน้านั้น
        if (page > 1) {
          const clicked = await clickPageNumber(page);
          if (!clicked) {
            // ลองใช้ปุ่ม > แทน
            const navigated = await goToNextPage();
            if (!navigated) {
              console.log(`[TikTok Scraper] Cannot navigate to page ${page}`);
              break;
            }
          }
        }
        
        STATE.currentPage = page;
        const newCount = await scrapeCurrentPage();
        
        console.log(`[TikTok Scraper] Page ${page}: ${newCount} new products, total: ${STATE.products.size}`);

        sendMessage('progress', { 
          current: page, 
          total: STATE.totalPages,
          productCount: STATE.products.size
        });

        sendMessage('products', { 
          products: Array.from(STATE.products.values()),
          isPartial: true
        });

        // Safety delay
        await delay(1000);
      }

      // ส่งผลลัพธ์สุดท้าย
      const finalProducts = Array.from(STATE.products.values());
      
      sendMessage('complete', {
        products: finalProducts,
        totalProducts: finalProducts.length,
        totalPages: STATE.currentPage
      });

      sendMessage('status', { 
        status: 'completed', 
        message: `เสร็จสิ้น! ดึงได้ ${finalProducts.length} สินค้า จาก ${STATE.currentPage} หน้า` 
      });

      console.log(`[TikTok Scraper] Complete! ${finalProducts.length} products from ${STATE.currentPage} pages`);

    } catch (error) {
      console.error('[TikTok Scraper] Error:', error);
      sendMessage('error', { message: error.message });
      sendMessage('status', { status: 'error', message: error.message });
    } finally {
      STATE.isRunning = false;
    }
  }

  function stopScraping() {
    STATE.isStopped = true;
    STATE.isRunning = false;
    sendMessage('status', { status: 'stopped', message: 'หยุดการดึงข้อมูล' });
  }

  async function nextPageManual() {
    if (STATE.isRunning) return;
    
    const navigated = await goToNextPage();
    if (navigated) {
      await scrapeCurrentPage();
      sendMessage('products', { 
        products: Array.from(STATE.products.values()),
        isPartial: false
      });
    }
  }

  // ★ ดึงเฉพาะหน้าที่ระบุ (ไม่ดึงทุกหน้า) ★
  async function scrapeSinglePage(targetPage) {
    if (STATE.isRunning) {
      console.log('[TikTok Scraper] Already running — forcing reset');
      STATE.isRunning = false;
    }
    
    STATE.isRunning = true;
    STATE.isStopped = false;
    STATE.products.clear(); // ล้างสินค้าเก่า
    STATE.currentPage = targetPage;
    STATE.retryCount = 0;

    sendMessage('status', { status: 'running', message: `กำลังดึงหน้า ${targetPage}...` });

    try {
      // รอให้หน้าโหลด
      await delay(1000);

      STATE.totalPages = getTotalPages();
      console.log(`[TikTok Scraper] Scraping single page ${targetPage}, total pages available: ${STATE.totalPages}`);
      
      if (targetPage > STATE.totalPages && STATE.totalPages > 1) {
        throw new Error(`หน้า ${targetPage} ไม่มีอยู่ (มีแค่ ${STATE.totalPages} หน้า)`);
      }

      sendMessage('progress', { current: 0, total: 1 });

      // ไปหน้าที่ต้องการ
      if (targetPage !== 1) {
        const clicked = await clickPageNumber(targetPage);
        if (!clicked) {
          // ลองไปทีละหน้า
          await goToPage(targetPage);
        }
        await delay(1500); // รอ page load
      }

      // ดึงสินค้าจากหน้านั้น
      const newCount = await scrapeCurrentPage();
      
      console.log(`[TikTok Scraper] Page ${targetPage}: ${newCount} products scraped`);

      sendMessage('progress', { 
        current: 1, 
        total: 1,
        productCount: STATE.products.size
      });

      // ส่งผลลัพธ์
      const finalProducts = Array.from(STATE.products.values());
      
      sendMessage('products', { 
        products: finalProducts,
        isPartial: false
      });

      sendMessage('complete', {
        products: finalProducts,
        totalProducts: finalProducts.length,
        totalPages: 1,
        scrapedPage: targetPage
      });

      sendMessage('status', { 
        status: 'completed', 
        message: `เสร็จสิ้น! ดึงได้ ${finalProducts.length} สินค้า จากหน้า ${targetPage}` 
      });

      console.log(`[TikTok Scraper] Complete! ${finalProducts.length} products from page ${targetPage}`);

    } catch (error) {
      console.error('[TikTok Scraper] Error:', error);
      sendMessage('error', { message: error.message });
      sendMessage('status', { status: 'error', message: error.message });
    } finally {
      STATE.isRunning = false;
    }
  }

  // ★ v3.23: ดึงทุกหน้าอัตโนมัติ — วนจากหน้า 1 จนถึงหน้าสุดท้าย ★
  async function scrapeAllPages() {
    if (STATE.isRunning) {
      console.log('[TikTok Scraper] Already running — forcing reset');
      STATE.isRunning = false;
    }

    STATE.isRunning = true;
    STATE.isStopped = false;
    STATE.products.clear();
    STATE.currentPage = 1;
    STATE.retryCount = 0;

    sendMessage('status', { status: 'running', message: 'กำลังตรวจสอบจำนวนหน้า...' });

    try {
      await delay(1000);
      STATE.totalPages = getTotalPages();
      const totalPages = Math.max(1, STATE.totalPages);
      console.log(`[TikTok Scraper] Scraping ALL pages: 1 to ${totalPages}`);

      sendMessage('status', { status: 'running', message: `พบ ${totalPages} หน้า — เริ่มดึงทุกหน้า...` });
      sendMessage('progress', { current: 0, total: totalPages });

      for (let page = 1; page <= totalPages; page++) {
        if (STATE.isStopped) {
          sendMessage('status', { status: 'stopped', message: `หยุดโดยผู้ใช้ — ดึงได้ ${STATE.products.size} สินค้า จาก ${page - 1} หน้า` });
          break;
        }

        sendMessage('status', { status: 'running', message: `กำลังดึงหน้า ${page}/${totalPages}...` });

        // ไปหน้าที่ต้องการ (หน้า 1 ไม่ต้อง navigate)
        if (page > 1) {
          const clicked = await clickPageNumber(page);
          if (!clicked) {
            await goToPage(page);
          }
          await delay(2000);
          await waitForLoading();
          await delay(1000);
        }

        const newCount = await scrapeCurrentPage();
        console.log(`[TikTok Scraper] Page ${page}/${totalPages}: ${newCount} products (total: ${STATE.products.size})`);

        sendMessage('progress', {
          current: page,
          total: totalPages,
          productCount: STATE.products.size
        });

        // ส่ง partial products ทุกหน้า
        sendMessage('products', {
          products: Array.from(STATE.products.values()),
          isPartial: page < totalPages
        });

        // รอระหว่างหน้า
        if (page < totalPages) {
          await delay(1500);
        }
      }

      const finalProducts = Array.from(STATE.products.values());

      sendMessage('products', {
        products: finalProducts,
        isPartial: false
      });

      sendMessage('complete', {
        products: finalProducts,
        totalProducts: finalProducts.length,
        totalPages: totalPages,
        scrapedPage: 'all'
      });

      if (!STATE.isStopped) {
        sendMessage('status', {
          status: 'completed',
          message: `เสร็จสิ้น! ดึงได้ ${finalProducts.length} สินค้า จาก ${totalPages} หน้า`
        });
      }

      console.log(`[TikTok Scraper] All pages complete! ${finalProducts.length} products from ${totalPages} pages`);

    } catch (error) {
      console.error('[TikTok Scraper] Error:', error);
      sendMessage('error', { message: error.message });
      sendMessage('status', { status: 'error', message: error.message });
    } finally {
      STATE.isRunning = false;
    }
  }

  function sendMessage(type, data) {
    try {
      chrome.runtime.sendMessage({
        source: 'tiktok-scraper',
        type: type,
        data: data
      }).catch(() => {});
    } catch (e) {
      // Ignore errors
    }
  }

  // Message listener
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target !== 'content-script') return;

    console.log('[TikTok Scraper] Received message:', message.action);

    switch (message.action) {
      case 'start':
        startScraping();
        sendResponse({ success: true });
        break;
      
      case 'stop':
        stopScraping();
        sendResponse({ success: true });
        break;
      
      case 'next':
        nextPageManual();
        sendResponse({ success: true });
        break;
      
      case 'getStatus':
        sendResponse({
          isRunning: STATE.isRunning,
          productCount: STATE.products.size,
          currentPage: STATE.currentPage,
          totalPages: STATE.totalPages
        });
        break;
      
      case 'getProducts':
        sendResponse({
          products: Array.from(STATE.products.values())
        });
        break;

      case 'ping':
        sendResponse({ success: true, loaded: true });
        break;
      
      // ★ ดึงเฉพาะหน้าที่ระบุ ★
      case 'scrapeSinglePage':
        scrapeSinglePage(message.page || 1);
        sendResponse({ success: true });
        break;

      // ★ v3.23: ดึงทุกหน้าอัตโนมัติ ★
      case 'scrapeAllPages':
        scrapeAllPages();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }

    return true;
  });

  // แจ้งว่าพร้อมแล้ว
  sendMessage('ready', { url: window.location.href });
  console.log('[TikTok Scraper] Content script loaded and ready');

  // ==========================================
  // TikTok Upload Automation
  // (v3.04 structure — จาก content-tiktok-platform.js)
  // ==========================================

  let _isUploadHandling = false;
  let _hasUploadCompleted = false;

  // ── Status Panel (ส่งไป Activity Log ใน sidepanel) ──
  function createUploadStatusPanel() {}

  function updateUploadStatus(text) {
    console.log('[TikTok Auto]', text);
    let logType = 'info';
    if (text.startsWith('✅') || text.startsWith('💾')) logType = 'success';
    else if (text.startsWith('❌')) logType = 'error';
    else if (text.startsWith('⚠️') || text.startsWith('🛑')) logType = 'warning';
    try {
      chrome.runtime.sendMessage({
        source: 'tiktok-upload',
        type: 'ACTIVITY_LOG',
        data: { message: `[TikTok] ${text}`, logType }
      }).catch(() => {});
    } catch (e) {}
  }

  // ── Wait for Upload Page (v3.04) ──
  async function waitForUploadPage(timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const hasFileInput = document.querySelector('input[type="file"][accept*="video"]');
      const hasSelectBtn = document.querySelector('[data-e2e="select_video_button"], button.upload-btn, .upload-text-container');
      if (hasFileInput || hasSelectBtn) return true;
      await delay(500);
    }
    return false;
  }

  // ── Upload Video (v3.04) ──
  async function uploadVideo(base64Data) {
    try {
      const file = dataURLtoFile(base64Data, 'video.mp4');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const videoInputs = document.querySelectorAll('input[type="file"][accept*="video"]');
      if (videoInputs.length > 0) {
        console.log('[TikTok Auto] Found video file input');
        videoInputs[0].files = dataTransfer.files;
        videoInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      const allInputs = document.querySelectorAll('input[type="file"]');
      if (allInputs.length > 0) {
        allInputs[0].files = dataTransfer.files;
        allInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      const dropZone = document.querySelector('.upload-card, [class*="upload"], [data-e2e="upload-card"]');
      if (dropZone) {
        console.log('[TikTok Auto] Trying drag & drop...');
        ['dragenter', 'dragover'].forEach(evt => {
          dropZone.dispatchEvent(new DragEvent(evt, { bubbles: true, cancelable: true, dataTransfer }));
        });
        dropZone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
        return true;
      }

      return false;
    } catch (e) {
      console.error('[TikTok Auto] Upload video error:', e);
      return false;
    }
  }

  // ── Set Caption (v3.35 — Draft.js safe, no innerHTML) ──
  async function setCaption(captionText) {
    const editorSelectors = [
      '.notranslate.public-DraftEditor-content[contenteditable="true"][role="combobox"]',
      '.public-DraftEditor-content[contenteditable="true"]',
      '[data-e2e="caption-editor"] [contenteditable="true"]',
      'div[contenteditable="true"][role="combobox"][spellcheck]',
      '[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"][spellcheck]'
    ];

    let editor = null;
    for (const selector of editorSelectors) {
      const el = document.querySelector(selector);
      if (el && el.offsetParent !== null) {
        editor = el;
        console.log('[TikTok Auto] Found caption editor:', selector);
        break;
      }
    }

    if (!editor) {
      try { await navigator.clipboard.writeText(captionText); } catch (e) {}
      console.log('[TikTok Auto] Caption editor not found — copied to clipboard');
      return false;
    }

    // ★ PD-INSPIRED: Method 0 — DraftJS direct via MAIN world (most reliable) ★
    try {
      const draftJsResult = await new Promise((resolve) => {
        const msgId = 'draftjs-caption-' + Date.now();
        const handler = (event) => {
          if (event.data?.source === 'tiktok-platform-result' && event.data?.id === msgId) {
            window.removeEventListener('message', handler);
            resolve(event.data.result);
          }
        };
        window.addEventListener('message', handler);
        window.postMessage({ source: 'tiktok-platform-cmd', action: 'SET_CAPTION_DRAFTJS', payload: { text: captionText }, id: msgId }, '*');
        setTimeout(() => { window.removeEventListener('message', handler); resolve(false); }, 5000);
      });
      if (draftJsResult) {
        await delay(500);
        if (editor.textContent.length > 5) {
          console.log('[TikTok Auto] Caption set via DraftJS MAIN world (Method 0)');
          return true;
        }
      }
    } catch (e) {
      console.log('[TikTok Auto] Method 0 (DraftJS) error:', e.message);
    }

    // ★ Step 1: Focus + clear existing text via keyboard (Draft.js safe) ★
    editor.focus();
    await delay(300);
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', ctrlKey: true, bubbles: true }));
    document.execCommand('selectAll', false, null);
    await delay(100);
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true }));
    document.execCommand('delete', false, null);
    await delay(300);

    // ★ Method A: execCommand insertText (best for Draft.js — updates internal state) ★
    try {
      editor.focus();
      await delay(100);
      const inserted = document.execCommand('insertText', false, captionText);
      if (inserted && editor.textContent.length > 5) {
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('[TikTok Auto] Caption set via execCommand (Method A)');
        return true;
      }
      console.log('[TikTok Auto] execCommand returned', inserted, '- text length:', editor.textContent.length);
    } catch (e) {
      console.log('[TikTok Auto] Method A error:', e.message);
    }

    // ★ Method B: Real clipboard write + Ctrl+V simulation ★
    try {
      editor.focus();
      await delay(100);
      await navigator.clipboard.writeText(captionText);
      await delay(200);
      editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', code: 'KeyV', ctrlKey: true, bubbles: true, cancelable: true }));
      document.execCommand('paste');
      await delay(500);
      if (editor.textContent.length > 5) {
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('[TikTok Auto] Caption set via clipboard + Ctrl+V (Method B)');
        return true;
      }
    } catch (e) {
      console.log('[TikTok Auto] Method B error:', e.message);
    }

    // ★ Method C: Synthetic paste event with DataTransfer ★
    try {
      editor.focus();
      await delay(100);
      const dt = new DataTransfer();
      dt.setData('text/plain', captionText);
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true, cancelable: true, clipboardData: dt
      });
      editor.dispatchEvent(pasteEvent);
      await delay(500);
      if (editor.textContent.length > 5) {
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('[TikTok Auto] Caption set via synthetic paste (Method C)');
        return true;
      }
    } catch (e) {
      console.log('[TikTok Auto] Method C error:', e.message);
    }

    // ★ Method D: InputEvent insertFromPaste (modern browsers) ★
    try {
      editor.focus();
      await delay(100);
      const inputEvent = new InputEvent('beforeinput', {
        bubbles: true, cancelable: true,
        inputType: 'insertFromPaste',
        data: captionText
      });
      editor.dispatchEvent(inputEvent);
      await delay(500);
      if (editor.textContent.length > 5) {
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('[TikTok Auto] Caption set via InputEvent (Method D)');
        return true;
      }
    } catch (e) {
      console.log('[TikTok Auto] Method D error:', e.message);
    }

    // ★ Final fallback: copy to clipboard for manual paste ★
    try { await navigator.clipboard.writeText(captionText); } catch (e) {}
    console.log('[TikTok Auto] All methods failed — Caption in clipboard, user needs Ctrl+V');
    return false;
  }

  // ── Helper: Create File from base64 ──
  function dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'video/mp4';
    const bstr = atob(arr[1] || '');
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, { type: mime });
  }

  // ── Add Product Link (v3.04) ──
  // Flow: คลิก "Add product links" → กด +Add → Next → Showcase tab → Search → Select → Next → CTA → Add
  async function addProductLink(productId, cta) {
    try {
      // === Step 0: คลิก "Add product links" บนหน้า Upload (Seller account) ===
      updateUploadStatus('🛒 [0/6] กำลังหา "Add product links"...');

      const clickAddProductLinks = () => {
        const allClickables = document.querySelectorAll('a, button, span, div, p, [role="button"]');
        for (const el of allClickables) {
          const text = (el.textContent || '').trim().toLowerCase();
          if ((text.includes('add product link') || text === 'add products' || text === 'add product' || text === 'tag products') && el.offsetParent !== null) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 10 && rect.height > 5) {
              const target = el.closest('a') || el.closest('button') || el.closest('[role="button"]') || el;
              target.click();
              target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              console.log('[TikTok Auto] ✅ Clicked "Add product links":', text);
              return true;
            }
          }
        }
        const productSections = document.querySelectorAll('[class*="product" i], [class*="commerce" i], [class*="shopping" i]');
        for (const section of productSections) {
          const links = section.querySelectorAll('a, button, [role="button"], span[class*="link" i]');
          for (const link of links) {
            const text = (link.textContent || '').trim().toLowerCase();
            if ((text.includes('add') && (text.includes('product') || text.includes('link'))) || text.includes('tag product')) {
              if (link.offsetParent !== null) {
                link.click();
                link.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                console.log('[TikTok Auto] ✅ Clicked product link in section:', text);
                return true;
              }
            }
          }
        }
        return false;
      };

      let productLinksClicked = false;
      for (let attempt = 0; attempt < 5 && !productLinksClicked; attempt++) {
        productLinksClicked = clickAddProductLinks();
        if (!productLinksClicked) {
          console.log(`[TikTok Auto] "Add product links" not found (attempt ${attempt + 1}/5)`);
          await delay(3000);
        }
      }

      if (productLinksClicked) {
        console.log('[TikTok Auto] ✅ "Add product links" clicked — waiting for + Add button...');
        await delay(4000);
      } else {
        console.log('[TikTok Auto] "Add product links" not found — ปุ่ม + Add อาจมีอยู่แล้ว (Creator account)');
      }

      // === Step 1: กดปุ่ม "+ Add" ===
      updateUploadStatus('🛒 [1/6] กำลังกดปุ่ม + Add...');
      const addBtnReady = await waitForElement(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = (btn.textContent || '').trim();
          const hasPlus = btn.querySelector('[data-icon="Plus"], [data-testid="Plus"]');
          if ((text === 'Add' || text === '+ Add' || text.includes('Add')) && hasPlus) {
            if (btn.offsetParent !== null) return btn;
          }
        }
        for (const btn of buttons) {
          const text = (btn.textContent || '').trim();
          if (text === 'Add' && btn.offsetParent !== null) {
            const parent = btn.closest('[class*="product" i], [class*="commerce" i], [class*="modal" i]');
            if (parent) return btn;
          }
        }
        return null;
      }, 15000);

      if (!addBtnReady) {
        console.log('[TikTok Auto] + Add button not found');
        return false;
      }
      simulateRealClick(addBtnReady);
      await delay(2000);

      // === Step 2: กด "Next" ในหน้า Add link (ใช้วิธีเดียวกับ autopost) ===
      updateUploadStatus('🛒 [2/6] กำลังกด Next...');
      let nextClicked1 = false;
      for (let attempt = 0; attempt < 3 && !nextClicked1; attempt++) {
        const nextBtn = document.querySelector('div.common-modal-footer button.TUXButton.TUXButton--primary');
        if (nextBtn) {
          nextBtn.click();
          console.log(`[TikTok Auto] Step 2: Clicked Next via direct selector (attempt ${attempt + 1})`);
          nextClicked1 = true;
        } else {
          console.log(`[TikTok Auto] Step 2: Next not found via direct selector (attempt ${attempt + 1})`);
          nextClicked1 = await clickTUXButton('Next', 3000);
        }
        if (!nextClicked1) await delay(3000);
      }
      if (!nextClicked1) {
        console.log('[TikTok Auto] Next button (step 1) — all methods failed');
        return false;
      }
      await delay(4000);

      // === Step 2.5: คลิก tab "Showcase products" (สำหรับ seller channel ที่ default เป็น "My shop") ===
      updateUploadStatus('🛒 [2.5/6] เช็ค tab Showcase products...');

      const findShowcaseTab = () => {
        // TUXTabBar-specific: หา button.TUXTabBar-itemTitle ที่มี text "Showcase" โดยตรง
        const tuxTabs = document.querySelectorAll('button.TUXTabBar-itemTitle, button[class*="TUXTabBar-itemTitle"]');
        for (const tab of tuxTabs) {
          const text = (tab.textContent || '').trim().toLowerCase();
          if (text.includes('showcase') && tab.offsetParent !== null) {
            console.log('[TikTok Auto] Found Showcase via TUXTabBar selector:', tab.textContent.trim());
            return tab;
          }
        }
        // Fallback: generic search
        const allClickables = document.querySelectorAll(
          '[role="tab"], [role="radio"], [class*="Tab"], [class*="tab"], button, label, a, span, div'
        );
        for (const el of allClickables) {
          const text = (el.textContent || '').trim().toLowerCase();
          if ((text === 'showcase products' || text === 'showcase product' || text === 'showcase') && el.offsetParent !== null) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 20 && rect.width < 500 && rect.height > 5 && rect.height < 100) {
              return el.closest('[role="tab"]') || el.closest('button') || el.closest('label') || el;
            }
          }
        }
        const radios = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        for (const radio of radios) {
          const label = radio.closest('label') || radio.parentElement;
          const labelText = (label?.textContent || '').toLowerCase();
          if (labelText.includes('showcase')) {
            if (!radio.checked) return radio;
          }
        }
        return null;
      };

      let showcaseClicked = false;
      for (let attempt = 0; attempt < 3 && !showcaseClicked; attempt++) {
        const tab = await waitForElement(findShowcaseTab, 10000);
        if (tab) {
          console.log(`[TikTok Auto] Found "Showcase products" tab (attempt ${attempt + 1}), clicking...`);
          simulateRealClick(tab);
          await delay(500);
          tab.click();
          await delay(500);
          await sendToMainWorld('CLICK_ELEMENT', { text: 'Showcase products' });
          await delay(2000);
          showcaseClicked = true;
          console.log('[TikTok Auto] ✅ Switched to Showcase products tab');
        } else {
          console.log(`[TikTok Auto] Showcase tab not found (attempt ${attempt + 1}/3)`);
          await delay(2000);
        }
      }

      if (!showcaseClicked) {
        console.log('[TikTok Auto] "Showcase products" tab not found after 3 attempts — อาจเป็น creator account (ไม่ใช่ seller), continuing...');
      }
      await delay(2000);

      // === Step 3: ค้นหา Product ID ในช่อง Search ===
      updateUploadStatus('🛒 [3/6] กำลังค้นหา Product ID...');
      const searchInput = await waitForElement(() => {
        return document.querySelector('input[placeholder="Search products"], input[placeholder*="Search product" i], input.TUXTextInputCore-input');
      }, 10000);

      if (!searchInput) {
        console.log('[TikTok Auto] Search input not found');
        return false;
      }

      searchInput.focus();
      await delay(300);
      setNativeInputValue(searchInput, productId);
      await delay(500);

      const searchIcon = document.querySelector('.product-search-icon, [class*="product-search-icon"], [data-icon="Search"], [data-testid="Search"]');
      if (searchIcon) {
        simulateRealClick(searchIcon);
        console.log('[TikTok Auto] Clicked search icon');
      } else {
        searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
        searchInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
        console.log('[TikTok Auto] Pressed Enter to search');
      }

      updateUploadStatus('🛒 [3/6] รอผลค้นหา...');
      await delay(5000);

      // === Step 4: เลือก Product (คลิก radio ตัวแรก) ===
      updateUploadStatus('🛒 [4/6] กำลังเลือก Product...');
      const radio = await waitForElement(() => {
        const radios = document.querySelectorAll('input[type="radio"].TUXRadioStandalone-input');
        for (const r of radios) {
          if (r.name !== 'postSchedule' && r.offsetParent !== null) return r;
        }
        return null;
      }, 15000);

      if (!radio) {
        console.log('[TikTok Auto] Product radio not found after search');
        return false;
      }

      console.log('[TikTok Auto] Found product radio, clicking via EXEC_CLICK_RADIO...');
      const execRadioResult = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'EXEC_CLICK_RADIO' }, (resp) => {
          if (chrome.runtime.lastError) {
            console.log('[TikTok Auto] EXEC_CLICK_RADIO error:', chrome.runtime.lastError.message);
            resolve(false);
          } else {
            console.log('[TikTok Auto] EXEC_CLICK_RADIO result:', resp);
            resolve(resp?.success || false);
          }
        });
      });
      await delay(1000);

      if (!radio.checked) {
        const radioRow = radio.closest('tr') || radio.closest('[class*="row"]') || radio.closest('label') || radio.parentElement;
        simulateRealClick(radioRow);
        await delay(500);
        simulateRealClick(radio);
        await delay(500);
      }

      console.log('[TikTok Auto] Radio checked:', radio.checked);
      await delay(2000);

      // === Step 5: กด "Next" อีกครั้ง (ใช้วิธีเดียวกับ autopost) ===
      updateUploadStatus('🛒 [5/6] กำลังกด Next...');
      let nextClicked2 = false;
      for (let attempt = 0; attempt < 3 && !nextClicked2; attempt++) {
        const nextBtn = document.querySelector('div.common-modal-footer button.TUXButton.TUXButton--primary');
        if (nextBtn) {
          nextBtn.click();
          console.log(`[TikTok Auto] Clicked Next via direct selector (attempt ${attempt + 1})`);
          nextClicked2 = true;
        } else {
          console.log(`[TikTok Auto] Next button not found via direct selector (attempt ${attempt + 1})`);
          nextClicked2 = await clickTUXButton('Next', 4000);
        }
        if (!nextClicked2) await delay(4000);
      }
      if (!nextClicked2) {
        console.log('[TikTok Auto] Next button (step 2) — all methods failed');
        return false;
      }
      await delay(5000);

      // === Step 6: ใส่ CTA แล้วกด "Add" ===
      if (cta) {
        updateUploadStatus('🛒 [6/6] กำลังใส่ CTA...');
        const ctaInput = await waitForElement(() => {
          const inputs = document.querySelectorAll('input.TUXTextInputCore-input[type="text"]');
          for (const inp of inputs) {
            const placeholder = (inp.placeholder || '').toLowerCase();
            if (!placeholder.includes('search')) return inp;
          }
          return null;
        }, 10000);

        if (ctaInput) {
          ctaInput.focus();
          await delay(300);
          ctaInput.select();
          document.execCommand('selectAll', false, null);
          document.execCommand('delete', false, null);
          await delay(200);
          setNativeInputValue(ctaInput, cta);
          await delay(500);
        }
      }

      updateUploadStatus('🛒 กำลังกด Add...');
      const addClicked = await clickTUXButton('Add', 15000);
      if (!addClicked) {
        console.log('[TikTok Auto] Final Add button — all methods failed');
        return false;
      }
      await delay(3000);

      console.log('[TikTok Auto] Product link + CTA added successfully!');
      return true;

    } catch (err) {
      console.error('[TikTok Auto] addProductLink error:', err);
      return false;
    }
  }

  // ── Click "Now" radio (v3.04) ──
  async function clickNowRadio() {
    try {
      const radios = document.querySelectorAll('input[type="radio"][name="postSchedule"]');
      for (const radio of radios) {
        if (radio.value === 'now' || (radios.length === 2 && radio.value !== 'schedule')) {
          const container = radio.closest('span[class*="Radio"]') || radio.closest('label') || radio;
          simulateRealClick(container);
          if (!radio.checked) simulateRealClick(radio);
          console.log('[TikTok Auto] Clicked "Now" radio');
          return true;
        }
      }
      return await sendToMainWorld('CLICK_RADIO', { value: 'now' });
    } catch (err) {
      console.error('[TikTok Auto] clickNowRadio error:', err);
      return false;
    }
  }

  // ── Click "Schedule" radio — คัดลอกจาก content-tiktok-platform.js (robust version) ──
  async function clickScheduleRadio() {
    try {
      // วิธี 1: MAIN world — trigger React handler ตรงๆ
      const mainResult = await sendToMainWorld('CLICK_RADIO', { value: 'schedule' });
      if (mainResult) {
        console.log('[TikTok Auto] Schedule radio clicked via MAIN world');
        await delay(500);
        const radios = document.querySelectorAll('input[type="radio"]');
        for (const radio of radios) {
          if (radio.value === 'schedule' && radio.checked) {
            console.log('[TikTok Auto] ✅ Schedule radio verified checked');
            return true;
          }
        }
        console.log('[TikTok Auto] MAIN world clicked but radio not checked, trying content script...');
      }

      // วิธี 2: หา "Schedule" text label แล้วคลิก
      const allLabels = document.querySelectorAll('span, label, div');
      for (const el of allLabels) {
        const text = (el.textContent || '').trim();
        if (text === 'Schedule' && el.offsetParent !== null) {
          const rect = el.getBoundingClientRect();
          if (rect.width < 200 && rect.height < 60) {
            const radioContainer = el.closest('label') || el.closest('[class*="Radio"]') || el.closest('[class*="radio"]') || el;
            simulateRealClick(radioContainer);
            console.log('[TikTok Auto] Clicked "Schedule" label via text search');
            await delay(500);
            await sendToMainWorld('CLICK_RADIO', { value: 'schedule' });
            return true;
          }
        }
      }

      // วิธี 3: Original radio selector
      const radios = document.querySelectorAll('input[type="radio"]');
      for (const radio of radios) {
        if (radio.value === 'schedule' || radio.nextSibling?.textContent?.includes('Schedule')) {
          const container = radio.closest('span[class*="Radio"]') || radio.closest('label') || radio;
          simulateRealClick(container);
          if (!radio.checked) simulateRealClick(radio);
          console.log('[TikTok Auto] Clicked Schedule radio via input selector');
          return true;
        }
      }

      console.log('[TikTok Auto] ❌ Schedule radio not found');
      return false;
    } catch (err) {
      console.error('[TikTok Auto] clickScheduleRadio error:', err);
      return false;
    }
  }

  // ── setTikTokSchedule — ตั้งเวลาโพสต์ ★ คัดลอกจาก content-tiktok-platform.js ★ ──
  async function setTikTokSchedule(scheduleTime) {
    try {
      const dt = new Date(scheduleTime);
      const targetHour = dt.getHours();
      const targetMinute = dt.getMinutes();
      const roundedMinute = Math.round(targetMinute / 5) * 5;
      const targetYear = dt.getFullYear();
      const targetMonth = dt.getMonth();
      const targetDay = dt.getDate();
      console.log('[TikTok Auto] Setting schedule:', targetHour, ':', roundedMinute, targetYear, '-', targetMonth + 1, '-', targetDay);

      // Step A: คลิก "Schedule" radio
      updateUploadStatus('⏰ [1/3] เลือก Schedule...');
      await clickScheduleRadio();
      await delay(2000);

      // Verify Step A
      let scheduleActive = await waitForElement(() => {
        const inputs = document.querySelectorAll('input.TUXTextInputCore-input[readonly], input[readonly]');
        for (const inp of inputs) {
          if (/^\d{1,2}:\d{2}$/.test(inp.value)) return inp;
        }
        return null;
      }, 5000);

      if (!scheduleActive) {
        console.log('[TikTok Auto] ⚠️ Schedule mode not activated, retrying radio click...');
        await clickScheduleRadio();
        await delay(2000);
        scheduleActive = await waitForElement(() => {
          const inputs = document.querySelectorAll('input.TUXTextInputCore-input[readonly], input[readonly]');
          for (const inp of inputs) {
            if (/^\d{1,2}:\d{2}$/.test(inp.value)) return inp;
          }
          return null;
        }, 5000);
      }

      const expectedTime = `${String(targetHour).padStart(2, '0')}:${String(roundedMinute).padStart(2, '0')}`;
      const expectedDate = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;

      // Step B: ตั้งเวลา — dropdown approach
      updateUploadStatus('⏰ [2/3] กำลังตั้งเวลา...');
      console.log('[TikTok Auto] Trying time set via dropdown...');
      const timeInput = scheduleActive || await waitForElement(() => {
        const inputs = document.querySelectorAll('input[readonly]');
        for (const inp of inputs) {
          if (/^\d{1,2}:\d{2}$/.test(inp.value)) return inp;
        }
        return null;
      }, 5000);

      if (timeInput) {
        const origTimeValue = timeInput.value;
        console.log('[TikTok Auto] Time input found, current value:', origTimeValue);

        const timeContainer = timeInput.closest('div[class*="TUXTextInput"]') || timeInput.parentElement;
        simulateRealClick(timeContainer);
        await delay(500);
        await sendToMainWorld('CLICK_INPUT', { pattern: '^\\d{1,2}:\\d{2}$' });
        await delay(1500);

        console.log('[TikTok Auto] Selecting hour:', targetHour);
        await sendToMainWorld('CLICK_TIME_ITEM', { value: targetHour, column: 'hour' });
        await delay(1000);

        console.log('[TikTok Auto] Selecting minute:', roundedMinute);
        await sendToMainWorld('CLICK_TIME_ITEM', { value: roundedMinute, column: 'minute' });
        await delay(1000);

        document.body.click();
        await delay(1000);

        const newTimeValue = timeInput.value;
        console.log('[TikTok Auto] Time after selection:', newTimeValue, '| Expected:', expectedTime);

        if (newTimeValue !== expectedTime && newTimeValue === origTimeValue) {
          console.log('[TikTok Auto] ⚠️ Time did not change, retrying...');
          simulateRealClick(timeContainer);
          await sendToMainWorld('CLICK_INPUT', { pattern: '^\\d{1,2}:\\d{2}$' });
          await delay(1500);
          await sendToMainWorld('CLICK_TIME_ITEM', { value: targetHour, column: 'hour' });
          await delay(1000);
          await sendToMainWorld('CLICK_TIME_ITEM', { value: roundedMinute, column: 'minute' });
          await delay(1000);
          document.body.click();
          await delay(1000);
          console.log('[TikTok Auto] Time after retry:', timeInput.value);
        }
      } else {
        console.log('[TikTok Auto] ❌ Time input not found');
      }

      // Step C: ตั้งวันที่
      updateUploadStatus('⏰ [3/3] กำลังตั้งวันที่...');

      const dateInput = await waitForElement(() => {
        const tuxInputs = document.querySelectorAll('input.TUXTextInputCore-input[readonly]');
        for (const inp of tuxInputs) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(inp.value)) return inp;
        }
        const inputs = document.querySelectorAll('input[readonly]');
        for (const inp of inputs) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(inp.value)) return inp;
        }
        return null;
      }, 8000);

      if (dateInput) {
        console.log('[TikTok Auto] Found date input, value:', dateInput.value);

        // APPROACH 1: React fiber direct
        console.log('[TikTok Auto] [Date] Approach 1: React fiber direct...');
        const directDateResult = await sendToMainWorld('SET_SCHEDULE_DIRECT', { time: null, date: expectedDate });
        if (directDateResult?.dateSet) {
          await delay(1000);
          const afterCheck = dateInput.value;
          console.log('[TikTok Auto] Approach 1 result: dateSet=true, value after 1s:', afterCheck, '| expected:', expectedDate);
          if (afterCheck === expectedDate) {
            console.log('[TikTok Auto] ✅ Date set via React fiber direct!');
          }
        }

        // APPROACH 2: DEBUGGER trusted click to open calendar + click day
        if (dateInput.value !== expectedDate) {
          console.log('[TikTok Auto] [Date] Approach 2: DEBUGGER calendar...');
          try {
            const debugResult = await new Promise((resolve) => {
              chrome.runtime.sendMessage({ type: 'DEBUGGER_SET_DATE', day: targetDay }, (resp) => {
                if (chrome.runtime.lastError) resolve(null);
                else resolve(resp);
              });
            });
            if (debugResult?.success) {
              await delay(1500);
              console.log('[TikTok Auto] DEBUGGER_SET_DATE result: success, newValue:', debugResult.newValue);
              if (dateInput.value === expectedDate) {
                console.log('[TikTok Auto] ✅ Date set via DEBUGGER calendar!');
              }
            } else {
              console.log('[TikTok Auto] DEBUGGER_SET_DATE result:', debugResult);
            }
          } catch (e) { console.log('[TikTok Auto] DEBUGGER_SET_DATE error:', e.message); }
        }

        // APPROACH 3: DEBUGGER_CLICK to open calendar
        if (dateInput.value !== expectedDate) {
          console.log('[TikTok Auto] [Date] Approach 3: DEBUGGER_CLICK to open calendar...');

          const rect = dateInput.getBoundingClientRect();
          const cx = Math.round(rect.left + rect.width / 2);
          const cy = Math.round(rect.top + rect.height / 2);

          console.log('[TikTok Auto] DEBUGGER_CLICK on date input at:', cx, cy);
          const dbgOpen = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'DEBUGGER_CLICK', x: cx, y: cy, keepAttached: true }, (resp) => {
              if (chrome.runtime.lastError) resolve(null);
              else resolve(resp);
            });
          });
          console.log('[TikTok Auto] DEBUGGER_CLICK result:', dbgOpen?.success);
          await delay(2000);

          let calendarFound = !!document.querySelector(
            '[class*="picker-dropdown"], [class*="PickerPanel"], [class*="picker-panel"], ' +
            '[class*="DatePicker"][class*="panel"], [class*="calendar"], [class*="Calendar"], ' +
            '[class*="TUXCalendar"], [role="grid"], table[class*="date"]'
          );

          if (!calendarFound) {
            const icon = dateInput.parentElement?.querySelector('[class*="leadingIcon"], [class*="Icon"], svg');
            const box = dateInput.closest('.TUXInputBox') || dateInput.closest('div[class*="InputBox"]');
            const tryTargets = [icon, box].filter(Boolean);

            for (const el of tryTargets) {
              if (calendarFound) break;
              const elRect = el.getBoundingClientRect();
              if (elRect.width < 3) continue;
              const ex = Math.round(elRect.left + elRect.width / 2);
              const ey = Math.round(elRect.top + elRect.height / 2);
              console.log('[TikTok Auto] DEBUGGER_CLICK on', el.tagName, 'at:', ex, ey);
              await new Promise((resolve) => {
                chrome.runtime.sendMessage({ type: 'DEBUGGER_CLICK', x: ex, y: ey, keepAttached: true }, (resp) => {
                  if (chrome.runtime.lastError) resolve(null);
                  else resolve(resp);
                });
              });
              await delay(1500);
              calendarFound = !!document.querySelector(
                '[class*="picker-dropdown"], [class*="PickerPanel"], [class*="picker-panel"], ' +
                '[class*="DatePicker"][class*="panel"], [class*="calendar"], [class*="Calendar"], ' +
                '[class*="TUXCalendar"], [role="grid"], table[class*="date"]'
              );
            }
          }

          if (!calendarFound) {
            await sendToMainWorld('OPEN_CALENDAR', {});
            await delay(1000);
            await sendToMainWorld('CLICK_INPUT', { pattern: '^\\d{4}-\\d{2}-\\d{2}$' });
            await delay(1500);
          }

          const calendarPopup = await waitForElement(() => {
            const sels = [
              '[class*="picker-dropdown"]', '[class*="PickerPanel"]', '[class*="picker-panel"]',
              '[class*="DatePicker"]', '[class*="calendar"]', '[class*="Calendar"]',
              '[class*="TUXCalendar"]', '[role="grid"]', '[role="dialog"] table',
              'table[class*="date"]'
            ];
            for (const sel of sels) {
              const el = document.querySelector(sel);
              if (el && el.offsetParent !== null) {
                const r = el.getBoundingClientRect();
                if (r.width > 80 && r.height > 60) return el;
              }
            }
            const bodyKids = [...document.body.children].reverse().slice(0, 10);
            for (const child of bodyKids) {
              const r = child.getBoundingClientRect();
              if (r.width > 100 && r.height > 80) {
                const style = window.getComputedStyle(child);
                if (style.position === 'absolute' || style.position === 'fixed' || parseInt(style.zIndex) > 50) {
                  const text = child.textContent || '';
                  if (/\b(1[0-9]|2[0-9]|30|31|[1-9])\b/.test(text)) return child;
                }
              }
            }
            return null;
          }, 3000);

          if (calendarPopup) {
            console.log('[TikTok Auto] ✅ Calendar popup opened!', calendarPopup.tagName);
          } else {
            console.log('[TikTok Auto] Calendar popup not found after all click attempts');
          }
        }

        // APPROACH 4: Calendar navigation + day cell click
        if (dateInput.value !== expectedDate) {
          const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
          const maxNav = 24;

          for (let i = 0; i < maxNav; i++) {
            let headerEl = null;
            let headerText = '';

            const candidates = document.querySelectorAll(
              '[class*="calendar"] *, [class*="Calendar"] *, [class*="DatePicker"] *, [class*="datepicker"] *, [class*="panel"] *, [role="grid"] *, [class*="TUXCalendar"] *, [class*="picker"] *, [class*="Picker"] *'
            );
            for (const el of candidates) {
              if (el.childElementCount > 0) continue;
              const txt = (el.textContent || '').trim();
              const match = txt.match(/^(\w+)\s*\/?\s*(\d{4})$/);
              if (match && months.includes(match[1])) {
                headerEl = el;
                headerText = txt;
                break;
              }
            }

            if (!headerEl) {
              const broader = document.querySelectorAll('div, span, button');
              for (const el of broader) {
                if (el.childElementCount > 3) continue;
                const txt = (el.textContent || '').trim();
                const match = txt.match(/^(\w+)\s*\/?\s*(\d{4})$/);
                if (match && months.includes(match[1])) {
                  headerEl = el;
                  headerText = txt;
                  break;
                }
              }
            }

            if (!headerEl) {
              console.log('[TikTok Auto] Calendar header not found, stopping navigation');
              break;
            }

            console.log('[TikTok Auto] Calendar header:', headerText);

            let calMonth = -1, calYear = -1;
            for (let m = 0; m < months.length; m++) {
              if (headerText.includes(months[m])) { calMonth = m; break; }
            }
            const ym = headerText.match(/\d{4}/);
            if (ym) calYear = parseInt(ym[0]);

            if (calMonth === targetMonth && calYear === targetYear) {
              console.log('[TikTok Auto] Correct month/year reached');
              break;
            }

            const needForward = (targetYear > calYear) || (targetYear === calYear && targetMonth > calMonth);
            console.log('[TikTok Auto] Need to navigate:', needForward ? 'FORWARD >' : '< BACKWARD');

            let navClicked = false;
            const allBtns = document.querySelectorAll('button');
            const svgNavBtns = [...allBtns].filter(b => {
              if (!b.querySelector('svg')) return false;
              if (b.textContent.trim().length > 3) return false;
              const navRect = b.getBoundingClientRect();
              return navRect.width > 0 && navRect.height > 0 && navRect.width < 60;
            });

            svgNavBtns.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);

            if (svgNavBtns.length >= 2) {
              const navBtn = needForward ? svgNavBtns[svgNavBtns.length - 1] : svgNavBtns[0];
              simulateRealClick(navBtn);
              navClicked = true;
            }

            if (!navClicked) {
              await sendToMainWorld('CLICK_CALENDAR_NAV', { direction: needForward ? 'next' : 'prev' });
            }
            await delay(800);
          }

          function findDayCell(day) {
            const dayCells = document.querySelectorAll(
              'td, [role="gridcell"], [class*="calendar"] button, [class*="Calendar"] button, ' +
              '[class*="DatePicker"] button, [class*="DatePicker"] div, [class*="DatePicker"] span, ' +
              '[class*="day"], [class*="Day"], [class*="date"] button, [class*="TUXCalendar"] td'
            );
            const dayCandidates = [];
            for (const cell of dayCells) {
              const text = (cell.textContent || '').trim();
              if (text !== String(day)) continue;
              if (cell.childElementCount > 2) continue;
              if (cell.offsetParent === null) continue;
              const cls = (cell.className || '').toLowerCase();
              if (cls.includes('disabled') || cls.includes('outside') || cls.includes('other') || cls.includes('prev') || cls.includes('next')) continue;
              const cellRect = cell.getBoundingClientRect();
              if (cellRect.width < 10 || cellRect.height < 10) continue;
              dayCandidates.push({ el: cell, rect: cellRect });
            }
            dayCandidates.sort((a, b) => {
              if (a.el.childElementCount === 0 && b.el.childElementCount > 0) return -1;
              if (a.el.childElementCount > 0 && b.el.childElementCount === 0) return 1;
              return (a.rect.width * a.rect.height) - (b.rect.width * b.rect.height);
            });
            return dayCandidates.length > 0 ? dayCandidates[0] : null;
          }

          // APPROACH 5: Calendar day cell click — retry 3 รอบ
          if (dateInput.value !== expectedDate) {
            for (let dateAttempt = 0; dateAttempt < 3; dateAttempt++) {
              await delay(500);
              console.log('[TikTok Auto] [Date] Day cell click attempt', dateAttempt + 1, '/ 3, day:', targetDay);

              let dateChanged = false;

              const found = findDayCell(targetDay);
              if (found) {
                const execResult = await new Promise((resolve) => {
                  chrome.runtime.sendMessage({ type: 'EXEC_CLICK_DATE_CELL', day: targetDay }, (resp) => {
                    if (chrome.runtime.lastError) resolve(false);
                    else resolve(resp?.success);
                  });
                });
                if (execResult) {
                  await delay(1000);
                  if (dateInput.value === expectedDate) {
                    console.log('[TikTok Auto] ✅ Date set via EXEC_CLICK_DATE_CELL!');
                    dateChanged = true;
                  }
                }
                if (!dateChanged) {
                  const freshTarget = findDayCell(targetDay);
                  if (freshTarget) {
                    const dcx = Math.round(freshTarget.rect.left + freshTarget.rect.width / 2);
                    const dcy = Math.round(freshTarget.rect.top + freshTarget.rect.height / 2);
                    try {
                      const dbgResult = await new Promise((resolve) => {
                        chrome.runtime.sendMessage({ type: 'DEBUGGER_CLICK', x: dcx, y: dcy }, (resp) => {
                          if (chrome.runtime.lastError) resolve(null);
                          else resolve(resp);
                        });
                      });
                      if (dbgResult?.success) {
                        await delay(1500);
                        if (dateInput.value === expectedDate) {
                          console.log('[TikTok Auto] ✅ Date set via DEBUGGER_CLICK!');
                          dateChanged = true;
                        }
                      }
                    } catch (e) { console.log('[TikTok Auto] DEBUGGER_CLICK error:', e.message); }
                  }
                }
                if (!dateChanged) {
                  const clickTarget = findDayCell(targetDay);
                  if (clickTarget) {
                    simulateRealClick(clickTarget.el);
                    await sendToMainWorld('CLICK_DATE_CELL', { day: targetDay });
                    await delay(1000);
                    if (dateInput.value === expectedDate) {
                      console.log('[TikTok Auto] ✅ Date set via simulateRealClick!');
                      dateChanged = true;
                    }
                  }
                }
              }

              if (!dateChanged) {
                try {
                  document.body.click();
                  await delay(300);
                  const debugResult2 = await new Promise((resolve) => {
                    chrome.runtime.sendMessage({ type: 'DEBUGGER_SET_DATE', day: targetDay }, (resp) => {
                      if (chrome.runtime.lastError) resolve(null);
                      else resolve(resp);
                    });
                  });
                  if (debugResult2?.success) {
                    await delay(1500);
                    if (dateInput.value === expectedDate) {
                      console.log('[TikTok Auto] ✅ Date set via DEBUGGER_SET_DATE retry!');
                      dateChanged = true;
                    }
                  }
                } catch (e) {}
              }

              if (!dateChanged) {
                const retryDirect = await sendToMainWorld('SET_SCHEDULE_DIRECT', { time: null, date: expectedDate });
                if (retryDirect?.dateSet) {
                  await delay(500);
                  if (dateInput.value === expectedDate) {
                    console.log('[TikTok Auto] ✅ Date set via retry setScheduleDirect!');
                    dateChanged = true;
                  }
                }
              }

              if (dateChanged) break;
              if (dateInput.value === expectedDate) break;

              if (dateAttempt < 2) {
                console.log('[TikTok Auto] ⚠️ Date not changed, reopening calendar...');
                document.body.click();
                await delay(500);
                const reopenRect = dateInput.getBoundingClientRect();
                const reopenX = Math.round(reopenRect.left + reopenRect.width / 2);
                const reopenY = Math.round(reopenRect.top + reopenRect.height / 2);
                await new Promise((resolve) => {
                  chrome.runtime.sendMessage({ type: 'DEBUGGER_CLICK', x: reopenX, y: reopenY, keepAttached: true }, (resp) => {
                    if (chrome.runtime.lastError) resolve(null);
                    else resolve(resp);
                  });
                });
                await delay(2000);
              }
            }
          }
        } // close APPROACH 4 if block

        // ปิด calendar + detach debugger
        await delay(500);
        document.body.click();
        await delay(500);
        try {
          chrome.runtime.sendMessage({ type: 'DEBUGGER_DETACH' }, () => {});
        } catch (e) {}

        // LOCK_DATE_FALLBACK — absolute last resort
        if (dateInput.value !== expectedDate) {
          console.log('[TikTok Auto] [Date] ALL approaches failed — using LOCK_DATE_FALLBACK...');
          const lockResult = await sendToMainWorld('LOCK_DATE_FALLBACK', {
            targetDate: expectedDate,
            currentDate: dateInput.value
          });
          console.log('[TikTok Auto] LOCK_DATE_FALLBACK result:', lockResult);
          await delay(500);
        }

        // FINAL CHECK
        console.log('[TikTok Auto] Final date value:', dateInput.value, '| Expected:', expectedDate);
        if (dateInput.value !== expectedDate) {
          console.log('[TikTok Auto] ⚠️ Date could not be changed. Proceeding with current date.');
        }
      } else {
        console.log('[TikTok Auto] Date input not found, skipping date selection');
      }

      console.log('[TikTok Auto] Schedule set!');
      return true;
    } catch (err) {
      console.error('[TikTok Auto] setTikTokSchedule error:', err);
      return false;
    }
  }

  // ── Click "Show more" (v3.04) ──
  async function clickShowMore() {
    const spans = document.querySelectorAll('span');
    for (const span of spans) {
      if (span.textContent.trim() === 'Show more' && span.offsetParent !== null) {
        const parent = span.closest('.more-btn') || span.closest('[data-e2e="advanced_settings_container"]') || span;
        simulateRealClick(parent);
        console.log('[TikTok Auto] Clicked "Show more"');
        return true;
      }
    }
    return await sendToMainWorld('CLICK_ELEMENT', { text: 'Show more', tag: 'span' });
  }

  // ── Click "AI-generated content" toggle (v3.04) ──
  async function clickAIGeneratedContent() {
    const allEls = document.querySelectorAll('span, div, label');
    for (const el of allEls) {
      if (el.textContent.trim() === 'AI-generated content' && el.offsetParent !== null) {
        const container = el.closest('div');
        if (!container) continue;
        const toggle = container.querySelector('[role="switch"], [class*="Switch__content"], input[type="checkbox"]');
        if (toggle) {
          const state = toggle.getAttribute('aria-checked') || toggle.getAttribute('data-state');
          if (state === 'true' || state === 'checked') {
            console.log('[TikTok Auto] AI-generated content already enabled');
            return true;
          }
          simulateRealClick(toggle);
          console.log('[TikTok Auto] Clicked AI-generated content toggle');
          return true;
        }
      }
    }
    return await sendToMainWorld('CLICK_ELEMENT', { text: 'AI-generated content', toggleSelector: '[role="switch"], [class*="Switch__content"]' });
  }

  // ── Click TUXButton — ลอง 4 วิธีเรียงลำดับ + retry (v3.04) ──
  async function clickTUXButton(text, timeoutMs = 15000) {
    const start = Date.now();
    let attempts = 0;

    while (Date.now() - start < timeoutMs) {
      const labels = document.querySelectorAll('.TUXButton-label');
      let targetBtn = null;
      for (const label of labels) {
        if (label.textContent.trim() === text) {
          const btn = label.closest('button');
          if (btn && btn.offsetParent !== null) { targetBtn = btn; break; }
        }
      }

      if (targetBtn) {
        attempts++;
        console.log(`[TikTok Auto] Found TUXButton "${text}", attempt ${attempts}...`);

        if (targetBtn.disabled || targetBtn.getAttribute('aria-disabled') === 'true') {
          console.log(`[TikTok Auto] Button "${text}" is disabled, waiting...`);
          await delay(1000);
          continue;
        }

        targetBtn.scrollIntoView({ block: 'center', behavior: 'instant' });
        await delay(300);

        const execResult = await execClickButton(text);
        await delay(800);
        if (execResult) {
          const gone = !findTUXButtonByText(text);
          if (gone) {
            console.log(`[TikTok Auto] execClickButton "${text}" SUCCESS — button gone`);
            return true;
          }
          console.log(`[TikTok Auto] execClickButton "${text}" returned success but button still exists`);
        }

        await sendToMainWorld('CLICK_BUTTON', { text });
        await delay(800);
        if (!findTUXButtonByText(text)) {
          console.log(`[TikTok Auto] MAIN world click "${text}" SUCCESS — button gone`);
          return true;
        }

        simulateRealClick(targetBtn);
        await delay(500);

        targetBtn.click();
        await delay(500);

        if (!findTUXButtonByText(text)) {
          console.log(`[TikTok Auto] simulateRealClick/click "${text}" SUCCESS — button gone`);
          return true;
        }

        if (attempts >= 3) {
          console.log(`[TikTok Auto] clickTUXButton "${text}" — ${attempts} attempts exhausted, button still exists = FAILED`);
          return false;
        }

        console.log(`[TikTok Auto] clickTUXButton "${text}" — button still exists, retrying...`);
        await delay(1500);
        continue;
      }

      await delay(1000);
    }

    console.log(`[TikTok Auto] clickTUXButton "${text}" — NOT FOUND after ${timeoutMs}ms`);
    return false;
  }

  // ── Main Upload Flow (v3.04 structure) ──
  async function handleTikTokUpload() {
    if (!window.location.href.includes('/upload')) return;
    if (_isUploadHandling) return;
    if (_hasUploadCompleted) {
      console.log('[TikTok Auto] Flow already completed, ignoring');
      return;
    }

    const result = await chrome.storage.local.get(['flowStatus', 'currentFlowData', 'currentItemPosted', 'currentItemPostedAt']);
    const status = result.flowStatus;
    let flowData = result.currentFlowData;

    const recentlyPosted = result.currentItemPostedAt && (Date.now() - result.currentItemPostedAt < 60000);
    if (result.currentItemPosted === true || status === 'posted' || status === 'upload_in_progress' || recentlyPosted) {
      console.log(`[TikTok Auto] Item already completed/uploading — skipping`);
      return;
    }

    const validStatuses = ['video_saved', 'video_saved_8s', 'video_saved_16s', 'completed_8s', 'completed_16s', 'completed_download', 'video_downloaded_16s', 'extending_16s'];
    if (!validStatuses.includes(status)) return;

    if (!flowData || !flowData.videoBlob) {
      try {
        const bgResult = await chrome.runtime.sendMessage({ type: 'FETCH_VIDEO_BLOB' });
        if (bgResult?.status === 'success' && bgResult.base64) {
          flowData = flowData ? { ...flowData, videoBlob: bgResult.base64 } : { videoBlob: bgResult.base64 };
        }
      } catch (e) {}
      if (!flowData?.videoBlob) return;
    }

    _isUploadHandling = true;
    console.log('[TikTok Auto] Found pending upload, starting...');
    console.log('[TikTok Auto] flowStatus:', status, '| productId:', flowData.productId, '| postMode:', flowData.postMode, '| scheduleTime:', flowData.scheduleTime);
    createUploadStatusPanel();

    try {
      // Wait for upload page ready (v3.04)
      updateUploadStatus('⏳ รอหน้า Upload โหลด...');
      const pageReady = await waitForUploadPage(30000);
      if (!pageReady) {
        updateUploadStatus('⚠️ หน้า Upload ไม่พร้อม');
        return;
      }
      await delay(2000);

      // Step 1: Upload Video
      updateUploadStatus('📤 กำลังอัพโหลด Video...');
      const uploaded = await retryAction(() => uploadVideo(flowData.videoBlob), 3, 5000);

      if (!uploaded) {
        updateUploadStatus('⚠️ อัพโหลดไม่สำเร็จ — กรุณาลากไฟล์ใส่เอง');
        return;
      }

      await delay(5000);

      // Step 2: Set Caption
      if (flowData.caption) {
        updateUploadStatus('📝 กำลังใส่ Caption...');
        await retryAction(() => setCaption(flowData.caption), 3, 5000);
        await delay(3000);
      }

      // Step 3: Add Product Link + CTA
      if (flowData.productId) {
        console.log('[TikTok Auto] === Starting Step 3: Add Product Link ===');
        updateUploadStatus('🛒 กำลังปักตะกร้า...');
        const productAdded = await addProductLink(flowData.productId, flowData.cta || '');
        console.log('[TikTok Auto] === Step 3 result:', productAdded, '===');
        if (productAdded) {
          updateUploadStatus('✅ ปักตะกร้าสำเร็จ!');
        } else {
          updateUploadStatus('⚠️ ปักตะกร้าไม่สำเร็จ — ข้ามไปตั้งเวลา');
        }
        await delay(2000);
      } else {
        console.log('[TikTok Auto] No productId, skipping Step 3');
      }

      // Step 4: Schedule — Now / Schedule / Draft (ก่อน Show more — ตาม v3.04)
      console.log('[TikTok Auto] === Starting Step 4: Schedule ===');
      console.log('[TikTok Auto] postMode:', flowData.postMode, '| scheduleTime:', flowData.scheduleTime);
      if (flowData.postMode === 'draft') {
        updateUploadStatus('📝 โหมด Draft — ข้าม Schedule settings');
        console.log('[TikTok Auto] === Step 4 (Draft) — skip schedule settings ===');
        await delay(500);
      } else if (flowData.postMode === 'schedule' && flowData.scheduleTime) {
        updateUploadStatus('⏰ กำลังตั้งเวลาโพสต์...');
        const scheduleResult = await setTikTokSchedule(flowData.scheduleTime);
        console.log('[TikTok Auto] === Step 4 done, result:', scheduleResult, '===');
        await delay(2000);
      } else {
        updateUploadStatus('⏰ ตั้งค่า โพสต์ทันที...');
        await clickNowRadio();
        console.log('[TikTok Auto] === Step 4 (Now) done ===');
        await delay(1000);
      }

      // Step 5: กด Show more + เปิด AI-generated content
      console.log('[TikTok Auto] === Starting Step 5: Show more + AI ===');
      updateUploadStatus('⚙️ กำลังเปิด Advanced Settings...');
      await clickShowMore();
      await delay(1500);
      await clickAIGeneratedContent();
      await delay(1000);
      console.log('[TikTok Auto] === Step 5 done ===');

      // Step 6: กดปุ่ม Post / Schedule / Save draft
      const isDraftMode = flowData.postMode === 'draft';
      const isScheduleMode = flowData.postMode === 'schedule';
      const targetBtnLabel = isDraftMode ? 'Save draft' : isScheduleMode ? 'Schedule' : 'Post';
      console.log('[TikTok Auto] === Starting Step 6:', targetBtnLabel, 'button ===');
      updateUploadStatus(`🚀 กำลังกด ${targetBtnLabel}...`);
      await delay(2000);

      // ★ หาปุ่มก่อน → set flag หลังเจอ → แล้วค่อย .click() ★
      let postBtn = null;
      let postBtnMethod = '';

      // กำหนดคำที่ต้องหาตาม postMode
      const targetTexts = isDraftMode
        ? ['Save draft', 'Save Draft', 'Drafts', 'Save as draft']
        : ['Post', 'Schedule'];

      for (let attempt = 0; attempt < 5 && !postBtn; attempt++) {
        // Method 1: Button__content div
        const btnContents = document.querySelectorAll('div[class*="Button__content--type-primary"], div[class*="Button__content"]');
        for (const bc of btnContents) {
          const txt = bc.textContent?.trim();
          if (targetTexts.some(t => txt === t || txt.toLowerCase() === t.toLowerCase())) {
            const btn = bc.closest('button') || bc.closest('[role="button"]') || bc.parentElement;
            if (btn) {
              postBtn = btn;
              postBtnMethod = `Button__content "${txt}" (attempt ${attempt + 1})`;
              break;
            }
          }
        }

        // Method 2: visible button by text match
        if (!postBtn) {
          const allBtns = document.querySelectorAll('button, [role="button"]');
          for (const btn of allBtns) {
            const txt = btn.textContent?.trim();
            if (targetTexts.some(t => txt === t || txt.toLowerCase() === t.toLowerCase()) && btn.offsetParent !== null) {
              const rect = btn.getBoundingClientRect();
              if (rect.width > 50 && rect.height > 20) {
                postBtn = btn;
                postBtnMethod = `text match "${txt}" (attempt ${attempt + 1})`;
                break;
              }
            }
          }
        }

        // Method 3: fallback — any visible button with matching text
        if (!postBtn) {
          const allBtns = document.querySelectorAll('button');
          for (const btn of allBtns) {
            const txt = btn.textContent?.trim();
            if (targetTexts.some(t => txt === t || txt.toLowerCase() === t.toLowerCase()) && btn.offsetParent !== null) {
              postBtn = btn;
              postBtnMethod = `simulateRealClick "${txt}" (attempt ${attempt + 1})`;
              break;
            }
          }
        }

        // Method 4 (Draft only): TikTok อาจแสดง "Drafts" เป็น link/anchor ไม่ใช่ button
        if (!postBtn && isDraftMode) {
          const allEls = document.querySelectorAll('a, span, div[role="button"]');
          for (const el of allEls) {
            const txt = el.textContent?.trim();
            if ((txt === 'Save draft' || txt === 'Save Draft' || txt === 'Drafts' || txt === 'Save as draft') && el.offsetParent !== null) {
              postBtn = el;
              postBtnMethod = `draft-link "${txt}" (attempt ${attempt + 1})`;
              break;
            }
          }
        }

        if (!postBtn) {
          console.log(`[TikTok Auto] ${targetBtnLabel} button not found (attempt ${attempt + 1})`);
          await delay(3000);
        }
      }

      if (postBtn) {
        console.log('[TikTok Auto] Found', targetBtnLabel, 'button via', postBtnMethod, '— set flag before click');

        const flowMsg = isDraftMode ? 'Video ถูกบันทึก Draft แล้ว!' : isScheduleMode ? 'Video ถูก Schedule แล้ว!' : 'Video ถูก Post แล้ว!';

        chrome.storage.local.set({
          flowStatus: 'posted', flowMessage: flowMsg,
          currentItemPosted: true, currentItemPostedAt: Date.now(), currentFlowData: null,
          autopostTargetClipDuration: null,
          autopostTargetItemId: null
        });

        try {
          chrome.runtime.sendMessage({
            action: 'itemPosted',
            message: (isDraftMode ? 'บันทึก Draft' : isScheduleMode ? 'Schedule' : 'โพส') + 'สำเร็จ! กำลังทำรายการถัดไป...'
          }, () => { if (chrome.runtime.lastError) {} });
        } catch (e) {}

        await delay(500);

        if (postBtnMethod.includes('simulateRealClick')) {
          simulateRealClick(postBtn);
        } else {
          postBtn.click();
        }
        console.log('[TikTok Auto] Clicked', targetBtnLabel, 'button via', postBtnMethod);
        updateUploadStatus(`✅ กด ${targetBtnLabel} สำเร็จ!`);
      } else {
        updateUploadStatus(`⚠️ ไม่พบปุ่ม ${targetBtnLabel} — กรุณากดเอง`);
      }

    } catch (err) {
      console.error('[TikTok Auto] Upload error:', err);
      updateUploadStatus('❌ Error: ' + err.message);
    } finally {
      _isUploadHandling = false;
      _hasUploadCompleted = true;
      console.log('[TikTok Auto] Flow completed, will not re-trigger');
    }
  }

  // ==========================================
  // TikTok Home Automation
  // ==========================================

  async function handleTikTokHome() {
    if (window.location.href.includes('/upload')) return;

    console.log('[TikTok Auto] Checking for pending action on Home...');

    const result = await chrome.storage.local.get(['flowStatus', 'currentItemPosted', 'currentItemPostedAt']);
    const status = result.flowStatus;

    const recentlyPosted = result.currentItemPostedAt && (Date.now() - result.currentItemPostedAt < 60000);
    if (result.currentItemPosted === true || status === 'posted' || status === 'upload_in_progress' || status === 'waiting_for_flow' || status === 'in_progress' || recentlyPosted) {
      console.log(`[TikTok Auto] Skipping Home action - status: ${status}, recentlyPosted: ${recentlyPosted}`);
      return;
    }

    const validStatuses = ['video_saved', 'video_saved_8s', 'video_saved_16s', 'completed_8s', 'completed_16s', 'completed_download', 'video_downloaded_16s', 'extending_16s'];
    if (!validStatuses.includes(status)) return;

    console.log('[TikTok Auto] Found pending status on Home:', status);
    createUploadStatusPanel();

    const delayMs = Math.floor(Math.random() * (15000 - 8000 + 1) + 8000);
    const seconds = Math.round(delayMs / 1000);

    updateUploadStatus(`⏳ รอสุ่มเวลา ${seconds} วินาที...`);
    console.log(`[TikTok Auto] Waiting ${delayMs}ms before clicking Upload`);

    await new Promise(resolve => setTimeout(resolve, delayMs));

    const recheck = await chrome.storage.local.get(['flowStatus', 'currentItemPosted']);
    if (recheck.currentItemPosted === true || recheck.flowStatus === 'posted' || recheck.flowStatus === 'waiting_for_flow' || recheck.flowStatus === 'in_progress') {
      console.log('[TikTok Auto] Skipping Home action after delay - status changed:', recheck.flowStatus);
      return;
    }

    updateUploadStatus('🔗 กำลังเปิดหน้า Upload...');
    console.log('[TikTok Auto] Redirecting to TikTok Upload page directly');
    window.location.href = 'https://www.tiktok.com/tiktokstudio/upload';
  }

  // ── Main Entry Point ──
  let lastUrl = window.location.href;

  async function initAutomation() {
    const url = window.location.href;
    console.log('[TikTok Auto] Init automation for:', url);

    if (url.includes('/upload')) {
      let uploadStarted = false;
      for (let retry = 0; retry < 10 && !uploadStarted; retry++) {
        if (retry > 0) {
          console.log(`[TikTok Auto] Upload retry ${retry}/10 — waiting 3s...`);
          await new Promise(r => setTimeout(r, 3000));
        }
        if (_isUploadHandling || _hasUploadCompleted) {
          console.log('[TikTok Auto] Upload already in progress or completed, stop retrying');
          uploadStarted = true;
          break;
        }
        try {
          const check = await chrome.storage.local.get(['flowStatus', 'currentFlowData', 'currentItemPosted', 'currentItemPostedAt']);
          const recentlyPosted = check.currentItemPostedAt && (Date.now() - check.currentItemPostedAt < 60000);
          if (check.currentItemPosted === true || check.flowStatus === 'posted' || check.flowStatus === 'upload_in_progress' || recentlyPosted) {
            console.log(`[TikTok Auto] Item already completed/uploading — skip`);
            uploadStarted = true;
            break;
          }
          const validStatuses = ['video_saved', 'video_saved_8s', 'video_saved_16s', 'completed_8s', 'completed_16s', 'completed_download', 'video_downloaded_16s', 'extending_16s'];
          if (validStatuses.includes(check.flowStatus) && check.currentFlowData?.videoBlob) {
            console.log(`[TikTok Auto] Storage ready! flowStatus: ${check.flowStatus} — starting upload`);
            uploadStarted = true;
            await handleTikTokUpload();
          } else {
            console.log(`[TikTok Auto] Storage not ready yet. flowStatus: ${check.flowStatus}, videoBlob: ${!!check.currentFlowData?.videoBlob} (retry ${retry}/10)`);
          }
        } catch (e) {
          console.log(`[TikTok Auto] Storage check error: ${e.message}`);
        }
      }
      if (!uploadStarted && !_isUploadHandling) {
        console.log('[TikTok Auto] ❌ Upload data not available after 10 retries (30s) — giving up');
      }
    } else if (url.includes('tiktok.com')) {
      await handleTikTokHome();
    }
  }

  // URL Change Observer
  const observer = new MutationObserver(() => {
    const url = window.location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log('[TikTok Auto] URL changed to:', url);
      setTimeout(initAutomation, 2000);
    }
  });

  observer.observe(document, { subtree: true, childList: true });

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutomation);
  } else {
    initAutomation();
  }

})();
