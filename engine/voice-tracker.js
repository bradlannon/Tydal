/**
 * engine/voice-tracker.js
 *
 * Active note tracking with voice stealing logic.
 *
 * Tracks which notes are currently held. When polyphony is
 * exhausted (8 voices), stealOldestIfFull() returns the oldest
 * note so instruments.js can release it before triggering the new one.
 */

import * as Tone from 'tone';

/** Maximum simultaneous voices before stealing begins */
export const MAX_VOICES = 8;

/**
 * activeNotes — ordered array of currently held notes.
 * Each entry: { note: string, startedAt: number }
 * Ordered oldest-first (index 0 is oldest).
 */
export const activeNotes = [];

/**
 * Track a note-on event.
 * @param {string} note — e.g. 'C4', 'F#3'
 */
export function trackNoteOn(note) {
  activeNotes.push({ note, startedAt: Tone.now() });
}

/**
 * Track a note-off event. Removes the note from active tracking.
 * @param {string} note — e.g. 'C4', 'F#3'
 */
export function trackNoteOff(note) {
  const idx = activeNotes.findIndex(n => n.note === note);
  if (idx !== -1) {
    activeNotes.splice(idx, 1);
  }
}

/**
 * If at max polyphony, steal the oldest active note.
 * Caller is responsible for calling triggerRelease on the returned note.
 *
 * @returns {string|null} stolen note name, or null if not full
 */
export function stealOldestIfFull() {
  if (activeNotes.length >= MAX_VOICES) {
    const oldest = activeNotes.shift();
    return oldest.note;
  }
  return null;
}

/**
 * Return a shallow copy of the active notes array.
 * @returns {Array<{note: string, startedAt: number}>}
 */
export function getActiveNotes() {
  return [...activeNotes];
}

/**
 * Clear all tracked notes.
 * Used during grid rebuild or other resets to prevent stuck notes.
 */
export function clearAll() {
  activeNotes.length = 0;
}
