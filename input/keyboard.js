/**
 * input/keyboard.js
 *
 * Keyboard key-to-note mapping with keydown/keyup note lifecycle.
 * Handles held-key tracking to prevent auto-repeat triggering.
 *
 * Exports:
 *   initKeyboard — Attaches global keydown/keyup listeners
 *
 * Zero setTimeout calls — all timing via Tone.now() inside noteOn/noteOff.
 */

import { ensureAudioStarted } from '../engine/audio-engine.js';
import { noteOn, noteOff } from '../engine/instruments.js';
import { NOTE_MAP, setPadActive } from '../ui/pad-grid.js';

/**
 * KEY_TO_NOTE: lookup map from keyboard key (lowercase) to note name.
 * Built from NOTE_MAP to keep a single source of truth.
 * e.g. { 'z': 'C3', 'x': 'D3', ... }
 */
const KEY_TO_NOTE = Object.fromEntries(
  NOTE_MAP.map(({ note, key }) => [key.toLowerCase(), note])
);

/**
 * heldKeys: tracks currently pressed keys to prevent auto-repeat
 * from re-triggering noteOn for a held key.
 */
const heldKeys = new Set();

/**
 * initKeyboard()
 *
 * Attaches keydown and keyup listeners to the document.
 * On keydown: triggers noteOn and visual pad activation (once per press).
 * On keyup: triggers noteOff and deactivates visual pad.
 */
export function initKeyboard() {
  document.addEventListener('keydown', async (e) => {
    // Ignore browser-generated auto-repeat events
    if (e.repeat) return;

    const note = KEY_TO_NOTE[e.key.toLowerCase()];
    if (!note) return;

    // Prevent double-trigger if somehow already held
    if (heldKeys.has(note)) return;

    heldKeys.add(note);

    await ensureAudioStarted();
    noteOn(note);
    setPadActive(note, true);
  });

  document.addEventListener('keyup', (e) => {
    const note = KEY_TO_NOTE[e.key.toLowerCase()];
    if (!note) return;

    heldKeys.delete(note);
    noteOff(note);
    setPadActive(note, false);
  });
}
