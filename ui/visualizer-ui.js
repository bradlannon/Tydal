/**
 * ui/visualizer-ui.js
 *
 * Canvas-based real-time audio visualizer.
 *
 * Modes:
 *   SPECTRUM  — frequency bars with rainbow HSL gradient (bass=red, treble=purple)
 *   WAVEFORM  — oscilloscope line with pitch-responsive HSL color
 *
 * Extras:
 *   Transient glow: white flash overlay that decays over ~150ms when a drum hit is detected
 *   Mode toggle button: switches between spectrum and waveform
 *
 * Usage:
 *   import { initVisualizer } from './ui/visualizer-ui.js';
 *   initVisualizer(document.getElementById('visualizer'));
 */

import { initAnalyser, getFrequencyData, getTimeDomainData, detectTransient } from '../engine/visualizer.js';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

/** @type {'spectrum' | 'waveform'} */
let mode = 'spectrum';

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
  // Check amplitude — if signal is too quiet, return null (no note playing)
  let maxAmp = 0;
  for (let i = 0; i < data.length; i++) {
    const s = Math.abs(data[i] - 128);
    if (s > maxAmp) maxAmp = s;
  }
  if (maxAmp < 8) return null; // silence threshold

  // Count zero crossings (sign changes)
  let crossings = 0;
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1] - 128;
    const curr = data[i] - 128;
    if ((prev < 0 && curr >= 0) || (prev >= 0 && curr < 0)) {
      crossings++;
    }
  }

  // ZCR-based frequency estimate: f = (crossings / 2) / (N / sampleRate)
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
  if (freq === null) return 180; // teal (≈ #00FFCC) when silent

  const minFreq = 65;   // C2
  const maxFreq = 1046; // C6
  const clampedFreq = Math.max(minFreq, Math.min(maxFreq, freq));
  const t = (Math.log(clampedFreq) - Math.log(minFreq)) / (Math.log(maxFreq) - Math.log(minFreq));
  return Math.round(t * 300);
}

// ---------------------------------------------------------------------------
// Render loop helpers
// ---------------------------------------------------------------------------

/**
 * Draw spectrum (frequency bars) mode.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 */
function drawSpectrum(ctx, width, height) {
  const data = getFrequencyData();
  if (!data.length) return;

  const barCount = Math.min(data.length, 128); // use first 128 bins for readable display
  const barWidth = width / barCount;

  for (let i = 0; i < barCount; i++) {
    const value = data[i]; // 0–255
    const barHeight = (value / 255) * height;
    const hue = Math.round((i / barCount) * 300);
    const lightness = 45 + (value / 255) * 25; // 45–70% — brighter when louder

    ctx.fillStyle = `hsl(${hue}, 90%, ${lightness}%)`;
    ctx.fillRect(
      i * barWidth,
      height - barHeight,
      Math.max(1, barWidth - 1),
      barHeight
    );
  }
}

/**
 * Draw waveform (oscilloscope) mode with pitch-based color.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {number} sampleRate
 */
function drawWaveform(ctx, width, height, sampleRate) {
  const data = getTimeDomainData();
  if (!data.length) return;

  const freq = estimatePitch(data, sampleRate);
  const hue = freqToHue(freq);
  const color = freq !== null
    ? `hsl(${hue}, 90%, 60%)`
    : '#00FFCC'; // teal when silent

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  const sliceWidth = width / data.length;
  let x = 0;

  for (let i = 0; i < data.length; i++) {
    const v = data[i] / 128; // normalize to 0–2
    const y = (v / 2) * height; // map to canvas height

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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * initVisualizer(containerEl)
 *
 * Creates the canvas and mode toggle button inside containerEl,
 * initialises the analyser, and starts the render loop.
 *
 * @param {HTMLElement} containerEl
 */
export function initVisualizer(containerEl) {
  if (!containerEl) return;

  // Mode toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = 'Spectrum';
  toggleBtn.className = 'visualizer-toggle';
  toggleBtn.setAttribute('aria-label', 'Toggle visualizer mode');
  toggleBtn.addEventListener('click', () => {
    mode = mode === 'spectrum' ? 'waveform' : 'spectrum';
    toggleBtn.textContent = mode === 'spectrum' ? 'Spectrum' : 'Waveform';
  });
  containerEl.appendChild(toggleBtn);

  // Canvas
  const canvas = document.createElement('canvas');
  canvas.className = 'visualizer-canvas';
  canvas.height = 120;
  containerEl.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // Initialize audio analyser
  initAnalyser();

  // Sample rate for pitch estimation (AudioContext sampleRate)
  let sampleRate = 44100;
  try {
    const rawCtx = /** @type {any} */ (window.Tone || {});
    // Attempt to get real sampleRate from Tone context
    sampleRate = (window._toneContext && window._toneContext.sampleRate) || 44100;
  } catch (_) { /* use default */ }

  // Resize canvas to match container width
  function resize() {
    canvas.width = containerEl.clientWidth || 300;
  }
  resize();
  window.addEventListener('resize', resize);

  // Render loop
  function render() {
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Transient glow — white overlay that decays
    if (detectTransient()) {
      transientGlow = Math.min(1, transientGlow + 0.6); // snap up
    } else {
      transientGlow = Math.max(0, transientGlow - 0.05); // decay per frame
    }

    if (transientGlow > 0.01) {
      ctx.save();
      ctx.globalAlpha = transientGlow * 0.35; // max 35% white overlay
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // Draw visualization
    if (mode === 'spectrum') {
      drawSpectrum(ctx, width, height);
    } else {
      drawWaveform(ctx, width, height, sampleRate);
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
