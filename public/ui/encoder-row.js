/**
 * ui/encoder-row.js
 *
 * Row of 9 rotary encoders wired to synth/FX parameters, with OLED
 * contextual display that activates during interaction and fades dark when idle.
 *
 * Layout: OLED display on top, below that a flex row with encoders (flex:1)
 * and the jog wheel slot (flex-shrink:0) side by side.
 *
 * Default: MELODIC_MAPPING — Filter Cutoff, Filter Res, Reverb, Delay,
 *          Attack, Release, Distortion, Vibrato, Volume.
 *
 * DRUM_MAPPING — BPM, drum volume, shared FX, and named placeholders for
 * per-voice params (Phase 8 will expose them via getDrumParams()).
 *
 * Mode switching: listen for 'mode-change' CustomEvent dispatched from app.js.
 */

import { createEncoder } from './encoder.js';
import { createOLED, showOLED, hideOLED, formatValue } from './oled-display.js';
import {
  reverb,
  delay,
  distortion,
  filterFX,
  vibrato,
  masterVolume,
} from '../engine/effects.js';
import { setSynthParam } from '../engine/instruments.js';
import { drumBus } from '../engine/drums.js';
import { setBPM, getBPM } from '../engine/sequencer.js';
import { getActiveTrack } from '../engine/track-manager.js';

// ---------------------------------------------------------------------------
// Parameter mappings
// ---------------------------------------------------------------------------

/**
 * MELODIC_MAPPING — default encoder layout for melodic (synth) mode.
 * Each entry: { name, min, max, value, step, unit, apply(val) }
 */
export const MELODIC_MAPPING = [
  {
    name: 'Cutoff',
    min: 50,
    max: 10000,
    value: 2800,
    step: 10,
    unit: 'Hz',
    apply(val) { filterFX.frequency.value = val; },
  },
  {
    name: 'Res',
    min: 0.1,
    max: 20,
    value: 1,
    step: 0.1,
    unit: '',
    apply(val) { filterFX.Q.value = val; },
  },
  {
    name: 'Reverb',
    min: 0,
    max: 1,
    value: 0.3,
    step: 0.01,
    unit: '',
    apply(val) { reverb.wet.value = val; },
  },
  {
    name: 'Delay',
    min: 0,
    max: 1,
    value: 0,
    step: 0.01,
    unit: '',
    apply(val) { delay.wet.value = val; },
  },
  {
    name: 'Attack',
    min: 0.001,
    max: 2,
    value: 0.02,
    step: 0.001,
    unit: 's',
    apply(val) { setSynthParam({ envelope: { attack: val } }); },
  },
  {
    name: 'Release',
    min: 0.01,
    max: 3,
    value: 0.4,
    step: 0.01,
    unit: 's',
    apply(val) { setSynthParam({ envelope: { release: val } }); },
  },
  {
    name: 'Dist',
    min: 0,
    max: 1,
    value: 0,
    step: 0.01,
    unit: '',
    apply(val) {
      distortion.distortion = val;
      distortion.wet.value = val > 0 ? 1 : 0;
    },
  },
  {
    name: 'Vibrato',
    min: 0,
    max: 1,
    value: 0,
    step: 0.01,
    unit: '',
    apply(val) {
      vibrato.depth.value = val;
      vibrato.wet.value = val > 0 ? 1 : 0;
    },
  },
  {
    name: 'Volume',
    min: -40,
    max: 0,
    value: -6,
    step: 1,
    unit: 'dB',
    apply(val) { masterVolume.volume.rampTo(val, 0.05); },
  },
];

/**
 * DRUM_MAPPING — encoder layout for drum mode.
 * Encoders 1-4 are named placeholders (individual drum voice params are
 * module-private in drums.js; per-voice controls arrive in Phase 8).
 * Encoders 5-9 are fully functional.
 */
