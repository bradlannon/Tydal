/**
 * engine/arpeggiator.js
 *
 * BPM-synced arpeggiator engine.
 * Held notes cycle through Up, Down, or Random order at the selected
 * rhythmic subdivision.
 *
 * Signal flow: addArpNote (pad down) → arp tick → noteOn/noteOff cycle
 *
 * Exports:
 *   addArpNote(note, velocity?)
 *   removeArpNote(note)
 *   setArpEnabled(val)
 *   isArpEnabled()
 *   setArpMode(mode)
 *   getArpMode()
 *   setArpRate(rate)
 */

import { _triggerNoteOn, _triggerNoteOff } from './instruments.js';
import { getBPM } from './sequencer.js';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let enabled = false;
let mode = 'up';           // 'up' | 'down' | 'random'
let rate = '8n';           // '4n' | '8n' | '16n' | '32n'

/** Notes in the order the player pressed them */
const heldNotes = [];

/** Current position in the sorted/shuffled cycle */
let arpIndex = 0;

/** setInterval handle */
let intervalId = null;

/** Last note triggered — needed for noteOff before next attack */
let lastNote = null;

// ---------------------------------------------------------------------------
// Rate conversion — same pattern as note-repeat.js
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
    default:    return quarterMs * 0.5;
  }
}

// ---------------------------------------------------------------------------
// Note sorting helpers
// ---------------------------------------------------------------------------

/**
 * Simple MIDI note number from note name (e.g. 'C4' → 60).
 * Handles sharps (#) and flats (b). Octave number is the last character(s).
 */
function noteToMidi(noteName) {
  const noteMap = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const match = noteName.match(/^([A-G])([#b]?)(-?\d+)$/);
  if (!match) return 60; // fallback to C4
  const [, letter, accidental, octStr] = match;
  const base = noteMap[letter] ?? 0;
  const acc = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  const oct = parseInt(octStr, 10);
  return (oct + 1) * 12 + base + acc;
}

/**
 * Return a sorted copy of heldNotes by MIDI number (ascending).
 */
function sortedAscending() {
  return [...heldNotes].sort((a, b) => noteToMidi(a) - noteToMidi(b));
}

// ---------------------------------------------------------------------------
// Arp tick
// ---------------------------------------------------------------------------

function _tick() {
  if (heldNotes.length === 0) {
    _stopInterval();
    return;
  }

  let sorted;
  if (mode === 'up') {
    sorted = sortedAscending();
  } else if (mode === 'down') {
    sorted = sortedAscending().reverse();
  } else {
    // random — shuffle
    sorted = [...heldNotes].sort(() => Math.random() - 0.5);
  }

  // noteOff previous note, then noteOn next with 5ms gap (anti-click pattern)
  if (lastNote !== null) {
    _triggerNoteOff(lastNote);
  }

  // Clamp arpIndex to current sorted length
  arpIndex = arpIndex % sorted.length;
  const nextNote = sorted[arpIndex];

  setTimeout(() => _triggerNoteOn(nextNote, 0.7), 5);
  lastNote = nextNote;

  // Advance index for next tick
  arpIndex = (arpIndex + 1) % sorted.length;
}

// ---------------------------------------------------------------------------
// Interval management
// ---------------------------------------------------------------------------

function _startInterval() {
  if (intervalId !== null) return;
  const ms = rateToMs(rate);
  intervalId = setInterval(_tick, ms);
}

function _stopInterval() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Called when a pad is pressed and ARP is enabled.
 * Adds note to held set. If this is the first note, starts the arp interval.
 * The arp tick handles noteOn — do NOT call noteOn directly when ARP is active.
 *
 * @param {string} note — e.g. 'C4'
 * @param {number} [velocity=0.8]
 */
export function addArpNote(note, velocity = 0.8) {
  if (heldNotes.includes(note)) return;
  heldNotes.push(note);

  if (enabled && intervalId === null) {
    arpIndex = 0;
    _startInterval();
  }
}

/**
 * Called when a pad is released and ARP is enabled.
 * Removes note from held set. If empty, stops arp and releases last note.
 *
 * @param {string} note
 */
export function removeArpNote(note) {
  const idx = heldNotes.indexOf(note);
  if (idx === -1) return;
  heldNotes.splice(idx, 1);

  if (heldNotes.length === 0) {
    _stopInterval();
    if (lastNote !== null) {
      _triggerNoteOff(lastNote);
      lastNote = null;
    }
    arpIndex = 0;
  }
}

/**
 * Enable or disable arpeggiator.
 * Disabling stops interval and releases last note.
 *
 * @param {boolean} val
 */
export function setArpEnabled(val) {
  enabled = val;
  if (!enabled) {
    _stopInterval();
    if (lastNote !== null) {
      _triggerNoteOff(lastNote);
      lastNote = null;
    }
    heldNotes.length = 0;
    arpIndex = 0;
  }
}

/**
 * Whether arpeggiator is currently enabled.
 * @returns {boolean}
 */
export function isArpEnabled() {
  return enabled;
}

/**
 * Set arp mode. Takes effect on next tick cycle boundary.
 * @param {'up'|'down'|'random'} newMode
 */
export function setArpMode(newMode) {
  mode = newMode;
}

/**
 * Get current arp mode string.
 * @returns {'up'|'down'|'random'}
 */
export function getArpMode() {
  return mode;
}

/**
 * Set the arp subdivision rate.
 * Immediately restarts the interval if running (same pattern as note-repeat.js).
 * @param {'4n'|'8n'|'16n'|'32n'} newRate
 */
export function setArpRate(newRate) {
  rate = newRate;
  if (intervalId !== null) {
    _stopInterval();
    _startInterval();
  }
}
