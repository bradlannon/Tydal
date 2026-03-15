/**
 * input/touch.js
 *
 * Pointer event handlers for the pad grid with multitouch tracking.
 * Uses pointerId map to correctly handle simultaneous touches.
 *
 * Exports:
 *   initTouch — Attaches pointer event listeners to the pad grid element
 *
 * Zero setTimeout calls — all timing via Tone.now() inside noteOn/noteOff.
 */

import { ensureAudioStarted } from '../engine/audio-engine.js';
import { noteOn, noteOff } from '../engine/instruments.js';
import { setPadActive } from '../ui/pad-grid.js';

/**
 * touchedPads: maps pointerId -> note name for active touches.
 * Enables correct note release when each finger lifts independently.
 */
const touchedPads = new Map();

/**
 * releasePointer(pointerId)
 *
 * Shared logic for pointerup, pointercancel, and pointerleave.
 * Looks up the note for this pointer, triggers noteOff, removes from map.
 *
 * @param {number} pointerId
 */
function releasePointer(pointerId) {
  const note = touchedPads.get(pointerId);
  if (!note) return;

  touchedPads.delete(pointerId);
  noteOff(note);
  setPadActive(note, false);
}

/**
 * initTouch(padGridEl)
 *
 * Attaches pointer event listeners to the pad grid element.
 * Sets touch-action: none to prevent scroll interference during pad play.
 *
 * @param {HTMLElement} padGridEl — The .pad-grid element
 */
export function initTouch(padGridEl) {
  // Prevent page scroll/zoom while interacting with the pad grid
  padGridEl.style.touchAction = 'none';

  // pointerdown: start note for the touched pad
  padGridEl.addEventListener('pointerdown', async (e) => {
    // Must call preventDefault here — requires { passive: false } on listener.
    // Without this, Chrome ignores preventDefault on touch events (Pitfall 3).
    e.preventDefault();

    const pad = e.target.closest('[data-note]');
    if (!pad) return;

    const note = pad.dataset.note;
    touchedPads.set(e.pointerId, note);

    await ensureAudioStarted();
    noteOn(note);
    setPadActive(note, true);
  }, { passive: false });

  // pointerup: finger lifted — release note
  padGridEl.addEventListener('pointerup', (e) => {
    releasePointer(e.pointerId);
  });

  // pointercancel: browser cancelled pointer (e.g. incoming call, scroll takeover)
  // IDENTICAL to pointerup — prevents stuck notes (Pitfall 6)
  padGridEl.addEventListener('pointercancel', (e) => {
    releasePointer(e.pointerId);
  });

  // pointerleave: finger slides off the pad grid entirely — release note
  padGridEl.addEventListener('pointerleave', (e) => {
    releasePointer(e.pointerId);
  });
}
