/**
 * engine/preset-storage.js
 *
 * Patch serialization, localStorage CRUD, and URL sharing for Tydal.
 *
 * Patch schema (version 1):
 * {
 *   version: 1,
 *   name: string,
 *   timestamp: number,
 *   synth: {
 *     factoryPreset: string | null,
 *     type: 'subtractive' | 'fm',
 *     params: { ... }
 *   },
 *   effects: {
 *     reverb: { decay, wet },
 *     delay: { delayTime, feedback, wet },
 *     distortion: { distortion, wet },
 *     filter: { frequency, type, Q },
 *     channel: { volume, pan },
 *     vibrato: { frequency, depth, wet },
 *     tremolo: { frequency, depth, wet },
 *     filterLFO: { frequency, min, max, type, enabled }
 *   }
 * }
 *
 * Exports:
 *   captureCurrentPatch  — Serialize current synth + effects state
 *   savePatch            — Persist patch to localStorage (capped at 50)
 *   loadPatch            — Restore synth + effects from patch object
 *   listPatches          — Return all saved patches from localStorage
 *   deletePatch          — Remove a patch by index
 *   patchToURL           — Encode patch as base64 URL hash fragment
 *   patchFromURL         — Decode patch from current URL hash
 */

import * as Tone from 'tone';
import { PRESETS, applyPreset } from './presets.js';
import { getActiveSynth, switchInstrument } from './instruments.js';
import {
  reverb, delay, distortion, filterFX, channel, vibrato, tremolo, filterLFO,
  setLFO,
} from './effects.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'tydal-patches';
const MAX_PATCHES = 50;
const SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// captureCurrentPatch(name)
// ---------------------------------------------------------------------------

/**
 * Read the full current synth + effects state and return a patch object.
 *
 * @param {string} name — Human-readable patch name
 * @returns {Object} Patch object matching the schema above
 */
