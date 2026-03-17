/**
 * engine/effects.js
 *
 * Full effects bus for the subtractive synth.
 *
 * Signal chain (AUDIO-02, SYNTH-02, SYNTH-04):
 *   Instrument → vibrato → tremolo → reverb → delay → distortion → filterFX → channel → masterVolume → Destination
 *
 * Default state: only reverb is audible (wet:0.3).
 * Delay and distortion start at wet:0 so the first load isn't overwhelming.
 * Vibrato and tremolo have wet:0 by default — in chain but inaudible until enabled.
 * filterLFO is created and connected to filterFX.frequency but not started.
 *
 * connectInstrument / disconnectInstrument replace the old hard-wired
 * warmPad.connect() so any synth can be hot-swapped into the chain.
 */

import * as Tone from 'tone';

// ---------------------------------------------------------------------------
// Effects nodes
// ---------------------------------------------------------------------------

/** Vibrato — pitch LFO modulation; starts silent (wet:0) */
export const vibrato = new Tone.Vibrato({ frequency: 5, depth: 0.1, wet: 0 });

/** Tremolo — amplitude LFO modulation; starts silent (wet:0). Must be started even at wet:0. */
export const tremolo = new Tone.Tremolo({ frequency: 4, depth: 0.5, wet: 0 }).start();

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
// LFO modulation
// ---------------------------------------------------------------------------

/**
 * filterLFO — oscillates filterFX.frequency between 400–4000 Hz.
 * Not started by default. Enable via setLFO('filterLFO', { enabled: true }).
 */
export const filterLFO = new Tone.LFO({ frequency: 2, min: 400, max: 4000, type: 'sine' });
filterLFO.connect(filterFX.frequency);

// ---------------------------------------------------------------------------
// Wire the chain: vibrato → tremolo → reverb → delay → distortion → filterFX → channel → masterVolume → Destination
// ---------------------------------------------------------------------------
vibrato.connect(tremolo);
tremolo.connect(reverb);
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
 * Connect a synth into the effects chain (into vibrato, the first node).
 * @param {Tone.PolySynth | Tone.Synth} synth
 */
export function connectInstrument(synth) {
  synth.connect(vibrato);
}

/**
 * Disconnect a synth from all outputs (used before hot-swapping).
 * @param {Tone.PolySynth | Tone.Synth} synth
 */
export function disconnectInstrument(synth) {
  synth.disconnect();
}

// ---------------------------------------------------------------------------
// Per-track effects chain factory (for multi-track system)
// ---------------------------------------------------------------------------

/**
 * createTrackEffectsChain()
 *
 * Creates an independent mini effects chain for a melodic track.
 * Each track gets: reverb → delay → channel → masterVolume
 *
 * The `input` property is the entry point for the track's synth.
 *
 * @returns {{ input, reverb, delay, channel, ready }}
 */
export function createTrackEffectsChain() {
  const trackReverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 });
  const trackDelay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.35, wet: 0 });
  const trackChannel = new Tone.Channel({ volume: 0, pan: 0 });

  // Chain: input (reverb) → delay → channel → masterVolume
  trackReverb.connect(trackDelay);
  trackDelay.connect(trackChannel);
  trackChannel.connect(masterVolume);

  return {
    input: trackReverb,
    reverb: trackReverb,
    delay: trackDelay,
    channel: trackChannel,
    ready: trackReverb.ready,
  };
}

// ---------------------------------------------------------------------------
// LFO control helper
// ---------------------------------------------------------------------------

/**
 * setLFO(target, params)
 *
 * Update LFO parameters at runtime. Called by UI controls to enable/configure
 * vibrato, tremolo, or the filter sweep LFO.
 *
 * @param {'vibrato' | 'tremolo' | 'filterLFO'} target
 * @param {Object} params
 *   For vibrato/tremolo: { frequency?, depth?, wet? }
 *   For filterLFO: { frequency?, min?, max?, type?, enabled? }
 */
export function setLFO(target, params) {
  const nodes = { vibrato, tremolo, filterLFO };
  const node = nodes[target];
  if (!node) {
    console.warn(`setLFO: unknown target "${target}"`);
    return;
  }

  if (target === 'filterLFO') {
    // filterLFO uses Tone.LFO API — handle start/stop via enabled flag
    const { enabled, ...lfoParams } = params;
    if (Object.keys(lfoParams).length > 0) {
      node.set(lfoParams);
    }
    if (enabled === true) {
      node.start();
    } else if (enabled === false) {
      node.stop();
    }
  } else {
    // vibrato and tremolo use Tone.Effect .set() for all params
    node.set(params);
  }
}
