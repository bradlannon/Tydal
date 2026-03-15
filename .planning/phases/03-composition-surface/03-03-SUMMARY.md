---
phase: 03-composition-surface
plan: 03
subsystem: audio-engine
tags: [recorder, tone.js, quantization, overdub, loop-recording, melody]

requires:
  - phase: 03-01
    provides: engine/sequencer.js with isPlaying() and Transport loop
  - phase: 03-02
    provides: ui/sequencer-ui.js transport bar to append recording controls
provides:
  - engine/recorder.js with quantized loop recording, overdub stack, and undo
  - Recording controls in sequencer UI (Rec button, quantize selector, Undo, Clear, overdub count)
affects: [04-differentiators, any future MIDI or pattern features]

tech-stack:
  added: [Tone.Part for loop-synchronized melody playback]
  patterns:
    - "One Tone.Part per recording pass — pushed to overdubStack after stop, loop enabled for replay"
    - "Circular import: instruments.js imports recorder.js; recorder.js imports instruments.js — safe because both only reference functions (not module-init values)"
    - "Auto-start pattern: pressing Record implies Play — sequencer starts if not running"
    - "quantization via Math.round(rawPos/subdivSeconds)*subdivSeconds then modulo measureLength"

key-files:
  created: [engine/recorder.js]
  modified: [engine/instruments.js, ui/sequencer-ui.js]

key-decisions:
  - "Circular import instruments.js <-> recorder.js is safe: both files only reference exported functions (never module-init values), so ES module deferred binding resolves cleanly"
  - "Record button auto-starts sequencer (DAW pattern) — pressing Record implies Play, no separate manual start needed"
  - "activePart.loop = false during recording, true after stopRecording() — prevents double-triggering during live capture"
  - "overdubStack uses push/pop for simple LIFO undo — last pass is always the newest layer"
  - "clearAllRecordings() handles in-progress recording pass (resets recBtn state in UI)"

requirements-completed: [COMP-04, COMP-05]

duration: ~5min
completed: 2026-03-15
---

# Phase 3 Plan 03: Melody Recording Engine Summary

**Tone.Part-based quantized loop recorder with overdub stacking and undo — captures notes from all input sources (keyboard, touch, MIDI) via instruments.js hook, plays back on each Transport loop**

## Performance

- **Duration:** ~5 minutes
- **Started:** 2026-03-15T16:34:43Z
- **Completed:** 2026-03-15T16:40:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Melody loop recorder with 4-level quantization snap (1/4, 1/8, 1/16, 1/32 notes)
- Overdub stacking: each recording pass creates an independent Tone.Part that loops indefinitely; passes stack without erasing prior recordings
- Undo removes the most recent overdub pass only (LIFO pop + dispose)
- Recording hook in noteOn() captures all input sources (keyboard, touch, MIDI) uniformly
- Recording controls in sequencer UI: Rec button (auto-starts playback), quantize selector, Undo/Clear buttons, live overdub count display

## Task Commits

1. **Task 1: Create recorder engine with quantized recording, overdub, and undo** - `b1e5d64` (feat)
2. **Task 2: Add recording controls to sequencer UI** - `336d6a5` (feat)

## Files Created/Modified

- `engine/recorder.js` — Quantized loop recorder: startRecording/stopRecording/recordNote/undoLastOverdub/clearAllRecordings/setQuantization/getQuantization/isRecording/getOverdubCount
- `engine/instruments.js` — Added import of isRecording/recordNote from recorder.js; call recordNote inside noteOn() after voice stealing
- `ui/sequencer-ui.js` — Added recorder.js imports and 5 new controls: Rec button, quantize select, Undo button, Clear button, overdub count span

## Decisions Made

- Circular import between instruments.js and recorder.js is safe: ES module deferred binding resolves correctly because both modules only export functions (no module-init side effects that reference the other module's exports)
- Auto-start sequencer on record press (standard DAW convention) rather than requiring user to press Play first
- `activePart.loop = false` during recording, switched to `true` after stop — prevents the Part from replaying during the live capture pass which would double-trigger notes

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Melody recording engine complete and integrated — all three composition surface features (drum sequencer, sequencer UI, melody recorder) are now working
- Ready for Phase 4 differentiators: preset system, pattern export, visual/MIDI enhancements
- No blockers

---
*Phase: 03-composition-surface*
*Completed: 2026-03-15*
