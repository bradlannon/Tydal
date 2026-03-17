/**
 * ui/jog-wheel.js
 *
 * Jog wheel component for browsing presets and sounds.
 * Vertical drag scrolls through the preset list with OLED feedback.
 * Releasing commits the selection by applying the preset.
 *
 * In drum mode (indicated by the caller), the jog wheel shows "808 Kit"
 * and does not scroll — multi-kit support arrives in Phase 8.
 *
 * Exports:
 *   initJogWheel(containerEl, oledEl)
 *   setJogWheelMode(mode)  — 'melodic' | 'drum'
 */

import { applyPreset, getPresetNames } from '../engine/presets.js';
import { showOLED, hideOLED } from './oled-display.js';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let currentIndex = 0;
let isDrumMode = false;
let oledRef = null;
let hideTimer = null;

const NOTCH_PX = 20; // pixels of drag per preset step

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPresets() {
  return getPresetNames();
}

function scheduleHideOLED() {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (oledRef) hideOLED(oledRef);
    hideTimer = null;
  }, 1500);
}

function cancelHideOLED() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * setJogWheelMode(mode) — switch between 'melodic' and 'drum' browsing modes.
 * Called from app.js when the mode-change CustomEvent fires.
 *
 * @param {'melodic'|'drum'} mode
 */
export function setJogWheelMode(mode) {
  isDrumMode = mode === 'drum';
}

/**
 * initJogWheel(containerEl, oledEl) — create and append the jog wheel.
 *
 * @param {HTMLElement} containerEl — target container
 * @param {HTMLElement} oledEl     — shared OLED display element
 */
export function initJogWheel(containerEl, oledEl) {
  if (!containerEl || !oledEl) return;

  oledRef = oledEl;

  // Ensure we start at a valid index
  const presets = getPresets();
  currentIndex = Math.max(0, Math.min(currentIndex, presets.length - 1));

  // Build DOM
  const wheel = document.createElement('div');
  wheel.className = 'jog-wheel';

  const inner = document.createElement('div');
  inner.className = 'jog-wheel-inner';

  const center = document.createElement('div');
  center.className = 'jog-wheel-center';

  inner.appendChild(center);
  wheel.appendChild(inner);

  // ---- Pointer interaction ----
  let dragging = false;
  let startY = 0;
  let startIndex = 0;

  wheel.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    wheel.setPointerCapture(e.pointerId);
    dragging = true;
    startY = e.clientY;
    startIndex = currentIndex;

    wheel.classList.add('active');
    cancelHideOLED();

    // Show current preset/kit name immediately
    if (isDrumMode) {
      showOLED(oledEl, 'Kit', '808 Kit');
    } else {
      const presets = getPresets();
      const name = presets[currentIndex] || '—';
      showOLED(oledEl, 'Preset', name);
    }
  });

  wheel.addEventListener('pointermove', (e) => {
    if (!dragging) return;

    if (isDrumMode) {
      // No scrolling in drum mode (single kit for now)
      return;
    }

    const dy = startY - e.clientY; // upward = positive = next preset
    const presets = getPresets();
    const steps = Math.round(dy / NOTCH_PX);
    let newIndex = startIndex + steps;

    // Circular wrap
    const len = presets.length;
    newIndex = ((newIndex % len) + len) % len;

    if (newIndex !== currentIndex) {
      currentIndex = newIndex;
      showOLED(oledEl, 'Preset', presets[currentIndex]);
    }
  });

  const onPointerEnd = (_e) => {
    if (!dragging) return;
    dragging = false;
    wheel.classList.remove('active');

    if (isDrumMode) {
      // Nothing to apply — single kit
      scheduleHideOLED();
      return;
    }

    // Commit: apply the selected preset
    const presets = getPresets();
    const name = presets[currentIndex];
    if (name) {
      applyPreset(name);
      // Keep OLED visible briefly to confirm selection
      scheduleHideOLED();
    } else {
      hideOLED(oledEl);
    }
  };

  wheel.addEventListener('pointerup', onPointerEnd);
  wheel.addEventListener('pointercancel', onPointerEnd);

  containerEl.appendChild(wheel);
}
