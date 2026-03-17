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
import {
  getActiveTrack,
  getActiveTrackId,
  setStepAutomation,
  getStepAutomation,
} from '../engine/track-manager.js';
import { getStep, ROWS } from '../engine/sequencer.js';

const NUM_STEPS = 16;

let _buttons = [];
let _containerEl = null;
let _rowEl = null;

// Hold detection state — track which step is currently held for automation capture
let _heldStep = -1;    // Step index currently held (-1 = none)
let _holdTimer = null; // Distinguishes tap (<200ms) from hold (≥200ms)

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

  // Automation: encoder turn while a step is held writes automation to that step
  document.addEventListener('encoder-change', _onEncoderChange);

  // Automation: refresh button indicators when automation data changes
  document.addEventListener('automation-update', _refreshButtons);

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
    btn.addEventListener('pointerdown', _onStepPointerDown);

    _buttons.push(btn);
    row.appendChild(btn);
  }

  return row;
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

/**
 * Pointer down on a step button — begin tap vs hold detection.
 * <200ms release = tap (toggle step note).
 * ≥200ms hold = automation mode (encoder turns write to this step).
 */
function _onStepPointerDown(e) {
  e.preventDefault();
  const track = getActiveTrack();
  // Drum step editing is done via the DRM sheet; step taps are no-ops on drum track
  if (track.type === 'drum') return;

  const step = parseInt(e.currentTarget.dataset.step);
  _heldStep = step;

  _holdTimer = setTimeout(() => {
    // Held past threshold — automation mode; timer consumed
    _holdTimer = null;
  }, 200);

  // Add release listeners (once — auto-removed after firing)
  e.currentTarget.addEventListener('pointerup', _onStepPointerUp, { once: true });
  e.currentTarget.addEventListener('pointerleave', _onStepPointerUp, { once: true });
}

/**
 * Pointer released or left button — resolve tap vs hold.
 */
function _onStepPointerUp(e) {
  const step = parseInt(e.currentTarget.dataset.step);
  if (_holdTimer !== null) {
    // Released before 200ms threshold — treat as a tap, toggle the step note
    clearTimeout(_holdTimer);
    _holdTimer = null;
    _doStepTap(step);
  }
  _heldStep = -1;
}

/**
 * Perform the normal step tap: toggle the selected note at this step.
 */
function _doStepTap(step) {
  const note = getSelectedNote();
  if (note !== null && note !== undefined) {
    toggleStep(step, note);
  }
}

/**
 * Encoder changed — if a step is held, write automation to that step.
 */
function _onEncoderChange(e) {
  if (_heldStep < 0) return;
  const { name, value } = e.detail;
  const trackId = getActiveTrackId();
  setStepAutomation(trackId, _heldStep, name, value);
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
  const trackId = getActiveTrackId();

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
    const hasAuto = getStepAutomation(trackId, i) !== null;

    btn.classList.toggle('active', isActive);
    btn.classList.toggle('playhead', isPlayhead);
    btn.classList.toggle('has-automation', hasAuto);
  });
}

function _refreshPlayhead(step) {
  _buttons.forEach((btn, i) => {
    btn.classList.toggle('playhead', i === step);
  });
}
