// GAME 16 — UI Toolset
// Utility functions for printing text lines, animations, start screen, input handling.
// Dependencies: DOM elements (#output, #terminal, #command-input); window.GameState (future).

const ui = (() => {
  // Cache DOM element references to avoid repeated lookups.
  let outputEl = null;

  /**
   * Lazily resolve the output container element.
   * @returns {HTMLElement|null}
   */
  function ensureOutput() {
    if (!outputEl) outputEl = document.getElementById('output');
    return outputEl;
  }

  /**
   * Print a single text line into the output area.
   * @param {string} text - Content to display.
   * @param {string} [type] - Optional CSS class suffix for styling.
   *                          '' | 'error' | 'hint' | 'important' | 'warning'
   *                          | 'system' | 'evidence' | 'digital-human' | 'zheng-qiao'
   * @param {object} [opts] - Extra options (reserved for future: typewriter mode, etc.).
   * @returns {HTMLDivElement} The created <div> element.
   */
  function print(text, type = '', opts = {}) {
    const el = ensureOutput();
    if (!el) { console.warn('[ui.print] #output not found in DOM.'); return null; }

    const line = document.createElement('div');
    line.className = type ? `line ${type}` : 'line';
    line.textContent = text ?? '';
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;

    // Evidence flash effect — highlight briefly on discovery.
    if (type === 'evidence') {
      line.classList.add('evidence-flash');
      setTimeout(() => line.classList.remove('evidence-flash'), 700);
    }

    return line;
  }

  /**
   * Print an array / iterable of strings as separate lines.
   * @param {(string[]|Iterable<string>)} lines
   * @param {string} [type] - Same type argument as print().
   */
  function printLines(lines, type = '') {
    for (const l of lines) print(l, type);
  }

  /**
   * Clear all output lines (does NOT affect header/input UI).
   */
  function clear() {
    const el = ensureOutput();
    if (el) el.innerHTML = '';
  }

  /**
   * Shake the terminal container (used for dramatic / alarm moments).
   * Toggles the "shake" class on #terminal, removes it after 700 ms.
   */
  function shakeScreen() {
    const term = document.getElementById('terminal');
    if (!term) return;

    // Remove first in case already shaking, then re-add to restart anim.
    term.classList.remove('shake');
    // Force reflow so the browser recognises the re-add as a fresh animation.
    void term.offsetWidth;
    term.classList.add('shake');

    setTimeout(() => term.classList.remove('shake'), 700);
  }

  /**
   * Stage-transition banner with fade-out / fade-in illusion.
   * @param {number} stageNum - Numeric stage identifier (1-5).
   * @param {string} stageName - Human-readable stage name.
   * @returns {Promise<void>} Resolves after the banner is printed.
   */
  async function stageTransition(stageNum, stageName) {
    const el = ensureOutput();
    if (!el) return Promise.resolve();

    const bannerHead = '\u2500'.repeat(42);
    const bannerBody = `[SYSTEM] Entering Stage ${stageNum}: ${stageName}`;

    print(bannerHead, 'system');
    print(bannerBody, 'system');
    print(bannerHead, 'system');
    print('', '');
    return Promise.resolve();
  }

  /**
   * Display the opening start-screen messages.
   */
  function startScreen() {
    print('', '');
    print('[Terminal initializing…]', 'hint');
    setTimeout(() => print('[Connection established]', 'hint'), 500);
  }

  // --- Input helpers -----------------------------------------------------------

  /**
   * Return the command input <input> element.
   * @returns {HTMLInputElement|null}
   */
  function getInput() { return document.getElementById('command-input'); }

  /**
   * Focus the command input element.
   */
  function focusInput() { const el = getInput(); if (el) el.focus(); }

  /**
   * Clear the current text value inside the input.
   */
  function clearInput() { const el = getInput(); if (el) el.value = ''; }

  /**
   * Read the current value of the input (does not clear anything).
   * @returns {string}
   */
  function getInputValue() { const el = getInput(); return el ? el.value : ''; }

  // -----------------------------------------------------------------------------
  // Public API
  return {
    print, printLines, clear, shakeScreen, stageTransition,
    startScreen, getInput, focusInput, clearInput, getInputValue,
  };
})();
