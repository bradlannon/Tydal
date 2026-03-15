/**
 * engine/effects.js
 *
 * Full effects bus for the subtractive synth.
 *
 * Signal chain (AUDIO-02, SYNTH-02):
 *   Instrument → reverb → delay → distortion → filterFX → channel → masterVolume → Destination
 *
 * Default state: only reverb is audible (wet:0.3).
 * Delay and distortion start at wet:0 so the first load isn't overwhelming.
 *
 * connectInstrument / disconnectInstrument replace the old hard-wired
 * warmPad.connect() so any synth can be hot-swapped into the chain.
 */

import * as Tone from 'tone';

// ---------------------------------------------------------------------------
// Effects nodes
// ---------------------------------------------------------------------------

/** Reverb — adds space; audible by default (wet:0.3, decay:2.5s) */
export const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 });

/** Delay — rhythmic echo; starts silent (wet:0) */
export const delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.35, wet: 0 });

/** Distortion — harmonic saturation; starts silent (wet:0) */
export const distortion = new Tone.Distortion({ distortion: 0.3, wet: 0 });

/** Filter effect — master tone shaping */
export const filterFX = new Tone.Filter({ frequency: 4000, type: 'lowpass', Q: 1 });

/** Channel — per-channel volume and pan */
export const channel = new Tone.Channel({ volume: 0, pan: 0 });

/** masterVolume — master output level, -6dB default headroom */
export const masterVolume = new Tone.Volume(-6).toDestination();

// ---------------------------------------------------------------------------
// Wire the chain: reverb → delay → distortion → filterFX → channel → masterVolume → Destination
// ---------------------------------------------------------------------------
reverb.connect(delay);
delay.connect(distortion);
distortion.connect(filterFX);
filterFX.connect(channel);
channel.connect(masterVolume);

// ---------------------------------------------------------------------------
// effectsReady — resolves once the convolution reverb IR is generated.
// Consumers that need the chain fully warmed up can await this.
// ---------------------------------------------------------------------------
export const effectsReady = reverb.ready;

// ---------------------------------------------------------------------------
// Instrument routing helpers
// ---------------------------------------------------------------------------

/**
 * Connect a synth into the effects chain (into the reverb input).
 * @param {Tone.PolySynth | Tone.Synth} synth
 */
export function connectInstrument(synth) {
  synth.connect(reverb);
}

/**
 * Disconnect a synth from all outputs (used before hot-swapping).
 * @param {Tone.PolySynth | Tone.Synth} synth
 */
export function disconnectInstrument(synth) {
  synth.disconnect();
}
