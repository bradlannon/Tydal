/**
 * engine/presets.js
 *
 * Factory preset definitions for Tydal's synthesizer.
 * Includes both subtractive (Tone.Synth) and FM (Tone.FMSynth) voices.
 *
 * Exports:
 *   PRESETS         — Object mapping preset name → preset definition
 *   applyPreset     — Creates a new PolySynth from preset and hot-swaps into effects chain
 *   getPresetNames  — Returns array of preset name strings
 */

import * as Tone from 'tone';
import { switchInstrument, getActiveSynth } from './instruments.js';
import { connectInstrument } from './effects.js';

// ---------------------------------------------------------------------------
// Factory Presets
// ---------------------------------------------------------------------------

/**
 * PRESETS — 7 factory voices (3 subtractive, 3 FM, 1 pluck).
 *
 * type: 'subtractive' uses Tone.Synth (filter-envelope capable)
 * type: 'fm' uses Tone.FMSynth (carrier + modulator)
 */
export const PRESETS = {
  'Warm Pad': {
    type: 'subtractive',
    synth: Tone.Synth,
    params: {
      oscillator: { type: 'sawtooth' },
      detune: -8,
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.85, release: 0.4 },
      filter: { type: 'lowpass', frequency: 2800, Q: 1 },
      filterEnvelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.5,
        release: 0.8,
        baseFrequency: 200,
        octaves: 3.5,
      },
    },
  },

  'Bright Lead': {
    type: 'subtractive',
    synth: Tone.Synth,
    params: {
      oscillator: { type: 'square' },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0.7, release: 0.2 },
      filter: { type: 'lowpass', frequency: 5000, Q: 2 },
    },
  },

  'Sub Bass': {
    type: 'subtractive',
    synth: Tone.Synth,
    params: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.9, release: 0.15 },
      filter: { type: 'lowpass', frequency: 800, Q: 0.5 },
    },
  },

  'FM Piano': {
    type: 'fm',
    synth: Tone.FMSynth,
    params: {
      harmonicity: 3,
      modulationIndex: 10,
      oscillator: { type: 'sine' },
      modulation: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.8 },
      modulationEnvelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
    },
  },

  'FM Organ': {
    type: 'fm',
    synth: Tone.FMSynth,
    params: {
      harmonicity: 1,
      modulationIndex: 2,
      oscillator: { type: 'sine' },
      modulation: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.01, sustain: 1.0, release: 0.1 },
      modulationEnvelope: { attack: 0.01, decay: 0.01, sustain: 1.0, release: 0.1 },
    },
  },

  'FM E.Piano': {
    type: 'fm',
    synth: Tone.FMSynth,
    params: {
      harmonicity: 3.5,
      modulationIndex: 12,
      oscillator: { type: 'sine' },
      modulation: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.8, sustain: 0.1, release: 1.0 },
      modulationEnvelope: { attack: 0.005, decay: 0.5, sustain: 0.05, release: 0.5 },
    },
  },

  'Pluck': {
    type: 'subtractive',
    synth: Tone.Synth,
    params: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 },
      filter: { type: 'lowpass', frequency: 3000, Q: 3 },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0,
        release: 0.1,
        baseFrequency: 500,
        octaves: 4,
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * applyPreset(presetName)
 *
 * Creates a new 8-voice PolySynth using the named preset's voice type and
 * parameters, then hot-swaps it into the effects chain via switchInstrument().
 *
 * @param {string} presetName — Key in PRESETS
 * @returns {object} The preset definition (for UI state tracking)
 */
export function applyPreset(presetName) {
  const preset = PRESETS[presetName];
  if (!preset) {
    console.warn(`applyPreset: unknown preset "${presetName}"`);
    return null;
  }

  const newSynth = new Tone.PolySynth(preset.synth, {
    maxPolyphony: 8,
    options: preset.params,
  });

  switchInstrument(newSynth);
  return preset;
}

/**
 * getPresetNames()
 *
 * @returns {string[]} Array of preset names in definition order
 */
export function getPresetNames() {
  return Object.keys(PRESETS);
}
