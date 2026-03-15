/**
 * engine/instruments.js
 *
 * Warm pad voice: PolySynth with sawtooth oscillator,
 * slight detuning, lowpass filter, and smooth ADSR.
 *
 * Exports noteOn/noteOff for triggering individual notes.
 * All timing via Tone.now() — zero setTimeout.
 */

import * as Tone from 'tone';

/**
 * warmPad — the primary instrument voice for Phase 1.
 *
 * Character: analog pad, warm and full-bodied, long sustain,
 * smooth release (0.4s) prevents click artifacts on note-off.
 *
 * maxPolyphony: 8 allows chord playing without voice exhaustion.
 */
export const warmPad = new Tone.PolySynth(Tone.Synth, {
  maxPolyphony: 8,
  options: {
    oscillator: {
      type: 'sawtooth',
    },
    detune: -8,
    envelope: {
      attack: 0.02,
      decay: 0.1,
      sustain: 0.85,
      release: 0.4,        // anti-click fade on note-off (AUDIO-06)
    },
    filter: {
      type: 'lowpass',
      frequency: 2800,
      rolloff: -12,
    },
    filterEnvelope: {
      attack: 0.05,
      decay: 0.2,
      sustain: 0.5,
      release: 0.8,
      baseFrequency: 200,
      octaves: 3.5,
    },
  },
});

/**
 * Trigger note attack using sample-accurate Tone.now() scheduling.
 * @param {string} note — e.g. 'C4', 'F#3'
 */
export function noteOn(note) {
  warmPad.triggerAttack(note, Tone.now());
}

/**
 * Trigger note release using sample-accurate Tone.now() scheduling.
 * @param {string} note — e.g. 'C4', 'F#3'
 */
export function noteOff(note) {
  warmPad.triggerRelease(note, Tone.now());
}

/**
 * Release all currently active voices immediately.
 * Called before grid rebuild to prevent stuck notes on octave shift.
 */
export function releaseAll() {
  warmPad.releaseAll(Tone.now());
}
