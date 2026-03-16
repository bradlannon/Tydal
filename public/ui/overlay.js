/**
 * ui/overlay.js
 *
 * iOS tap-to-start overlay with interrupted-state recovery.
 *
 * Shows a full-screen overlay prompting the user to tap
 * to start the AudioContext. On iOS the AudioContext must be
 * started from within a user gesture. Listens for the
 * 'audio-interrupted' event dispatched by audio-engine.js
 * to re-show the overlay if the context is suspended.
 */

import * as Tone from 'tone';
import { ensureAudioStarted } from '../engine/audio-engine.js';

const overlay = document.getElementById('audio-overlay');

/** Show the tap-to-start overlay. */
export function showAudioOverlay() {
  if (overlay) overlay.hidden = false;
}

/** Hide the tap-to-start overlay. */
export function hideAudioOverlay() {
  if (overlay) overlay.hidden = true;
}

// On overlay tap: start AudioContext then hide overlay.
// Uses { once: false } so it can trigger again after interruption.
if (overlay) {
  overlay.addEventListener('click', async () => {
    await ensureAudioStarted();
    hideAudioOverlay();
  });
}

// If the AudioContext gets interrupted (e.g. iOS phone call, screen lock),
// re-show the overlay so the user can tap to resume.
document.addEventListener('audio-interrupted', () => {
  showAudioOverlay();
});

// Initial state: show overlay if AudioContext is not yet running.
if (Tone.getContext().rawContext.state !== 'running') {
  showAudioOverlay();
} else {
  hideAudioOverlay();
}
