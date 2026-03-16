/**
 * input/keyboard.js
 *
 * Keyboard key-to-note mapping with keydown/keyup note lifecycle.
 * Handles 32 note pads (4 rows × 8 keys).
 *
 * Exports:
 *   initKeyboard — Attaches global keydown/keyup listeners
 */

import { ensureAudioStarted } from '../engine/audio-engine.js';
import { noteOn, noteOff } from '../engine/instruments.js';
import { getNoteMap, setPadActive } from '../ui/pad-grid.js';
import { setSelectedNote } from '../engine/melodic-sequencer.js';
import { startRepeat, stopRepeat, isRepeatEnabled } from '../engine/note-repeat.js';

let KEY_TO_NOTE = {};
const heldKeys = new Set();

export function rebuildKeyMap() {
  KEY_TO_NOTE = {};
  for (const { note, key } of getNoteMap()) {
    if (key) KEY_TO_NOTE[key.toLowerCase()] = note;
  }
  heldKeys.clear();
}

export function initKeyboard() {
  rebuildKeyMap();

  document.addEventListener('grid-rebuild', () => {
    rebuildKeyMap();
  });

  document.addEventListener('keydown', async (e) => {
    if (e.repeat) return;
    const note = KEY_TO_NOTE[e.key.toLowerCase()];
    if (!note) return;
    if (heldKeys.has(note)) return;

    heldKeys.add(note);
    await ensureAudioStarted();
    noteOn(note);
    if (isRepeatEnabled()) startRepeat(note);
    setPadActive(note, true);
    setSelectedNote(note);
  });

  document.addEventListener('keyup', (e) => {
    const note = KEY_TO_NOTE[e.key.toLowerCase()];
    if (!note) return;
    heldKeys.delete(note);
    stopRepeat(note);
    noteOff(note);
    setPadActive(note, false);
  });
}
