/**
 * engine/capture.js
 *
 * Rolling note buffer — Capture mode.
 *
 * Continuously records the last 1 measure (16 steps) worth of played notes.
 * The buffer is always rolling; pressing the CAP button commits ("retroactively
 * captures") recent notes into the active track's step grid.
 *
 * This implements Ableton Move's signature Capture feature:
 *   - Play freely without committing to record mode
 *   - Press Capture after a good take and it's saved
 *   - No pressure of hitting Record before inspiration strikes
 *
 * Exports:
 *   feedCapture(note, velocity)   — called from instruments.js on every noteOn
 *   commitCapture()               — quantize buffer → active track step grid
 *   clearCaptureBuffer()          — empty the buffer (e.g. on track switch)
 */

import { getBPM } from './sequencer.js';
import { getActiveTrack } from './track-manager.js';
import { NUM_STEPS, setSelectedNote } from './melodic-sequencer.js';

// ---------------------------------------------------------------------------
// Rolling buffer state
// ---------------------------------------------------------------------------

/** @type {Array<{note: string, velocity: number, timestamp: number}>} */
let buffer = [];

// ---------------------------------------------------------------------------
// feedCapture — called on every noteOn (unconditionally — buffer always rolls)
// ---------------------------------------------------------------------------

/**
 * Add a note event to the rolling buffer and prune stale entries.
 * Lightweight: push + shift loop — safe to call on every noteOn.
 *
 * @param {string} note     — e.g. 'C4'
 * @param {number} velocity — 0..1
 */
export function feedCapture(note, velocity) {
  const timestamp = performance.now();

  // One measure at current BPM = 4 beats × (60000ms / BPM)
  const bufferDurationMs = (60000 / getBPM()) * 4;

  buffer.push({ note, velocity, timestamp });

  // Prune entries older than one measure
  const cutoff = timestamp - bufferDurationMs;
  while (buffer.length > 0 && buffer[0].timestamp < cutoff) {
    buffer.shift();
  }
}

// ---------------------------------------------------------------------------
// commitCapture — quantize buffer into active track's step grid
// ---------------------------------------------------------------------------

/**
 * Quantize the rolling buffer into the active track's step grid.
 *
 * Steps:
 *   1. Guard: active track must be melodic
 *   2. Calculate step duration from current BPM (16th note = one step)
 *   3. Map each buffer entry to the step it falls on
 *   4. Add each note to activeTrack.grid[step] (Set — duplicates safe)
 *   5. Set selected note so step display reflects the capture
 *   6. Dispatch 'melodic-update' so step buttons refresh
 *   7. Clear the buffer
 *
 * @returns {number} count of notes committed (0 = buffer was empty or wrong track)
 */
export function commitCapture() {
  const activeTrack = getActiveTrack();
  if (!activeTrack || activeTrack.type !== 'melodic') return 0;

  if (buffer.length === 0) return 0;

  const bpm = getBPM();
  // 16th note duration in ms (one step = one 16th note)
  const stepDurationMs = (60000 / bpm) / 4;

  const windowEnd = performance.now();
  const windowStart = windowEnd - (stepDurationMs * NUM_STEPS);

  let committed = 0;
  let lastNote = null;

  for (const entry of buffer) {
    if (entry.timestamp < windowStart || entry.timestamp > windowEnd) continue;

    const step = Math.floor((entry.timestamp - windowStart) / stepDurationMs);
    const clampedStep = Math.max(0, Math.min(NUM_STEPS - 1, step));

    activeTrack.grid[clampedStep].add(entry.note);
    lastNote = entry.note;
    committed++;
  }

  if (lastNote) {
    setSelectedNote(lastNote);
  }

  // Notify step buttons to redraw
  document.dispatchEvent(new CustomEvent('melodic-update'));

  // Clear after commit
  buffer = [];

  return committed;
}

// ---------------------------------------------------------------------------
// clearCaptureBuffer — empty the buffer (call on track switch)
// ---------------------------------------------------------------------------

/**
 * Empty the rolling buffer.
 * Call when switching tracks to prevent cross-track contamination.
 */
export function clearCaptureBuffer() {
  buffer = [];
}
