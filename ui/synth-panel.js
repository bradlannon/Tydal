/**
 * ui/synth-panel.js
 *
 * Collapsible synth parameter control panel.
 * Controls: preset selector, waveform, ADSR envelope, filter cutoff/resonance/type.
 * All controls update the active synth in real time via setSynthParam() and applyPreset().
 *
 * Export: initSynthPanel(containerEl)
 */

import { setSynthParam } from '../engine/instruments.js';
import { applyPreset, getPresetNames } from '../engine/presets.js';

/**
 * initSynthPanel(containerEl)
 *
 * Creates and appends the synth control panel to containerEl.
 * Panel is collapsible — starts collapsed.
 *
 * @param {HTMLElement} containerEl
 */
export function initSynthPanel(containerEl) {
  if (!containerEl) return;

  // Track whether current preset is FM (FM presets have fixed oscillator)
  let isFMPreset = false;

  // ---------------------------------------------------------------------------
  // Build panel structure
  // ---------------------------------------------------------------------------
  const panel = document.createElement('div');
  panel.className = 'panel-section';

  const header = document.createElement('div');
  header.className = 'panel-header';
  header.setAttribute('role', 'button');
  header.setAttribute('tabindex', '0');
  header.setAttribute('aria-expanded', 'false');
  header.innerHTML = '<span>Synth</span><span class="panel-toggle">+</span>';

  const body = document.createElement('div');
  body.className = 'panel-body';

  panel.appendChild(header);
  panel.appendChild(body);
  containerEl.appendChild(panel);

  // Toggle collapse
  function togglePanel() {
    const expanded = body.classList.toggle('expanded');
    header.setAttribute('aria-expanded', String(expanded));
    header.querySelector('.panel-toggle').textContent = expanded ? '−' : '+';
  }
  header.addEventListener('click', togglePanel);
  header.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePanel(); }
  });

  // ---------------------------------------------------------------------------
  // Helper: create a labeled control row
  // ---------------------------------------------------------------------------
  function makeRow(labelText, inputEl) {
    const row = document.createElement('div');
    row.className = 'panel-row';

    const label = document.createElement('span');
    label.className = 'panel-label';
    label.textContent = labelText;

    row.appendChild(label);
    row.appendChild(inputEl);
    return row;
  }

  // ---------------------------------------------------------------------------
  // Helper: create a range input
  // ---------------------------------------------------------------------------
  function makeSlider(min, max, value, step) {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.step = step;
    return slider;
  }

  // ---------------------------------------------------------------------------
  // Helper: create a select input
  // ---------------------------------------------------------------------------
  function makeSelect(options) {
    const select = document.createElement('select');
    select.className = 'panel-select';
    for (const { value, label } of options) {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label || value;
      select.appendChild(opt);
    }
    return select;
  }

  // ---------------------------------------------------------------------------
  // Preset selector
  // ---------------------------------------------------------------------------
  const presetSelect = makeSelect(
    getPresetNames().map((name) => ({ value: name, label: name }))
  );
  presetSelect.value = 'Warm Pad'; // default
  presetSelect.addEventListener('change', () => {
    const preset = applyPreset(presetSelect.value);
    if (preset) {
      isFMPreset = preset.type === 'fm';
      waveformSelect.disabled = isFMPreset;
      waveformSelect.style.opacity = isFMPreset ? '0.4' : '1';
    }
  });
  body.appendChild(makeRow('Preset', presetSelect));

  // ---------------------------------------------------------------------------
  // Waveform selector
  // ---------------------------------------------------------------------------
  const waveformSelect = makeSelect([
    { value: 'sine', label: 'Sine' },
    { value: 'square', label: 'Square' },
    { value: 'sawtooth', label: 'Sawtooth' },
    { value: 'triangle', label: 'Triangle' },
  ]);
  waveformSelect.value = 'sawtooth'; // default matches Warm Pad
  waveformSelect.addEventListener('change', () => {
    if (!isFMPreset) {
      setSynthParam({ oscillator: { type: waveformSelect.value } });
    }
  });
  body.appendChild(makeRow('Wave', waveformSelect));

  // ---------------------------------------------------------------------------
  // ADSR sliders
  // ---------------------------------------------------------------------------
  const adsrDefs = [
    { key: 'attack',  label: 'Attack',  min: 0.001, max: 2,   value: 0.02,  step: 0.01 },
    { key: 'decay',   label: 'Decay',   min: 0.01,  max: 2,   value: 0.1,   step: 0.01 },
    { key: 'sustain', label: 'Sustain', min: 0,     max: 1,   value: 0.85,  step: 0.01 },
    { key: 'release', label: 'Release', min: 0.01,  max: 3,   value: 0.4,   step: 0.01 },
  ];

  for (const def of adsrDefs) {
    const slider = makeSlider(def.min, def.max, def.value, def.step);
    slider.addEventListener('input', () => {
      setSynthParam({ envelope: { [def.key]: Number(slider.value) } });
    });
    body.appendChild(makeRow(def.label, slider));
  }

  // ---------------------------------------------------------------------------
  // Filter controls
  // ---------------------------------------------------------------------------

  // Filter type
  const filterTypeSelect = makeSelect([
    { value: 'lowpass', label: 'Lowpass' },
    { value: 'highpass', label: 'Highpass' },
    { value: 'bandpass', label: 'Bandpass' },
  ]);
  filterTypeSelect.addEventListener('change', () => {
    setSynthParam({ filter: { type: filterTypeSelect.value } });
  });
  body.appendChild(makeRow('Flt Type', filterTypeSelect));

  // Cutoff slider
  const cutoffSlider = makeSlider(50, 10000, 2800, 10);
  cutoffSlider.addEventListener('input', () => {
    setSynthParam({ filter: { frequency: Number(cutoffSlider.value) } });
  });
  body.appendChild(makeRow('Cutoff', cutoffSlider));

  // Resonance slider
  const resonanceSlider = makeSlider(0.1, 20, 1, 0.1);
  resonanceSlider.addEventListener('input', () => {
    setSynthParam({ filter: { Q: Number(resonanceSlider.value) } });
  });
  body.appendChild(makeRow('Resonance', resonanceSlider));
}
