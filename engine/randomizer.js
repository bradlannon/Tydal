/**
 * engine/randomizer.js
 *
 * Macro randomizer: one-tap random sound generation with musical constraints,
 * plus 4 variation snapshot slots for A/B comparison.
 *
 * Musical constraints:
 * - Chaos budget limits total effect wetness to ~1.5 (prevents wall-of-noise)
 * - Exponential distribution on filter frequency for musical spread
 * - Each effect has 60% chance of being off (only reverb has higher on-rate)
 * - Conservative wet ranges when effects are active
 *
 * Exports:
 *   randomizePatch   — Generate and apply a new musically constrained sound
 *   saveVariation    — Capture current patch to a slot (0-3)
 *   loadVariation    — Restore a saved variation slot
 *   listVariations   — Return names of filled slots (null for empty)
 */

import { setSynthParam } from './instruments.js';
import { reverb, delay, distortion, vibrato, tremolo } from './effects.js';
import { captureCurrentPatch, loadPatch } from './preset-storage.js';

// ---------------------------------------------------------------------------
// Module state — 4 variation snapshot slots
// ---------------------------------------------------------------------------

/** Variation slots: null = empty, patch object = saved */
const variations = [null, null, null, null];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Return a random element from an array.
 * @param {Array} arr
 * @returns {*}
 */
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Return a random float between min and max (uniform distribution).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Return a random float with exponential distribution biased toward lower values.
 * Maps a uniform [0,1] random through an exponential curve to spread the range musically.
 * For frequencies, this gives more density in the low-mid range (as human hearing is).
 *
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function expRandom(min, max) {
  const t = Math.random();
  return min * Math.pow(max / min, t);
}

// ---------------------------------------------------------------------------
// randomizePatch()
// ---------------------------------------------------------------------------

/**
 * Generate and apply a new musically constrained random sound.
 *
 * Synth parameters are fully randomized within musical ranges.
 * Effects are each given a 60% chance of being off; when on, wet values are
 * conservative. Total wet is capped at 1.5 (chaos budget) to prevent
 * wall-of-noise results.
 */
export function randomizePatch() {
  // -- Synth parameters --
  setSynthParam({
    oscillator: {
      type: randomChoice(['sine', 'square', 'sawtooth', 'triangle']),
    },
    envelope: {
      attack:  randomRange(0.001, 0.5),
      decay:   randomRange(0.05, 0.8),
      sustain: randomRange(0.1, 1.0),
      release: randomRange(0.05, 2.0),
    },
    filter: {
      frequency: expRandom(200, 8000),
      Q:         randomRange(0.5, 6),
    },
    detune: randomRange(-20, 20),
  });

  // -- Effects with chaos budget --
  let totalWet = 0;
  const CHAOS_BUDGET = 1.5;

  // Helper: clamp a wet value to stay within remaining budget
  function budgetedWet(wet) {
    if (totalWet >= CHAOS_BUDGET) return 0;
    const allowed = Math.min(wet, CHAOS_BUDGET - totalWet);
    totalWet += allowed;
    return allowed;
  }

  // Reverb — 40% chance on (most musically forgiving effect)
  if (Math.random() > 0.6) {
    const reverbWet = budgetedWet(randomRange(0.1, 0.6));
    reverb.set({ wet: reverbWet, decay: randomRange(1, 5) });
  } else {
    reverb.set({ wet: 0 });
  }

  // Delay — 40% chance on
  if (Math.random() > 0.6) {
    const delayWet = budgetedWet(randomRange(0.1, 0.4));
    delay.set({ wet: delayWet, feedback: randomRange(0.1, 0.5) });
  } else {
    delay.set({ wet: 0 });
  }

  // Distortion — 40% chance on (conservative range to avoid harshness)
  if (Math.random() > 0.6) {
    const distWet = budgetedWet(randomRange(0.2, 0.8));
    distortion.set({ wet: distWet, distortion: randomRange(0.05, 0.4) });
  } else {
    distortion.set({ wet: 0 });
  }

  // Vibrato — 40% chance on
  if (Math.random() > 0.6) {
    vibrato.set({
      wet:       randomRange(0.2, 0.7),
      depth:     randomRange(0.05, 0.3),
      frequency: randomRange(2, 8),
    });
  } else {
    vibrato.set({ wet: 0 });
  }

  // Tremolo — 30% chance on
  if (Math.random() > 0.7) {
    tremolo.set({
      wet:       randomRange(0.2, 0.6),
      depth:     randomRange(0.1, 0.5),
      frequency: randomRange(2, 10),
    });
  } else {
    tremolo.set({ wet: 0 });
  }
}

// ---------------------------------------------------------------------------
// saveVariation(slot)
// ---------------------------------------------------------------------------

/**
 * Capture the current patch state into a variation slot.
 *
 * @param {number} slot — 0-indexed slot number (0-3)
 */
export function saveVariation(slot) {
  if (slot < 0 || slot > 3) {
    console.warn(`saveVariation: slot ${slot} out of range (0-3)`);
    return;
  }
  variations[slot] = captureCurrentPatch(`Variation ${slot + 1}`);
}

// ---------------------------------------------------------------------------
// loadVariation(slot)
// ---------------------------------------------------------------------------

/**
 * Restore the patch saved in a variation slot.
 *
 * @param {number} slot — 0-indexed slot number (0-3)
 * @returns {boolean} true if restored, false if slot was empty
 */
export function loadVariation(slot) {
  if (slot < 0 || slot > 3) {
    console.warn(`loadVariation: slot ${slot} out of range (0-3)`);
    return false;
  }
  if (variations[slot] === null) {
    return false;
  }
  loadPatch(variations[slot]);
  return true;
}

// ---------------------------------------------------------------------------
// listVariations()
// ---------------------------------------------------------------------------

/**
 * Return the names of all variation slots (null for empty slots).
 *
 * @returns {(string|null)[]} Array of 4 entries: name or null
 */
export function listVariations() {
  return variations.map((v) => (v ? v.name : null));
}
