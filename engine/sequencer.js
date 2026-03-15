/**
 * engine/sequencer.js
 *
 * 16-step Tone.Sequence drum sequencer with Tone.Transport control.
 *
 * Grid state: 4 rows × 16 steps, each cell boolean (active/inactive).
 * Playback: Tone.Sequence fires on '16n' subdivision, sample-accurate via Transport.
 * Visual sync: 'sequencer-step' CustomEvent dispatched on document via Tone.Draw
 *   (never update DOM directly from Sequence callback — audio thread constraint).
 *
 * Exports:
 *   ROWS            — ['kick','snare','hihat','clap']
 *   NUM_STEPS       — 16
 *   initTransport(bpm?)
 *   startSequencer()
 *   stopSequencer()
 *   isPlaying()
 *   setBPM(bpm)
 *   getBPM()
 *   setStep(row, step, active)
 *   getStep(row, step)
 *   getGrid()
 *   getCurrentStep()
 */

import * as Tone from 'tone';
import { triggerKick, triggerSnare, triggerHihat, triggerClap } from './drums.js';
import { ensureAudioStarted } from './audio-engine.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Drum row order — matches UI layout */
export const ROWS = ['kick', 'snare', 'hihat', 'clap'];

/** Number of steps per row */
export const NUM_STEPS = 16;

// ---------------------------------------------------------------------------
// Grid state
// ---------------------------------------------------------------------------

const grid = {
  kick:  Array(NUM_STEPS).fill(false),
  snare: Array(NUM_STEPS).fill(false),
  hihat: Array(NUM_STEPS).fill(false),
  clap:  Array(NUM_STEPS).fill(false),
};

let currentStep = 0;
let _drawFallbackWarned = false;

// ---------------------------------------------------------------------------
// Grid accessors
// ---------------------------------------------------------------------------

/**
 * Set a grid cell.
 * @param {string} row — one of ROWS
 * @param {number} step — 0..NUM_STEPS-1
 * @param {boolean} active
 */
export function setStep(row, step, active) {
  grid[row][step] = active;
}

/**
 * Get a grid cell.
 * @param {string} row
 * @param {number} step
 * @returns {boolean}
 */
export function getStep(row, step) {
  return grid[row][step];
}

/**
 * Get a reference to the entire grid object (for bulk UI renders).
 * @returns {{ kick: boolean[], snare: boolean[], hihat: boolean[], clap: boolean[] }}
 */
export function getGrid() {
  return grid;
}

/**
 * Get the current playhead step index (0–15 during playback, -1 when stopped).
 * @returns {number}
 */
export function getCurrentStep() {
  return currentStep;
}

// ---------------------------------------------------------------------------
// Draw helper — dispatches 'sequencer-step' on document via Tone.Draw
// Falls back to Tone.Draw.schedule, then requestAnimationFrame.
// ---------------------------------------------------------------------------

function scheduleStepEvent(step) {
  const dispatch = () => {
    document.dispatchEvent(new CustomEvent('sequencer-step', { detail: { step } }));
  };

  if (typeof Tone.getDraw === 'function') {
    Tone.getDraw().schedule(dispatch, Tone.now());
  } else if (Tone.Draw && typeof Tone.Draw.schedule === 'function') {
    Tone.Draw.schedule(dispatch, Tone.now());
  } else {
    if (!_drawFallbackWarned) {
      console.warn('[Tydal] Tone.getDraw / Tone.Draw unavailable; falling back to requestAnimationFrame for sequencer-step events.');
      _drawFallbackWarned = true;
    }
    requestAnimationFrame(dispatch);
  }
}

// ---------------------------------------------------------------------------
// Tone.Sequence — 16 steps at '16n' subdivision
// ---------------------------------------------------------------------------

const sequence = new Tone.Sequence(
  (time, step) => {
    currentStep = step;

    // Fire active drum voices — audio-thread safe (Tone scheduled time)
    if (grid.kick[step])  triggerKick(time);
    if (grid.snare[step]) triggerSnare(time);
    if (grid.hihat[step]) triggerHihat('closed', time);
    if (grid.clap[step])  triggerClap(time);

    // Dispatch visual cursor event via Tone.Draw (never DOM from audio callback)
    scheduleStepEvent(step);
  },
  Array.from({ length: NUM_STEPS }, (_, i) => i),
  '16n'
);

sequence.loop = true;

// ---------------------------------------------------------------------------
// Transport control
// ---------------------------------------------------------------------------

/**
 * Configure Tone.Transport for a 1-measure loop at the given BPM.
 * Call once before startSequencer.
 * @param {number} [bpm=120]
 */
export function initTransport(bpm = 120) {
  const transport = Tone.getTransport();
  transport.bpm.value = bpm;
  transport.loop = true;
  transport.loopStart = 0;
  transport.loopEnd = '1m';
}

/**
 * Set Transport BPM, clamped to 40–240.
 * @param {number} bpm
 */
export function setBPM(bpm) {
  Tone.getTransport().bpm.value = Math.max(40, Math.min(240, bpm));
}

/**
 * Get current Transport BPM.
 * @returns {number}
 */
export function getBPM() {
  return Tone.getTransport().bpm.value;
}

/**
 * Whether the Transport is currently playing.
 * @returns {boolean}
 */
export function isPlaying() {
  return Tone.getTransport().state === 'started';
}

/**
 * Start the sequencer.
 * Ensures AudioContext is running first (iOS-safe).
 */
export async function startSequencer() {
  await ensureAudioStarted();
  Tone.getTransport().start();
  sequence.start(0);
}

/**
 * Stop the sequencer. Resets playhead and dispatches cursor-off event (step: -1).
 */
export function stopSequencer() {
  sequence.stop();
  Tone.getTransport().stop();
  currentStep = 0;
  document.dispatchEvent(new CustomEvent('sequencer-step', { detail: { step: -1 } }));
}
