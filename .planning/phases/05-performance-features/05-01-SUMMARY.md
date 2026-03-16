---
phase: 05-performance-features
plan: 01
subsystem: ui
tags: [expression, touch, pointer-events, ema-smoothing, pitch-bend, filter-sweep]

# Dependency graph
requires:
  - phase: 02-instrument-quality
    provides: setSynthParam() API for runtime synth param mutation
  - phase: 02-instrument-quality
    provides: filterFX export from effects.js for filter sweep
  - phase: 01-audio-foundation
    provides: pointer event infrastructure in touch.js

provides:
  - MPE-lite per-pad expression: X→detune (-200 to +200 cents), Y→filter (200-6000 Hz)
  - EMA-smoothed real-time expression with alpha=0.3
  - Visual 'expressing' CSS class feedback on held pads
  - pad-expression.js engine module with full pointer lifecycle API

affects:
  - future MIDI/keyboard expression (same setSynthParam/filterFX pattern)
  - Phase 5 plans that modify touch.js or effects chain

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-pointer state via Map<pointerId, entry> for multi-touch expression tracking"
    - "EMA smoothing (alpha=0.3) for gesture input: smoothX = alpha*raw + (1-alpha)*prev"
    - "Coordinate normalization: (clientX - rect.left) / rect.width clamped to 0-1"
    - "Y-axis inversion: top=high freq (musically natural), bottom=low"

key-files:
  created:
    - engine/pad-expression.js
  modified:
    - input/touch.js
    - styles.css

key-decisions:
  - "EMA alpha=0.3 for pad expression: more responsive than gyroscope (0.15) because finger contact has inherent mechanical smoothing"
  - "releasePointer receives gridEl to remove expressing class — avoids global DOM query at module scope"
  - "stopExpression resets detune to -8 (matching instruments.js default) and filter to 4000Hz"
  - "pointermove listener on gridEl (not document) — expression only active while pointer within grid"

patterns-established:
  - "Engine expression module pattern: Map<pointerId, state> with start/update/stop/has lifecycle"

requirements-completed: [EXPR-01]

# Metrics
duration: 7min
completed: 2026-03-16
---

# Phase 5 Plan 01: MPE-Lite Pad Expression Summary

**Real-time per-finger pitch bend and filter sweep on note pads via X/Y position tracking with EMA smoothing**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-16T05:36:15Z
- **Completed:** 2026-03-16T05:43:38Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `engine/pad-expression.js` — tracks per-pointer X/Y within pad bounds, maps to detune and filter with EMA smoothing
- Integrated expression lifecycle into `input/touch.js` — pointerdown starts, pointermove updates, release stops and resets
- Added `.note-cell.expressing` CSS — accent border glow while finger is actively expressing on a pad

## Task Commits

1. **Task 1: Pad expression engine module** - `550b1bf` (feat)
2. **Task 2: Touch handler integration and expression CSS** - `c850ef5` (feat)

## Files Created/Modified

- `engine/pad-expression.js` — Expression engine: EMA smoothing, X→detune mapping, Y→filter mapping, pointer lifecycle
- `input/touch.js` — Import and integrate startExpression/updateExpression/stopExpression, add pointermove listener
- `styles.css` — `.note-cell.expressing` with accent border and inset glow, 100ms transition

## Decisions Made

- EMA alpha=0.3 (more responsive than gyroscope's 0.15) — finger contact provides inherent mechanical smoothing
- `releasePointer` receives gridEl parameter so it can remove the 'expressing' class from the correct pad element
- `stopExpression` resets detune to -8 to match `subtractiveSynth` default in instruments.js
- pointermove listener scoped to gridEl, not document — expression only fires when pointer is within the grid

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Expression engine module is ready; the same `setSynthParam`/`filterFX` pattern can be extended for MIDI channel pressure (aftertouch) or keyboard slide
- Remaining Phase 5 plans can integrate with expression by checking `hasExpression(pointerId)`

---
*Phase: 05-performance-features*
*Completed: 2026-03-16*
