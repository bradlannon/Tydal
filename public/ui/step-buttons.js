/**
 * ui/step-buttons.js
 *
 * 16-step horizontal button row — replaces the 4x8 step-zone grid.
 * Matches Ableton Move's physical layout: one row of small step buttons
 * between the encoder section and the note pads.
 *
 * Exports:
 *   initStepButtons(containerEl) — builds and appends step row, returns it
 */

import {
  getSelectedNote,
  hasNoteAtStep,
  getCurrentMelodicStep,
  toggleStep,
} from '../engine/melodic-sequencer.js';

const NUM_STEPS = 16;

let _buttons = [];
let _containerEl = null;
let _rowEl = null;

// ---------------------------------------------------------------------------
// Build the 16-button row
// ---------------------------------------------------------------------------

export function initStepButtons(containerEl) {
  _containerEl = containerEl;
  _rowEl = _buildRow();
  containerEl.appendChild(_rowEl);

  // Listen for playhead and step updates
  document.addEventListener('sequencer-step', _onSequencerStep);
  document.addEventListener('melodic-update', _onMelodicUpdate);

  // Initial render
  _refreshButtons();

  return _rowEl;
}

function _buildRow() {
  const row = document.createElement('div');
  row.className = 'step-button-row';

  _buttons = [];

  for (let i = 0; i < NUM_STEPS; i++) {
    const btn = document.createElement('button');
    btn.className = 'step-btn';
    // Every 4th step (except the first) gets a beat-start class for the visual gap
    if (i > 0 && i % 4 === 0) {
      btn.classList.add('beat-start');
    }
    btn.dataset.step = String(i);
    btn.setAttribute('type', 'button');
    btn.addEventListener('pointerdown', _onStepTap);

    _buttons.push(btn);
    row.appendChild(btn);
  }

  return row;
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

function _onStepTap(e) {
  e.preventDefault();
  const step = parseInt(e.currentTarget.dataset.step);
  const note = getSelectedNote();
  if (note !== null && note !== undefined) {
    toggleStep(step, note);
  }
}

function _onSequencerStep(e) {
  _refreshPlayhead(e.detail ? e.detail.step : -1);
}

function _onMelodicUpdate() {
  _refreshButtons();
}

// ---------------------------------------------------------------------------
// Visual refresh
// ---------------------------------------------------------------------------

function _refreshButtons() {
  const note = getSelectedNote();
  const playStep = getCurrentMelodicStep();

  _buttons.forEach((btn, i) => {
    const isActive = note ? hasNoteAtStep(i, note) : false;
    const isPlayhead = i === playStep;

    btn.classList.toggle('active', isActive);
    btn.classList.toggle('playhead', isPlayhead);
  });
}

function _refreshPlayhead(step) {
  _buttons.forEach((btn, i) => {
    btn.classList.toggle('playhead', i === step);
  });
}