export const DRUM_MAPPING = [
  // Placeholders (no direct param exposed yet — Phase 8 will add getDrumParams())
  { name: 'Kick Tone',  min: 40,   max: 80,  value: 60,  step: 1,    unit: '',    apply(_val) {} },
  { name: 'Snare Tone', min: 0,    max: 1,   value: 0.5, step: 0.01, unit: '',    apply(_val) {} },
  { name: 'HH Decay',   min: 0.01, max: 0.5, value: 0.1, step: 0.01, unit: 's',  apply(_val) {} },
  { name: 'Clap Verb',  min: 0,    max: 1,   value: 0.3, step: 0.01, unit: '',    apply(_val) {} },
  // Functional encoders
  {
    name: 'Reverb',
    min: 0,    max: 1,   value: 0.2, step: 0.01, unit: '',
    apply(val) { reverb.wet.value = val; },
  },
  {
    name: 'Delay',
    min: 0,    max: 1,   value: 0,   step: 0.01, unit: '',
    apply(val) { delay.wet.value = val; },
  },
  {
    name: 'BPM',
    min: 40,   max: 240, value: 120, step: 1,    unit: 'bpm',
    apply(val) { setBPM(val); },
  },
  {
    name: 'Drum Vol',
    min: -40,  max: 0,   value: 0,   step: 1,    unit: 'dB',
    apply(val) { drumBus.volume.rampTo(val, 0.05); },
  },
  {
    name: 'Master Vol',
    min: -40,  max: 0,   value: -6,  step: 1,    unit: 'dB',
    apply(val) { masterVolume.volume.rampTo(val, 0.05); },
  },
];

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let oledEl = null;
let encoderEls = [];
/** Each slot holds the current live param config (swapped on mode-change) */
let liveParams = MELODIC_MAPPING.map(p => ({ ...p }));

// ---------------------------------------------------------------------------
// Build helpers
// ---------------------------------------------------------------------------

/**
 * Build OLED display string: "FormattedValue unit"
 */
function oledValue(param, val) {
  const formatted = formatValue(val, param.step);
  const unit = param.unit ? ' ' + param.unit : '';
  return formatted + unit;
}

/**
 * Wire a single encoder element to its live param slot via an index.
 * The onChange handler reads liveParams[i] at call time, so swapping
 * liveParams entries via setEncoderMapping() takes effect immediately.
 */
