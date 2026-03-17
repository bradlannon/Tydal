/**
 * ui/oled-display.js
 *
 * OLED-style contextual display that shows parameter name + value
 * while the user is interacting with an encoder.
 *
 * Goes fully dark (opacity: 0) when idle. Fades in on showOLED(),
 * fades out 1500ms after the last showOLED() call.
 */

/**
 * createOLED() — returns an OLED display DOM element.
 * @returns {HTMLElement}
 */
export function createOLED() {
  const el = document.createElement('div');
  el.className = 'oled-display';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'oled-name';

  const valueSpan = document.createElement('span');
  valueSpan.className = 'oled-value';

  el.appendChild(nameSpan);
  el.appendChild(valueSpan);

  // Store refs for showOLED / hideOLED
  el._nameSpan = nameSpan;
  el._valueSpan = valueSpan;
  el._hideTimer = null;

  return el;
}

/**
 * showOLED(displayEl, name, value) — reveal display with name + value.
 * Resets the 1500ms hide timeout on each call.
 *
 * @param {HTMLElement} displayEl
 * @param {string} name   - Parameter name (e.g. "Cutoff")
 * @param {string} value  - Formatted value string (e.g. "2800 Hz")
 */
export function showOLED(displayEl, name, value) {
  if (!displayEl) return;

  // Cancel pending hide
  if (displayEl._hideTimer) {
    clearTimeout(displayEl._hideTimer);
    displayEl._hideTimer = null;
  }

  displayEl._nameSpan.textContent = name;
  displayEl._valueSpan.textContent = value;
  displayEl.classList.add('active');
}

/**
 * hideOLED(displayEl) — schedule fade-out after 1500ms idle.
 * Calling showOLED() before the timeout fires cancels it.
 *
 * @param {HTMLElement} displayEl
 */
export function hideOLED(displayEl) {
  if (!displayEl) return;

  if (displayEl._hideTimer) clearTimeout(displayEl._hideTimer);

  displayEl._hideTimer = setTimeout(() => {
    displayEl.classList.remove('active');
    displayEl._hideTimer = null;
  }, 1500);
}

/**
 * formatValue(value, step) — format a number for OLED display.
 * Uses 0-2 decimal places depending on step size.
 *
 * @param {number} value
 * @param {number} step
 * @returns {string}
 */
export function formatValue(value, step) {
  if (step >= 1) return Math.round(value).toString();
  if (step >= 0.1) return value.toFixed(1);
  return value.toFixed(2);
}
