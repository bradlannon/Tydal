/**
 * engine/note-repeat.js
 *
 * BPM-synced note repeat engine.
 * Holding a pad with repeat enabled auto-retriggers the note at the selected
 * rhythmic subdivision: 1/4, 1/8, 1/16, or 1/32.
 *
 * Signal flow: pad hold → startRepeat → setInterval ticks → noteOff/noteOn cycle
 *
 * Exports:
 *   startRepeat(note, velocity?)
 *   stopRepeat(note)
 *   setRepeatEnabled(val)
 *   isRepeatEnabled()
 *   setRepeatRate(rate)
 *   getRepeatRate()
 */

import { noteOn, noteOff } from './instruments.js';
import { getBPM } from './sequencer.js';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let enabled = false;
let rate = '8n';   // default: eighth notes

/**
 * activeRepeats: note → { intervalId, velocity }
 * Stores each active repeat's interval handle and the velocity used to retrigger.
 */
const activeRepeats = new Map();

// ---------------------------------------------------------------------------
// Rate conversion
// ---------------------------------------------------------------------------

/**
 * Convert a note-rate string to milliseconds at the current BPM.
 * @param {string} noteRate — '4n' | '8n' | '16n' | '32n'
 * @returns {number} interval in milliseconds
 */
function rateToMs(noteRate) {
  const bpm = getBPM();
  const quarterMs = 60000 / bpm;
  switch (noteRate) {
    case '4n':  return quarterMs * 1;
    case '8n':  return quarterMs * 0.5;
    case '16n': return quarterMs * 0.25;
    case '32n': return quarterMs * 0.125;
    default:    return quarterMs * 0.5;  // fallback: eighth note
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Begin repeating a note at the current BPM-synced interval.
 * No-op if repeat is disabled or the note is already repeating.
 *
 * @param {string} note — e.g. 'C4'
 * @param {number} [velocity=0.8]
 */
export function startRepeat(note, velocity = 0.8) {
  if (!enabled) return;
  if (activeRepeats.has(note)) return;

  const interval = rateToMs(rate);

  const intervalId = setInterval(() => {
    noteOff(note);
    setTimeout(() => noteOn(note, velocity), 5);
  }, interval);

  activeRepeats.set(note, { intervalId, velocity });
}

/**
 * Stop repeating a note and call noteOff.
 * Safe to call even if the note is not currently repeating.
 *
 * @param {string} note
 */
export function stopRepeat(note) {
  const entry = activeRepeats.get(note);
  if (!entry) return;
  clearInterval(entry.intervalId);
  activeRepeats.delete(note);
  noteOff(note);
}

/**
 * Change the repeat rate. Immediately restarts all active repeats
 * with the new interval so rhythm changes feel instantaneous.
 *
 * @param {string} newRate — '4n' | '8n' | '16n' | '32n'
 */
export function setRepeatRate(newRate) {
  rate = newRate;
  const interval = rateToMs(rate);

  for (const [note, entry] of activeRepeats.entries()) {
    clearInterval(entry.intervalId);
    const { velocity } = entry;
    const intervalId = setInterval(() => {
      noteOff(note);
      setTimeout(() => noteOn(note, velocity), 5);
    }, interval);
    activeRepeats.set(note, { intervalId, velocity });
  }
}

/**
 * Enable or disable note repeat.
 * Disabling immediately stops all active repeats.
 *
 * @param {boolean} val
 */
export function setRepeatEnabled(val) {
  enabled = val;
  if (!enabled) {
    for (const note of [...activeRepeats.keys()]) {
      stopRepeat(note);
    }
  }
}

/**
 * Whether note repeat is currently enabled.
 * @returns {boolean}
 */
export function isRepeatEnabled() {
  return enabled;
}

/**
 * Get the current repeat rate string.
 * @returns {string} — '4n' | '8n' | '16n' | '32n'
 */
export function getRepeatRate() {
  return rate;
}
