/**
 * engine/macros.js
 *
 * Macro knob engine — 4 predefined macros that each control multiple
 * synthesis/effect parameters simultaneously via linear interpolation.
 *
 * Inspired by Push 3 macro controls: one slider morphs timbral character
 * dramatically without requiring parameter-by-parameter adjustment.
 *
 * Macros:
 *   Darkness — closes filter, adds reverb/delay (dark, atmospheric)
 *   Grit     — distortion amount + filter resonance (harsh, driven)
 *   Motion   — vibrato + tremolo depth (animated, trembling)
 *   Space    — reverb decay/wet + delay wet/feedback (expansive, echoing)
 */

import { reverb, delay, distortion, filterFX, vibrato, tremolo } from './effects.js';

// ---------------------------------------------------------------------------
// Macro definitions
// ---------------------------------------------------------------------------

/**
 * MACROS — 4 predefined macro mappings.
 *
 * Each entry: { name, params: [{ target, param, min, max }, ...] }
 * value 0 → min, value 1 → max (linear interpolation)
 */
export const MACROS = {
  Darkness: {
    name: 'Darkness',
    params: [
      { target: filterFX, param: 'frequency', min: 4000, max: 200 },
      { target: reverb,   param: 'wet',       min: 0,    max: 0.8  },
      { target: delay,    param: 'wet',        min: 0,    max: 0.5  },
    ],
  },
  Grit: {
    name: 'Grit',
    params: [
      { target: distortion, param: 'distortion', min: 0, max: 0.8 },
      { target: distortion, param: 'wet',         min: 0, max: 1   },
      { target: filterFX,   param: 'Q',           min: 1, max: 8   },
    ],
  },
  Motion: {
    name: 'Motion',
    params: [
      { target: vibrato, param: 'wet',   min: 0, max: 1   },
      { target: vibrato, param: 'depth', min: 0, max: 0.5 },
      { target: tremolo, param: 'wet',   min: 0, max: 1   },
      { target: tremolo, param: 'depth', min: 0, max: 0.6 },
    ],
  },
  Space: {
    name: 'Space',
    params: [
      { target: reverb, param: 'wet',      min: 0,   max: 0.9 },
      { target: reverb, param: 'decay',    min: 1,   max: 8   },
      { target: delay,  param: 'wet',      min: 0,   max: 0.6 },
      { target: delay,  param: 'feedback', min: 0.2, max: 0.7 },
    ],
  },
};

// ---------------------------------------------------------------------------
// State — current 0-1 value per macro
// ---------------------------------------------------------------------------

const macroValues = {
  Darkness: 0,
  Grit:     0,
  Motion:   0,
  Space:    0,
};

// ---------------------------------------------------------------------------
// applyMacro(name, value)
// ---------------------------------------------------------------------------

/**
 * Apply a macro slider value (0–1) to all its mapped parameters.
 *
 * Uses Tone's .set() for all params — Tone internally handles both Signal
 * targets (ramped) and plain properties (direct assignment).
 *
 * @param {string} name  - Macro name (Darkness | Grit | Motion | Space)
 * @param {number} value - Normalized 0–1 slider value
 */
export function applyMacro(name, value) {
  const macro = MACROS[name];
  if (!macro) {
    console.warn(`applyMacro: unknown macro "${name}"`);
    return;
  }

  for (const { target, param, min, max } of macro.params) {
    const interpolated = min + (max - min) * value;
    target.set({ [param]: interpolated });
  }

  macroValues[name] = value;
}

// ---------------------------------------------------------------------------
// getMacroValue(name)
// ---------------------------------------------------------------------------

/**
 * Get the current 0-1 value for a named macro.
 *
 * @param {string} name
 * @returns {number}
 */
export function getMacroValue(name) {
  return macroValues[name] ?? 0;
}
