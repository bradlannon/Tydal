/**
 * ui/pad-grid.js
 *
 * Push 3-inspired 8×8 grid with split layout:
 *   Top 4 rows  — step sequencer (4 note lanes × 8 steps, paged for 16 total)
 *   Bottom 4 rows — playable note pads (32 notes, chromatic or scale-locked)
 *
 * Exports:
 *   buildNoteMap, getNoteMap, getCurrentOctave
 *   initPadGrid, setPadActive, shiftOctave
 *   setScaleLock, getScaleLock
 */

import { releaseAll } from '../engine/instruments.js';
import { Scale } from 'tonal';
import {
  getLanes, getPage, getSelectedNote, getCurrentMelodicStep,
  hasNoteAtStep, togglePage, STEPS_PER_PAGE,
} from '../engine/melodic-sequencer.js';

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
}

// ---------------------------------------------------------------------------
// Grid construction — Push 3-style 8×8
// ---------------------------------------------------------------------------

function _createGrid() {
  const container = document.createElement('div');
  container.className = 'push-grid';

  // ---- Step zone (top 4 rows × 8 cols) ----
  const stepZone = document.createElement('div');
  stepZone.className = 'step-zone';

  for (let lane = 0; lane < 4; lane++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell step-cell';
      cell.dataset.type = 'step';
      cell.dataset.lane = String(lane);
      cell.dataset.col = String(col);
      stepZone.appendChild(cell);
    }
  }
  container.appendChild(stepZone);

  // ---- Zone divider with page toggle ----
  const divider = document.createElement('div');
  divider.className = 'zone-divider';

  const pageLabel = document.createElement('span');
  pageLabel.className = 'page-label';
  pageLabel.id = 'step-page-label';
  pageLabel.textContent = '1–8';

  const pageBtn = document.createElement('button');
  pageBtn.className = 'page-toggle-btn';
  pageBtn.textContent = '▶';
  pageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePage();
  });

  divider.appendChild(pageLabel);
  divider.appendChild(pageBtn);
  container.appendChild(divider);

  // ---- Note zone (bottom 4 rows × 8 cols) ----
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

  // Initial step display
  requestAnimationFrame(_updateStepDisplay);

  return container;
}

// ---------------------------------------------------------------------------
// Step cell visual update — called on every 'melodic-update' event
// ---------------------------------------------------------------------------

function _updateStepDisplay() {
  const lanesArr = getLanes();
  const page = getPage();
  const selected = getSelectedNote();
  const playStep = getCurrentMelodicStep();

  // Update page label
  const pageLabel = document.getElementById('step-page-label');
  if (pageLabel) pageLabel.textContent = page === 0 ? '1–8' : '9–16';

  const stepCells = document.querySelectorAll('.step-cell');
  stepCells.forEach(cell => {
    const lane = parseInt(cell.dataset.lane);
    const col = parseInt(cell.dataset.col);
    const actualStep = page * STEPS_PER_PAGE + col;
    const laneNote = lanesArr[lane];

    // Reset classes
    cell.classList.remove('step-active', 'step-selected-lane', 'step-playhead', 'step-empty');

    // Remove old lane label
    const oldLabel = cell.querySelector('.lane-label');
    if (oldLabel) oldLabel.remove();

    if (!laneNote) {
      cell.classList.add('step-empty');
      return;
    }

    // Lane label on first column
    if (col === 0) {
      const label = document.createElement('span');
      label.className = 'lane-label';
      label.textContent = laneNote;
      cell.appendChild(label);
    }

    // Selected note's lane
    if (laneNote === selected) {
      cell.classList.add('step-selected-lane');
    }

    // Note active at this step
    if (hasNoteAtStep(actualStep, laneNote)) {
      cell.classList.add('step-active');
    }

    // Playhead
    if (actualStep === playStep) {
      cell.classList.add('step-playhead');
    }
  });

  // Update selected pad visual
  const selectedNote = getSelectedNote();
  document.querySelectorAll('.note-cell').forEach(cell => {
    cell.classList.toggle('selected', cell.dataset.note === selectedNote);
  });
}

// Listen for melodic sequencer updates
document.addEventListener('melodic-update', _updateStepDisplay);

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
}