function wireEncoderAtIndex(encoderEl, i, oled) {
  encoderEl.addEventListener('encoder-start', () => {
    const param = liveParams[i];
    showOLED(oled, param.name, oledValue(param, encoderEl.getValue()));
  });

  encoderEl.addEventListener('encoder-end', () => {
    hideOLED(oled);
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * getOLEDElement() — returns the shared OLED display element.
 * Used by app.js to pass the oled reference to initJogWheel.
 *
 * @returns {HTMLElement|null}
 */
export function getOLEDElement() {
  return oledEl;
}

/**
 * initEncoderRow(containerEl) — build the encoder section and append to container.
 * Creates OLED on top, then an .encoder-controls-row containing:
 *   - .encoder-row (9 encoders, flex:1)
 *   - a .jog-wheel-slot div (flex-shrink:0) for the jog wheel
 *
 * @param {HTMLElement} containerEl
 */
export function initEncoderRow(containerEl) {
  if (!containerEl) return;

  const section = document.createElement('div');
  section.className = 'encoder-section';

  // OLED display (full width on top)
  oledEl = createOLED();
  section.appendChild(oledEl);

  // Controls row: encoders left, jog wheel right
  const controlsRow = document.createElement('div');
  controlsRow.className = 'encoder-controls-row';

  // Encoder row
  const row = document.createElement('div');
  row.className = 'encoder-row';

  encoderEls = [];
  liveParams = MELODIC_MAPPING.map(p => ({ ...p }));

  liveParams.forEach((param, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'encoder-wrapper';

    const encoderEl = createEncoder({
      name: param.name,
      min: param.min,
      max: param.max,
      value: param.value,
      step: param.step,
      onChange: (val) => {
        const live = liveParams[i];
        live.apply(val);
        showOLED(oledEl, live.name, oledValue(live, val));
      },
    });

    wireEncoderAtIndex(encoderEl, i, oledEl);
    encoderEls.push(encoderEl);

    // Tiny label
    const label = document.createElement('div');
    label.className = 'encoder-label';
    label.textContent = param.name;

    wrapper.appendChild(encoderEl);
    wrapper.appendChild(label);
    row.appendChild(wrapper);
  });

  // Jog wheel slot — populated by app.js via initJogWheel(jogSlot, oledEl)
  const jogSlot = document.createElement('div');
  jogSlot.className = 'jog-wheel-slot';
  jogSlot.id = 'jog-wheel-slot';

  controlsRow.appendChild(row);
  controlsRow.appendChild(jogSlot);
  section.appendChild(controlsRow);
  containerEl.appendChild(section);
}

/**
 * setEncoderMapping(mappingArray) — swap parameter bindings at runtime.
 * Updates liveParams entries in-place and resets encoder visual positions
 * and labels. The onChange closures reference liveParams[i] by index, so
 * they automatically call the new param's apply() function.
 *
 * @param {Array} mappingArray - Array of parameter config objects
 */
export function setEncoderMapping(mappingArray) {
  if (!oledEl || encoderEls.length === 0) return;

  const count = Math.min(mappingArray.length, encoderEls.length);
  for (let i = 0; i < count; i++) {
    const param = mappingArray[i];

    // Update live param slot in-place so existing onChange closures pick it up
    liveParams[i] = { ...param };

    const encoderEl = encoderEls[i];

    // For BPM encoder in drum mode, initialize from current Transport BPM
    let initValue = param.value;
    if (param.name === 'BPM') {
      try { initValue = getBPM() || param.value; } catch (_) { /* no-op */ }
    }

    // Reset encoder to new param's value
    encoderEl.setValue(initValue);
    encoderEl.dataset.name = param.name;

    // Update label
    const wrapper = encoderEl.parentElement;
    if (wrapper) {
      const label = wrapper.querySelector('.encoder-label');
      if (label) label.textContent = param.name;
    }
  }
}

// ---------------------------------------------------------------------------
// Per-track melodic mapping builder
// ---------------------------------------------------------------------------

/**
 * buildTrackMelodicMapping(track) — build a MELODIC_MAPPING-shaped array
 * targeting the given track's independent synth and effects chain.
 *
 * @param {Object} track — a melodic track object from track-manager.js
 * @returns {Array}
 */
export function buildTrackMelodicMapping(track) {
  const { synth, effectsChain } = track;
  return [
    {
      name: 'Cutoff',
      min: 50,
      max: 10000,
      value: 2800,
      step: 10,
      unit: 'Hz',
      apply(val) {
        // PolySynth filter frequency via set()
        synth.set({ filter: { frequency: val } });
      },
    },
    {
      name: 'Res',
      min: 0.1,
      max: 20,
      value: 1,
      step: 0.1,
      unit: '',
      apply(val) {
        synth.set({ filter: { Q: val } });
      },
    },
    {
      name: 'Reverb',
      min: 0,
      max: 1,
      value: 0.3,
      step: 0.01,
      unit: '',
      apply(val) { effectsChain.reverb.wet.value = val; },
    },
    {
      name: 'Delay',
      min: 0,
      max: 1,
      value: 0,
      step: 0.01,
      unit: '',
      apply(val) { effectsChain.delay.wet.value = val; },
    },
    {
      name: 'Attack',
      min: 0.001,
      max: 2,
      value: 0.02,
      step: 0.001,
      unit: 's',
      apply(val) { synth.set({ envelope: { attack: val } }); },
    },
    {
      name: 'Release',
      min: 0.01,
      max: 3,
      value: 0.4,
      step: 0.01,
      unit: 's',
      apply(val) { synth.set({ envelope: { release: val } }); },
    },
    {
      name: 'Dist',
      min: 0,
      max: 1,
      value: 0,
      step: 0.01,
      unit: '',
      apply(val) {
        // No per-track distortion node; route to global distortion as fallback
        distortion.distortion = val;
        distortion.wet.value = val > 0 ? 1 : 0;
      },
    },
    {
      name: 'Vibrato',
      min: 0,
      max: 1,
      value: 0,
      step: 0.01,
      unit: '',
      apply(val) {
        // No per-track vibrato node; route to global vibrato as fallback
        vibrato.depth.value = val;
        vibrato.wet.value = val > 0 ? 1 : 0;
      },
    },
    {
      name: 'Volume',
      min: -40,
      max: 0,
      value: 0,
      step: 1,
      unit: 'dB',
      apply(val) { effectsChain.channel.volume.rampTo(val, 0.05); },
    },
  ];
}

// ---------------------------------------------------------------------------
// Mode-change listener — dispatched from app.js toolbar handler
// ---------------------------------------------------------------------------

document.addEventListener('mode-change', (e) => {
  const mode = e.detail && e.detail.mode;
  if (mode === 'drum') {
    setEncoderMapping(DRUM_MAPPING);
  } else {
    // Apply mapping for the currently active melodic track
    const track = getActiveTrack();
    if (track && track.type === 'melodic') {
      setEncoderMapping(buildTrackMelodicMapping(track));
    } else {
      setEncoderMapping(MELODIC_MAPPING);
    }
  }
});

// ---------------------------------------------------------------------------
// Track-change listener — dispatched from track-manager.js setActiveTrack()
// ---------------------------------------------------------------------------

document.addEventListener('track-change', (e) => {
  const trackId = e.detail && e.detail.trackId;
  if (trackId === 0) {
    // Drum track — apply drum mapping
    setEncoderMapping(DRUM_MAPPING);
  } else {
    // Melodic track — build mapping from the track's own synth/effects
    const track = getActiveTrack();
    if (track && track.type === 'melodic') {
      setEncoderMapping(buildTrackMelodicMapping(track));
    }
  }
});
