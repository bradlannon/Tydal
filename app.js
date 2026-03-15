/**
 * app.js — Tydal bootstrap
 *
 * Module entry point. Wires the signal chain (via effects.js import),
 * sets up the audio overlay (via overlay.js import), initializes the
 * pad grid and input handlers, and connects the volume slider.
 */

// Side effect: wires warmPad -> Volume(-6dB) -> Destination
import { masterVolume } from './engine/effects.js';

// Side effect: sets up overlay click handler and initial state
import './ui/overlay.js';

// Pad grid DOM generation
import { initPadGrid } from './ui/pad-grid.js';

// Input handlers
import { initKeyboard } from './input/keyboard.js';
import { initTouch } from './input/touch.js';
import { initMIDI } from './input/midi.js';

// Initialize pad grid and input
const instrumentEl = document.getElementById('instrument');
const padGrid = initPadGrid(instrumentEl);
initKeyboard();
initTouch(padGrid);
initMIDI(); // fire-and-forget — gracefully no-ops on unsupported browsers

// Wire volume slider to masterVolume ramp
const volumeSlider = document.getElementById('volume-slider');
if (volumeSlider) {
  volumeSlider.addEventListener('input', (e) => {
    masterVolume.volume.rampTo(Number(e.target.value), 0.05);
  });
}

// Help panel toggle
const helpBtn = document.getElementById('help-btn');
const helpPanel = document.getElementById('help-panel');
if (helpBtn && helpPanel) {
  helpBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    helpPanel.hidden = !helpPanel.hidden;
  });

  // Close help panel on click outside
  document.addEventListener('click', (e) => {
    if (!helpPanel.hidden && !helpPanel.contains(e.target) && e.target !== helpBtn) {
      helpPanel.hidden = true;
    }
  });
}

console.log('Tydal ready');
