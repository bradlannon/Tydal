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
import { triggerKick, triggerSnare, triggerHihat, triggerClap, drumBus } from './drums.js';
import { ensureAudioStarted } from './audio-engine.js';
import { getTrackById } from './track-manager.js';
import { reverb, delay } from './effects.js';

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
// Swing state
// ---------------------------------------------------------------------------

/** 0 = straight 16th notes, 1 = full triplet swing (maximum shuffle) */
let swingAmount = 0;

/**
 * Set swing amount.
 * @param {number} amount — 0..1
 */
export function setSwing(amount) {
  swingAmount = Math.max(0, Math.min(1, amount));
}

/**
 * Get current swing amount.
 * @returns {number} 0..1
 */
export function getSwing() {
  return swingAmount;
}

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

    // Check drum track mute state (track 0) before triggering voices
    const drumTrack = getTrackById(0);
    const drumsMuted = drumTrack && drumTrack.muted;

    // Swing offset: delay odd steps (1, 3, 5, ...) by swingAmount × one 16th note duration.
    // Even steps play on the grid; odd steps are pushed later for a shuffle feel.
    // Visual playhead is NOT swung — cursor stays on-grid for clarity.
    const isOddStep = step % 2 === 1;
    const swingOffset = isOddStep ? swingAmount * (60 / getBPM() / 4) : 0;
    const audioTime = time + swingOffset;

    // Apply per-step drum automation (volume/reverb etc.) before triggering voices
    const drumAuto = drumTrack && drumTrack.automation && drumTrack.automation[step];
    if (drumAuto) {
      _applyDrumAutomation(drumAuto);
    }

    if (!drumsMuted) {
      // Fire active drum voices — audio-thread safe (Tone scheduled time)
      if (grid.kick[step])  triggerKick(audioTime);
      if (grid.snare[step]) triggerSnare(audioTime);
      if (grid.hihat[step]) triggerHihat('closed', audioTime);
      if (grid.clap[step])  triggerClap(audioTime);
    }

    // Dispatch visual cursor event via Tone.Draw (never DOM from audio callback)
    // Always advance playhead even when muted — visual sync continues
    scheduleStepEvent(step);
  },
  Array.from({ length: NUM_STEPS }, (_, i) => i),
  '16n'
);

sequence.loop = true;

// ---------------------------------------------------------------------------
// Drum automation helper
// ---------------------------------------------------------------------------

/**
 * Apply per-step automation for the drum track.
 * Automation stays applied until the next automated step changes it (step automation model).
 *
 * @param {{ paramName: string, value: number }} auto
 */
function _applyDrumAutomation(auto) {
  const { paramName, value } = auto;
  switch (paramName) {
    case 'Drum Vol':
      drumBus.volume.value = value;
      break;
    case 'Reverb':
      reverb.wet.value = value;
      break;
    case 'Delay':
      delay.wet.value = value;
      break;
    default:
      break;
  }
}

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
