/**
 * engine/instruments.js
 *
 * Full subtractive synthesizer with selectable waveforms, ADSR envelope,
 * filter with cutoff/resonance, velocity-aware note triggering, and voice stealing.
 *
 * Signal chain: subtractiveSynth → effects chain (see engine/effects.js)
 *
 * Exports noteOn/noteOff for triggering notes (backward-compatible with
 * keyboard.js and touch.js callers that do not pass velocity).
 */

import * as Tone from 'tone';
import { connectInstrument, disconnectInstrument } from './effects.js';
import { getActiveTrack } from './track-manager.js';
import { trackNoteOn, trackNoteOff, stealOldestIfFull, clearAll, getActiveNotes } from './voice-tracker.js';
import { isRecording, recordNote } from './recorder.js';

// ---------------------------------------------------------------------------
// Subtractive synthesizer definition
// ---------------------------------------------------------------------------

/**
 * subtractiveSynth — 8-voice PolySynth with:
 *   - Sawtooth oscillator (warm, harmonically rich)
 *   - ADSR envelope with smooth 0.4s release (anti-click)
 *   - Lowpass filter at 2800Hz (-12dB/oct) for warmth
 *   - Filter envelope sweeps from 200Hz up +3.5 octaves
 *
 * These parameters match the Phase 1 instrument for identical initial character.
 */
const subtractiveSynth = new Tone.PolySynth(Tone.Synth, {
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
      release: 0.4,        // anti-click fade on note-off
    },
    filter: {
      type: 'lowpass',
      frequency: 2800,
      Q: 1,
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

// ---------------------------------------------------------------------------
// Active synth (mutable — preset switching in Plan 04 will swap this)
// ---------------------------------------------------------------------------

/** Currently active synth. Preset switching will reassign this via switchInstrument(). */
export let activeSynth = subtractiveSynth;

// Wire initial synth into effects chain
connectInstrument(activeSynth);

// ---------------------------------------------------------------------------
// Note triggering — public API
// ---------------------------------------------------------------------------

/**
 * Trigger note attack with optional velocity.
 * Performs voice stealing if 8 voices are already active.
 *
 * Backward-compatible: callers that omit velocity (keyboard.js, touch.js) get 0.8.
 *
 * @param {string} note — e.g. 'C4', 'F#3'
 * @param {number} [velocity=0.8] — 0..1 loudness
 */
export function noteOn(note, velocity = 0.8) {
  // Use active track's synth if a melodic track is active
  const activeTrack = getActiveTrack();
  const synth = (activeTrack && activeTrack.type === 'melodic') ? activeTrack.synth : activeSynth;

  // Voice steal: release oldest note if at polyphony limit
  const stolenNote = stealOldestIfFull();
  if (stolenNote !== null) {
    synth.triggerRelease(stolenNote, Tone.now());
  }

  trackNoteOn(note);
  synth.triggerAttack(note, Tone.now(), velocity);

  // Capture note into active recording pass (all sources: keyboard, touch, MIDI)
  if (isRecording()) {
    recordNote(note, velocity, '8n');
  }
}

/**
 * Trigger note release.
 * @param {string} note — e.g. 'C4', 'F#3'
 */
export function noteOff(note) {
  const activeTrack = getActiveTrack();
  const synth = (activeTrack && activeTrack.type === 'melodic') ? activeTrack.synth : activeSynth;
  trackNoteOff(note);
  synth.triggerRelease(note, Tone.now());
}

/**
 * Release all currently tracked notes and clear the tracker.
 * Used before hot-swapping instruments or resetting state.
 */
export function releaseAll() {
  const active = getActiveNotes();
  const activeTrack = getActiveTrack();
  const synth = (activeTrack && activeTrack.type === 'melodic') ? activeTrack.synth : activeSynth;
  for (const { note } of active) {
    synth.triggerRelease(note, Tone.now());
  }
  clearAll();
}

// ---------------------------------------------------------------------------
// Runtime parameter control
// ---------------------------------------------------------------------------

/**
 * Update synth parameters at runtime.
 * Accepts any object valid for Tone.PolySynth.set().
 *
 * Examples:
 *   setSynthParam({ oscillator: { type: 'square' } })
 *   setSynthParam({ envelope: { attack: 0.5 } })
 *   setSynthParam({ filter: { frequency: 1200 } })
 *
 * @param {object} paramObj
 */
export function setSynthParam(paramObj) {
  activeSynth.set(paramObj);
}

/**
 * Return a reference to the currently active synth.
 * Useful for direct parameter inspection or one-off Tone.js calls.
 * @returns {Tone.PolySynth}
 */
export function getActiveSynth() {
  const activeTrack = getActiveTrack();
  if (activeTrack && activeTrack.type === 'melodic') {
    return activeTrack.synth;
  }
  return activeSynth;
}

// ---------------------------------------------------------------------------
// Instrument hot-swap (used by preset system in Plan 04)
// ---------------------------------------------------------------------------

/**
 * Swap in a new synth:
 *   1. Release all notes on old synth
 *   2. Disconnect old synth from effects chain
 *   3. Connect new synth to effects chain
 *   4. Update activeSynth reference
 *
 * @param {Tone.PolySynth | Tone.Synth} newSynth
 */
export function switchInstrument(newSynth) {
  releaseAll();
  const activeTrack = getActiveTrack();
  if (activeTrack && activeTrack.type === 'melodic') {
    // Swap synth on the active track and reconnect to its effects chain
    disconnectInstrument(activeTrack.synth);
    activeTrack.synth = newSynth;
    newSynth.connect(activeTrack.effectsChain.input);
    // Keep activeSynth in sync for backward compatibility
    activeSynth = newSynth;
  } else {
    disconnectInstrument(activeSynth);
    activeSynth = newSynth;
    connectInstrument(activeSynth);
  }
}
