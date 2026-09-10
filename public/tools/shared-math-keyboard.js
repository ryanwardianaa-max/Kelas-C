/**
 * Shared Virtual Math Keyboard (Photomath / Equation Style) for KelasKu Calculators
 * Menyediakan keyboard matematika visual interaktif untuk input rumus & angka di semua kalkulator.
 */

(function () {
  'use strict';

  // Cegah inisialisasi ganda
  if (window.__KELASKU_MATH_KEYBOARD__) return;
  window.__KELASKU_MATH_KEYBOARD__ = true;

  // Deteksi domain kalkulator
  function detectDomain() {
    const path = window.location.pathname.toLowerCase();
    const title = (document.title || '').toLowerCase();
    if (path.includes('mateko') || title.includes('ekonomi')) return 'mateko';
    if (path.includes('polar') || path.includes('kompleks') || title.includes('kompleks')) return 'kompleks';
    if (path.includes('metnum') || title.includes('numerik')) return 'metnum';
    if (path.includes('kalkulus') || title.includes('kalkulus')) return 'kalkulus';
    if (path.includes('real') || path.includes('induksi') || title.includes('analisis real')) return 'real';
    if (path.includes('matriks') || title.includes('matriks')) return 'matriks';
    return 'umum';
  }

  const domain = detectDomain();

  // Konfigurasi tombol spesifik domain
  const DOMAIN_KEYS = {
    mateko: {
      title: 'Matematika Ekonomi',
      tabs: [
        {
          id: 'pasar',
          name: 'Pasar & PPF',
          keys: [
            { label: 'P', ins: 'P' },
            { label: 'Q', ins: 'Q' },
            { label: 'P²', ins: 'P^2' },
            { label: 'Q²', ins: 'Q^2' },
            { label: 'X', ins: 'X' },
            { label: 'Y', ins: 'Y' },
            { label: 'X²', ins: 'X^2' },
            { label: 'Y²', ins: 'Y^2' },
            { label: 'Pₓ', ins: 'Px' },
            { label: 'Pᵧ', ins: 'Py' },
            { label: '√□', ins: 'sqrt()', cursorOffset: -1 },
            { label: '=', ins: ' = ' }
          ]
        },
        {
          id: 'aritmatika',
          name: 'Variabel & Pajak',
          keys: [
            { label: 't', ins: 't' },
            { label: 's', ins: 's' },
            { label: 'Qd', ins: 'Qd' },
            { label: 'Qs', ins: 'Qs' },
            { label: '+', ins: ' + ' },
            { label: '−', ins: ' - ' },
            { label: '×', ins: '*' },
            { label: '/', ins: '/' },
            { label: '( )', ins: '()', cursorOffset: -1 },
            { label: '^', ins: '^' }
          ]
        }
      ]
    },
    kompleks: {
      title: 'Analisis Kompleks',
      tabs: [
        {
          id: 'polar',
          name: 'Polar & Vektor',
          keys: [
            { label: 'i', ins: 'i' },
            { label: 'π', ins: 'π' },
            { label: '√□', ins: 'sqrt()', cursorOffset: -1 },
            { label: '√2', ins: '√2' },
            { label: '√3', ins: '√3' },
            { label: '2√3', ins: '2√3' },
            { label: '²', ins: '^2' },
            { label: 'ⁿ', ins: '^' },
            { label: '/', ins: '/' },
            { label: '( )', ins: '()', cursorOffset: -1 },
            { label: '±', ins: '±' },
            { label: 'r', ins: 'r' }
          ]
        },
        {
          id: 'operasi',
          name: 'Sudut & Operasi',
          keys: [
            { label: 'θ', ins: 'θ' },
            { label: 'deg', ins: '°' },
            { label: 'e', ins: 'e' },
            { label: 'z', ins: 'z' },
            { label: '+', ins: '+' },
            { label: '−', ins: '-' },
            { label: '×', ins: '*' },
            { label: '/', ins: '/' }
          ]
        }
      ]
    },
    metnum: {
      title: 'Metode Numerik',
      tabs: [
        {
          id: 'fungsi',
          name: 'Fungsi & Polinom',
          keys: [
            { label: 'x', ins: 'x' },
            { label: 'x²', ins: '^2' },
            { label: 'x³', ins: '^3' },
            { label: 'xⁿ', ins: '^' },
            { label: '√□', ins: 'sqrt()', cursorOffset: -1 },
            { label: 'eˣ', ins: 'e^x' },
            { label: 'sin', ins: 'sin()', cursorOffset: -1 },
            { label: 'cos', ins: 'cos()', cursorOffset: -1 },
            { label: 'exp', ins: 'exp()', cursorOffset: -1 },
            { label: 'log', ins: 'log()', cursorOffset: -1 },
            { label: '( )', ins: '()', cursorOffset: -1 },
            { label: '/', ins: '/' }
          ]
        }
      ]
    },
    kalkulus: {
      title: 'Kalkulus Edukatif',
      tabs: [
        {
          id: 'kalkulus',
          name: 'Fungsi & Transenden',
          keys: [
            { label: 'x', ins: 'x' },
            { label: 'x²', ins: '^2' },
            { label: 'xⁿ', ins: '^' },
            { label: '√□', ins: 'sqrt()', cursorOffset: -1 },
            { label: 'eˣ', ins: 'e^x' },
            { label: 'sin', ins: 'sin(' },
            { label: 'cos', ins: 'cos(' },
            { label: 'tan', ins: 'tan(' },
            { label: 'ln', ins: 'ln(' },
            { label: '/', ins: '/' },
            { label: '( )', ins: '()', cursorOffset: -1 }
          ]
        }
      ]
    },
    real: {
      title: 'Analisis Real',
      tabs: [
        {
          id: 'barisan',
          name: 'Barisan & Limit',
          keys: [
            { label: 'n', ins: 'n' },
            { label: 'n²', ins: 'n^2' },
            { label: '1/n', ins: '1/n' },
            { label: 'ε', ins: 'ε' },
            { label: 'δ', ins: 'δ' },
            { label: '√□', ins: 'sqrt()', cursorOffset: -1 },
            { label: 'k', ins: 'k' },
            { label: '/', ins: '/' },
            { label: '( )', ins: '()', cursorOffset: -1 }
          ]
        }
      ]
    },
    matriks: {
      title: 'Aljabar Linear Matriks',
      tabs: [
        {
          id: 'elemen',
          name: 'Input Sel Matriks',
          keys: [
            { label: '−', ins: '-' },
            { label: '/', ins: '/' },
            { label: '.', ins: '.' },
            { label: 'Tab ⏭', action: 'tab_next' }
          ]
        }
      ]
    },
    umum: {
      title: 'Kalkulator Matematika',
      tabs: [
        {
          id: 'umum',
          name: 'Simbol Matematika',
          keys: [
            { label: 'x', ins: 'x' },
            { label: 'x²', ins: '^2' },
            { label: '√□', ins: 'sqrt()', cursorOffset: -1 },
            { label: 'π', ins: 'π' },
            { label: '/', ins: '/' },
            { label: '( )', ins: '()', cursorOffset: -1 }
          ]
        }
      ]
    }
  };

  function formatMathPreview(str) {
    if (!str) return '—';
    let s = String(str);
    s = s.replace(/sqrt\((.*?)\)/g, '\\sqrt{$1}')
         .replace(/sqrt/g, '\\sqrt{}')
         .replace(/exp\((.*?)\)/g, 'e^{$1}')
         .replace(/e\^([0-9a-zA-Z]+)/g, 'e^{$1}')
         .replace(/\^([0-9a-zA-Z]+)/g, '^{$1}')
         .replace(/([PQXY])2/g, '$1^2')
         .replace(/\*/g, ' \\cdot ');
    return s;
  }

  // Gaya CSS Photomath Keyboard
  const CSS = `
    .kmk-dock {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 99999;
      background: #ffffff;
      border-top: 1px solid #cbd5e1;
      box-shadow: 0 -8px 32px rgba(15, 23, 42, 0.2);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
      transform: translateY(110%);
      opacity: 0;
      pointer-events: none;
      user-select: none;
      -webkit-user-select: none;
    }
    .kmk-dock.kmk-visible {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }
    .kmk-inner {
      max-width: 680px;
      margin: 0 auto;
      padding: 6px 10px 14px;
    }
    .kmk-preview-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 5px 10px;
      margin-bottom: 6px;
      min-height: 32px;
    }
    .kmk-preview-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      white-space: nowrap;
    }
    .kmk-preview-math {
      font-size: 0.95rem;
      color: #312e81;
      font-weight: 700;
      overflow-x: auto;
      white-space: nowrap;
      text-align: right;
      flex: 1;
    }
    .kmk-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 2px 6px;
      margin-bottom: 6px;
    }
    .kmk-title {
      font-size: 0.76rem;
      font-weight: 800;
      color: #312e81;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .kmk-tabs {
      display: flex;
      gap: 5px;
    }
    .kmk-tab-btn {
      padding: 3px 9px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      font-size: 0.74rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
    }
    .kmk-tab-btn.kmk-tab-active {
      background: #312e81;
      border-color: #312e81;
      color: white;
    }
    .kmk-actions {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .kmk-tool-btn {
      padding: 4px 9px;
      border-radius: 7px;
      border: 1px solid #cbd5e1;
      background: #f1f5f9;
      font-size: 0.78rem;
      font-weight: 700;
      color: #334155;
      cursor: pointer;
    }
    .kmk-tool-btn:hover {
      background: #e2e8f0;
    }
    .kmk-grid-container {
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
      gap: 7px;
    }
    @media (max-width: 480px) {
      .kmk-grid-container {
        grid-template-columns: 1fr;
      }
    }
    .kmk-math-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 5px;
    }
    .kmk-num-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 5px;
    }
    .kmk-btn {
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.94rem;
      font-weight: 600;
      color: #0f172a;
      cursor: pointer;
      touch-action: manipulation;
      transition: background 0.08s ease, transform 0.08s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .kmk-btn:active {
      transform: scale(0.94);
      background: #e0e7ff;
    }
    .kmk-btn-math {
      background: #f8fafc;
      color: #3730a3;
      font-weight: 700;
      font-family: "Cambria Math", "KaTeX_Math", serif;
      border-color: #c7d2fe;
    }
    .kmk-btn-del {
      background: #fee2e2;
      color: #991b1b;
      font-weight: 700;
      border-color: #fecaca;
    }
    .kmk-btn-num {
      background: #ffffff;
      color: #1e293b;
      font-weight: 700;
      font-size: 1.02rem;
    }
    .kmk-toggle-pill {
      position: fixed;
      bottom: 12px;
      right: 12px;
      z-index: 99990;
      background: #312e81;
      color: white;
      border: 0;
      border-radius: 999px;
      padding: 8px 14px;
      font-size: 0.78rem;
      font-weight: 700;
      box-shadow: 0 4px 14px rgba(49, 46, 129, 0.35);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: transform 0.15s ease;
    }
    .kmk-toggle-pill:active {
      transform: scale(0.95);
    }
  `;

  // Suntikkan style
  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  let activeInput = null;
  let activeTabIdx = 0;
  let dockEl = null;
  let toggleBtn = null;

  function createKeyboardDOM() {
    dockEl = document.createElement('div');
    dockEl.className = 'kmk-dock';
    dockEl.setAttribute('role', 'region');
    dockEl.setAttribute('aria-label', 'Keyboard Matematika Photomath');

    dockEl.innerHTML = `
      <div class="kmk-inner">
        <div class="kmk-preview-bar">
          <span class="kmk-preview-label">Rumus Aktif:</span>
          <div class="kmk-preview-math" id="kmk-preview-output">—</div>
        </div>
        <div class="kmk-header">
          <div class="kmk-title">
            <span>⌨️ ${DOMAIN_KEYS[domain]?.title || 'Keyboard Matematika'}</span>
          </div>
          <div class="kmk-tabs" id="kmk-tabs-container"></div>
          <div class="kmk-actions">
            <button type="button" class="kmk-tool-btn" id="kmk-btn-prev" title="Geser Kursor Kiri">◀</button>
            <button type="button" class="kmk-tool-btn" id="kmk-btn-next" title="Geser Kursor Kanan">▶</button>
            <button type="button" class="kmk-tool-btn" id="kmk-btn-hide" style="background:#f8fafc;color:#64748b" title="Sembunyikan Keyboard">▼ Tutup</button>
          </div>
        </div>
        <div class="kmk-grid-container">
          <div class="kmk-math-grid" id="kmk-math-buttons"></div>
          <div class="kmk-num-grid">
            <button type="button" class="kmk-btn kmk-btn-num" data-val="7">7</button>
            <button type="button" class="kmk-btn kmk-btn-num" data-val="8">8</button>
            <button type="button" class="kmk-btn kmk-btn-num" data-val="9">9</button>
            <button type="button" class="kmk-btn kmk-btn-num" data-val="4">4</button>
            <button type="button" class="kmk-btn kmk-btn-num" data-val="5">5</button>
            <button type="button" class="kmk-btn kmk-btn-num" data-val="6">6</button>
            <button type="button" class="kmk-btn kmk-btn-num" data-val="1">1</button>
            <button type="button" class="kmk-btn kmk-btn-num" data-val="2">2</button>
            <button type="button" class="kmk-btn kmk-btn-num" data-val="3">3</button>
            <button type="button" class="kmk-btn kmk-btn-num" data-val="0">0</button>
            <button type="button" class="kmk-btn kmk-btn-num" data-val="." title="Koma Desimal">.</button>
            <button type="button" class="kmk-btn kmk-btn-del" id="kmk-btn-backspace" title="Hapus">⌫</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dockEl);

    // Floating pill tombol manual
    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'kmk-toggle-pill';
    toggleBtn.innerHTML = '<span>⌨️</span> <span>Keyboard Rumus</span>';
    toggleBtn.title = 'Buka Keyboard Matematika';
    toggleBtn.onclick = () => {
      if (!activeInput) {
        const first = document.querySelector('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea');
        if (first) {
          first.focus();
        }
      }
      showKeyboard();
    };
    document.body.appendChild(toggleBtn);

    bindEvents();
    renderTabs();
    renderMathKeys();
  }

  function updatePreview() {
    const prevEl = document.getElementById('kmk-preview-output');
    if (!prevEl || !activeInput) return;
    const v = activeInput.value.trim();
    if (!v) {
      prevEl.textContent = '—';
      return;
    }
    const tex = formatMathPreview(v);
    if (window.katex) {
      try {
        katex.render(tex, prevEl, { throwOnError: false, displayMode: false });
        return;
      } catch {
        // fallback
      }
    }
    prevEl.textContent = v;
  }

  function renderTabs() {
    const tabsContainer = document.getElementById('kmk-tabs-container');
    if (!tabsContainer) return;
    const tabs = DOMAIN_KEYS[domain]?.tabs || [];
    if (tabs.length <= 1) {
      tabsContainer.innerHTML = '';
      return;
    }
    tabsContainer.innerHTML = tabs
      .map(
        (t, idx) => `
        <button type="button" class="kmk-tab-btn ${idx === activeTabIdx ? 'kmk-tab-active' : ''}" data-tab="${idx}">
          ${t.name}
        </button>
      `
      )
      .join('');

    tabsContainer.querySelectorAll('button[data-tab]').forEach((b) => {
      b.onclick = (e) => {
        e.preventDefault();
        activeTabIdx = Number(b.dataset.tab);
        renderTabs();
        renderMathKeys();
      };
    });
  }

  function renderMathKeys() {
    const mathContainer = document.getElementById('kmk-math-buttons');
    if (!mathContainer) return;
    const tabs = DOMAIN_KEYS[domain]?.tabs || [];
    const currentTab = tabs[activeTabIdx] || tabs[0];
    if (!currentTab) return;

    mathContainer.innerHTML = currentTab.keys
      .map(
        (k) => `
        <button type="button" class="kmk-btn kmk-btn-math" data-label="${k.label}" data-ins="${k.ins || ''}" data-action="${k.action || ''}" data-offset="${k.cursorOffset || 0}">
          ${k.label}
        </button>
      `
      )
      .join('');

    mathContainer.querySelectorAll('button').forEach((b) => {
      b.onclick = (e) => {
        e.preventDefault();
        const action = b.dataset.action;
        if (action === 'tab_next') {
          handleTabNext();
          return;
        }
        const ins = b.dataset.ins;
        const offset = Number(b.dataset.offset) || 0;
        insertText(ins, offset);
      };
    });
  }

  function handleTabNext() {
    if (!activeInput) return;
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea'));
    const idx = inputs.indexOf(activeInput);
    if (idx !== -1 && idx + 1 < inputs.length) {
      inputs[idx + 1].focus();
    }
  }

  function bindEvents() {
    document.getElementById('kmk-btn-hide').onclick = (e) => {
      e.preventDefault();
      hideKeyboard();
    };

    document.getElementById('kmk-btn-prev').onclick = (e) => {
      e.preventDefault();
      moveCursor(-1);
    };

    document.getElementById('kmk-btn-next').onclick = (e) => {
      e.preventDefault();
      moveCursor(1);
    };

    document.getElementById('kmk-btn-backspace').onclick = (e) => {
      e.preventDefault();
      deleteBack();
    };

    dockEl.querySelectorAll('.kmk-num-grid button[data-val]').forEach((b) => {
      b.onclick = (e) => {
        e.preventDefault();
        insertText(b.dataset.val);
      };
    });
  }

  function insertText(text, cursorOffset = 0) {
    if (!activeInput) return;
    const start = activeInput.selectionStart ?? activeInput.value.length;
    const end = activeInput.selectionEnd ?? activeInput.value.length;
    const val = activeInput.value;

    activeInput.value = val.slice(0, start) + text + val.slice(end);

    const nextPos = start + text.length + cursorOffset;
    activeInput.focus();
    if (typeof activeInput.setSelectionRange === 'function') {
      activeInput.setSelectionRange(nextPos, nextPos);
    }

    activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    activeInput.dispatchEvent(new Event('change', { bubbles: true }));
    updatePreview();
  }

  function deleteBack() {
    if (!activeInput) return;
    const start = activeInput.selectionStart ?? activeInput.value.length;
    const end = activeInput.selectionEnd ?? activeInput.value.length;
    const val = activeInput.value;

    if (start === end && start > 0) {
      activeInput.value = val.slice(0, start - 1) + val.slice(end);
      const nextPos = start - 1;
      activeInput.focus();
      if (typeof activeInput.setSelectionRange === 'function') {
        activeInput.setSelectionRange(nextPos, nextPos);
      }
    } else if (start !== end) {
      activeInput.value = val.slice(0, start) + val.slice(end);
      activeInput.focus();
      if (typeof activeInput.setSelectionRange === 'function') {
        activeInput.setSelectionRange(start, start);
      }
    }

    activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    activeInput.dispatchEvent(new Event('change', { bubbles: true }));
    updatePreview();
  }

  function moveCursor(delta) {
    if (!activeInput) return;
    const start = activeInput.selectionStart ?? activeInput.value.length;
    const nextPos = Math.max(0, Math.min(activeInput.value.length, start + delta));
    activeInput.focus();
    if (typeof activeInput.setSelectionRange === 'function') {
      activeInput.setSelectionRange(nextPos, nextPos);
    }
  }

  function showKeyboard() {
    if (!dockEl) createKeyboardDOM();
    dockEl.classList.add('kmk-visible');
    document.body.style.paddingBottom = '220px';
    updatePreview();
  }

  function hideKeyboard() {
    if (dockEl) {
      dockEl.classList.remove('kmk-visible');
    }
    document.body.style.paddingBottom = '';
  }

  function attachToInputs() {
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]), textarea');
    inputs.forEach((input) => {
      if (input.dataset.kmkBound) return;
      input.dataset.kmkBound = 'true';

      input.addEventListener('focus', () => {
        activeInput = input;
        showKeyboard();
      });

      input.addEventListener('click', () => {
        activeInput = input;
        showKeyboard();
      });

      input.addEventListener('input', () => {
        if (activeInput === input) updatePreview();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createKeyboardDOM();
      attachToInputs();
    });
  } else {
    createKeyboardDOM();
    attachToInputs();
  }

  const observer = new MutationObserver(() => {
    attachToInputs();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
