/**
 * app.js — Tydal bootstrap
 *
 * Module entry point. Wires the signal chain (via effects.js import),
 * sets up the audio overlay (via overlay.js import), initializes the
 * pad grid and input handlers, and connects the volume slider.
 */

// Side effect: wires warmPad -> Volume(-6dB) -> Destination
import { masterVolume } from './engine/effects.js';

// Preset persistence and URL sharing
import { patchFromURL, loadPatch } from './engine/preset-storage.js';

// Side effect: sets up overlay click handler and initial state
import './ui/overlay.js';

// Pad grid DOM generation
import { initPadGrid } from './ui/pad-grid.js';

// Synth and effects control panels
import { initSynthPanel } from './ui/synth-panel.js';
import { initFXPanel } from './ui/fx-panel.js';
import { initSequencerUI } from './ui/sequencer-ui.js';
import { initVisualizer } from './ui/visualizer-ui.js';

// Input handlers
import { initKeyboard } from './input/keyboard.js';
import { initTouch } from './input/touch.js';
import { initMIDI } from './input/midi.js';

// Gyroscope panel
import { initGyroPanel } from './ui/gyro-panel.js';

// Initialize pad grid and input
const instrumentEl = document.getElementById('instrument');
const padGrid = initPadGrid(instrumentEl);
initKeyboard();
initTouch(padGrid);
initMIDI(); // fire-and-forget — gracefully no-ops on unsupported browsers

// Initialize synth and FX control panels
initSynthPanel(document.getElementById('synth-panel'));
initFXPanel(document.getElementById('fx-panel'));
initSequencerUI(document.getElementById('sequencer'));
initVisualizer(document.getElementById('visualizer'));
initGyroPanel(document.getElementById('gyro-panel'));

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

// Restore shared patch from URL hash (e.g. #patch=<base64>)
// Run after all panel inits so loadPatch has a fully wired audio chain.
const urlPatch = patchFromURL();
if (urlPatch) {
  loadPatch(urlPatch);
}

console.log('Tydal ready');
