const STORAGE_KEYS = {
  skipLicense: '1click_web_skip_license',
  googleKey: '1click_web_api_google',
  openaiKey: '1click_web_api_openai'
};

function getLicenseService() {
  return window.licenseService;
}

function showLicenseScreen() {
  document.getElementById('license-screen').classList.add('active');
  document.getElementById('main-app').classList.remove('active');
}

function showMainApp() {
  document.getElementById('license-screen').classList.remove('active');
  document.getElementById('main-app').classList.add('active');
}

function setMainTab(tab) {
  const main = document.getElementById('main-app');
  if (main) main.setAttribute('data-active-tab', tab);
  document.querySelectorAll('.bottom-nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
  });
  document.querySelectorAll('.tab-panel').forEach((p) => {
    p.classList.toggle('active', p.id === 'tab-' + tab);
  });
  const dockScript = document.getElementById('action-dock-script');
  const dockSettings = document.getElementById('action-dock-settings');
  if (dockScript) dockScript.hidden = tab !== 'script';
  if (dockSettings) dockSettings.hidden = tab !== 'settings';
}

function setMsg(el, text, type) {
  if (!el) return;
  if (!text) {
    el.style.display = 'none';
    el.textContent = '';
    el.className = 'msg';
    return;
  }
  el.style.display = 'block';
  el.textContent = text;
  el.className = 'msg ' + (type === 'error' ? 'error' : 'ok');
}

function formatLicenseInput(e) {
  let value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  let formatted = '';
  for (let i = 0; i < value.length && i < 16; i++) {
    if (i > 0 && i % 4 === 0) formatted += '-';
    formatted += value[i];
  }
  e.target.value = formatted;
}

function loadApiKeys() {
  const g = localStorage.getItem(STORAGE_KEYS.googleKey) || '';
  const o = localStorage.getItem(STORAGE_KEYS.openaiKey) || '';
  const ge = document.getElementById('key-google');
  const oe = document.getElementById('key-openai');
  if (ge) ge.value = g;
  if (oe) oe.value = o;
}

function saveApiKeys() {
  const g = document.getElementById('key-google')?.value?.trim() || '';
  const o = document.getElementById('key-openai')?.value?.trim() || '';
  localStorage.setItem(STORAGE_KEYS.googleKey, g);
  localStorage.setItem(STORAGE_KEYS.openaiKey, o);
  setMsg(document.getElementById('keys-status'), 'บันทึกแล้ว', 'ok');
}

function skipLicenseEnabled() {
  return localStorage.getItem(STORAGE_KEYS.skipLicense) === '1';
}

async function init() {
  const ls = getLicenseService();
  const deviceEl = document.getElementById('display-device-id');
  try {
    const id = await ls.getDeviceId();
    if (deviceEl) deviceEl.textContent = id;
  } catch {
    if (deviceEl) deviceEl.textContent = 'ไม่สามารถสร้างได้';
  }

  const skipBox = document.getElementById('skip-license');
  if (skipBox) skipBox.checked = skipLicenseEnabled();

  const licenseInput = document.getElementById('license-key-input');
  if (licenseInput) {
    licenseInput.addEventListener('input', formatLicenseInput);
  }

  if (skipBox) {
    skipBox.addEventListener('change', () => {
      localStorage.setItem(STORAGE_KEYS.skipLicense, skipBox.checked ? '1' : '0');
    });
  }

  document.getElementById('activate-license-btn')?.addEventListener('click', async () => {
    const skip = skipLicenseEnabled();
    if (skip) {
      showMainApp();
      loadApiKeys();
      return;
    }
    const key = document.getElementById('license-key-input')?.value?.trim();
    const statusEl = document.getElementById('license-status-msg');
    if (!key) {
      setMsg(statusEl, 'กรุณาใส่ License Key', 'error');
      return;
    }
    setMsg(statusEl, 'กำลังตรวจสอบ…', 'ok');
    const result = await ls.validateLicense(key);
    if (result.success) {
      setMsg(statusEl, result.message || 'สำเร็จ', 'ok');
      setTimeout(() => {
        showMainApp();
        loadApiKeys();
      }, 600);
    } else {
      setMsg(statusEl, result.error || 'ไม่สำเร็จ', 'error');
    }
  });

  if (skipLicenseEnabled()) {
    showMainApp();
    loadApiKeys();
  } else {
    const cached = await ls.loadLocalLicense();
    if (cached.success) {
      showMainApp();
      loadApiKeys();
    } else {
      showLicenseScreen();
    }
  }

  document.querySelectorAll('.bottom-nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) setMainTab(tab);
    });
  });

  document.getElementById('save-keys-btn')?.addEventListener('click', saveApiKeys);

  document.getElementById('generate-btn')?.addEventListener('click', async () => {
    const provider = document.getElementById('ai-provider')?.value || 'google';
    const apiKey =
      provider === 'google'
        ? localStorage.getItem(STORAGE_KEYS.googleKey)
        : localStorage.getItem(STORAGE_KEYS.openaiKey);
    const userMessage = document.getElementById('user-prompt')?.value?.trim();
    const out = document.getElementById('output');
    const st = document.getElementById('gen-status');
    if (!apiKey) {
      setMsg(st, 'กรุณาบันทึก API Key ในแท็บตั้งค่า', 'error');
      return;
    }
    if (!userMessage) {
      setMsg(st, 'กรุณากรอกคำสั่งหรือข้อมูลสินค้า', 'error');
      return;
    }
    setMsg(st, 'กำลังสร้าง… อาจใช้เวลาสักครู่', 'ok');
    const btn = document.getElementById('generate-btn');
    if (btn) btn.disabled = true;
    try {
      const gen = window.generateScript;
      if (typeof gen !== 'function') {
        throw new Error('ไม่พบ generateScript — ตรวจสอบลำดับโหลดสคริปต์ (api.js)');
      }
      const text = await gen(provider, apiKey, userMessage);
      if (out) out.textContent = text;
      setMsg(st, 'เสร็จแล้ว', 'ok');
      out?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      // Show the bridge button after successful generation
      const bridgeRow = document.getElementById('bridge-row');
      if (bridgeRow) bridgeRow.style.display = '';
    } catch (e) {
      setMsg(st, e.message || String(e), 'error');
      if (out) out.textContent = '';
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await getLicenseService().logout();
    localStorage.removeItem(STORAGE_KEYS.skipLicense);
    const skip = document.getElementById('skip-license');
    if (skip) skip.checked = false;
    showLicenseScreen();
    setMsg(document.getElementById('license-status-msg'), 'ออกจากระบบแล้ว', 'ok');
  });

  document.getElementById('copy-for-ext-btn')?.addEventListener('click', () => {
    const script = document.getElementById('output')?.textContent?.trim() || '';
    const prompt = document.getElementById('user-prompt')?.value?.trim() || '';
    if (!script || script === 'ยังไม่มีผลลัพธ์') return;
    const payload = JSON.stringify({
      _type: '1click_bridge_v1',
      productName: prompt.split('\n')[0].slice(0, 60),
      mainPrompt: prompt,
      script,
    });
    navigator.clipboard.writeText(payload).then(() => {
      const btn = document.getElementById('copy-for-ext-btn');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✅ คัดลอกแล้ว!';
        setTimeout(() => { btn.textContent = orig; }, 2000);
      }
    }).catch(() => {
      // fallback for file:// protocol
      const ta = document.createElement('textarea');
      ta.value = payload;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      const btn = document.getElementById('copy-for-ext-btn');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✅ คัดลอกแล้ว!';
        setTimeout(() => { btn.textContent = orig; }, 2000);
      }
    });
  });
}

init();
