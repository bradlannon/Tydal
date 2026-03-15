/**
 * input/touch.js
 *
 * Pointer event handlers for the pad grid with multitouch tracking.
 * Uses pointerId map to correctly handle simultaneous touches.
 * Clears touchedPads on 'grid-rebuild' events (octave shift) to prevent
 * stuck notes when pads are reassigned to different notes.
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
 * Sets touch-action: none on both the grid and body to prevent
 * scroll/zoom interference during multitouch pad play.
 *
 * @param {HTMLElement} padGridEl — The .pad-grid element
 */
export function initTouch(padGridEl) {
  // Prevent page scroll/zoom while interacting with the pad grid
  padGridEl.style.touchAction = 'none';

  // Set touch-action: manipulation on body to prevent double-tap zoom
  // at the page level without blocking pointer events on the grid.
  document.body.style.touchAction = 'manipulation';

  // On 'grid-rebuild' (octave shift), clear all active pointer tracking.
  // The grid DOM has been recreated — old pointer→note mappings are invalid.
  // releaseAll() in instruments.js handles actual audio release; we just
  // clean up the pointer map and visual state here.
  document.addEventListener('grid-rebuild', () => {
    // Deactivate any visually highlighted pads for tracked pointers
    for (const note of touchedPads.values()) {
      setPadActive(note, false);
    }
    touchedPads.clear();
  });

  // pointerdown: start note for the touched pad
  padGridEl.addEventListener('pointerdown', async (e) => {
    // Must call preventDefault here — requires { passive: false } on listener.
    // Without this, Chrome ignores preventDefault on touch events.
    // This also prevents zoom on rapid multi-finger taps (Pitfall 7).
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
  // IDENTICAL to pointerup — prevents stuck notes on iOS gesture interruptions
  padGridEl.addEventListener('pointercancel', (e) => {
    releasePointer(e.pointerId);
  });

  // pointerleave: finger slides off the pad grid entirely — release note
  padGridEl.addEventListener('pointerleave', (e) => {
    releasePointer(e.pointerId);
  });
}
