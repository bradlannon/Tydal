/**
 * engine/effects.js
 *
 * Master volume node wired to Destination.
 *
 * Signal chain established here (AUDIO-02):
 *   PolySynth (warmPad) → Volume(-6dB) → Tone.Destination
 *
 * The -6dB default provides headroom before clipping.
 */

import * as Tone from 'tone';
import { warmPad } from './instruments.js';

/**
 * masterVolume — master output volume node.
 * Controlled by the volume slider in the UI.
 */
export const masterVolume = new Tone.Volume(-6).toDestination();

// Wire the warm pad synth through master volume to the output
warmPad.connect(masterVolume);
