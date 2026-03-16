/**
 * ui/preset-browser.js
 *
 * Preset browser bottom sheet with tap-to-preview flow.
 * Shows factory presets and user patches in a scrollable list.
 * Tapping a preset plays a C major chord preview; pressing Load commits
 * the selection and closes the sheet; Cancel restores the original sound.
 *
 * Exports:
 *   initPresetBrowser(sheetContentEl)  — build UI inside a sheet container
 *   refreshPresetBrowser()             — rebuild the list (call after saving patches)
 */

import { applyPreset, getPresetNames } from '../engine/presets.js';
import { captureCurrentPatch, loadPatch, listPatches } from '../engine/preset-storage.js';
import { noteOn, noteOff, releaseAll } from '../engine/instruments.js';
import { ensureAudioStarted } from '../engine/audio-engine.js';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

/** Patch captured before the first preview — restored on Cancel. */
let backupPatch = null;

/** Identifier of the currently previewing preset ('factory:name' or 'user:index'). */
let currentPreview = null;

/** Timeout IDs for scheduled noteOff calls — cleared on cancel/confirm. */
let previewTimeouts = [];

/** Reference to the sheet content element — used by refreshPresetBrowser(). */
let containerEl = null;

// ---------------------------------------------------------------------------
// Preview chord
// ---------------------------------------------------------------------------

const PREVIEW_NOTES = ['C4', 'E4', 'G4'];
const PREVIEW_VELOCITY = 0.6;
const PREVIEW_DURATION_MS = 800;

/**
 * Play C major chord for PREVIEW_DURATION_MS ms.
 * Cleans up any in-flight timeouts first.
 */
async function playPreviewChord() {
  clearPreviewTimeouts();

  await ensureAudioStarted();

  for (const note of PREVIEW_NOTES) {
    noteOn(note, PREVIEW_VELOCITY);
  }

  const t = setTimeout(() => {
    for (const note of PREVIEW_NOTES) {
      noteOff(note);
    }
  }, PREVIEW_DURATION_MS);

  previewTimeouts.push(t);
}

function clearPreviewTimeouts() {
  for (const t of previewTimeouts) {
    clearTimeout(t);
  }
  previewTimeouts = [];
}

// ---------------------------------------------------------------------------
// Internal: close the preset browser sheet
// ---------------------------------------------------------------------------

function closeBrowserSheet() {
  // Dispatch a custom event so app.js closeSheet() handles it
  document.dispatchEvent(new CustomEvent('close-preset-browser'));
}

// ---------------------------------------------------------------------------
// Preview handler
// ---------------------------------------------------------------------------

/**
 * Handle a tap on a preset or patch item.
 *
 * @param {'factory'|'user'} type
 * @param {string|number} identifier  — preset name for factory, index for user
 * @param {HTMLElement} itemEl        — the tapped .preset-item element
 */
function handlePreview(type, identifier, itemEl) {
  // Capture backup before the very first preview this session
  if (!backupPatch) {
    backupPatch = captureCurrentPatch('_browser_backup');
  }

  // Release any playing notes before switching sound
  releaseAll();

  // Apply the sound
  if (type === 'factory') {
    applyPreset(identifier);
  } else {
    const patches = listPatches();
    if (patches[identifier]) {
      loadPatch(patches[identifier]);
    }
  }

  // Update highlighting
  if (containerEl) {
    containerEl.querySelectorAll('.preset-item').forEach((el) => {
      el.classList.remove('previewing');
    });
  }
  itemEl.classList.add('previewing');

  currentPreview = type === 'factory' ? `factory:${identifier}` : `user:${identifier}`;

  // Play the audition chord
  playPreviewChord();
}

// ---------------------------------------------------------------------------
// Confirm / Cancel
// ---------------------------------------------------------------------------

function confirmSelection() {
  backupPatch = null;
  currentPreview = null;
  clearPreviewTimeouts();
  closeBrowserSheet();
}

function cancelSelection() {
  if (backupPatch) {
    releaseAll();
    loadPatch(backupPatch);
  }
  backupPatch = null;
  currentPreview = null;
  clearPreviewTimeouts();
  releaseAll();
  closeBrowserSheet();
}

// ---------------------------------------------------------------------------
// Build UI
// ---------------------------------------------------------------------------

/**
 * Build (or rebuild) the preset browser inside sheetContentEl.
 *
 * @param {HTMLElement} el
 */
function buildUI(el) {
  el.innerHTML = '';

  // ---- Factory Presets ----
  const factoryHeading = document.createElement('h3');
  factoryHeading.className = 'preset-section-title';
  factoryHeading.textContent = 'Factory Presets';
  el.appendChild(factoryHeading);

  for (const name of getPresetNames()) {
    const item = document.createElement('div');
    item.className = 'preset-item';
    item.textContent = name;
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');

    item.addEventListener('click', () => handlePreview('factory', name, item));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePreview('factory', name, item); }
    });

    el.appendChild(item);
  }

  // ---- My Patches ----
  const userHeading = document.createElement('h3');
  userHeading.className = 'preset-section-title';
  userHeading.textContent = 'My Patches';
  el.appendChild(userHeading);

  const patches = listPatches();

  if (patches.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'preset-empty';
    empty.textContent = 'No saved patches';
    el.appendChild(empty);
  } else {
    patches.forEach((patch, index) => {
      const item = document.createElement('div');
      item.className = 'preset-item';
      item.textContent = patch.name || `Patch ${index + 1}`;
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');

      item.addEventListener('click', () => handlePreview('user', index, item));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePreview('user', index, item); }
      });

      el.appendChild(item);
    });
  }

  // ---- Action buttons ----
  const actions = document.createElement('div');
  actions.className = 'preset-browser-actions';

  const loadBtn = document.createElement('button');
  loadBtn.className = 'panel-btn';
  loadBtn.textContent = 'Load';
  loadBtn.addEventListener('click', confirmSelection);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'panel-btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', cancelSelection);

  actions.appendChild(cancelBtn);
  actions.appendChild(loadBtn);
  el.appendChild(actions);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize the preset browser inside the given sheet content element.
 * Should be called once from app.js after the DOM is ready.
 *
 * @param {HTMLElement} el — the #preset-browser container
 */
export function initPresetBrowser(el) {
  if (!el) return;
  containerEl = el;
  buildUI(el);
}

/**
 * Rebuild the preset browser list.
 * Call after saving or deleting user patches so the browser stays current.
 */
export function refreshPresetBrowser() {
  if (containerEl) {
    // Preserve any in-flight backup state across refresh
    buildUI(containerEl);
  }
}
