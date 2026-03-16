/**
 * input/gyroscope.js
 *
 * Gyroscope/tilt input module for SoundForge.
 *
 * Reads DeviceOrientation events (gamma = left/right tilt, beta = forward/backward tilt)
 * and maps them to audio parameters:
 *   - gamma [-45..+45] → filterFX.frequency [200..8000 Hz] (exponential mapping)
 *   - beta  [-30..+30] → activeSynth detune [-200..+200 cents]
 *
 * Jitter smoothing: EMA with alpha=0.15 eliminates zipper noise while keeping
 * response time under 100ms.
 *
 * iOS 13+ requires explicit DeviceOrientationEvent.requestPermission() before
 * orientation events fire. requestPermission() handles this gate.
 */

import { filterFX } from '../engine/effects.js';
import { getActiveSynth } from '../engine/instruments.js';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let _active = false;
let _hasPermission = false;

/** EMA-smoothed tilt values */
let smoothedBeta = 0;
let smoothedGamma = 0;

/** EMA smoothing factor — 0.15 is responsive but jitter-free */
const ALPHA = 0.15;

/** Whether the deviceorientation listener has been attached */
let _listenerAttached = false;

// ---------------------------------------------------------------------------
// Default parameter values (restored on disable)
// ---------------------------------------------------------------------------

const DEFAULT_FILTER_FREQ = 4000;
const DEFAULT_DETUNE = 0;

// ---------------------------------------------------------------------------
// Orientation event handler
// ---------------------------------------------------------------------------

function onDeviceOrientation(event) {
  if (!_active) return;

  // Raw tilt angles (degrees)
  const rawBeta = event.beta ?? 0;   // forward/backward: -180..180
  const rawGamma = event.gamma ?? 0; // left/right: -90..90

  // Clamp to musical range
  const clampedGamma = Math.max(-45, Math.min(45, rawGamma));
  const clampedBeta = Math.max(-30, Math.min(30, rawBeta));

  // EMA jitter smoothing
  smoothedGamma = ALPHA * clampedGamma + (1 - ALPHA) * smoothedGamma;
  smoothedBeta = ALPHA * clampedBeta + (1 - ALPHA) * smoothedBeta;

  // --- Gamma -> Filter cutoff (UX-01) ---
  // Map [-45..+45] to [200..8000 Hz] using exponential curve.
  // At gamma=0 (flat): freq ≈ 1265 Hz (mid-range, musical default).
  // Full left (-45) → 200 Hz, Full right (+45) → 8000 Hz.
  const normalizedGamma = (smoothedGamma + 45) / 90; // 0..1
  const freq = 200 * Math.pow(40, normalizedGamma);
  filterFX.frequency.rampTo(freq, 0.05);

  // --- Beta -> Pitch bend in cents (UX-01) ---
  // Map [-30..+30] to [-200..+200 cents].
  // Forward tilt (positive beta) = pitch up (+200 cents = 2 semitones).
  const cents = (smoothedBeta / 30) * 200;
  const synth = getActiveSynth();
  if (synth) {
    synth.set({ detune: cents });
  }
}

// ---------------------------------------------------------------------------
// iOS permission (UX-02)
// ---------------------------------------------------------------------------

/**
 * Request DeviceOrientation permission (required on iOS 13+).
 *
 * On iOS: shows native permission dialog; resolves to true if granted.
 * On Android/desktop: permission is implicit; resolves to true immediately.
 *
 * @returns {Promise<boolean>} true if permission granted, false if denied
 */
export async function requestPermission() {
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS 13+ — must be called from a user gesture
    try {
      const result = await DeviceOrientationEvent.requestPermission();
      _hasPermission = result === 'granted';
    } catch (_err) {
      _hasPermission = false;
    }
  } else {
    // Android / desktop — implicit permission
    _hasPermission = true;
  }
  return _hasPermission;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Attach the deviceorientation event listener.
 * Only attaches if permission has been granted and gyro is active.
 * Safe to call multiple times — listener is attached at most once.
 */
export function initGyroscope() {
  if (_listenerAttached) return;
  if (!_hasPermission) return;

  window.addEventListener('deviceorientation', onDeviceOrientation, true);
  _listenerAttached = true;
}

/**
 * Enable or disable gyroscope control.
 * When disabled, resets detune and filter frequency to defaults.
 *
 * @param {boolean} enabled
 */
export function setGyroActive(enabled) {
  _active = enabled;

  if (!enabled) {
    // Reset audio parameters to defaults
    filterFX.frequency.rampTo(DEFAULT_FILTER_FREQ, 0.1);
    const synth = getActiveSynth();
    if (synth) {
      synth.set({ detune: DEFAULT_DETUNE });
    }
    // Reset smoothed values so re-enable starts from neutral
    smoothedBeta = 0;
    smoothedGamma = 0;
  }
}

/**
 * @returns {boolean} whether gyroscope control is currently active
 */
export function isGyroActive() {
  return _active;
}
