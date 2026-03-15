/**
 * app.js — Tydal bootstrap
 *
 * Module entry point. Wires the signal chain (via effects.js import),
 * sets up the audio overlay (via overlay.js import), and connects
 * the volume slider to the master volume node.
 *
 * NOTE: Input handlers (keyboard.js, touch.js) and pad grid rendering
 * are NOT imported here yet — Plan 02 adds those.
 */

// Side effect: wires warmPad -> Volume(-6dB) -> Destination
import { masterVolume } from './engine/effects.js';

// Side effect: sets up overlay click handler and initial state
import './ui/overlay.js';

// Wire volume slider to masterVolume ramp
const volumeSlider = document.getElementById('volume-slider');
if (volumeSlider) {
  volumeSlider.addEventListener('input', (e) => {
    masterVolume.volume.rampTo(Number(e.target.value), 0.05);
  });
}

console.log('Tydal ready');
