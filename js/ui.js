// GAME 16 — UI Toolset
// Utility functions for printing text lines, animations, start screen, input handling.
// Dependencies: DOM elements (#output, #terminal, #command-input); window.GameState (future).

const ui = (() => {
  // Cache DOM element references to avoid repeated lookups.
  let outputEl = null;

  // ── Sequential output queue ─────────────────────────────────────────────
  // All text output goes through this queue so lines appear one by one,
  // each character typed in sequence.  No text can "jump ahead" of earlier
  // content (e.g. a ui.print() line appearing while printDialogue() is still
  // typing).
  const _queue = [];
  let _busy = false;
  let _drainResolve = null;  // resolve callback for _waitForDrain()

  function _sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function _getSpeed(type) {
    // ms per character — tune to taste
    const map = {
      'system':         6,
      'hint':           8,
      'important':     15,
      'warning':       12,
      'error':         12,
      'evidence':      20,
      'digital-human': 45,
      'zheng-qiao':    45,
      '':              10,
    };
    return map[type] !== undefined ? map[type] : 10;
  }

  async function _processQueue() {
    if (_busy) return;
    _busy = true;
    const el = ensureOutput();

    while (_queue.length) {
      const item = _queue.shift();

      if (item.type === 'dialogue') {
        const box = document.createElement('div');
        box.className = `dialogue-box ${item.speakerType}`;
        const nameEl = document.createElement('div');
        nameEl.className = 'speaker-name';
        nameEl.textContent = item.speaker;
        box.appendChild(nameEl);
        el.appendChild(box);
        scrollOutputToBottom();

        for (const line of item.lines) {
          const contentEl = document.createElement('div');
          contentEl.className = `dialogue-content line ${item.speakerType}`;
          box.appendChild(contentEl);
          scrollOutputToBottom();
          for (let i = 0; i < line.length; i++) {
            contentEl.textContent += line[i];
            scrollOutputToBottom();
            await _sleep(item.speed);
          }
        }
        if (item._resolve) item._resolve();
        continue;
      }

      if (item.type === 'custom' && typeof item.fn === 'function') {
        item.fn();
        if (item._resolve) item._resolve();
        continue;
      }

      const cls = item.cls || '';
      const line = document.createElement('div');
      line.className = cls ? `line ${cls}` : 'line';

      if (!item.text) {
        el.appendChild(line);
        scrollOutputToBottom();
        if (item._resolve) item._resolve();
        continue;
      }

      el.appendChild(line);
      for (let i = 0; i < item.text.length; i++) {
        line.textContent += item.text[i];
        scrollOutputToBottom();
        await _sleep(item.speed);
      }

      if (cls === 'evidence') {
        line.classList.add('evidence-flash');
        setTimeout(() => line.classList.remove('evidence-flash'), 700);
      }

      if (item._resolve) item._resolve();
    }

    _busy = false;
    if (_drainResolve) {
      _drainResolve();
      _drainResolve = null;
    }
  }

  /** Enqueue an item and start processing. Returns a promise that resolves
   *  when this specific item finishes rendering. */
  function _enqueue(item) {
    return new Promise(resolve => {
      item._resolve = resolve;
      _queue.push(item);
      _processQueue();
    });
  }

  /** Wait until the queue is completely empty (all pending text rendered). */
  function _waitForDrain() {
    if (!_busy && _queue.length === 0) return Promise.resolve();
    return new Promise(resolve => {
      // Chain: if someone is already waiting, resolve both when drain happens
      const prev = _drainResolve;
      _drainResolve = prev
        ? () => { prev(); resolve(); }
        : resolve;
    });
  }

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
   * Text appears character-by-character via the display queue.
   * @param {string} text - Content to display.
   * @param {string} [type] - Optional CSS class suffix for styling.
   *                          '' | 'error' | 'hint' | 'important' | 'warning'
   *                          | 'system' | 'evidence' | 'digital-human' | 'zheng-qiao'
   * @param {object} [opts] - Extra options.
   *                          opts.speed — override typewriter speed (ms/char).
   * @returns {null} (Use printDialogue if you need to await completion.)
   */
  function print(text, type = '', opts = {}) {
    _enqueue({
      type: 'line',
      text: text ?? '',
      cls: type,
      speed: opts.speed != null ? opts.speed : _getSpeed(type),
    });
    // Fire-and-forget — callers that need ordering use printDialogue + await
    return null;
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
   * Also aborts any pending queue items — they are discarded.
   */
  function clear() {
    _queue.length = 0;
    _busy = false;
    _drainResolve = null;
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
    const bannerHead = '\u2500'.repeat(42);
    const bannerBody = `[SYSTEM] Entering Stage ${stageNum}: ${stageName}`;

    print(bannerHead, 'system');
    print(bannerBody, 'system');
    print(bannerHead, 'system');
    print('', '');
    // Wait for these items to render before resolving
    return _waitForDrain();
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
   * Each line is typed character-by-character.  All rendering goes through
   * the shared display queue so it preserves order with ui.print() calls.
   *
   * @param {string} speaker - Name of the speaker.
   * @param {string[]} lines - Array of dialogue content lines.
   * @param {string} [type='digital-human'] - CSS type suffix for styling.
   * @returns {Promise<null>} Resolves when all lines finish typing.
   */
  async function printDialogue(speaker, lines, type = 'digital-human') {
    return _enqueue({
      type: 'dialogue',
      speaker,
      speakerType: type,
      lines: [...lines],
      speed: 55,
    });
  }

  /**
   * Async typewriter effect — displays text character by character.
   * Used internally by the queue; exposed for edge-case direct use.
   * @param {HTMLElement} element - Target element to type into.
   * @param {string} text - Full text content.
   * @param {number} [speed=30] - Milliseconds per character.
   * @returns {Promise<void>}
   */
  async function typewriter(element, text, speed = 30) {
    if (!text) return;
    for (let i = 0; i < text.length; i++) {
      element.textContent += text[i];
      await _sleep(speed);
    }
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
   * Renders inside the shared queue so it never jumps ahead of prior output.
   * @param {string} systemName - Name of the system being connected.
   * @param {number} [durationMs=2000] - Duration before auto-hide.
   * @returns {Promise<void>}
   */
  async function showConnectionAnimation(systemName, durationMs = 2000) {
    const el = ensureOutput();

    // Build the loading indicator element
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

    // Append via the queue so it respects ordering
    // (We push a custom callback item into the queue)
    await _enqueue({
      type: 'custom',
      fn: () => {
        el.appendChild(container);
        scrollOutputToBottom();
      },
    });

    // Wait for the animation duration
    await _sleep(durationMs);

    // Remove the loader and show success — also via queue
    container.remove();
    await _enqueue({
      type: 'line',
      text: `[${systemName} 已连接]`,
      cls: 'system',
      speed: 8,
    });
  }

  /**
   * Display a group of choice buttons with keyboard navigation.
   * Supports: ArrowUp/ArrowDown, Enter, number keys 1-9.
   * Disables command-input during choice selection, restores after.
   * Waits for the display queue to drain before showing buttons,
   * so all preceding text appears first.
   * @param {{label: string, value: any}[]} options - Choice options.
   * @param {string} [promptText='请做出选择：'] - Prompt text above buttons.
   * @returns {Promise<any>} Resolves with opt.value of selected button.
   */
  async function displayChoice(options, promptText = '请做出选择：') {
    const output = ensureOutput();
    const commandInput = getInput();
    if (!output) return -1;

    // Wait for all preceding text to finish rendering
    await _waitForDrain();

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

    return new Promise((resolve) => {
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
        // Ignore events originating from the command input to prevent double-handling
        // with main.js's input.keydown listener (race condition when async showXxx
        // calls displayChoice immediately after dispatch).
        if (commandInput && e.target === commandInput) return;
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
