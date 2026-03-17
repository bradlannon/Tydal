---
phase: 08-multi-track-system
plan: "02"
subsystem: ui-track-switching
tags: [multi-track, track-buttons, pad-grid, step-buttons, encoder-row, track-switching]
dependency_graph:
  requires: [08-01]
  provides: [track-buttons-ui, track-aware-pad-colors, track-aware-step-display, per-track-encoder-mapping]
  affects: [pad-grid, step-buttons, encoder-row, app]
tech_stack:
  added: [track-buttons.js]
  patterns: [track-aware-pad-colors, per-track-encoder-mapping, long-press-mute, combined-drum-step-view]
key_files:
  created:
    - public/ui/track-buttons.js
  modified:
    - public/ui/pad-grid.js
    - public/ui/step-buttons.js
    - public/ui/encoder-row.js
    - public/app.js
    - public/index.html
    - public/styles.css
decisions:
  - "buildTrackMelodicMapping targets per-track synth.set() for Cutoff/Res/Attack/Release and per-track effectsChain for Reverb/Delay/Volume — global distortion/vibrato are shared fallbacks since per-track chain lacks those nodes"
  - "Drum step view shows combined pattern (any row active = button active) — individual drum row editing stays in DRM sheet"
  - "DRM sheet open saves lastMelodicTrackId and calls setActiveTrack(0); close restores it — track-change cascade recolors pads and remaps encoders automatically"
  - "instrument-container changed to flex-row; instrument-main inner div wraps encoder-section + pad grid + visualizer; track-buttons-col is 36px flex-shrink:0 on left"
metrics:
  duration: 230s
  completed_date: "2026-03-17"
  tasks_completed: 2
  files_modified: 6
---

# Phase 8 Plan 2: Track Switching UI Summary

**One-liner:** 4 track selection buttons wired to pad color, step display, and per-track encoder mapping via track-change event cascade.

## What Was Built

### track-buttons.js (new)
Vertical column of 4 track selection buttons on the left side of the instrument:
- Each button: `button.track-btn` with a colored dot (`div.track-color-dot`) and label (D/1/2/3)
- `--track-color` CSS custom property drives active border color
- Tap: calls `setActiveTrack(id)` — dispatches `track-change` event
- Long-press (500ms): toggles `track.muted`, adds `.muted` class (dimmed), dispatches `track-mute` CustomEvent
- Listens for `track-change` to keep `.active` class in sync

### pad-grid.js (modified)
- Removed static `export const TRACK_COLOR` — replaced with `getActiveTrack().color` at coloring time
- Added `_hexToRgba(hex, alpha)` helper for building glow strings from any hex color
- Root note color and glow now use active track color dynamically
- Added `track-change` listener: calls `_applyPadColors()` via `requestAnimationFrame` to recolor pads on track switch

### step-buttons.js (modified)
- Added imports: `getActiveTrack` from track-manager, `getStep`/`ROWS` from sequencer
- Added `track-change` listener calling `_refreshButtons()`
- `_refreshButtons()`: if drum track active, shows combined drum view (`ROWS.some(row => getStep(row, i))`); if melodic, existing behavior
- `_onStepTap()`: no-op when drum track is active (drum editing via DRM sheet)

### encoder-row.js (modified)
- Added `getActiveTrack` import from track-manager
- New `buildTrackMelodicMapping(track)` export: builds 9-encoder array targeting `track.synth.set()` for synth params and `track.effectsChain` for reverb/delay/volume
- `mode-change` listener updated: when returning to melodic, applies `buildTrackMelodicMapping(getActiveTrack())` instead of static `MELODIC_MAPPING`
- New `track-change` listener: trackId 0 → DRUM_MAPPING, trackId 1-3 → `buildTrackMelodicMapping(getActiveTrack())`

### app.js (modified)
- Imports `initTrackButtons`, `setActiveTrack`, `getActiveTrackId`
- Calls `initTrackButtons(document.getElementById('track-buttons'))` during init
- `_lastMelodicTrackId` variable tracks the melodic track to restore
- `openSheet()`: DRM sheet saves `_lastMelodicTrackId`, calls `setActiveTrack(0)`, dispatches drum mode
- `closeSheet()`: DRM sheet detected, calls `setActiveTrack(_lastMelodicTrackId)` to restore

### index.html + styles.css (modified)
- `instrument-container` restructured: `<div id="track-buttons">` + `<div class="instrument-main">` wrapper
- `instrument-container`: `flex-direction: row` (was column)
- `.instrument-main`: `flex: 1`, column layout — holds encoder-section + pad grid + visualizer
- `.track-buttons-col`: 36px wide flex column, centered vertically
- `.track-btn`: 32×32px, `border: 2px solid #333`, active state uses `var(--track-color)` with `color-mix` tint
- `.track-color-dot`: 8px circle, `.track-btn-label`: 8px font, `.track-btn.muted`: opacity 0.3

## Architecture

```
Track Button tap
  → setActiveTrack(id) [track-manager.js]
    → dispatches 'track-change' CustomEvent
      ├── track-buttons.js: updates .active class
      ├── pad-grid.js: _applyPadColors() with new track color
      ├── step-buttons.js: _refreshButtons() with track-aware pattern
      └── encoder-row.js: setEncoderMapping(buildTrackMelodicMapping(track)) or DRUM_MAPPING
```

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

All created/modified files confirmed present. Both task commits verified.
- FOUND: public/ui/track-buttons.js
- FOUND: public/index.html (track-buttons div, instrument-main wrapper)
- FOUND: public/styles.css (track-btn, track-buttons-col, instrument-main)
- FOUND: public/ui/pad-grid.js (track-change listener, getActiveTrack)
- FOUND: public/ui/step-buttons.js (track-change listener, drum step view)
- FOUND: public/ui/encoder-row.js (buildTrackMelodicMapping, track-change listener)
- FOUND: public/app.js (initTrackButtons, DRM sheet track switching)
