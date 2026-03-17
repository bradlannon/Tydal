/**
 * app.js — Tydal bootstrap
 *
 * Wires the signal chain, initializes the Push 3-style grid,
 * input handlers, panels, and transport controls.
 */

import { patchFromURL, loadPatch } from './engine/preset-storage.js';
import { initTransport, startSequencer, stopSequencer, isPlaying } from './engine/sequencer.js';
import { ensureAudioStarted } from './engine/audio-engine.js';

// Import melodic sequencer — arms its Sequence on the shared Transport
import './engine/melodic-sequencer.js';

import './ui/overlay.js';
import { initPadGrid } from './ui/pad-grid.js';
import { initSynthPanel } from './ui/synth-panel.js';
import { initFXPanel } from './ui/fx-panel.js';
import { initSequencerUI } from './ui/sequencer-ui.js';
import { initVisualizer } from './ui/visualizer-ui.js';
import { initKeyboard } from './input/keyboard.js';
import { initTouch } from './input/touch.js';
import { initMIDI } from './input/midi.js';
import { initGyroPanel } from './ui/gyro-panel.js';
import { initNoteRepeatUI } from './ui/note-repeat-ui.js';
import { initMacroPanel } from './ui/macro-panel.js';
import { initPresetBrowser } from './ui/preset-browser.js';
import { initEncoderRow, getOLEDElement } from './ui/encoder-row.js';
import { initJogWheel, setJogWheelMode } from './ui/jog-wheel.js';

// Initialize Push 3-style grid
const instrumentEl = document.getElementById('instrument');
const pushGrid = initPadGrid(instrumentEl);
initKeyboard();
initTouch(pushGrid);
initMIDI();

// Initialize panels (inside bottom sheets)
initSynthPanel(document.getElementById('synth-panel'));
initFXPanel(document.getElementById('fx-panel'));
initSequencerUI(document.getElementById('sequencer'));
initVisualizer(document.getElementById('visualizer'));
initGyroPanel(document.getElementById('gyro-panel'));
initNoteRepeatUI(document.getElementById('note-repeat-control'));
initMacroPanel(document.getElementById('macro-panel'));
initPresetBrowser(document.getElementById('preset-browser'));

// Initialize encoder row (9 rotary encoders + OLED display above pad grid)
initEncoderRow(document.getElementById('encoder-section'));

// Initialize jog wheel — placed in the slot created by initEncoderRow
const jogSlot = document.getElementById('jog-wheel-slot');
const oledEl = getOLEDElement();
if (jogSlot && oledEl) {
  initJogWheel(jogSlot, oledEl);
}

// Help panel
const helpBtn = document.getElementById('help-btn');
const helpPanel = document.getElementById('help-panel');
if (helpBtn && helpPanel) {
  helpBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    helpPanel.hidden = !helpPanel.hidden;
  });
  document.addEventListener('click', (e) => {
    if (!helpPanel.hidden && !helpPanel.contains(e.target) && e.target !== helpBtn) {
      helpPanel.hidden = true;
    }
  });
}

// ---------------------------------------------------------------------------
// Play/Stop button — controls shared Transport (drums + melodic)
// ---------------------------------------------------------------------------
const playBtn = document.getElementById('play-btn');
if (playBtn) {
  playBtn.addEventListener('click', async () => {
    await ensureAudioStarted();
    if (isPlaying()) {
      stopSequencer();
      playBtn.textContent = '▶';
      playBtn.classList.remove('playing');
    } else {
      initTransport();
      await startSequencer();
      playBtn.textContent = '■';
      playBtn.classList.add('playing');
    }
  });
}

// ---------------------------------------------------------------------------
// Bottom sheet system — one sheet open at a time
// ---------------------------------------------------------------------------
const backdrop = document.getElementById('sheet-backdrop');
const toolbarBtns = document.querySelectorAll('.toolbar-btn[data-sheet]');
let activeSheet = null;

/**
 * Dispatch mode-change CustomEvent so encoder-row.js and jog-wheel.js
 * can react to drum/melodic mode transitions.
 */
function dispatchModeChange(mode) {
  document.dispatchEvent(new CustomEvent('mode-change', { detail: { mode } }));
  setJogWheelMode(mode);
}

function openSheet(sheetId) {
  closeSheet();
  const sheet = document.getElementById(sheetId);
  if (!sheet) return;
  sheet.classList.add('open');
  backdrop.classList.add('visible');
  activeSheet = sheetId;
  toolbarBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.sheet === sheetId);
  });
  // Switch encoder/jog-wheel mapping based on active sheet
  dispatchModeChange(sheetId === 'seq-sheet' ? 'drum' : 'melodic');
}

function closeSheet() {
  if (!activeSheet) return;
  const sheet = document.getElementById(activeSheet);
  if (sheet) sheet.classList.remove('open');
  backdrop.classList.remove('visible');
  activeSheet = null;
  toolbarBtns.forEach((btn) => btn.classList.remove('active'));
  // Return to melodic mode when sheet closes
  dispatchModeChange('melodic');
}

toolbarBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const sheetId = btn.dataset.sheet;
    if (activeSheet === sheetId) closeSheet();
    else openSheet(sheetId);
  });
});

backdrop.addEventListener('click', closeSheet);

// Preset browser sheet open/close events (dispatched by synth-panel and preset-browser)
document.addEventListener('open-preset-browser', () => openSheet('preset-browser-sheet'));
document.addEventListener('close-preset-browser', () => closeSheet());

// Restore shared patch from URL
const urlPatch = patchFromURL();
if (urlPatch) loadPatch(urlPatch);

console.log('Tydal ready');
