/**
 * ui/fx-panel.js
 *
 * Collapsible effects control panel.
 * Controls: reverb, delay, distortion, filter FX, channel (volume/pan),
 *           vibrato, and tremolo.
 * All controls update effects parameters in real time.
 *
 * Export: initFXPanel(containerEl)
 */

import {
  reverb,
  delay,
  distortion,
  filterFX,
  channel,
  vibrato,
  tremolo,
  filterLFO,
  setLFO,
} from '../engine/effects.js';

/**
 * initFXPanel(containerEl)
 *
 * Creates and appends the effects control panel to containerEl.
 * Panel is collapsible — starts collapsed.
 *
 * @param {HTMLElement} containerEl
 */
export function initFXPanel(containerEl) {
  if (!containerEl) return;

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
  header.innerHTML = '<span>Effects</span><span class="panel-toggle">+</span>';

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
  // Helper: section heading
  // ---------------------------------------------------------------------------
  function makeHeading(text) {
    const el = document.createElement('div');
    el.className = 'panel-heading';
    el.textContent = text;
    return el;
  }

  // ---------------------------------------------------------------------------
  // Reverb
  // ---------------------------------------------------------------------------
  body.appendChild(makeHeading('Reverb'));

  const reverbWet = makeSlider(0, 1, 0.3, 0.01);
  reverbWet.addEventListener('input', () => {
    reverb.wet.value = Number(reverbWet.value);
  });
  body.appendChild(makeRow('Wet', reverbWet));

  const reverbDecay = makeSlider(0.1, 10, 2.5, 0.1);
  reverbDecay.addEventListener('input', () => {
    reverb.decay = Number(reverbDecay.value);
  });
  body.appendChild(makeRow('Decay', reverbDecay));

  // ---------------------------------------------------------------------------
  // Delay
  // ---------------------------------------------------------------------------
  body.appendChild(makeHeading('Delay'));

  const delayWet = makeSlider(0, 1, 0, 0.01);
  delayWet.addEventListener('input', () => {
    delay.wet.value = Number(delayWet.value);
  });
  body.appendChild(makeRow('Wet', delayWet));

  const delayTimeSelect = makeSelect([
    { value: '4n', label: '1/4' },
    { value: '8n', label: '1/8' },
    { value: '16n', label: '1/16' },
  ]);
  delayTimeSelect.value = '8n';
  delayTimeSelect.addEventListener('change', () => {
    delay.delayTime.value = delayTimeSelect.value;
  });
  body.appendChild(makeRow('Time', delayTimeSelect));

  const delayFeedback = makeSlider(0, 0.9, 0.35, 0.01);
  delayFeedback.addEventListener('input', () => {
    delay.feedback.value = Number(delayFeedback.value);
  });
  body.appendChild(makeRow('Feedback', delayFeedback));

  // ---------------------------------------------------------------------------
  // Distortion
  // ---------------------------------------------------------------------------
  body.appendChild(makeHeading('Distortion'));

  const distAmount = makeSlider(0, 1, 0, 0.01);
  distAmount.addEventListener('input', () => {
    const val = Number(distAmount.value);
    distortion.distortion = val;
    distortion.wet.value = val > 0 ? 1 : 0;
  });
  body.appendChild(makeRow('Amount', distAmount));

  // ---------------------------------------------------------------------------
  // Filter FX
  // ---------------------------------------------------------------------------
  body.appendChild(makeHeading('Filter'));

  const filterCutoff = makeSlider(50, 10000, 4000, 10);
  filterCutoff.addEventListener('input', () => {
    filterFX.frequency.value = Number(filterCutoff.value);
  });
  body.appendChild(makeRow('Cutoff', filterCutoff));

  const filterRes = makeSlider(0.1, 20, 1, 0.1);
  filterRes.addEventListener('input', () => {
    filterFX.Q.value = Number(filterRes.value);
  });
  body.appendChild(makeRow('Resonance', filterRes));

  // ---------------------------------------------------------------------------
  // Channel (volume + pan)
  // ---------------------------------------------------------------------------
  body.appendChild(makeHeading('Channel'));

  const chanVol = makeSlider(-40, 0, 0, 1);
  chanVol.addEventListener('input', () => {
    channel.volume.value = Number(chanVol.value);
  });
  body.appendChild(makeRow('Volume', chanVol));

  const chanPan = makeSlider(-1, 1, 0, 0.01);
  chanPan.addEventListener('input', () => {
    channel.pan.value = Number(chanPan.value);
  });
  body.appendChild(makeRow('Pan', chanPan));

  // ---------------------------------------------------------------------------
  // Vibrato
  // ---------------------------------------------------------------------------
  body.appendChild(makeHeading('Vibrato'));

  const vibratoDepth = makeSlider(0, 1, 0, 0.01);
  vibratoDepth.addEventListener('input', () => {
    const depth = Number(vibratoDepth.value);
    vibrato.depth.value = depth;
    vibrato.wet.value = depth > 0 ? 1 : 0;
  });
  body.appendChild(makeRow('Depth', vibratoDepth));

  const vibratoRate = makeSlider(1, 10, 5, 0.1);
  vibratoRate.addEventListener('input', () => {
    vibrato.frequency.value = Number(vibratoRate.value);
  });
  body.appendChild(makeRow('Rate', vibratoRate));

  // ---------------------------------------------------------------------------
  // Tremolo
  // ---------------------------------------------------------------------------
  body.appendChild(makeHeading('Tremolo'));

  const tremoloDepth = makeSlider(0, 1, 0, 0.01);
  tremoloDepth.addEventListener('input', () => {
    const depth = Number(tremoloDepth.value);
    tremolo.depth.value = depth;
    tremolo.wet.value = depth > 0 ? 1 : 0;
  });
  body.appendChild(makeRow('Depth', tremoloDepth));

  const tremoloRate = makeSlider(1, 10, 4, 0.1);
  tremoloRate.addEventListener('input', () => {
    tremolo.frequency.value = Number(tremoloRate.value);
  });
  body.appendChild(makeRow('Rate', tremoloRate));

  // ---------------------------------------------------------------------------
  // Filter LFO (sweep)
  // ---------------------------------------------------------------------------
  body.appendChild(makeHeading('Filter LFO'));

  const filterLFODepth = makeSlider(0, 1, 0, 0.01);
  filterLFODepth.addEventListener('input', () => {
    const depth = Number(filterLFODepth.value);
    if (depth > 0) {
      setLFO('filterLFO', { enabled: true });
    } else {
      setLFO('filterLFO', { enabled: false });
    }
  });
  body.appendChild(makeRow('Enable', filterLFODepth));

  const filterLFORate = makeSlider(0.1, 10, 2, 0.1);
  filterLFORate.addEventListener('input', () => {
    setLFO('filterLFO', { frequency: Number(filterLFORate.value) });
  });
  body.appendChild(makeRow('Rate', filterLFORate));
}
