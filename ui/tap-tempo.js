/**
 * ui/tap-tempo.js
 *
 * Tap tempo module — records tap timestamps, computes average inter-tap
 * interval, and applies the resulting BPM to the sequencer engine.
 *
 * Algorithm: sliding window of up to MAX_TAPS taps; resets after 2s silence.
 *
 * Exports:
 *   recordTap() — call on each tap event (pointerdown)
 */

import { setBPM } from '../engine/sequencer.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAP_TIMEOUT_MS = 2000;
const MIN_TAPS = 2;
const MAX_TAPS = 8;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let tapTimes = [];
let timeoutId = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Record a tap and update BPM once MIN_TAPS taps have been collected.
 * Resets tap history after TAP_TIMEOUT_MS of silence.
 */
export function recordTap() {
  const now = performance.now();

  // Reset stale sequence
  if (tapTimes.length > 0 && now - tapTimes[tapTimes.length - 1] > TAP_TIMEOUT_MS) {
    tapTimes = [];
  }

  tapTimes.push(now);

  // Keep sliding window capped at MAX_TAPS
  if (tapTimes.length > MAX_TAPS) {
    tapTimes.shift();
  }

  // Clear any pending reset timer and start a new one
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
  }
  timeoutId = setTimeout(() => {
    tapTimes = [];
    timeoutId = null;
  }, TAP_TIMEOUT_MS);

  // Need at least MIN_TAPS to compute a meaningful interval
  if (tapTimes.length < MIN_TAPS) {
    return;
  }

  // Average inter-tap interval across all recorded taps
  const intervals = [];
  for (let i = 1; i < tapTimes.length; i++) {
    intervals.push(tapTimes[i] - tapTimes[i - 1]);
  }
  const avgMs = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
  const bpm = Math.round(60000 / avgMs);

  setBPM(bpm);
}
