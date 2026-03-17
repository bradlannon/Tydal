/**
 * engine/track-manager.js
 *
 * Central track state manager for the 4-track multi-track system.
 *
 * Track layout:
 *   Track 0 — drum track (uses existing drums.js engine; no separate synth)
 *   Track 1 — melodic (PolySynth + per-track effects chain)
 *   Track 2 — melodic (PolySynth + per-track effects chain)
 *   Track 3 — melodic (PolySynth + per-track effects chain)
 *
 * Default active track: 1 (first melodic track — pads play on this track at startup).
 *
 * Exports:
 *   TRACK_COLORS      — 4 track color constants
 *   tracks            — array of 4 track objects
 *   getActiveTrack()  — returns the currently active track object
 *   getActiveTrackId() — returns the active track index
 *   setActiveTrack(id) — sets active track; dispatches 'track-change' event
 *   getTrackById(id)  — returns tracks[id]
 */

import * as Tone from 'tone';
import { createTrackEffectsChain } from './effects.js';
import { drumBus } from './drums.js';

// ---------------------------------------------------------------------------
// Track colors — 4 distinct colors (orange, blue, purple, green)
// ---------------------------------------------------------------------------

export const TRACK_COLORS = ['#e87a20', '#00b3f4', '#b44aff', '#00e676'];

// ---------------------------------------------------------------------------
// Melodic track factory
// ---------------------------------------------------------------------------

/**
 * Create a melodic track with its own PolySynth and effects chain.
 *
 * @param {number} id — track index (1-3)
 * @param {string} color — CSS color string
 * @returns {Object} track object
 */
function createMelodicTrack(id, color) {
  const synth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 8,
    options: {
      oscillator: {
        type: 'sawtooth',
      },
      detune: -8,
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.85,
        release: 0.4,
      },
      filter: {
        type: 'lowpass',
        frequency: 2800,
        Q: 1,
        rolloff: -12,
      },
      filterEnvelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.5,
        release: 0.8,
        baseFrequency: 200,
        octaves: 3.5,
      },
    },
  });

  const effectsChain = createTrackEffectsChain();

  // Wire synth into this track's effects chain
  synth.connect(effectsChain.input);

  // 16-step melodic grid — each step holds a Set of note names
  const grid = Array.from({ length: 16 }, () => new Set());

  // 16-step automation — each step is null or { paramName, value }
  const automation = Array.from({ length: 16 }, () => null);

  return {
    id,
    color,
    type: 'melodic',
    synth,
    effectsChain,
    grid,
    automation,
    selectedNote: null,
    muted: false,
    volume: 0,
  };
}

// ---------------------------------------------------------------------------
// Track array — 1 drum track + 3 melodic tracks
// ---------------------------------------------------------------------------

export const tracks = [
  // Track 0: drum track — uses drums.js engine directly
  {
    id: 0,
    color: TRACK_COLORS[0],
    type: 'drum',
    muted: false,
    volume: 0,
    automation: Array.from({ length: 16 }, () => null),
  },

  // Tracks 1-3: melodic tracks with independent synths and effects chains
  createMelodicTrack(1, TRACK_COLORS[1]),
  createMelodicTrack(2, TRACK_COLORS[2]),
  createMelodicTrack(3, TRACK_COLORS[3]),
];

// ---------------------------------------------------------------------------
// Active track state
// ---------------------------------------------------------------------------

/** Default to first melodic track — pads play on Track 1 at startup */
let activeTrackId = 1;

// ---------------------------------------------------------------------------
// Track accessors — public API
// ---------------------------------------------------------------------------

/**
 * Get the currently active track object.
 * @returns {Object}
 */
export function getActiveTrack() {
  return tracks[activeTrackId];
}

/**
 * Get the active track index.
 * @returns {number}
 */
export function getActiveTrackId() {
  return activeTrackId;
}

/**
 * Set the active track and dispatch a 'track-change' event.
 * @param {number} id — 0-3
 */
export function setActiveTrack(id) {
  if (id < 0 || id >= tracks.length) return;
  activeTrackId = id;
  document.dispatchEvent(new CustomEvent('track-change', { detail: { trackId: id } }));
}

/**
 * Get a track by its index.
 * @param {number} id — 0-3
 * @returns {Object}
 */
export function getTrackById(id) {
  return tracks[id];
}

/**
 * Set a track's volume in dB and ramp the audio node.
 * Drum track (0): ramps drumBus volume.
 * Melodic tracks (1-3): ramp the track's own effects chain channel volume.
 * Dispatches 'track-volume' CustomEvent.
 *
 * @param {number} trackId — 0-3
 * @param {number} volumeDb — volume in dB (e.g. -40 to 0)
 */
export function setTrackVolume(trackId, volumeDb) {
  const track = tracks[trackId];
  if (!track) return;
  track.volume = volumeDb;
  if (trackId === 0) {
    drumBus.volume.rampTo(volumeDb, 0.05);
  } else if (track.effectsChain) {
    track.effectsChain.channel.volume.rampTo(volumeDb, 0.05);
  }
  document.dispatchEvent(new CustomEvent('track-volume', { detail: { trackId, volume: volumeDb } }));
}

/**
 * Mute or unmute a track at the audio channel level.
 * Drum track (0): sets drumBus.mute.
 * Melodic tracks (1-3): sets the track's effects chain channel mute.
 * Dispatches 'track-mute' CustomEvent.
 *
 * @param {number} trackId — 0-3
 * @param {boolean} muted
 */
export function setTrackMute(trackId, muted) {
  const track = tracks[trackId];
  if (!track) return;
  track.muted = muted;
  if (trackId === 0) {
    drumBus.mute = muted;
  } else if (track.effectsChain) {
    track.effectsChain.channel.mute = muted;
  }
  document.dispatchEvent(new CustomEvent('track-mute', { detail: { trackId, muted } }));
}

// ---------------------------------------------------------------------------
// Per-step automation API
// ---------------------------------------------------------------------------

/**
 * Write per-step automation for a track.
 * Stores { paramName, value } at the given step; dispatches 'automation-update'.
 *
 * @param {number} trackId — 0-3
 * @param {number} step — 0-15
 * @param {string} paramName — encoder parameter name (e.g. 'Cutoff')
 * @param {number} value — parameter value to apply at this step
 */
export function setStepAutomation(trackId, step, paramName, value) {
  const track = tracks[trackId];
  if (!track || step < 0 || step >= 16) return;
  track.automation[step] = { paramName, value };
  document.dispatchEvent(new CustomEvent('automation-update', { detail: { trackId, step } }));
}

/**
 * Get per-step automation for a track.
 *
 * @param {number} trackId — 0-3
 * @param {number} step — 0-15
 * @returns {{ paramName: string, value: number } | null}
 */
export function getStepAutomation(trackId, step) {
  const track = tracks[trackId];
  if (!track || step < 0 || step >= 16) return null;
  return track.automation[step];
}

/**
 * Clear per-step automation for a track at a specific step.
 * Dispatches 'automation-update'.
 *
 * @param {number} trackId — 0-3
 * @param {number} step — 0-15
 */
export function clearStepAutomation(trackId, step) {
  const track = tracks[trackId];
  if (!track || step < 0 || step >= 16) return;
  track.automation[step] = null;
  document.dispatchEvent(new CustomEvent('automation-update', { detail: { trackId, step } }));
}
