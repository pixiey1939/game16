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

  // --- New UI functions (Batch 2) -------------------------------------------

  /**
   * Print a dialogue box with speaker name and multiple content lines.
   * @param {string} speaker - Name of the speaker.
   * @param {string[]} lines - Array of dialogue content lines.
   * @param {string} [type='digital-human'] - CSS type suffix for styling.
   * @returns {HTMLDivElement[]} Array of created content elements.
   */
  function printDialogue(speaker, lines, type = 'digital-human') {
    const el = ensureOutput();
    if (!el) return [];

    const box = document.createElement('div');
    box.className = `dialogue-box ${type}`;

    const nameEl = document.createElement('div');
    nameEl.className = 'speaker-name';
    nameEl.textContent = speaker;
    box.appendChild(nameEl);

    const results = [];
    lines.forEach(line => {
      const contentEl = document.createElement('div');
      contentEl.className = `dialogue-content line ${type}`;
      contentEl.textContent = line;
      box.appendChild(contentEl);
      results.push(contentEl);
    });

    el.appendChild(box);
    scrollOutputToBottom();
    return results;
  }

  /**
   * Async typewriter effect — displays text character by character.
   * @param {HTMLElement} element - Target element to type into.
   * @param {string} text - Full text content.
   * @param {number} [speed=30] - Milliseconds per character.
   * @returns {Promise<void>}
   */
  async function typewriter(element, text, speed = 30) {
    await new Promise(resolve => {
      let i = 0;
      const timer = setInterval(() => {
        if (i >= text.length) {
          clearInterval(timer);
          resolve();
          return;
        }
        element.textContent += text[i];
        i++;
      }, speed);
    });
  }

  /**
   * Initialize real-time clock display in #header-clock (HH:MM:SS).
   */
  function initClock() {
    const clockEl = document.getElementById('header-clock');
    if (!clockEl) return;

    const update = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      clockEl.textContent = `${hh}:${mm}:${ss}`;
    };
    update();
    setInterval(update, 1000);
  }

  /**
   * Show "connecting to xxx..." animation with auto-hide after durationMs.
   * @param {string} systemName - Name of the system being connected.
   * @param {number} [durationMs=2000] - Duration before auto-hide.
   * @returns {Promise<void>}
   */
  function showConnectionAnimation(systemName, durationMs = 2000) {
    const el = ensureOutput();
    if (!el) return;

    const container = document.createElement('div');
    container.className = 'loading-indicator';

    const textEl = document.createElement('span');
    textEl.textContent = `[正在连接 ${systemName}]`;
    container.appendChild(textEl);

    const dots = ['.', '.', '.'];
    dots.forEach(() => {
      const dotEl = document.createElement('span');
      dotEl.className = 'dot';
      dotEl.style.animation = 'dotPulse 1.2s infinite';
      container.appendChild(dotEl);
    });

    el.appendChild(container);
    scrollOutputToBottom();

    return new Promise(resolve => {
      setTimeout(() => {
        container.remove();
        const success = document.createElement('div');
        success.className = 'line system';
        success.textContent = `[${systemName} 已连接]`;
        el.appendChild(success);
        scrollOutputToBottom();
        resolve();
      }, durationMs);
    });
  }

  /**
   * Display a group of choice buttons with keyboard navigation.
   * Supports: ArrowUp/ArrowDown, Enter, number keys 1-9.
   * Disables command-input during choice selection, restores after.
   * @param {{label: string, value: any}[]} options - Choice options.
   * @param {string} [promptText='请做出选择：'] - Prompt text above buttons.
   * @returns {Promise<any>} Resolves with opt.value of selected button.
   */
  function displayChoice(options, promptText = '请做出选择：') {
    return new Promise((resolve) => {
      const output = ensureOutput();
      const commandInput = getInput();
      if (!output) { resolve(-1); return; }

      if (promptText) {
        const prompt = document.createElement('div');
        prompt.className = 'line hint';
        prompt.textContent = promptText;
        output.appendChild(prompt);
      }

      const container = document.createElement('div');
      container.className = 'choice-group';
      const buttons = [];

      options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'choice-button';
        btn.textContent = opt.label;
        btn.setAttribute('data-index', String(i + 1));
        btn.setAttribute('tabindex', '0');

        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          activate(i);
        });

        container.appendChild(btn);
        buttons.push(btn);
      });

      output.appendChild(container);
      scrollOutputToBottom();

      let focusedIndex = 0;
      buttons[0].classList.add('focused');

      if (commandInput) commandInput.disabled = true;

      function activate(idx) {
        if (idx < 0 || idx >= options.length) return;
        buttons.forEach((b, i) => {
          b.disabled = true;
          if (i === idx) b.classList.add('selected');
        });
        if (commandInput) {
          commandInput.disabled = false;
          commandInput.focus();
        }
        window.removeEventListener('keydown', keyHandler);
        resolve(options[idx].value);
      }

      function keyHandler(e) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          moveFocus((focusedIndex - 1 + options.length) % options.length);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          moveFocus((focusedIndex + 1) % options.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          activate(focusedIndex);
        } else if (/^[1-9]$/.test(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (idx < options.length) {
            e.preventDefault();
            activate(idx);
          }
        }
      }

      function moveFocus(idx) {
        buttons[focusedIndex].classList.remove('focused');
        focusedIndex = idx;
        buttons[idx].classList.add('focused');
        buttons[idx].focus();
      }

      window.addEventListener('keydown', keyHandler);
    });
  }

  /**
   * Smooth-scroll the output area to the bottom.
   */
  function scrollOutputToBottom() {
    const el = ensureOutput();
    if (el) el.scrollTop = el.scrollHeight;
  }

  /**
   * Show a loading indicator above the input line.
   * @param {string} [text='处理中'] - Loading text.
   */
  function showLoadingIndicator(text = '处理中') {
    hideLoadingIndicator();
    const input = document.getElementById('command-input');
    if (!input) return;

    const indicator = document.createElement('div');
    indicator.id = 'loading-indicator';
    indicator.className = 'loading-indicator';
    indicator.textContent = text + '...';

    input.parentElement.insertBefore(indicator, input);
  }

  /**
   * Hide the loading indicator if present.
   */
  function hideLoadingIndicator() {
    const existing = document.getElementById('loading-indicator');
    if (existing) existing.remove();
  }

  // -----------------------------------------------------------------------------
  // Public API
  return {
    // Existing functions
    print, printLines, clear, shakeScreen, stageTransition,
    startScreen, getInput, focusInput, clearInput, getInputValue,
    // New functions (Batch 2)
    printDialogue,
    typewriter,
    initClock,
    showConnectionAnimation,
    displayChoice,
    scrollOutputToBottom,
    showLoadingIndicator,
    hideLoadingIndicator,
  };
})();
