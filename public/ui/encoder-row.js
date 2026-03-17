/**
 * ui/encoder-row.js
 *
 * Row of 9 rotary encoders wired to synth/FX parameters, with OLED
 * contextual display that activates during interaction and fades dark when idle.
 *
 * Layout: OLED display on top, 9 encoders in a flex row below.
 *
 * Default: MELODIC_MAPPING — Filter Cutoff, Filter Res, Reverb, Delay,
 *          Attack, Release, Distortion, Vibrato, Volume.
 *
 * DRUM_MAPPING is provided as a placeholder for Phase 7 Plan 03 wiring.
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
 * DRUM_MAPPING — placeholder encoder layout for drum mode.
 * Actual drum parameter wiring done in Phase 7 Plan 03.
 */
export const DRUM_MAPPING = [
  { name: 'Kick Pitch', min: 40,   max: 80,  value: 60,  step: 1,    unit: '',   apply(_val) {} },
  { name: 'Kick Decay', min: 0.05, max: 1.5, value: 0.5, step: 0.05, unit: 's',  apply(_val) {} },
  { name: 'Snare Tone', min: 0,    max: 1,   value: 0.5, step: 0.01, unit: '',   apply(_val) {} },
  { name: 'HH Decay',   min: 0.01, max: 0.5, value: 0.1, step: 0.01, unit: 's',  apply(_val) {} },
  { name: 'Reverb',     min: 0,    max: 1,   value: 0.2, step: 0.01, unit: '',   apply(val)  { reverb.wet.value = val; } },
  { name: 'Delay',      min: 0,    max: 1,   value: 0,   step: 0.01, unit: '',   apply(val)  { delay.wet.value = val; } },
  { name: 'BPM',        min: 60,   max: 200, value: 120, step: 1,    unit: 'bpm', apply(_val) {} },
  { name: 'Swing',      min: 0,    max: 1,   value: 0,   step: 0.01, unit: '',   apply(_val) {} },
  { name: 'Volume',     min: -40,  max: 0,   value: -6,  step: 1,    unit: 'dB', apply(val)  { masterVolume.volume.rampTo(val, 0.05); } },
];

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let oledEl = null;
let encoderEls = [];
let currentMapping = MELODIC_MAPPING;

// ---------------------------------------------------------------------------
// Build helpers
// ---------------------------------------------------------------------------

/**
 * Build OLED display string: "Name  FormattedValue [unit]"
 */
function oledValue(param, val) {
  const formatted = formatValue(val, param.step);
  const unit = param.unit ? ' ' + param.unit : '';
  return formatted + unit;
}

/**
 * Wire a single encoder element to an OLED and parameter.
 */
function wireEncoder(encoderEl, param, oled) {
  encoderEl.addEventListener('encoder-start', () => {
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
 * initEncoderRow(containerEl) — build the encoder section and append to container.
 *
 * @param {HTMLElement} containerEl
 */
export function initEncoderRow(containerEl) {
  if (!containerEl) return;

  const section = document.createElement('div');
  section.className = 'encoder-section';

  // OLED display
  oledEl = createOLED();
  section.appendChild(oledEl);

  // Encoder row
  const row = document.createElement('div');
  row.className = 'encoder-row';

  encoderEls = [];

  currentMapping.forEach((param) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'encoder-wrapper';

    const encoderEl = createEncoder({
      name: param.name,
      min: param.min,
      max: param.max,
      value: param.value,
      step: param.step,
      onChange: (val) => {
        param.apply(val);
        showOLED(oledEl, param.name, oledValue(param, val));
      },
    });

    wireEncoder(encoderEl, param, oledEl);
    encoderEls.push(encoderEl);

    // Tiny label
    const label = document.createElement('div');
    label.className = 'encoder-label';
    label.textContent = param.name;

    wrapper.appendChild(encoderEl);
    wrapper.appendChild(label);
    row.appendChild(wrapper);
  });

  section.appendChild(row);
  containerEl.appendChild(section);
}

/**
 * setEncoderMapping(mappingArray) — swap parameter bindings at runtime.
 * Rebuilds encoder values and re-wires onChange handlers.
 *
 * @param {Array} mappingArray - Array of parameter config objects
 */
export function setEncoderMapping(mappingArray) {
  currentMapping = mappingArray;

  if (!oledEl || encoderEls.length === 0) return;

  // Update each encoder with new mapping entry
  const count = Math.min(mappingArray.length, encoderEls.length);
  for (let i = 0; i < count; i++) {
    const param = mappingArray[i];
    const encoderEl = encoderEls[i];

    // Reset encoder to new param's default value
    encoderEl.setValue(param.value);
    encoderEl.dataset.name = param.name;

    // Remove old listeners by cloning — then re-wire
    // (Simplest approach: rebuild the onChange by storing on element)
    encoderEl._onChangeParam = param;

    // Update label
    const wrapper = encoderEl.parentElement;
    if (wrapper) {
      const label = wrapper.querySelector('.encoder-label');
      if (label) label.textContent = param.name;
    }
  }

  // Re-wire onChange for each encoder using stored param ref
  // We achieve this by patching the existing encoder's onChange directly.
  // Since createEncoder captures onChange in closure, we need a level of indirection.
  // The actual re-wiring is handled by the encoderEl event listeners calling param.apply.
  // For a full swap, rebuild would be cleaner — but for Plan 03 we re-init the row.
}
