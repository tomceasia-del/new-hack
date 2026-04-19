/* Demo flow only — no API / Firebase */

const OUTPUT_EMPTY = 'ยังไม่มีผลลัพธ์';

const SCRIPT_BODY = `HOOK (0–3 วินาที)
กันแดดทาแล้วยังเหมือนไม่ทา… แต่ SPF50 นะ

Scene 1 — ปัญหา
- ภาพ: มือลูบแก้มใต้แสงธรรมชาติ
- VO: เนื้อครีมหนัก วอก เป็นคราบเวลาเหงื่อ

Scene 2 — โซลูชัน
- ภาพ: หยดครีมบางบนมือ แล้วเกลี่ยจางทันที
- VO: เนื้อเซรั่มบางเบา ซึมไว ไม่วอก

Scene 3 — จุดเด่น + CTA
- ภาพ: แพ็กสินค้า + ป้ายราคา/โปร (placeholder)
- VO: ลองคลิกตะกร้า — โปรวันนี้เท่านั้น (ตัวอย่างเท่านั้น)`;

let generating = false;

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

function providerDisplayName(value) {
  if (value === 'openai') return 'OpenAI GPT-4 Turbo';
  return 'Google Gemini';
}

function buildFakeOutput(userBrief, providerValue) {
  const provider = providerDisplayName(providerValue || 'google');
  const line = userBrief.length > 120 ? userBrief.slice(0, 117) + '…' : userBrief;
  return `【 MOCKUP — ตัวอย่างผลลัพธ์ 】
ผู้ให้บริการ (จำลอง): ${provider}
จากบรีฟ: ${line}

${SCRIPT_BODY}`;
}

function setCopyButtonEnabled(on) {
  const btn = document.getElementById('copy-output-btn');
  if (btn) btn.disabled = !on;
}

function isOutputEmpty(out) {
  if (!out) return true;
  const t = out.textContent.trim();
  return !t || t === OUTPUT_EMPTY;
}

function setPipeState(phase) {
  const steps = document.querySelectorAll('.pipe-strip__step');
  if (!steps.length) return;
  steps.forEach((el) => {
    el.classList.remove('pipe-strip__step--done');
    el.removeAttribute('aria-current');
  });
  if (phase === 'idle' || phase === 'running') {
    steps[0].classList.add('pipe-strip__step--done');
    steps[1].setAttribute('aria-current', 'step');
    return;
  }
  if (phase === 'done') {
    steps[0].classList.add('pipe-strip__step--done');
    steps[1].classList.add('pipe-strip__step--done');
    steps[2].setAttribute('aria-current', 'step');
  }
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

  if (tab === 'script') {
    setMsg(document.getElementById('keys-status'), '', null);
  } else if (tab === 'settings') {
    setMsg(document.getElementById('gen-status'), '', null);
  }
}

function resetMainWorkspace() {
  const out = document.getElementById('output');
  if (out) out.textContent = OUTPUT_EMPTY;
  setMsg(document.getElementById('gen-status'), '', null);
  setMsg(document.getElementById('keys-status'), '', null);
  setCopyButtonEnabled(false);
  setPipeState('idle');
  const btn = document.getElementById('generate-btn');
  if (btn) btn.disabled = false;
  generating = false;
}

function init() {
  const deviceEl = document.getElementById('display-device-id');
  if (deviceEl) deviceEl.textContent = 'mock-web-7f2a9c1d';

  setPipeState('idle');
  setCopyButtonEnabled(false);

  document.getElementById('activate-license-btn')?.addEventListener('click', () => {
    const skip = document.getElementById('skip-license')?.checked;
    const statusEl = document.getElementById('license-status-msg');
    setMsg(statusEl, '', null);
    if (!skip) {
      const key = document.getElementById('license-key-input')?.value?.trim();
      if (!key) {
        setMsg(statusEl, '(Mockup) ใส่ key จำลองหรือติ๊กโหมดทดสอบ', 'error');
        return;
      }
    }
    setMsg(statusEl, '(Mockup) เปิดใช้งานสำเร็จ', 'ok');
    setTimeout(() => {
      showMainApp();
      setMainTab('script');
    }, 400);
  });

  document.querySelectorAll('.bottom-nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) setMainTab(tab);
    });
  });

  document.getElementById('generate-btn')?.addEventListener('click', async () => {
    if (generating) return;
    const userMessage = document.getElementById('user-prompt')?.value?.trim();
    const out = document.getElementById('output');
    const st = document.getElementById('gen-status');
    const btn = document.getElementById('generate-btn');
    const provider = document.getElementById('ai-provider')?.value;
    if (!userMessage) {
      setMsg(st, '(Mockup) ลองพิมพ์บรีฟสั้นๆ แล้วกดอีกครั้ง', 'error');
      return;
    }
    generating = true;
    setPipeState('running');
    setMsg(st, '(Mockup) กำลังสร้าง…', 'ok');
    if (btn) btn.disabled = true;
    try {
      await new Promise((r) => setTimeout(r, 900));
      if (out) out.textContent = buildFakeOutput(userMessage, provider);
      setMsg(st, '(Mockup) เสร็จแล้ว — ไม่ได้เรียก API จริง', 'ok');
      setCopyButtonEnabled(true);
      setPipeState('done');
      out?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } finally {
      generating = false;
      if (btn) btn.disabled = false;
    }
  });

  document.getElementById('copy-output-btn')?.addEventListener('click', async () => {
    const out = document.getElementById('output');
    const st = document.getElementById('gen-status');
    if (isOutputEmpty(out) || !out) return;
    try {
      await navigator.clipboard.writeText(out.textContent);
      setMsg(st, '(Mockup) คัดลอกไปคลิปบอร์ดแล้ว', 'ok');
    } catch {
      setMsg(st, '(Mockup) คัดลอกไม่ได้ — ลองอนุญาตคลิปบอร์ดในเบราว์เซอร์', 'error');
    }
  });

  document.getElementById('save-keys-btn')?.addEventListener('click', () => {
    setMsg(document.getElementById('keys-status'), '(Mockup) บันทึกแล้ว — ไม่ได้เก็บจริง', 'ok');
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    resetMainWorkspace();
    showLicenseScreen();
    setMsg(document.getElementById('license-status-msg'), '(Mockup) ออกจากระบบแล้ว', 'ok');
  });
}

init();
