/**
 * engine/visualizer.js
 *
 * Audio analysis engine for the real-time visualizer.
 *
 * Taps off masterVolume as a fan-out (does NOT insert into signal chain).
 * Uses the Web Audio API AnalyserNode directly via Tone.getContext().rawContext.
 *
 * Exports:
 *   initAnalyser()       — create and connect AnalyserNode; call after AudioContext started
 *   getFrequencyData()   — Uint8Array of FFT frequency bins
 *   getTimeDomainData()  — Uint8Array of time-domain waveform samples
 *   detectTransient()    — boolean; true when a drum hit / percussive transient is detected
 */

import * as Tone from 'tone';
import { masterVolume } from './effects.js';

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

/** @type {AnalyserNode | null} */
let analyserNode = null;

/** @type {Uint8Array | null} */
let freqData = null;

/** @type {Uint8Array | null} */
let timeData = null;

// Ring buffer for transient detection (rolling RMS energy)
const ENERGY_WINDOW = 10;
const energyHistory = new Float32Array(ENERGY_WINDOW);
let energyIndex = 0;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * initAnalyser()
 *
 * Creates a raw AnalyserNode with fftSize=2048, connects masterVolume to it
 * as a tap (fan-out) — does NOT break the existing signal chain.
 * Safe to call multiple times (idempotent after first call).
 */
export function initAnalyser() {
  if (analyserNode) return; // already initialized

  const rawCtx = Tone.getContext().rawContext;
  analyserNode = rawCtx.createAnalyser();
  analyserNode.fftSize = 2048;
  analyserNode.smoothingTimeConstant = 0.8;

  // Pre-allocate typed arrays
  freqData = new Uint8Array(analyserNode.frequencyBinCount);
  timeData = new Uint8Array(analyserNode.fftSize);

  // Tap off masterVolume — fan-out, not in series
  // Tone.js Volume inherits from ToneAudioNode; connect to the raw AnalyserNode
  masterVolume.connect(analyserNode);
}

/**
 * getFrequencyData()
 * @returns {Uint8Array} Current FFT frequency magnitude data (0–255 per bin)
 */
export function getFrequencyData() {
  if (!analyserNode || !freqData) return new Uint8Array(0);
  analyserNode.getByteFrequencyData(freqData);
  return freqData;
}

/**
 * getTimeDomainData()
 * @returns {Uint8Array} Current time-domain waveform data (0–255 per sample, 128=zero)
 */
export function getTimeDomainData() {
  if (!analyserNode || !timeData) return new Uint8Array(0);
  analyserNode.getByteTimeDomainData(timeData);
  return timeData;
}

/**
 * detectTransient()
 *
 * Compares current RMS energy against a rolling average over the last
 * ENERGY_WINDOW frames. Returns true when the current frame energy
 * exceeds the average by more than 1.8x (drum hit threshold).
 *
 * @returns {boolean}
 */
export function detectTransient() {
  if (!analyserNode || !timeData) return false;

  analyserNode.getByteTimeDomainData(timeData);

  // Compute RMS energy of current frame
  let sumSq = 0;
  for (let i = 0; i < timeData.length; i++) {
    const sample = (timeData[i] - 128) / 128; // normalize to -1..1
    sumSq += sample * sample;
  }
  const rms = Math.sqrt(sumSq / timeData.length);

  // Compute rolling average
  let avg = 0;
  for (let i = 0; i < ENERGY_WINDOW; i++) {
    avg += energyHistory[i];
  }
  avg /= ENERGY_WINDOW;

  // Store current rms in ring buffer
  energyHistory[energyIndex] = rms;
  energyIndex = (energyIndex + 1) % ENERGY_WINDOW;

  // Transient: current energy exceeds rolling average by >1.8x
  return avg > 0.001 && rms > avg * 1.8;
}
