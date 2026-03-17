/**
 * ui/pad-grid.js
 *
 * Move-style grid layout:
 *   Step buttons row — 16 horizontal step buttons (via step-buttons.js)
 *   Note zone        — 4 rows × 8 cols playable note pads
 *
 * Exports:
 *   buildNoteMap, getNoteMap, getCurrentOctave
 *   initPadGrid, setPadActive, shiftOctave
 *   setScaleLock, getScaleLock
 *   TRACK_COLOR
 */

import { releaseAll } from '../engine/instruments.js';
import { Scale } from 'tonal';
import { initStepButtons } from './step-buttons.js';
import { getSelectedNote } from '../engine/melodic-sequencer.js';

/** Move track 1 default color — orange-amber. Phase 8 can swap per track. */
export const TRACK_COLOR = '#e87a20';

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Keyboard key assignments — 4 rows × 8 keys for 32 note pads */
const KEYS = [
  'z', 'x', 'c', 'v', 'b', 'n', 'm', ',',
  'a', 's', 'd', 'f', 'g', 'h', 'j', 'k',
  'q', 'w', 'e', 'r', 't', 'y', 'u', 'i',
  '1', '2', '3', '4', '5', '6', '7', '8',
];

let currentOctave = 3;
let scaleLock = null;
let _containerEl = null;
let _gridEl = null;

// ---------------------------------------------------------------------------
// Scale lock
// ---------------------------------------------------------------------------

function _normalizePitchClass(pc) {
  const enharmonics = {
    'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#',
    'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B',
  };
  const normalized = pc.charAt(0).toUpperCase() + pc.slice(1);
  return enharmonics[normalized] || normalized;
}

export function setScaleLock(key, scaleName) {
  scaleLock = (key && scaleName) ? { key, scale: scaleName } : null;
  _rebuildGrid();
}

export function getScaleLock() { return scaleLock; }

// ---------------------------------------------------------------------------
// Note map — 32 notes for the bottom 4×8 grid
// ---------------------------------------------------------------------------

export function buildNoteMap(octave = currentOctave) {
  const NUM_PADS = 32;

  if (scaleLock) {
    const scaleResult = Scale.get(`${scaleLock.key} ${scaleLock.scale}`);
    const scalePCs = (scaleResult.notes || []).map(_normalizePitchClass);

    if (scalePCs.length > 0) {
      const chromatic = [];
      for (let o = octave; o < octave + 6; o++) {
        for (let ci = 0; ci < 12; ci++) {
          chromatic.push({ pc: CHROMATIC[ci], oct: o });
        }
      }
      const inScale = chromatic.filter(({ pc }) => scalePCs.includes(pc));
      return inScale.slice(0, NUM_PADS).map(({ pc, oct: o }, i) => ({
        note: `${pc}${o}`,
        key: i < KEYS.length ? KEYS[i] : '',
        padIndex: i,
      }));
    }
  }

  // Chromatic mode
  const notes = [];
  let oct = octave;
  let chromIdx = 0;
  for (let i = 0; i < NUM_PADS; i++) {
    notes.push({
      note: `${CHROMATIC[chromIdx]}${oct}`,
      key: i < KEYS.length ? KEYS[i] : '',
      padIndex: i,
    });
    chromIdx++;
    if (chromIdx >= 12) { chromIdx = 0; oct++; }
  }
  return notes;
}

export function getNoteMap() { return buildNoteMap(currentOctave); }
export function getCurrentOctave() { return currentOctave; }

// ---------------------------------------------------------------------------
// Octave shifting
// ---------------------------------------------------------------------------

export function shiftOctave(delta) {
  currentOctave = Math.max(1, Math.min(6, currentOctave + delta));
  _rebuildGrid();
}

function _rebuildGrid() {
  releaseAll();
  if (!_containerEl || !_gridEl) return;
  _gridEl.remove();
  _gridEl = _createGrid();
  _containerEl.prepend(_gridEl);

  const display = document.getElementById('octave-display');
  if (display) display.textContent = `Oct ${currentOctave}`;
  document.dispatchEvent(new CustomEvent('grid-rebuild'));
  // Re-apply pad colors after rebuild (scale/octave may have changed)
  requestAnimationFrame(_applyPadColors);
}

// ---------------------------------------------------------------------------
// Grid construction — Move-style step row + note zone
// ---------------------------------------------------------------------------

