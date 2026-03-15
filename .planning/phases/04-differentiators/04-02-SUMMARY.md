---
phase: 04-differentiators
plan: 02
subsystem: ui
tags: [gyroscope, deviceorientation, ema-smoothing, ios-permission, filter-mapping, pitch-bend]

# Dependency graph
requires:
  - phase: 02-instrument-quality
    provides: filterFX (effects.js) and getActiveSynth (instruments.js) for parameter control
  - phase: 01-audio-foundation
    provides: Tone.js audio engine and effects chain
provides:
  - Gyroscope tilt-to-filter mapping (gamma -> filterFX.frequency, 200-8000 Hz exponential)
  - Gyroscope tilt-to-pitch mapping (beta -> activeSynth detune, -200 to +200 cents)
  - iOS 13+ DeviceOrientationEvent permission flow
  - EMA jitter smoothing (alpha=0.15) for audio parameter stability
  - Gyro toggle button in controls bar with graceful N/A state on desktop
affects: [04-differentiators, 05-platform]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - EMA smoothing for sensor input: alpha=0.15 on DeviceOrientation events before audio parameter updates
    - rampTo(value, 0.05) for smooth Tone.js parameter changes without zipper noise
    - iOS permission gate: DeviceOrientationEvent.requestPermission() checked before event listener attach

key-files:
  created:
    - input/gyroscope.js
    - ui/gyro-panel.js
  modified:
    - index.html
    - styles.css
    - app.js

key-decisions:
  - "Gyroscope EMA alpha=0.15: responsive (sub-100ms) but eliminates zipper noise from rapid sensor jitter"
  - "Exponential gamma-to-frequency mapping: freq = 200 * Math.pow(40, normalizedGamma) gives musical frequency distribution"
  - "setGyroActive(false) resets filter to 4000Hz and detune to 0 — prevents audio state drift when toggled off"
  - "iOS permission requested on first enable (user gesture context required by Safari)"
  - "listener attached once via _listenerAttached flag — avoids duplicate event handlers on re-enable"

patterns-established:
  - "Sensor input pattern: clamp -> EMA smooth -> exponential/linear map -> rampTo audio param"
  - "iOS permission pattern: check requestPermission existence, call in click handler, gate on result"

requirements-completed: [UX-01, UX-02, UX-03]

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 4 Plan 02: Gyroscope Tilt Control Summary

**DeviceOrientation-driven filter sweep and pitch bend with EMA jitter smoothing and iOS 13+ permission gate**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-15T18:19:13Z
- **Completed:** 2026-03-15T18:21:13Z
- **Tasks:** 1
- **Files modified:** 5

## Accomplishments

- Gyroscope module reads DeviceOrientation events with EMA (alpha=0.15) smoothing to eliminate sensor jitter
- Left/right tilt (gamma) maps to filterFX.frequency via exponential curve: 200Hz at full left, 8000Hz at full right
- Forward/back tilt (beta) maps to pitch bend: +200 cents (2 semitones up) forward, -200 cents backward
- iOS 13+ permission flow handled via DeviceOrientationEvent.requestPermission() on first enable
- Gyro toggle button in controls bar; shows "N/A" in disabled state on desktop (graceful degradation)

## Task Commits

Each task was committed atomically:

1. **Task 1: Gyroscope input module with iOS permission and jitter smoothing** - `e8f60a9` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `input/gyroscope.js` - DeviceOrientation handler with EMA smoothing, parameter mapping, iOS permission, enable/disable API
- `ui/gyro-panel.js` - Toggle button UI with iOS denial message and N/A graceful state
- `index.html` - Added `<div id="gyro-panel">` in controls-bar
- `styles.css` - .gyro-control, .gyro-btn, .gyro-btn--active, .gyro-denied-msg styles
- `app.js` - Import and call initGyroPanel(document.getElementById('gyro-panel'))

## Decisions Made

- EMA alpha=0.15: chosen as the best balance between responsiveness and smoothness (audio jitter becomes audible above ~0.3, sluggishness apparent below ~0.05)
- Exponential frequency mapping (200 * 40^x): provides musically natural distribution — slow sweep in bass, faster in treble, mimicking human pitch perception
- setGyroActive(false) resets parameters to known defaults (4000Hz, 0 detune) to prevent audio state drift when toggled off mid-performance
- Listener attached once via `_listenerAttached` guard — avoids duplicate handlers if initGyroscope called multiple times
- Permission requested at first enable (in click handler) — meets iOS requirement of user gesture context for sensor API

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Gyroscope control complete and ready for Phase 5 platform work
- Tilt control integrates cleanly with existing filterFX and activeSynth — no coupling changes needed

---
*Phase: 04-differentiators*
*Completed: 2026-03-15*
