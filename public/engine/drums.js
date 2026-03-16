/**
 * engine/drums.js
 *
 * 808/909-style drum synthesis engine with four pre-allocated voices.
 *
 * DRUM-05 compliance: All Tone.* nodes are constructed at module top level.
 * No `new Tone.*` calls appear inside any trigger or callback function.
 *
 * Signal routing: all voices → drumBus → masterVolume (bypasses melodic effects chain)
 *
 * Exports:
 *   triggerKick(time)     — deep sub-bass thump with pitch sweep + saturation
 *   triggerSnare(time)    — noisy rattle (NoiseSynth) + tonal body (Synth)
 *   triggerHihat(type, time) — 'closed' or 'open'; closed chokes open
 *   triggerClap(time)     — 4-burst stagger with reverb tail
 *   drumBus               — Tone.Channel for future per-drum mixing
 */

import * as Tone from 'tone';
import { masterVolume } from './effects.js';

// ---------------------------------------------------------------------------
// Drum bus — routes all drum voices to masterVolume, bypassing melodic chain
// ---------------------------------------------------------------------------

/** drumBus: dedicated channel at 0 dB for all drum voices */
export const drumBus = new Tone.Channel({ volume: 0, pan: 0 });
drumBus.connect(masterVolume);

// ---------------------------------------------------------------------------
// KICK — DRUM-01
// MembraneSynth: deep sub-bass pitch sweep + slight distortion saturation
// ---------------------------------------------------------------------------

const kick = new Tone.MembraneSynth({
  pitchDecay: 0.08,
  octaves: 6,
  envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 },
});

const kickDist = new Tone.Distortion({ distortion: 0.4, wet: 0.3 });

// Route: kick → kickDist → drumBus
kick.connect(kickDist);
kickDist.connect(drumBus);

/**
 * Trigger the kick drum.
 * @param {Tone.Unit.Time} time — Tone audio-thread time
 */
export function triggerKick(time) {
  kick.triggerAttack('C1', time);
}

// ---------------------------------------------------------------------------
// SNARE — DRUM-02
// NoiseSynth (white noise rattle) + Synth (triangle tonal body)
// ---------------------------------------------------------------------------

const snareNoise = new Tone.NoiseSynth({
  noise: { type: 'white' },
  envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 },
});

const snareFilter = new Tone.Filter({ frequency: 1800, type: 'highpass' });

const snareTone = new Tone.Synth({
  oscillator: { type: 'triangle' },
  envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
});

// Route: snareNoise → snareFilter → drumBus; snareTone → drumBus
snareNoise.connect(snareFilter);
snareFilter.connect(drumBus);
snareTone.connect(drumBus);

/**
 * Trigger the snare drum (noise rattle + tonal body crack).
 * @param {Tone.Unit.Time} time
 */
export function triggerSnare(time) {
  snareNoise.triggerAttackRelease('16n', time);
  snareTone.triggerAttackRelease('E3', '16n', time);
}

// ---------------------------------------------------------------------------
// HI-HAT — DRUM-03
// Two MetalSynth instances: closed (short) + open (long); closed chokes open
// ---------------------------------------------------------------------------

const closedHat = new Tone.MetalSynth({
  frequency: 400,
  harmonicity: 5.1,
  modulationIndex: 32,
  resonance: 4000,
  octaves: 1.5,
  envelope: { attack: 0.001, decay: 0.07, release: 0.01 },
});

const openHat = new Tone.MetalSynth({
  frequency: 400,
  harmonicity: 5.1,
  modulationIndex: 32,
  resonance: 4000,
  octaves: 1.5,
  envelope: { attack: 0.001, decay: 0.5, release: 0.2 },
});

// Shared gain at -6 dB: MetalSynth produces high amplitude
const hatGain = new Tone.Gain(Tone.dbToGain(-6));

// Route: closedHat + openHat → hatGain → drumBus
closedHat.connect(hatGain);
openHat.connect(hatGain);
hatGain.connect(drumBus);

/**
 * Trigger the hi-hat.
 * Closed chokes open: releases the currently ringing hat before striking.
 * @param {'closed' | 'open'} type
 * @param {Tone.Unit.Time} time
 */
export function triggerHihat(type, time) {
  if (type === 'closed') {
    openHat.triggerRelease(time);
    closedHat.triggerAttack(time + 0.005);
  } else {
    closedHat.triggerRelease(time);
    openHat.triggerAttack(time + 0.005);
  }
}

// ---------------------------------------------------------------------------
// CLAP — DRUM-04
// NoiseSynth + bandpass filter + reverb; multi-burst for natural feel
// ---------------------------------------------------------------------------

const clap = new Tone.NoiseSynth({
  noise: { type: 'white' },
  envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.02 },
});

const clapFilter = new Tone.Filter({ frequency: 1200, type: 'bandpass', Q: 0.5 });

const clapReverb = new Tone.Reverb({ decay: 0.8, wet: 0.4 });

// Route: clap → clapFilter → clapReverb → drumBus
clap.connect(clapFilter);
clapFilter.connect(clapReverb);
clapReverb.connect(drumBus);

/**
 * Trigger the clap (4 staggered bursts for natural hand-slap texture).
 * Irregular spacing: 0ms, 8ms, 16ms, 28ms; last burst uses '64n' for shorter tail.
 * @param {Tone.Unit.Time} time
 */
export function triggerClap(time) {
  clap.triggerAttackRelease('32n', time);
  clap.triggerAttackRelease('32n', time + 0.008);
  clap.triggerAttackRelease('32n', time + 0.016);
  clap.triggerAttackRelease('64n', time + 0.028);
}
