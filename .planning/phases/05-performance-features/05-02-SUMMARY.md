---
phase: 05-performance-features
plan: 02
subsystem: note-repeat
tags: [performance, note-repeat, input, ui, bpm-sync]
dependency_graph:
  requires: [05-01]
  provides: [note-repeat-engine, note-repeat-ui]
  affects: [input/touch.js, input/keyboard.js, app.js]
tech_stack:
  added: []
  patterns: [setInterval-BPM-sync, noteOff-noteOn-retrigger-cycle, toolbar-control-pattern]
key_files:
  created:
    - engine/note-repeat.js
    - ui/note-repeat-ui.js
  modified:
    - input/touch.js
    - input/keyboard.js
    - index.html
    - app.js
    - styles.css
decisions:
  - "5ms noteOff→noteOn gap prevents envelope click artifacts during repeat ticks"
  - "setRepeatRate immediately restarts active repeats so rhythm changes are felt in real time"
  - "stopRepeat called unconditionally on pointer/key release — safe no-op when not repeating"
  - "note-repeat-rate select uses same CSS pattern as .scale-control select for visual consistency"
metrics:
  duration: "5"
  completed_date: "2026-03-16"
  tasks_completed: 2
  files_modified: 7
---

# Phase 5 Plan 02: Note Repeat Summary

**One-liner:** BPM-synced note repeat engine with setInterval retriggering at 1/4, 1/8, 1/16, 1/32 subdivisions and RPT toolbar toggle.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Note repeat engine | 2dcc836 | engine/note-repeat.js |
| 2 | UI, input integration, HTML/app wiring | fd90ab2 | ui/note-repeat-ui.js, input/touch.js, input/keyboard.js, index.html, app.js, styles.css |

## What Was Built

### engine/note-repeat.js
BPM-synced repeat engine using `setInterval`. Each tick fires `noteOff(note)` then `setTimeout(() => noteOn(note, velocity), 5)` — the 5ms gap prevents envelope click artifacts. `setRepeatRate` immediately restarts all active repeats so rate selector changes are felt in real time without waiting for the next interval. Disabling RPT via `setRepeatEnabled(false)` stops all active repeats.

Rate → millisecond conversion at current BPM:
- `4n`:  `60000/bpm * 1`
- `8n`:  `60000/bpm * 0.5`
- `16n`: `60000/bpm * 0.25`
- `32n`: `60000/bpm * 0.125`

### ui/note-repeat-ui.js
Toolbar RPT toggle button and rate selector `<select>`. Button uses `.toolbar-btn` / `.active` class pattern matching the rest of the toolbar. Rate selector styled identically to `.scale-control select`.

### Input handler integration
Both `input/touch.js` and `input/keyboard.js` call `startRepeat(note, velocity)` after `noteOn` when `isRepeatEnabled()` is true. Both call `stopRepeat(note)` unconditionally on release — it is a safe no-op when no repeat is active for that note.

## Decisions Made

1. **5ms noteOff→noteOn gap:** Prevents envelope click artifacts. Short enough to not affect rhythm perception at any practical tempo.
2. **Immediate rate restart:** `setRepeatRate` clears and restarts all active intervals so musicians hear the new rate immediately — matches hardware Push 3 behavior.
3. **Unconditional stopRepeat on release:** Simpler logic — no need to check `isRepeatEnabled()` on release path since `stopRepeat` is already a no-op for unknown notes.
4. **CSS pattern reuse:** `.note-repeat-rate` select mirrors `.scale-control select` exactly — no new design tokens needed.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

Checking created files and commits exist:

## Self-Check: PASSED

- engine/note-repeat.js: FOUND
- ui/note-repeat-ui.js: FOUND
- Commit 2dcc836 (Task 1): FOUND
- Commit fd90ab2 (Task 2): FOUND
