/**
 * ui/track-buttons.js
 *
 * 4 track selection buttons in a vertical column on the left side of the instrument.
 * Each button shows a colored dot indicator matching the track's TRACK_COLORS entry.
 * Tapping a button calls setActiveTrack(id) which dispatches 'track-change'.
 * Long-press (500ms) toggles track mute and dispatches 'track-mute'.
 *
 * Exports:
 *   initTrackButtons(containerEl)
 */

import {
  TRACK_COLORS,
  tracks,
  getActiveTrackId,
  setActiveTrack,
  setTrackMute,
  getTrackById,
} from '../engine/track-manager.js';

const LONG_PRESS_MS = 500;

/** Labels for each track slot */
const LABELS = ['D', '1', '2', '3'];

let _buttons = [];

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

export function initTrackButtons(containerEl) {
  if (!containerEl) return;

  const col = document.createElement('div');
  col.className = 'track-buttons-col';

  _buttons = [];

  tracks.forEach((track, i) => {
    const btn = document.createElement('button');
    btn.className = 'track-btn';
    btn.dataset.trackId = String(i);
    btn.setAttribute('type', 'button');
    // CSS custom property for active border color
    btn.style.setProperty('--track-color', track.color);

    // Colored dot
    const dot = document.createElement('div');
    dot.className = 'track-color-dot';
    dot.style.background = track.color;
    btn.appendChild(dot);

    // Label
    const label = document.createElement('div');
    label.className = 'track-btn-label';
    label.textContent = LABELS[i];
    btn.appendChild(label);

    // Long-press + tap logic
    let pressTimer = null;
    let isLongPress = false;

    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      isLongPress = false;
      pressTimer = setTimeout(() => {
        isLongPress = true;
        _toggleMute(i, btn);
      }, LONG_PRESS_MS);
    });

    btn.addEventListener('pointerup', () => {
      clearTimeout(pressTimer);
      if (!isLongPress) {
        setActiveTrack(i);
      }
    });

    btn.addEventListener('pointercancel', () => {
      clearTimeout(pressTimer);
    });

    btn.addEventListener('pointerleave', () => {
      clearTimeout(pressTimer);
    });

    _buttons.push(btn);
    col.appendChild(btn);
  });

  containerEl.appendChild(col);

  // Set initial active state
  _refreshActive(getActiveTrackId());

  // Listen for track-change to keep active highlight in sync
  document.addEventListener('track-change', (e) => {
    const trackId = e.detail && e.detail.trackId;
    if (trackId !== undefined) _refreshActive(trackId);
  });

  // Listen for track-mute to keep mute indicator in sync (handles external mute changes)
  document.addEventListener('track-mute', (e) => {
    const { trackId, muted } = e.detail || {};
    if (trackId !== undefined && _buttons[trackId]) {
      _buttons[trackId].classList.toggle('muted', muted);
    }
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _refreshActive(activeId) {
  _buttons.forEach((btn, i) => {
    btn.classList.toggle('active', i === activeId);
  });
}

function _toggleMute(trackId, btn) {
  const track = getTrackById(trackId);
  if (!track) return;
  // setTrackMute updates track.muted, controls audio channel, and dispatches track-mute event
  // The track-mute listener above will update the button's .muted class
  setTrackMute(trackId, !track.muted);
}
