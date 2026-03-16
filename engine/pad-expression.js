/**
 * engine/pad-expression.js
 *
 * MPE-lite pad expression: tracks per-pointer X/Y position within pad bounds
 * and maps to pitch bend (detune) and filter cutoff in real time.
 *
 * X axis → detune  : center=0, left=-200 cents, right=+200 cents
 * Y axis → filter  : top=6000 Hz (high), bottom=200 Hz (low)
 *
 * EMA smoothing (alpha=0.3) prevents zipper noise from rapid finger movement.
 *
 * Exports:
 *   startExpression(pointerId, note, padRect)
 *   updateExpression(pointerId, clientX, clientY)
 *   stopExpression(pointerId)
 *   hasExpression(pointerId)
 */

import { setSynthParam } from './instruments.js';
import { filterFX } from './effects.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** EMA smoothing factor: 0.3 is responsive but eliminates zipper noise */
const EMA_ALPHA = 0.3;

/** Detune range in cents: ±200 cents = ~2 semitones */
const DETUNE_RANGE = 200; // ±200 from center

/** Filter frequency range in Hz */
const FILTER_MIN = 200;
const FILTER_MAX = 6000;

/** Default detune matches subtractiveSynth definition in instruments.js */
const DEFAULT_DETUNE = -8;

/** Default filter frequency matches filterFX in effects.js */
const DEFAULT_FILTER_FREQ = 4000;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/**
 * Active expression entries keyed by pointerId.
 * @type {Map<number, { note: string, padRect: DOMRect, smoothX: number, smoothY: number }>}
 */
const activeExpressions = new Map();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Begin expression tracking for a pointer touching a note pad.
 *
 * @param {number} pointerId — pointer event pointerId
 * @param {string} note      — note name e.g. 'C4'
 * @param {DOMRect} padRect  — bounding rect of the pad element
 */
export function startExpression(pointerId, note, padRect) {
  activeExpressions.set(pointerId, {
    note,
    padRect,
    smoothX: 0.5, // start at center (no bend)
    smoothY: 0.5, // start at center
  });
}

/**
 * Update expression from pointer movement while finger is held on pad.
 * Applies EMA smoothing and maps X→detune, Y→filter.
 *
 * @param {number} pointerId — pointer event pointerId
 * @param {number} clientX   — pointer X in viewport coordinates
 * @param {number} clientY   — pointer Y in viewport coordinates
 */
export function updateExpression(pointerId, clientX, clientY) {
  const entry = activeExpressions.get(pointerId);
  if (!entry) return;

  const { padRect } = entry;

  // Normalize position to 0–1 within pad bounds (clamped)
  const rawX = Math.max(0, Math.min(1, (clientX - padRect.left) / padRect.width));
  const rawY = Math.max(0, Math.min(1, (clientY - padRect.top) / padRect.height));

  // Apply EMA smoothing
  entry.smoothX = EMA_ALPHA * rawX + (1 - EMA_ALPHA) * entry.smoothX;
  entry.smoothY = EMA_ALPHA * rawY + (1 - EMA_ALPHA) * entry.smoothY;

  // X → detune: center=0, left=-200, right=+200 cents
  const detune = (entry.smoothX - 0.5) * (DETUNE_RANGE * 2);
  setSynthParam({ detune });

  // Y → filter: top=high freq (Y=0), bottom=low freq (Y=1)
  const filterFreq = FILTER_MIN + (1 - entry.smoothY) * (FILTER_MAX - FILTER_MIN);
  filterFX.frequency.rampTo(filterFreq, 0.05);
}

/**
 * End expression tracking for a pointer, resetting detune and filter to defaults.
 *
 * @param {number} pointerId — pointer event pointerId
 */
export function stopExpression(pointerId) {
  if (!activeExpressions.has(pointerId)) return;

  activeExpressions.delete(pointerId);

  // Reset pitch and filter to defaults
  setSynthParam({ detune: DEFAULT_DETUNE });
  filterFX.frequency.rampTo(DEFAULT_FILTER_FREQ, 0.1);
}

/**
 * Check whether a pointer currently has active expression tracking.
 *
 * @param {number} pointerId
 * @returns {boolean}
 */
export function hasExpression(pointerId) {
  return activeExpressions.has(pointerId);
}
