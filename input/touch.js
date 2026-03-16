/**
 * input/touch.js
 *
 * Pointer event handlers for the Push 3-style grid.
 * Handles both step cells (toggle) and note pads (play + select).
 *
 * Exports:
 *   initTouch — Attaches pointer event listeners to the grid element
 */

import { ensureAudioStarted } from '../engine/audio-engine.js';
import { noteOn, noteOff } from '../engine/instruments.js';
import { setPadActive } from '../ui/pad-grid.js';
import {
  setSelectedNote, toggleStep, getLanes, getPage,
  STEPS_PER_PAGE,
} from '../engine/melodic-sequencer.js';
import { startExpression, updateExpression, stopExpression } from '../engine/pad-expression.js';

/** Maps pointerId → note name for active touches on note pads */
const touchedPads = new Map();

let lastPointerY = null;
let lastPointerTime = null;

function releasePointer(pointerId, gridEl) {
  const note = touchedPads.get(pointerId);
  if (!note) return;
  touchedPads.delete(pointerId);
  stopExpression(pointerId);
  noteOff(note);
  setPadActive(note, false);
  // Remove expressing class from any pad showing expression feedback
  if (gridEl) {
    const expressingEl = gridEl.querySelector(`.note-cell[data-note="${note}"]`);
    if (expressingEl) expressingEl.classList.remove('expressing');
  }
}

export function initTouch(gridEl) {
  gridEl.style.touchAction = 'none';
  document.body.style.touchAction = 'manipulation';

  document.addEventListener('grid-rebuild', () => {
    for (const note of touchedPads.values()) {
      setPadActive(note, false);
    }
    touchedPads.clear();
    lastPointerY = null;
    lastPointerTime = null;
  });

  gridEl.addEventListener('pointerdown', async (e) => {
    e.preventDefault();

    const target = e.target.closest('[data-type]');
    if (!target) return;

    // ---- Step cell: toggle step ----
    if (target.dataset.type === 'step') {
      const lane = parseInt(target.dataset.lane);
      const col = parseInt(target.dataset.col);
      const lanesArr = getLanes();
      const laneNote = lanesArr[lane];
      if (!laneNote) return;

      const actualStep = getPage() * STEPS_PER_PAGE + col;
      toggleStep(actualStep, laneNote);
      return;
    }

    // ---- Note pad: play + select ----
    if (target.dataset.type === 'pad') {
      const note = target.dataset.note;
      touchedPads.set(e.pointerId, note);

      // Velocity from pointer speed
      let velocity = 0.6;
      const now = performance.now();
      if (lastPointerY !== null && lastPointerTime !== null) {
        const timeDelta = now - lastPointerTime;
        if (timeDelta > 0) {
          const speed = Math.abs(e.clientY - lastPointerY) / timeDelta;
          velocity = Math.min(1, Math.max(0.4, speed / 3));
        }
      }
      lastPointerY = e.clientY;
      lastPointerTime = now;

      await ensureAudioStarted();
      noteOn(note, velocity);
      setPadActive(note, true);
      setSelectedNote(note);
      startExpression(e.pointerId, note, target.getBoundingClientRect());
    }
  }, { passive: false });

  gridEl.addEventListener('pointermove', (e) => {
    updateExpression(e.pointerId, e.clientX, e.clientY);
    // Add expressing class to the pad element currently held by this pointer
    const note = touchedPads.get(e.pointerId);
    if (note) {
      const padEl = gridEl.querySelector(`.note-cell[data-note="${note}"]`);
      if (padEl) padEl.classList.add('expressing');
    }
  });

  gridEl.addEventListener('pointerup', (e) => releasePointer(e.pointerId, gridEl));
  gridEl.addEventListener('pointercancel', (e) => releasePointer(e.pointerId, gridEl));
  gridEl.addEventListener('pointerleave', (e) => releasePointer(e.pointerId, gridEl));
}