function _createGrid() {
  const container = document.createElement('div');
  container.className = 'push-grid';

  // ---- Step button row (16 horizontal buttons) ----
  // initStepButtons builds and appends a .step-button-row div inside the container
  initStepButtons(container);

  // ---- Note zone (4 rows × 8 cols) ----
  const noteZone = document.createElement('div');
  noteZone.className = 'note-zone';

  const noteMap = buildNoteMap(currentOctave);
  const ROWS = 4, COLS = 8;

  // MPC layout: bottom-left = lowest, top-right = highest
  for (let row = ROWS - 1; row >= 0; row--) {
    for (let col = 0; col < COLS; col++) {
      const idx = row * COLS + col;
      const { note } = noteMap[idx];

      const cell = document.createElement('div');
      cell.className = 'grid-cell note-cell';
      cell.dataset.type = 'pad';
      cell.dataset.note = note;

      const label = document.createElement('span');
      label.className = 'cell-note';
      label.textContent = note;
      cell.appendChild(label);

      noteZone.appendChild(cell);
    }
  }
  container.appendChild(noteZone);

  // Initial pad coloring
  requestAnimationFrame(() => {
    _applyPadColors();
  });

  return container;
}

// ---------------------------------------------------------------------------
// Pad RGB coloring — assigns colors based on musical role
// ---------------------------------------------------------------------------

function _applyPadColors() {
  const cells = document.querySelectorAll('.note-cell');
  if (!cells.length) return;

  let scalePCs = null;
  let rootPC = null;

  if (scaleLock) {
    const scaleResult = Scale.get(`${scaleLock.key} ${scaleLock.scale}`);
    scalePCs = (scaleResult.notes || []).map(_normalizePitchClass);
    rootPC = _normalizePitchClass(scaleLock.key);
  }

  cells.forEach(cell => {
    // Skip if currently active (pressed) — don't override white flash
    if (cell.classList.contains('active')) return;

    const noteStr = cell.dataset.note; // e.g. "C4"
    if (!noteStr) return;

    // Extract pitch class: handle sharps (e.g. "C#4" -> "C#", "A4" -> "A")
    const pc = noteStr.length > 2 && noteStr[1] === '#'
      ? noteStr.slice(0, 2)
      : noteStr.slice(0, 1);

    let color, glow;

    if (scalePCs && rootPC) {
      if (pc === rootPC) {
        // Root note — orange glow
        color = TRACK_COLOR;
        glow = '0 0 8px rgba(232, 122, 32, 0.4)';
      } else if (scalePCs.includes(pc)) {
        // In-scale (non-root) — dim warm gray
        color = '#2a2a2a';
        glow = 'none';
      } else {
        // Out-of-scale — nearly black
        color = '#0d0d0d';
        glow = 'none';
      }
    } else {
      // Chromatic mode — all pads dim gray, no root distinction
      color = '#2a2a2a';
      glow = 'none';
    }

    cell.style.backgroundColor = color;
    cell.style.boxShadow = glow;
    // Store role color so setPadActive can restore it
    cell.dataset.roleColor = color;
    cell.dataset.roleGlow = glow;
  });
}

// Listen for melodic sequencer updates — update selected pad visual
document.addEventListener('melodic-update', _onMelodicUpdate);

function _onMelodicUpdate() {
  // Update which pad shows as selected (last tapped note)
  const selectedNote = getSelectedNote();
  document.querySelectorAll('.note-cell').forEach(cell => {
    cell.classList.toggle('selected', cell.dataset.note === selectedNote);
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function initPadGrid(containerEl) {
  _containerEl = containerEl;
  _gridEl = _createGrid();
  containerEl.appendChild(_gridEl);

  // Octave buttons
  const octaveDown = document.getElementById('octave-down');
  const octaveUp = document.getElementById('octave-up');
  const octaveDisplay = document.getElementById('octave-display');

  if (octaveDown) octaveDown.addEventListener('click', () => shiftOctave(-1));
  if (octaveUp) octaveUp.addEventListener('click', () => shiftOctave(+1));
  if (octaveDisplay) octaveDisplay.textContent = `Oct ${currentOctave}`;

  // Scale lock selectors
  const scaleKey = document.getElementById('scale-key');
  const scaleType = document.getElementById('scale-type');

  function _onScaleChange() {
    const key = scaleKey ? scaleKey.value : '';
    const type = scaleType ? scaleType.value : 'major';
    setScaleLock(key || null, key ? type : null);
  }

  if (scaleKey) scaleKey.addEventListener('change', _onScaleChange);
  if (scaleType) scaleType.addEventListener('change', _onScaleChange);

  return _gridEl;
}

export function setPadActive(note, isActive) {
  const pad = document.querySelector(`.note-cell[data-note="${note}"]`);
  if (!pad) return;
  pad.classList.toggle('active', isActive);
  if (isActive) {
    pad.style.backgroundColor = '#fff';
    pad.style.boxShadow = '0 0 12px rgba(255, 255, 255, 0.5)';
  } else {
    pad.style.backgroundColor = pad.dataset.roleColor || '#2a2a2a';
    pad.style.boxShadow = pad.dataset.roleGlow || 'none';
  }
}
