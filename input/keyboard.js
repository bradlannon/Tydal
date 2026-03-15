/**
 * input/keyboard.js
 *
 * Keyboard key-to-note mapping with keydown/keyup note lifecycle.
 * Handles held-key tracking to prevent auto-repeat triggering.
 * Rebuilds KEY_TO_NOTE dynamically on 'grid-rebuild' events (octave shift).
 *
 * Exports:
 *   initKeyboard — Attaches global keydown/keyup listeners
 *
 * Zero setTimeout calls — all timing via Tone.now() inside noteOn/noteOff.
 */

import { ensureAudioStarted } from '../engine/audio-engine.js';
import { noteOn, noteOff } from '../engine/instruments.js';
import { getNoteMap, setPadActive } from '../ui/pad-grid.js';

/**
 * KEY_TO_NOTE: lookup map from keyboard key (lowercase) to note name.
 * Built dynamically from getNoteMap() so it stays in sync with octave shifts.
 * e.g. { 'z': 'C3', 'x': 'C#3', ... }
 */
let KEY_TO_NOTE = {};

/**
 * heldKeys: tracks currently pressed keys to prevent auto-repeat
 * from re-triggering noteOn for a held key.
 */
const heldKeys = new Set();

/**
 * rebuildKeyMap()
 *
 * Reconstructs KEY_TO_NOTE from the current note map.
 * Called once at init and again whenever 'grid-rebuild' fires.
 * Also clears heldKeys to prevent stuck notes after octave shift.
 */
export function rebuildKeyMap() {
  KEY_TO_NOTE = Object.fromEntries(
    getNoteMap().map(({ note, key }) => [key.toLowerCase(), note])
  );
  heldKeys.clear();
}

/**
 * initKeyboard()
 *
 * Attaches keydown and keyup listeners to the document.
 * On keydown: triggers noteOn and visual pad activation (once per press).
 * On keyup: triggers noteOff and deactivates visual pad.
 *
 * Listens for 'grid-rebuild' to rebuild KEY_TO_NOTE when octave shifts.
 */
export function initKeyboard() {
  // Initialize KEY_TO_NOTE from current note map
  rebuildKeyMap();

  // Rebuild on octave shift — pad notes have changed
  document.addEventListener('grid-rebuild', () => {
    rebuildKeyMap();
  });

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
