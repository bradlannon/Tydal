/**
 * ui/macro-panel.js
 *
 * Bottom sheet panel for macro knob controls.
 * Renders 4 labeled range sliders (Darkness, Grit, Motion, Space),
 * each connected to the macro engine for real-time multi-param control.
 */

import { applyMacro, getMacroValue, MACROS } from '../engine/macros.js';

/**
 * initMacroPanel(containerEl)
 *
 * Build and attach 4 macro slider rows into the given container element.
 * Reuses existing .panel-row / .panel-label / input[type="range"] styles.
 *
 * @param {HTMLElement} containerEl - The #macro-panel sheet-content div
 */
export function initMacroPanel(containerEl) {
  if (!containerEl) return;

  for (const name of Object.keys(MACROS)) {
    const row = document.createElement('div');
    row.className = 'panel-row';

    const label = document.createElement('span');
    label.className = 'panel-label';
    label.textContent = name;

    const slider = document.createElement('input');
    slider.type  = 'range';
    slider.min   = '0';
    slider.max   = '1';
    slider.step  = '0.01';
    slider.value = String(getMacroValue(name));
    slider.setAttribute('aria-label', `${name} macro`);

    slider.addEventListener('input', () => {
      applyMacro(name, Number(slider.value));
    });

    row.appendChild(label);
    row.appendChild(slider);
    containerEl.appendChild(row);
  }
}
