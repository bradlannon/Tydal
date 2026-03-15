/**
 * ui/pad-grid.js
 *
 * Generates the 4x4 pad grid DOM with MPC layout ordering.
 * Uses a chromatic 16-note layout starting at C{currentOctave}.
 * Supports octave shifting (+/- one octave) with automatic grid rebuild.
 *
 * Exports:
 *   buildNoteMap    — Generates array of { note, key, padIndex } for 16 chromatic pads
 *   getNoteMap      — Returns the current note map array
 *   getCurrentOctave — Returns the current base octave
 *   initPadGrid     — Generates and appends pad grid DOM to a container; wires octave buttons
 *   setPadActive    — Adds/removes .active class on a pad by note name
 *   shiftOctave     — Shifts the base octave by delta (-1 or +1), clamped 1-7
 */

import { releaseAll } from '../engine/instruments.js';

/**
 * CHROMATIC: All 12 pitch classes in order.
 */
const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * KEYS: Keyboard key assignment per pad index (0-15).
 * Same layout as Phase 1 — z/x/c/v bottom row, 1/2/3/4 top row.
 */
const KEYS = ['z', 'x', 'c', 'v', 'a', 's', 'd', 'f', 'q', 'w', 'e', 'r', '1', '2', '3', '4'];

/**
 * currentOctave: base octave for the lowest pad (C{currentOctave}).
 * Mutable — changed by shiftOctave().
 */
let currentOctave = 3;

/**
 * _containerEl: stored reference to the grid's parent container,
 * used by rebuildGrid() to recreate the grid DOM on octave shift.
 */
let _containerEl = null;

/**
 * _gridEl: stored reference to the current pad-grid element.
 */
let _gridEl = null;

/**
 * buildNoteMap(octave)
 *
 * Generates 16 consecutive chromatic semitone entries starting at C{octave}.
 * When chromIdx reaches 12 (B), resets to C and increments octave.
 *
 * @param {number} octave — Base octave (defaults to currentOctave)
 * @returns {Array<{note: string, key: string, padIndex: number}>}
 */
export function buildNoteMap(octave = currentOctave) {
  const notes = [];
  let oct = octave;
  let chromIdx = 0; // start at C

  for (let i = 0; i < 16; i++) {
    notes.push({
      note: `${CHROMATIC[chromIdx]}${oct}`,
      key: KEYS[i],
      padIndex: i,
    });
    chromIdx++;
    if (chromIdx >= 12) {
      chromIdx = 0;
      oct++;
    }
  }
  return notes;
}

/**
 * getNoteMap()
 *
 * Returns the current 16-entry note map based on currentOctave.
 * Used by keyboard.js to rebuild KEY_TO_NOTE after an octave shift.
 *
 * @returns {Array<{note: string, key: string, padIndex: number}>}
 */
export function getNoteMap() {
  return buildNoteMap(currentOctave);
}

/**
 * getCurrentOctave()
 *
 * @returns {number} The current base octave
 */
export function getCurrentOctave() {
  return currentOctave;
}

/**
 * shiftOctave(delta)
 *
 * Shifts the base octave by delta, clamped to [1, 7].
 * Releases all active notes before rebuilding the grid to prevent stuck notes.
 * Dispatches 'grid-rebuild' event so input modules can clear their state.
 *
 * @param {number} delta — +1 or -1
 */
export function shiftOctave(delta) {
  currentOctave = Math.max(1, Math.min(7, currentOctave + delta));
  _rebuildGrid();
}

/**
 * _rebuildGrid()
 *
 * Internal: releases all notes, clears and recreates the grid DOM,
 * dispatches 'grid-rebuild' event, and updates the octave display.
 */
function _rebuildGrid() {
  // Release all active notes before destroying pad elements (Pitfall 5)
  releaseAll();

  if (!_containerEl || !_gridEl) return;

  // Remove old grid and create a new one
  _gridEl.remove();
  _gridEl = _createGrid();
  _containerEl.prepend(_gridEl);

  // Update octave display
  const display = document.getElementById('octave-display');
  if (display) display.textContent = `Oct ${currentOctave}`;

  // Notify input handlers that the grid has been rebuilt
  document.dispatchEvent(new CustomEvent('grid-rebuild'));
}

/**
 * _createGrid()
 *
 * Internal: creates and returns the pad-grid element using current note map.
 * Renders rows in reverse order for MPC layout (highest notes at top).
 *
 * @returns {HTMLElement} The pad-grid div element
 */
function _createGrid() {
  const noteMap = buildNoteMap(currentOctave);

  const grid = document.createElement('div');
  grid.className = 'pad-grid';

  const ROWS = 4;
  const COLS = 4;

  // Render rows in reverse order: top row (pads 13-16) first in DOM,
  // bottom row (pads 1-4) last — this achieves MPC layout visually.
  for (let row = ROWS - 1; row >= 0; row--) {
    for (let col = 0; col < COLS; col++) {
      const idx = row * COLS + col;
      const { note, key } = noteMap[idx];

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

  return grid;
}

/**
 * initPadGrid(containerEl)
 *
 * Creates and appends a .pad-grid element to containerEl.
 * Wires the octave shift buttons (#octave-down, #octave-up) to shiftOctave().
 *
 * @param {HTMLElement} containerEl — Parent element (e.g. #instrument)
 * @returns {HTMLElement} The pad-grid div element
 */
export function initPadGrid(containerEl) {
  _containerEl = containerEl;
  _gridEl = _createGrid();
  containerEl.appendChild(_gridEl);

  // Wire octave shift buttons
  const octaveDown = document.getElementById('octave-down');
  const octaveUp = document.getElementById('octave-up');
  const octaveDisplay = document.getElementById('octave-display');

  if (octaveDown) {
    octaveDown.addEventListener('click', () => shiftOctave(-1));
  }
  if (octaveUp) {
    octaveUp.addEventListener('click', () => shiftOctave(+1));
  }
  if (octaveDisplay) {
    octaveDisplay.textContent = `Oct ${currentOctave}`;
  }

  return _gridEl;
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
