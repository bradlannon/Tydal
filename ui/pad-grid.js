/**
 * ui/pad-grid.js
 *
 * Generates the 4x4 pad grid DOM with MPC layout ordering.
 * Bottom-left = lowest note (C3), top-right = highest note (D5).
 *
 * Exports:
 *   NOTE_MAP      — Array of { note, key, padIndex } for all 16 pads
 *   initPadGrid   — Generates and appends pad grid DOM to a container
 *   setPadActive  — Adds/removes .active class on a pad by note name
 */

/**
 * NOTE_MAP: 16 pads in logical order (pad 1 = bottom-left, pad 16 = top-right).
 * Diatonic two-octave range C3-D5 for musical warmth.
 *
 * MPC layout: bottom-left = lowest, top-right = highest.
 * Rows (bottom to top):
 *   Row 1 (bottom): pads 1-4   → C3 D3 E3 F3  (keys: z x c v)
 *   Row 2:          pads 5-8   → G3 A3 B3 C4  (keys: a s d f)
 *   Row 3:          pads 9-12  → D4 E4 F4 G4  (keys: q w e r)
 *   Row 4 (top):    pads 13-16 → A4 B4 C5 D5  (keys: 1 2 3 4)
 */
export const NOTE_MAP = [
  { note: 'C3', key: 'z', padIndex: 0 },
  { note: 'D3', key: 'x', padIndex: 1 },
  { note: 'E3', key: 'c', padIndex: 2 },
  { note: 'F3', key: 'v', padIndex: 3 },
  { note: 'G3', key: 'a', padIndex: 4 },
  { note: 'A3', key: 's', padIndex: 5 },
  { note: 'B3', key: 'd', padIndex: 6 },
  { note: 'C4', key: 'f', padIndex: 7 },
  { note: 'D4', key: 'q', padIndex: 8 },
  { note: 'E4', key: 'w', padIndex: 9 },
  { note: 'F4', key: 'e', padIndex: 10 },
  { note: 'G4', key: 'r', padIndex: 11 },
  { note: 'A4', key: '1', padIndex: 12 },
  { note: 'B4', key: '2', padIndex: 13 },
  { note: 'C5', key: '3', padIndex: 14 },
  { note: 'D5', key: '4', padIndex: 15 },
];

/**
 * initPadGrid(containerEl)
 *
 * Creates and appends a .pad-grid element to containerEl.
 * Renders rows in reverse order for MPC layout:
 *   Top DOM row    = pads 13-16 (highest notes)
 *   ...
 *   Bottom DOM row = pads 1-4 (lowest notes)
 *
 * @param {HTMLElement} containerEl — Parent element (e.g. #instrument)
 * @returns {HTMLElement} The pad-grid div element
 */
export function initPadGrid(containerEl) {
  const grid = document.createElement('div');
  grid.className = 'pad-grid';

  // Render rows in reverse order: top row (pads 13-16) first in DOM,
  // bottom row (pads 1-4) last — this achieves MPC layout visually.
  const ROWS = 4;
  const COLS = 4;

  for (let row = ROWS - 1; row >= 0; row--) {
    for (let col = 0; col < COLS; col++) {
      const idx = row * COLS + col;
      const { note, key } = NOTE_MAP[idx];

      const pad = document.createElement('div');
      pad.className = 'pad';
      pad.dataset.note = note;
      pad.dataset.key = key;

      const keySpan = document.createElement('span');
      keySpan.className = 'pad-key';
      keySpan.textContent = key.toUpperCase();

      const noteSpan = document.createElement('span');
      noteSpan.className = 'pad-note';
      noteSpan.textContent = note;

      pad.appendChild(keySpan);
      pad.appendChild(noteSpan);
      grid.appendChild(pad);
    }
  }

  containerEl.appendChild(grid);
  return grid;
}

/**
 * setPadActive(note, isActive)
 *
 * Adds or removes the .active class on the pad element matching
 * the given note name. Used by keyboard.js and touch.js for visual
 * feedback during note on/off.
 *
 * @param {string} note    — Note name, e.g. 'C3'
 * @param {boolean} isActive — true = add .active, false = remove
 */
export function setPadActive(note, isActive) {
  const pad = document.querySelector(`.pad[data-note="${note}"]`);
  if (!pad) return;
  pad.classList.toggle('active', isActive);
}
