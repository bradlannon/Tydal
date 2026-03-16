/**
 * ui/visualizer-ui.js
 *
 * Canvas-based real-time audio visualizer — waveform overlay on the pad grid.
 *
 * Pitch-responsive HSL color (low notes=warm, high=cool).
 * Transient glow: white flash overlay that decays over ~150ms on drum hits.
 *
 * Usage:
 *   import { initVisualizer } from './ui/visualizer-ui.js';
 *   initVisualizer(document.getElementById('visualizer'));
 */

import { initAnalyser, getTimeDomainData, detectTransient } from '../engine/visualizer.js';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

/** Transient glow intensity (0.0 = none, 1.0 = full white) */
let transientGlow = 0;

// ---------------------------------------------------------------------------
// Pitch estimation via zero-crossing rate
// ---------------------------------------------------------------------------

/**
 * Estimate fundamental frequency from time-domain data using zero-crossing rate.
 * @param {Uint8Array} data
 * @param {number} sampleRate
 * @returns {number | null} frequency in Hz, or null if signal too quiet
 */
function estimatePitch(data, sampleRate) {
  let maxAmp = 0;
  for (let i = 0; i < data.length; i++) {
    const s = Math.abs(data[i] - 128);
    if (s > maxAmp) maxAmp = s;
  }
  if (maxAmp < 8) return null;

  let crossings = 0;
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1] - 128;
    const curr = data[i] - 128;
    if ((prev < 0 && curr >= 0) || (prev >= 0 && curr < 0)) {
      crossings++;
    }
  }

  const durationSec = data.length / sampleRate;
  const freq = (crossings / 2) / durationSec;
  return freq;
}

/**
 * Map a frequency in Hz to an HSL hue (0–300).
 * C2 (65 Hz) → 0 (red), C6 (1046 Hz) → 300 (purple).
 * @param {number | null} freq
 * @returns {number} hue 0–300
 */
function freqToHue(freq) {
  if (freq === null) return 180;

  const minFreq = 65;
  const maxFreq = 1046;
  const clampedFreq = Math.max(minFreq, Math.min(maxFreq, freq));
  const t = (Math.log(clampedFreq) - Math.log(minFreq)) / (Math.log(maxFreq) - Math.log(minFreq));
  return Math.round(t * 300);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * initVisualizer(containerEl)
 *
 * Creates a canvas overlay inside containerEl and starts the waveform render loop.
 *
 * @param {HTMLElement} containerEl
 */
export function initVisualizer(containerEl) {
  if (!containerEl) return;

  // Canvas
  const canvas = document.createElement('canvas');
  canvas.className = 'visualizer-canvas';
  containerEl.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // Initialize audio analyser
  initAnalyser();

  // Sample rate for pitch estimation
  let sampleRate = 44100;
  try {
    sampleRate = (window._toneContext && window._toneContext.sampleRate) || 44100;
  } catch (_) { /* use default */ }

  // Resize canvas to match container
  function resize() {
    canvas.width = containerEl.clientWidth || 300;
    canvas.height = containerEl.clientHeight || 200;
  }
  resize();
  window.addEventListener('resize', resize);

  // Render loop
  function render() {
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Transient glow
    if (detectTransient()) {
      transientGlow = Math.min(1, transientGlow + 0.6);
    } else {
      transientGlow = Math.max(0, transientGlow - 0.05);
    }

    if (transientGlow > 0.01) {
      ctx.save();
      ctx.globalAlpha = transientGlow * 0.35;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // Draw waveform
    const data = getTimeDomainData();
    if (data.length) {
      const freq = estimatePitch(data, sampleRate);
      const hue = freqToHue(freq);
      const color = freq !== null
        ? `hsl(${hue}, 90%, 60%)`
        : '#00FFCC';

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      const sliceWidth = width / data.length;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128;
        const y = (v / 2) * height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
