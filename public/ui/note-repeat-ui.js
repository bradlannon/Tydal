/**
 * ui/note-repeat-ui.js
 *
 * Note Repeat toolbar UI — RPT toggle button + rate selector.
 * Mounts into the #note-repeat-control container added to the toolbar.
 *
 * Exports:
 *   initNoteRepeatUI(containerEl)
 */

import {
  isRepeatEnabled,
  setRepeatEnabled,
  setRepeatRate,
  getRepeatRate,
} from '../engine/note-repeat.js';

/**
 * Initialise the Note Repeat toolbar controls inside containerEl.
 *
 * @param {HTMLElement} containerEl
 */
export function initNoteRepeatUI(containerEl) {
  if (!containerEl) return;

  // ------------------------------------------------------------------
  // RPT toggle button
  // ------------------------------------------------------------------
  const rptBtn = document.createElement('button');
  rptBtn.type = 'button';
  rptBtn.className = 'toolbar-btn';
  rptBtn.textContent = 'RPT';
  rptBtn.setAttribute('aria-label', 'Note Repeat');
  rptBtn.setAttribute('aria-pressed', String(isRepeatEnabled()));

  rptBtn.addEventListener('click', () => {
    const next = !isRepeatEnabled();
    setRepeatEnabled(next);
    rptBtn.classList.toggle('active', next);
    rptBtn.setAttribute('aria-pressed', String(next));
  });

  // ------------------------------------------------------------------
  // Rate selector
  // ------------------------------------------------------------------
  const rateSelect = document.createElement('select');
  rateSelect.setAttribute('aria-label', 'Repeat Rate');
  // Match .scale-control select visual style
  rateSelect.className = 'note-repeat-rate';

  const rates = [
    { value: '4n',  label: '1/4'  },
    { value: '8n',  label: '1/8'  },
    { value: '16n', label: '1/16' },
    { value: '32n', label: '1/32' },
  ];

  for (const { value, label } of rates) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    rateSelect.appendChild(opt);
  }

  // Set default to match engine default ('8n')
  rateSelect.value = getRepeatRate();

  rateSelect.addEventListener('change', () => {
    setRepeatRate(rateSelect.value);
  });

  // ------------------------------------------------------------------
  // Mount
  // ------------------------------------------------------------------
  containerEl.appendChild(rptBtn);
  containerEl.appendChild(rateSelect);
}
