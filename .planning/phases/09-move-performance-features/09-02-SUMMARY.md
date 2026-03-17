---
phase: 09-move-performance-features
plan: "02"
subsystem: ui
tags: [capture, rolling-buffer, step-sequencer, quantize, toolbar]

# Dependency graph
requires:
  - phase: 08-multi-track-system
    provides: track-manager with getActiveTrack, per-track melodic grids
  - phase: 09-move-performance-features-01
    provides: arpeggiator pattern showing toolbar button conventions

provides:
  - Rolling note buffer (capture.js) continuously recording last 1 measure of noteOn events
  - commitCapture() quantizing buffer entries to 16th note step grid positions
  - CAP toolbar button with green/dim visual feedback and OLED confirmation
  - Track-change cleanup preventing cross-track capture contamination

affects:
  - melodic-sequencer
  - instruments
  - toolbar UI
  - step-buttons display

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Rolling buffer with BPM-aware window pruning on every feedCapture call
    - Retroactive capture: buffer always rolling, commit is the conscious action
    - CSS class toggle for transient button feedback (.captured / .empty)

key-files:
  created:
    - public/engine/capture.js
  modified:
    - public/engine/instruments.js
    - public/app.js
    - public/index.html
    - public/styles.css

key-decisions:
  - "feedCapture called unconditionally on every noteOn — whole point is retroactive capture, buffer must always roll"
  - "bufferDurationMs = (60000 / getBPM()) * 4 recalculated on each feedCapture call for live BPM accuracy"
  - "stepDurationMs = (60000 / BPM) / 4 — one step = one 16th note for quantization grid mapping"
  - "buffer cleared after commitCapture and on track-change to prevent cross-track contamination"
  - "setSelectedNote(lastNote) called after commit so step display shows the captured content"

patterns-established:
  - "Capture pattern: feedX unconditionally in event handler, commitX called deliberately by user action"
  - "Transient button feedback: add CSS class + setTimeout to remove — no state machine needed"

requirements-completed: [MPERF-02]

# Metrics
duration: 5min
completed: 2026-03-17
---

# Phase 9 Plan 02: Capture Mode Summary

**Rolling note buffer (capture.js) lets musicians play freely and retroactively commit the last 1 measure to any melodic track's step grid via the CAP toolbar button**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-17T04:10:00Z
- **Completed:** 2026-03-17T04:15:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- capture.js engine module with rolling BPM-aware buffer, quantize-to-grid commit logic
- feedCapture wired unconditionally into instruments.js noteOn — buffer is always rolling
- CAP button in toolbar with green flash on success, dim flash on empty buffer
- OLED shows "Captured N notes" after successful commit
- Track-switch automatically clears buffer to prevent cross-track note contamination

## Task Commits

1. **Task 1: Capture engine with rolling buffer and quantize-to-grid commit** - `d9ad5d7` (feat)
2. **Task 2: Capture button in toolbar UI** - `93c321f` (feat)

## Files Created/Modified

- `public/engine/capture.js` — Rolling buffer engine: feedCapture, commitCapture, clearCaptureBuffer
- `public/engine/instruments.js` — Added feedCapture import and call in noteOn
- `public/app.js` — CAP button wiring, track-change cleanup listener
- `public/index.html` — CAP button added to toolbar-panels
- `public/styles.css` — #capture-btn.captured (green glow) and #capture-btn.empty (dim) states

## Decisions Made

- `feedCapture` called unconditionally on every noteOn — the whole point is retroactive capture, the buffer must always be rolling
- `bufferDurationMs` recalculated on each `feedCapture` call so live BPM changes are reflected immediately in the window
- `stepDurationMs = (60000 / BPM) / 4` maps timestamps to 16th note steps (one step = one 16th note)
- Buffer cleared both after `commitCapture` and on `track-change` to prevent playing Track 1 notes accidentally ending up in Track 2's grid
- `setSelectedNote(lastNote)` called after commit so the step buttons display shows the captured content immediately

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Capture mode complete; CAP button ships the Ableton Move signature retroactive capture UX
- Ready for Plan 09-03 (swing timing) or remaining phase plans
- capture.js is self-contained and does not conflict with existing recording (recorder.js) functionality

---
*Phase: 09-move-performance-features*
*Completed: 2026-03-17*
