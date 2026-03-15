---
phase: 03-composition-surface
plan: 02
subsystem: ui
tags: [sequencer, drum-grid, tap-tempo, bpm, transport, tone.js, css]

requires:
  - phase: 03-composition-surface/03-01
    provides: "engine/sequencer.js and engine/drums.js — Transport, grid state, sequencer-step event, setBPM/getBPM"
  - phase: 01-audio-foundation
    provides: "app.js bootstrap pattern, index.html shell, styles.css dark theme variables"
provides:
  - "ui/sequencer-ui.js: initSequencerUI(containerEl) — 4x16 drum grid, play/stop, BPM slider, tap tempo, cursor sync"
  - "ui/tap-tempo.js: recordTap() — sliding window BPM calculation from tap rhythm"
affects: [04-differentiators, any plan adding more sequencer tracks or pattern storage]

tech-stack:
  added: []
  patterns:
    - "initX(containerEl) UI module pattern — all DOM built programmatically, no innerHTML"
    - "pointerdown on grid cells for fast mobile response; CSS classes drive visual state"
    - "sequencer-step CustomEvent listener for cursor sync — UI never polls engine state"
    - "tap tempo: performance.now() sliding window, setTimeout reset on silence"

key-files:
  created: [ui/sequencer-ui.js, ui/tap-tempo.js]
  modified: [index.html, app.js, styles.css]

key-decisions:
  - "Play button calls initTransport(currentBPM) before startSequencer() each time — ensures Transport loop is configured even on first press"
  - "After each tap, getBPM() result is synced back to the slider and display — tap tempo sets BPM in the engine and the UI reflects it"
  - "CSS flex: 1 on .seq-cell with max-width: 36px — cells fill available width on small screens and cap on desktop"
  - "beat-start class on steps 0,4,8,12 at grid-creation time — avoids runtime modulo checks per step event"
  - "#bpm-slider flex: none overrides global input[type=range] flex:1 to keep slider a fixed 100px width"

patterns-established:
  - "Sequencer cursor: querySelectorAll('.seq-cell') remove all 'playing', then querySelectorAll('[data-step=N]') add 'playing'"
  - "Tap tempo: tapTimes array with MAX_TAPS=8 sliding window, TAP_TIMEOUT_MS=2000 setTimeout reset"

requirements-completed: [COMP-01, COMP-02, COMP-03]

duration: ~2min
completed: 2026-03-15
---

# Phase 3 Plan 02: Sequencer UI Summary

**16-step drum grid with visual step cursor, play/stop Transport control, live BPM slider, and tap-tempo — wired into the app shell via initSequencerUI(containerEl)**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-15T16:34:24Z
- **Completed:** 2026-03-15T16:36:02Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Built `ui/tap-tempo.js` with sliding window averaging over up to 8 taps, 2s silence reset using `performance.now()`
- Built `ui/sequencer-ui.js` with programmatic DOM generation for a 4-row x 16-step grid, transport controls, and `sequencer-step` event cursor sync
- Wired sequencer into `app.js` and `index.html`; added complete CSS for grid, transport, and active/playing/beat-start states

## Task Commits

Each task was committed atomically:

1. **Task 1: Create sequencer UI with grid, cursor, play/stop, and BPM controls** - `e0a677a` (feat)
2. **Task 2: Wire sequencer UI into app shell and add styles** - `30b3ad8` (feat)

## Files Created/Modified

- `ui/sequencer-ui.js` — initSequencerUI(containerEl): builds 4x16 grid, transport bar, wires all events and cursor sync
- `ui/tap-tempo.js` — recordTap(): sliding window BPM calculation from taps, calls setBPM on engine
- `index.html` — added `<div id="sequencer">` between fx-panel and controls-bar
- `app.js` — imports and calls initSequencerUI(document.getElementById('sequencer'))
- `styles.css` — sequencer section styles: .sequencer-section, .seq-row, .seq-cell, active/playing/beat-start states

## Decisions Made

- Play button calls `initTransport(currentBPM)` before `startSequencer()` every time — ensures Transport loop is (re)configured even on first press after a stop
- After each tap, `getBPM()` is read back and reflected in the slider + display — tap tempo sets the engine BPM and the UI stays in sync
- `#bpm-slider { flex: none }` overrides the global `input[type=range] { flex: 1 }` rule to keep the slider a fixed 100px width inside the flex transport bar
- `beat-start` class added to cells at grid-creation time on steps 0, 4, 8, 12 — no runtime modulo computation needed per step event

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Sequencer UI is fully functional: grid programming, playback, BPM slider, tap tempo, cursor sync all working
- Phase 4 differentiators (chord modes, arpeggiator, preset saving) can build on the established initX(containerEl) pattern
- Pattern storage / serialization would require engine/sequencer.js additions (getGrid/setGrid) — APIs already exist

---
*Phase: 03-composition-surface*
*Completed: 2026-03-15*
