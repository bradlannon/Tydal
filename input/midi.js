/**
 * input/midi.js
 *
 * Web MIDI API handler. Listens for MIDI note-on / note-off messages from
 * connected keyboards and routes them into the instrument engine.
 *
 * Exports:
 *   initMIDI — Sets up MIDI access; returns boolean (true = available)
 *
 * Graceful degradation:
 *   - Returns false (no throw) on browsers without Web MIDI API
 *   - Returns false on non-secure contexts (MIDI requires HTTPS)
 *   - Logs diagnostic messages to console, no UI errors
 *
 * Note encoding:
 *   MIDI note number → Tone note string via Tone.Frequency(n, 'midi').toNote()
 *   Velocity byte 0–127 → float 0.0–1.0
 *   Note-on with velocity 0 is treated as note-off (standard MIDI spec)
 */

import * as Tone from 'tone';
import { ensureAudioStarted } from '../engine/audio-engine.js';
import { noteOn, noteOff } from '../engine/instruments.js';
import { setPadActive } from '../ui/pad-grid.js';

/** True after first MIDI note-on — prevents repeated ensureAudioStarted calls */
let audioStarted = false;

/**
 * handleMIDIMessage(event)
 *
 * Parses raw MIDI bytes and dispatches to noteOn / noteOff.
 *
 * @param {MIDIMessageEvent} event
 */
async function handleMIDIMessage(event) {
  const [status, noteNumber, velocityByte] = event.data;
  const command = status & 0xf0;

  // Convert MIDI note number to Tone.js note string (e.g. 60 → "C4")
  const note = Tone.Frequency(noteNumber, 'midi').toNote();

  if (command === 0x90 && velocityByte > 0) {
    // Note On — velocity byte > 0 means genuine note-on
    if (!audioStarted) {
      await ensureAudioStarted();
      audioStarted = true;
    }
    const velocity = velocityByte / 127;
    noteOn(note, velocity);
    setPadActive(note, true);
  } else if (command === 0x80 || (command === 0x90 && velocityByte === 0)) {
    // Note Off — explicit note-off, or note-on with velocity 0 (running status)
    noteOff(note);
    setPadActive(note, false);
  }
}

/**
 * initMIDI()
 *
 * Requests Web MIDI access and attaches message handlers to all inputs.
 * Re-attaches handlers on onstatechange for hot-plugged devices.
 *
 * @returns {Promise<boolean>} true = MIDI is available, false = unavailable/denied
 */
export async function initMIDI() {
  // Guard: Web MIDI API must be available
  if (!navigator.requestMIDIAccess) {
    console.log('Web MIDI API not supported in this browser');
    return false;
  }

  // Guard: Web MIDI requires a secure context (HTTPS or localhost)
  if (!window.isSecureContext) {
    console.log('MIDI requires HTTPS — not available on this page');
    return false;
  }

  let midiAccess;
  try {
    midiAccess = await navigator.requestMIDIAccess();
  } catch (err) {
    console.log('MIDI access denied or unavailable:', err.message);
    return false;
  }

  /**
   * attachHandlers — iterates all MIDI inputs and sets onmidimessage.
   * Called on initial setup and whenever device state changes.
   */
  function attachHandlers() {
    for (const input of midiAccess.inputs.values()) {
      input.onmidimessage = handleMIDIMessage;
    }
  }

  attachHandlers();

  // Re-attach handlers when MIDI devices are connected or disconnected
  midiAccess.onstatechange = () => {
    attachHandlers();
  };

  console.log(`MIDI ready — ${midiAccess.inputs.size} input(s) connected`);
  return true;
}
