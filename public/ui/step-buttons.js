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
import { getActiveTrack } from '../engine/track-manager.js';
import { getStep, ROWS } from '../engine/sequencer.js';

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

  // Listen for playhead, step, and track-change updates
  document.addEventListener('sequencer-step', _onSequencerStep);
  document.addEventListener('melodic-update', _onMelodicUpdate);
  document.addEventListener('track-change', _onTrackChange);

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
  const track = getActiveTrack();
  // Drum step editing is done via the DRM sheet; step taps are no-ops on drum track
  if (track.type === 'drum') return;
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

function _onTrackChange() {
  _refreshButtons();
}

// ---------------------------------------------------------------------------
// Visual refresh
// ---------------------------------------------------------------------------

function _refreshButtons() {
  const track = getActiveTrack();
  const playStep = getCurrentMelodicStep();

  _buttons.forEach((btn, i) => {
    let isActive = false;

    if (track.type === 'drum') {
      // Combined drum view: step is active if ANY drum row has it active
      isActive = ROWS.some(row => getStep(row, i));
    } else {
      // Melodic view: check if the selected note has a step at position i
      const note = getSelectedNote();
      isActive = note ? hasNoteAtStep(i, note) : false;
    }

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