export function captureCurrentPatch(name = 'My Patch') {
  const synth = getActiveSynth();
  const synthState = synth.get();

  // Detect FM by presence of harmonicity property
  const isFM = 'harmonicity' in synthState;

  // Build synth section from live state
  const synthSection = {
    factoryPreset: null,          // will be detected below if applicable
    type: isFM ? 'fm' : 'subtractive',
    params: synthState,
  };

  // Check if current state matches a known factory preset (by name)
  // This is a best-effort: we don't track the active preset name here,
  // so we skip factory preset detection and always store full params.
  // loadPatch can still use applyPreset if factoryPreset is explicitly set.

  // Read effects state
  const reverbState = reverb.get();
  const delayState = delay.get();
  const distortionState = distortion.get();
  const filterState = filterFX.get();
  const channelState = channel.get();
  const vibratoState = vibrato.get();
  const tremoloState = tremolo.get();

  const filterLFOEnabled = filterLFO.state === 'started';
  const filterLFOState = filterLFO.get();

  return {
    version: SCHEMA_VERSION,
    name: String(name),
    timestamp: Date.now(),
    synth: synthSection,
    effects: {
      reverb: {
        decay: reverbState.decay,
        wet: reverbState.wet,
      },
      delay: {
        delayTime: delayState.delayTime,
        feedback: delayState.feedback,
        wet: delayState.wet,
      },
      distortion: {
        distortion: distortionState.distortion,
        wet: distortionState.wet,
      },
      filter: {
        frequency: filterState.frequency,
        type: filterState.type,
        Q: filterState.Q,
      },
      channel: {
        volume: channelState.volume,
        pan: channelState.pan,
      },
      vibrato: {
        frequency: vibratoState.frequency,
        depth: vibratoState.depth,
        wet: vibratoState.wet,
      },
      tremolo: {
        frequency: tremoloState.frequency,
        depth: tremoloState.depth,
        wet: tremoloState.wet,
      },
      filterLFO: {
        frequency: filterLFOState.frequency,
        min: filterLFOState.min,
        max: filterLFOState.max,
        type: filterLFOState.type,
        enabled: filterLFOEnabled,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// savePatch(patch)
// ---------------------------------------------------------------------------

/**
 * Persist a patch to localStorage.
 * Appends to the patches array and caps at MAX_PATCHES (removes oldest).
 *
 * @param {Object} patch — Patch object from captureCurrentPatch()
 */
export function savePatch(patch) {
  const patches = listPatches();
  patches.push(patch);

  // Prune oldest if over cap
  while (patches.length > MAX_PATCHES) {
    patches.shift();
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patches));
  } catch (err) {
    console.warn('savePatch: localStorage write failed', err);
  }
}

// ---------------------------------------------------------------------------
// loadPatch(patch)
// ---------------------------------------------------------------------------

/**
 * Apply a patch object to the currently active synth and effects chain.
 * Reconstructs the synth if needed (factory preset or custom FM/subtractive).
 *
 * @param {Object} patch — Patch object matching the schema
 */
export function loadPatch(patch) {
  if (!patch || patch.version !== SCHEMA_VERSION) {
    console.warn('loadPatch: invalid or unsupported patch version', patch);
    return;
  }

  // -- Restore synth --
  if (patch.synth.factoryPreset && PRESETS[patch.synth.factoryPreset]) {
    // Factory preset — use applyPreset for full reconstruction
    applyPreset(patch.synth.factoryPreset);
  } else {
    // Custom patch — rebuild PolySynth from saved params
    const VoiceType = patch.synth.type === 'fm' ? Tone.FMSynth : Tone.Synth;
    const newSynth = new Tone.PolySynth(VoiceType, {
      maxPolyphony: 8,
      options: patch.synth.params,
    });
    switchInstrument(newSynth);
  }

  // -- Restore effects --
  const fx = patch.effects;

  if (fx.reverb) {
    reverb.set({ decay: fx.reverb.decay, wet: fx.reverb.wet });
  }
  if (fx.delay) {
    delay.set({ delayTime: fx.delay.delayTime, feedback: fx.delay.feedback, wet: fx.delay.wet });
  }
  if (fx.distortion) {
    distortion.set({ distortion: fx.distortion.distortion, wet: fx.distortion.wet });
  }
  if (fx.filter) {
    filterFX.set({ frequency: fx.filter.frequency, type: fx.filter.type, Q: fx.filter.Q });
  }
  if (fx.channel) {
    channel.set({ volume: fx.channel.volume, pan: fx.channel.pan });
  }
  if (fx.vibrato) {
    vibrato.set({ frequency: fx.vibrato.frequency, depth: fx.vibrato.depth, wet: fx.vibrato.wet });
  }
  if (fx.tremolo) {
    tremolo.set({ frequency: fx.tremolo.frequency, depth: fx.tremolo.depth, wet: fx.tremolo.wet });
  }
  if (fx.filterLFO) {
    setLFO('filterLFO', {
      frequency: fx.filterLFO.frequency,
      min: fx.filterLFO.min,
      max: fx.filterLFO.max,
      type: fx.filterLFO.type,
      enabled: fx.filterLFO.enabled,
    });
  }
}

// ---------------------------------------------------------------------------
// listPatches()
// ---------------------------------------------------------------------------

/**
 * Return all saved patches from localStorage.
 *
 * @returns {Object[]} Array of patch objects (may be empty)
 */
export function listPatches() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('listPatches: failed to parse localStorage data', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// deletePatch(index)
// ---------------------------------------------------------------------------

/**
 * Remove a saved patch by its index in the patches array.
 *
 * @param {number} index — Zero-based index into listPatches()
 */
export function deletePatch(index) {
  const patches = listPatches();
  if (index < 0 || index >= patches.length) {
    console.warn(`deletePatch: index ${index} out of bounds`);
    return;
  }
  patches.splice(index, 1);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patches));
  } catch (err) {
    console.warn('deletePatch: localStorage write failed', err);
  }
}

// ---------------------------------------------------------------------------
// patchToURL(patch)
// ---------------------------------------------------------------------------

/**
 * Encode a patch as a base64 URL hash fragment.
 * Returns a full URL: origin + pathname + '#patch=' + encoded
 *
 * @param {Object} patch — Patch object
 * @returns {string} Full shareable URL
 */
export function patchToURL(patch) {
  const json = JSON.stringify(patch);
  // Use encodeURIComponent before btoa to handle non-ASCII characters safely
  const encoded = btoa(encodeURIComponent(json));
  const base = window.location.origin + window.location.pathname;
  return base + '#patch=' + encoded;
}

// ---------------------------------------------------------------------------
// patchFromURL()
// ---------------------------------------------------------------------------

/**
 * Decode a patch from the current page's URL hash fragment.
 * Expects format: #patch=<base64-encoded-json>
 *
 * @returns {Object|null} Decoded patch object, or null if not present/invalid
 */
export function patchFromURL() {
  const hash = window.location.hash;
  if (!hash || !hash.includes('#patch=')) {
    return null;
  }

  try {
    const encoded = hash.slice(hash.indexOf('#patch=') + 7);
    const json = decodeURIComponent(atob(encoded));
    const patch = JSON.parse(json);

    // Validate schema version
    if (!patch || typeof patch.version === 'undefined') {
      console.warn('patchFromURL: missing version field in patch');
      return null;
    }

    return patch;
  } catch (err) {
    console.warn('patchFromURL: failed to decode URL patch', err);
    return null;
  }
}
