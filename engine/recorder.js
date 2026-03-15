/**
 * engine/recorder.js
 *
 * Melody loop recorder with quantization, overdub stacking, and undo.
 *
 * Pattern: Tone.Part per recording pass — new Part created on startRecording(),
 * events added in real-time via recordNote(), Part pushed to overdubStack on
 * stopRecording() and set to loop so it replays on every Transport cycle.
 *
 * Quantization: notes snap to nearest subdivision (4n/8n/16n/32n) using
 * Math.round to avoid duplicate events at edges.
 *
 * Guard: recording only works while Transport is playing (isPlaying() check).
 * Integration: instruments.js calls recordNote() from within noteOn() so all
 * note sources (keyboard, touch, MIDI) are captured automatically.
 *
 * Exports:
 *   startRecording()
 *   stopRecording()
 *   recordNote(note, velocity, duration)
 *   undoLastOverdub()
 *   clearAllRecordings()
 *   setQuantization(subdiv)
 *   getQuantization()
 *   isRecording()
 *   getOverdubCount()
 */

import * as Tone from 'tone';
import { noteOn, noteOff } from './instruments.js';
import { isPlaying } from './sequencer.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _isRecording = false;
let _quantization = '16n';   // default: snap to 16th notes
const overdubStack = [];     // array of Tone.Part objects, one per pass
let activePart = null;       // Part currently being recorded into

// ---------------------------------------------------------------------------
// Quantization control
// ---------------------------------------------------------------------------

/**
 * Set the quantization subdivision for note snap.
 * @param {'4n'|'8n'|'16n'|'32n'} subdiv
 */
export function setQuantization(subdiv) {
  const valid = ['4n', '8n', '16n', '32n'];
  if (valid.includes(subdiv)) {
    _quantization = subdiv;
  } else {
    console.warn('[Tydal recorder] Invalid quantization:', subdiv, '— ignored');
  }
}

/**
 * Get current quantization subdivision.
 * @returns {'4n'|'8n'|'16n'|'32n'}
 */
export function getQuantization() {
  return _quantization;
}

// ---------------------------------------------------------------------------
// Recording lifecycle
// ---------------------------------------------------------------------------

/**
 * Start a new recording pass.
 * Guard: only works when Transport is playing.
 * Creates a new Tone.Part and starts it at position 0 so it syncs with the loop.
 */
export function startRecording() {
  if (!isPlaying()) {
    console.warn('[Tydal recorder] Cannot start recording — Transport is not playing.');
    return;
  }
  if (_isRecording) {
    console.warn('[Tydal recorder] Already recording — call stopRecording() first.');
    return;
  }

  _isRecording = true;

  // Create a new Part for this recording pass.
  // loop = false during recording to avoid double-triggering.
  // Playback callback triggers noteOn and schedules noteOff after duration.
  activePart = new Tone.Part((time, event) => {
    noteOn(event.note, event.velocity);
    Tone.getTransport().scheduleOnce((t) => {
      noteOff(event.note);
    }, time + event.duration);
  }, []);

  activePart.loop = false;  // enabled after recording stops
  activePart.start(0);
}

/**
 * Stop the current recording pass.
 * Pushes the completed Part onto overdubStack and enables its loop so it
 * replays on every subsequent Transport cycle.
 */
export function stopRecording() {
  if (!_isRecording) {
    return;
  }

  _isRecording = false;

  if (activePart) {
    activePart.loop = true;
    activePart.loopStart = 0;
    activePart.loopEnd = '1m';
    overdubStack.push(activePart);
    activePart = null;
  }
}

/**
 * Record a note into the active Part, quantized to the selected subdivision.
 * Guard: no-op if not recording or no active Part.
 *
 * @param {string} note     — e.g. 'C4', 'F#3'
 * @param {number} velocity — 0..1
 * @param {string} [duration='8n'] — note duration (Tone.js time string)
 */
export function recordNote(note, velocity, duration) {
  if (!_isRecording || !activePart) {
    return;
  }

  const transport = Tone.getTransport();

  // Quantize: snap to nearest subdivision boundary
  const rawPos = transport.seconds;
  const subdivSeconds = Tone.Time(_quantization).toSeconds();
  const quantizedPos = Math.round(rawPos / subdivSeconds) * subdivSeconds;

  // Wrap to current loop length (1 measure)
  const measureLength = Tone.Time('1m').toSeconds();
  const wrappedPos = quantizedPos % measureLength;

  const durationSeconds = Tone.Time(duration || '8n').toSeconds();
  activePart.add(wrappedPos, { note, velocity, duration: durationSeconds });
}

// ---------------------------------------------------------------------------
// Overdub management
// ---------------------------------------------------------------------------

/**
 * Undo the last recording pass by stopping and disposing its Part.
 * @returns {number} Remaining overdub count
 */
export function undoLastOverdub() {
  if (overdubStack.length === 0) {
    return 0;
  }
  const last = overdubStack.pop();
  last.stop();
  last.dispose();
  return overdubStack.length;
}

/**
 * Remove all recorded Parts — stop, dispose, and clear overdubStack.
 * Also cancels any in-progress recording pass.
 */
export function clearAllRecordings() {
  for (const part of overdubStack) {
    part.stop();
    part.dispose();
  }
  overdubStack.length = 0;

  if (activePart) {
    activePart.stop();
    activePart.dispose();
    activePart = null;
  }

  _isRecording = false;
}

// ---------------------------------------------------------------------------
// Status queries
// ---------------------------------------------------------------------------

/**
 * Whether a recording pass is currently in progress.
 * @returns {boolean}
 */
export function isRecording() {
  return _isRecording;
}

/**
 * Total number of recorded layers (committed passes + active pass if recording).
 * @returns {number}
 */
export function getOverdubCount() {
  return overdubStack.length + (_isRecording ? 1 : 0);
}
