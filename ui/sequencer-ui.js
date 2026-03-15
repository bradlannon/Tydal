/**
 * ui/sequencer-ui.js
 *
 * Step sequencer UI — builds the 16-step drum grid, play/stop button,
 * BPM slider, and tap tempo button; wires cursor sync via 'sequencer-step'
 * CustomEvent from the engine.
 *
 * Exports:
 *   initSequencerUI(containerEl) — call once with a host element
 */

import {
  ROWS,
  NUM_STEPS,
  initTransport,
  startSequencer,
  stopSequencer,
  setStep,
  setBPM,
  getBPM,
  isPlaying,
} from '../engine/sequencer.js';
import { recordTap } from './tap-tempo.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build and mount the sequencer UI inside containerEl.
 * @param {HTMLElement} containerEl — host element (e.g. div#sequencer)
 */
export function initSequencerUI(containerEl) {
  // -----------------------------------------------------------------------
  // Root section
  // -----------------------------------------------------------------------
  const section = document.createElement('div');
  section.className = 'sequencer-section';

  // -----------------------------------------------------------------------
  // Transport row: Play/Stop — BPM slider — Tap
  // -----------------------------------------------------------------------
  const transport = document.createElement('div');
  transport.className = 'sequencer-transport';

  // Play/Stop button
  const playBtn = document.createElement('button');
  playBtn.id = 'seq-play';
  playBtn.className = 'seq-btn';
  playBtn.textContent = 'Play';

  playBtn.addEventListener('click', async () => {
    if (isPlaying()) {
      stopSequencer();
      playBtn.textContent = 'Play';
    } else {
      const currentBPM = Number(bpmSlider.value);
      initTransport(currentBPM);
      await startSequencer();
      playBtn.textContent = 'Stop';
    }
  });

  // BPM control group
  const bpmControl = document.createElement('div');
  bpmControl.className = 'bpm-control';

  const bpmLabel = document.createElement('label');
  bpmLabel.textContent = 'BPM';
  bpmLabel.htmlFor = 'bpm-slider';

  const bpmSlider = document.createElement('input');
  bpmSlider.type = 'range';
  bpmSlider.id = 'bpm-slider';
  bpmSlider.min = '40';
  bpmSlider.max = '240';
  bpmSlider.value = '120';
  bpmSlider.step = '1';

  const bpmDisplay = document.createElement('span');
  bpmDisplay.id = 'bpm-display';
  bpmDisplay.textContent = '120';

  bpmSlider.addEventListener('input', (e) => {
    const bpm = Number(e.target.value);
    setBPM(bpm);
    bpmDisplay.textContent = String(bpm);
  });

  bpmControl.appendChild(bpmLabel);
  bpmControl.appendChild(bpmSlider);
  bpmControl.appendChild(bpmDisplay);

  // Tap tempo button
  const tapBtn = document.createElement('button');
  tapBtn.id = 'tap-tempo';
  tapBtn.className = 'seq-btn';
  tapBtn.textContent = 'Tap';

  tapBtn.addEventListener('pointerdown', () => {
    recordTap();
    // Reflect the new BPM (set by recordTap via setBPM) in the slider and display
    const newBPM = Math.round(getBPM());
    bpmSlider.value = String(newBPM);
    bpmDisplay.textContent = String(newBPM);
  });

  transport.appendChild(playBtn);
  transport.appendChild(bpmControl);
  transport.appendChild(tapBtn);

  // -----------------------------------------------------------------------
  // Grid: 4 rows × 16 steps
  // -----------------------------------------------------------------------
  const gridEl = document.createElement('div');
  gridEl.className = 'sequencer-grid';

  ROWS.forEach((row) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'seq-row';
    rowEl.dataset.row = row;

    // Row label (capitalize first letter)
    const label = document.createElement('span');
    label.className = 'seq-row-label';
    label.textContent = row.charAt(0).toUpperCase() + row.slice(1);
    rowEl.appendChild(label);

    // 16 step cells
    for (let step = 0; step < NUM_STEPS; step++) {
      const cell = document.createElement('div');
      cell.className = 'seq-cell';
      if (step % 4 === 0) {
        cell.classList.add('beat-start');
      }
      cell.dataset.row = row;
      cell.dataset.step = String(step);

      cell.addEventListener('pointerdown', () => {
        const isActive = cell.classList.contains('active');
        cell.classList.toggle('active', !isActive);
        setStep(row, step, !isActive);
      });

      rowEl.appendChild(cell);
    }

    gridEl.appendChild(rowEl);
  });

  // -----------------------------------------------------------------------
  // Cursor sync — listen for engine's sequencer-step events
  // -----------------------------------------------------------------------
  document.addEventListener('sequencer-step', (e) => {
    const step = e.detail.step;

    // Clear all playing highlights
    gridEl.querySelectorAll('.seq-cell').forEach((cell) => {
      cell.classList.remove('playing');
    });

    // When step is -1 (stopped), just clear — nothing to highlight
    if (step < 0) return;

    // Highlight the entire current step column
    gridEl.querySelectorAll(`.seq-cell[data-step="${step}"]`).forEach((cell) => {
      cell.classList.add('playing');
    });
  });

  // -----------------------------------------------------------------------
  // Assemble and mount
  // -----------------------------------------------------------------------
  section.appendChild(transport);
  section.appendChild(gridEl);
  containerEl.appendChild(section);
}
