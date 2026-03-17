/**
 * engine/melodic-sequencer.js
 *
 * Melodic step sequencer — 16 steps, each holding a Set of note names.
 * 4 visible "lanes" track which notes are displayed in the step zone.
 * Shares Transport with the drum sequencer (engine/sequencer.js).
 *
 * The Tone.Sequence is created and armed at module load — it plays
 * automatically whenever Transport is running. No explicit start/stop needed.
 *
 * Exports:
 *   NUM_STEPS, NUM_LANES, STEPS_PER_PAGE
 *   setSelectedNote(note), getSelectedNote()
 *   getLanes(), getLaneForNote(note)
 *   setPage(page), getPage(), togglePage()
 *   toggleStep(step, note), hasNoteAtStep(step, note), clearAllMelodic()
 *   getCurrentMelodicStep()
 */

import * as Tone from 'tone';
import { tracks, getActiveTrack, getActiveTrackId } from './track-manager.js';
import { getSwing, getBPM } from './sequencer.js';

export const NUM_STEPS = 16;
export const NUM_LANES = 4;
export const STEPS_PER_PAGE = 8;

// Lanes: which notes are displayed in the step zone (LRU replacement)
// These are per-session display lanes, not per-track (UI only shows one track at a time)
const lanes = [null, null, null, null];
const laneAge = [0, 0, 0, 0];
let ageCounter = 0;

// Module-level fallback for selectedNote (used if track-manager isn't fully initialized)
let _selectedNote = null;
let currentStep = -1;
let currentPage = 0;
let _drawFallbackWarned = false;

// ---------------------------------------------------------------------------
// Note selection
// ---------------------------------------------------------------------------

export function setSelectedNote(note) {
  _selectedNote = note;
  const activeTrack = getActiveTrack();
  if (activeTrack && activeTrack.type === 'melodic') {
    activeTrack.selectedNote = note;
  }
  if (note) _assignLane(note);
  _dispatch();
}

export function getSelectedNote() {
  const activeTrack = getActiveTrack();
  if (activeTrack && activeTrack.type === 'melodic' && activeTrack.selectedNote !== undefined) {
    return activeTrack.selectedNote;
  }
  return _selectedNote;
}

// ---------------------------------------------------------------------------
// Lane management (LRU)
// ---------------------------------------------------------------------------

function _assignLane(note) {
  // Already has a lane — just bump age
  const existing = lanes.indexOf(note);
  if (existing >= 0) {
    laneAge[existing] = ++ageCounter;
    return existing;
  }

  // Empty lane available
  const empty = lanes.indexOf(null);
  if (empty >= 0) {
    lanes[empty] = note;
    laneAge[empty] = ++ageCounter;
    return empty;
  }

  // Replace least-recently-used lane
  let minAge = Infinity, minIdx = 0;
  for (let i = 0; i < NUM_LANES; i++) {
    if (laneAge[i] < minAge) { minAge = laneAge[i]; minIdx = i; }
  }
  lanes[minIdx] = note;
  laneAge[minIdx] = ++ageCounter;
  return minIdx;
}

export function getLanes() { return [...lanes]; }
export function getLaneForNote(note) { return lanes.indexOf(note); }

// ---------------------------------------------------------------------------
// Page control (0 = steps 1-8, 1 = steps 9-16)
// ---------------------------------------------------------------------------

export function setPage(page) {
  currentPage = Math.max(0, Math.min(1, page));
  _dispatch();
}

export function getPage() { return currentPage; }

export function togglePage() {
  setPage(currentPage === 0 ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Grid operations
// ---------------------------------------------------------------------------

export function toggleStep(step, note) {
  if (!note || step < 0 || step >= NUM_STEPS) return;
  const activeTrack = getActiveTrack();
  if (!activeTrack || activeTrack.type !== 'melodic') return;
  const grid = activeTrack.grid;
  if (grid[step].has(note)) {
    grid[step].delete(note);
  } else {
    grid[step].add(note);
  }
  _dispatch();
}

export function hasNoteAtStep(step, note) {
  if (step < 0 || step >= NUM_STEPS) return false;
  const activeTrack = getActiveTrack();
  if (!activeTrack || activeTrack.type !== 'melodic') return false;
  return activeTrack.grid[step].has(note);
}

export function clearAllMelodic() {
  const activeTrack = getActiveTrack();
  if (activeTrack && activeTrack.type === 'melodic') {
    for (const s of activeTrack.grid) s.clear();
    activeTrack.selectedNote = null;
  }
  for (let i = 0; i < NUM_LANES; i++) { lanes[i] = null; laneAge[i] = 0; }
  ageCounter = 0;
  _selectedNote = null;
  _dispatch();
}

export function getCurrentMelodicStep() { return currentStep; }

// ---------------------------------------------------------------------------
// Tone.Sequence — armed at load, plays with Transport
// ---------------------------------------------------------------------------

const sequence = new Tone.Sequence(
  (time, step) => {
    currentStep = step;

    // Swing offset: delay odd steps (1, 3, 5, ...) by swingAmount × one 16th note duration.
    // Same formula as sequencer.js — single swing source of truth via getSwing().
    const isOddStep = step % 2 === 1;
    const swingOffset = isOddStep ? getSwing() * (60 / getBPM() / 4) : 0;
    const audioTime = time + swingOffset;

    // Trigger notes for all non-muted melodic tracks simultaneously
    for (const track of tracks) {
      if (track.type !== 'melodic' || track.muted) continue;
      for (const note of track.grid[step]) {
        track.synth.triggerAttackRelease(note, '16n', audioTime, 0.7);
      }
    }

    // Visual sync via Tone.Draw
    _scheduleVisual();
  },
  Array.from({ length: NUM_STEPS }, (_, i) => i),
  '16n'
);

sequence.loop = true;
sequence.start(0); // armed — plays when Transport starts

// Reset playhead when Transport stops (drum sequencer dispatches step: -1)
document.addEventListener('sequencer-step', (e) => {
  if (e.detail.step === -1) {
    currentStep = -1;
    _dispatch();
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _dispatch() {
  document.dispatchEvent(new CustomEvent('melodic-update'));
}

function _scheduleVisual() {
  const fn = () => _dispatch();
  if (typeof Tone.getDraw === 'function') {
    Tone.getDraw().schedule(fn, Tone.now());
  } else if (Tone.Draw && typeof Tone.Draw.schedule === 'function') {
    Tone.Draw.schedule(fn, Tone.now());
  } else {
    if (!_drawFallbackWarned) {
      console.warn('[Tydal] Tone.Draw unavailable; falling back to rAF');
      _drawFallbackWarned = true;
    }
    requestAnimationFrame(fn);
  }
}
