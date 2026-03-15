---
phase: 02-instrument-quality
plan: "03"
subsystem: input
tags: [velocity, midi, web-midi-api, lfo, tone.js, vibrato, tremolo]

# Dependency graph
requires:
  - phase: 02-instrument-quality/02-01
    provides: noteOn(note, velocity) and noteOff(note) signatures in instruments.js
  - phase: 02-instrument-quality/02-02
    provides: pad-grid.js setPadActive and grid-rebuild event for MIDI visual feedback
provides:
  - Touch pads send velocity 0.4-1.0 derived from pointer movement speed
  - Web MIDI API handler in input/midi.js with note-on/off and velocity mapping
  - Graceful MIDI degradation (no crash on unsupported browsers)
  - Vibrato and tremolo in signal chain (wet=0 default, enabled via setLFO)
  - filterLFO connected to filterFX.frequency for filter sweep
  - setLFO(target, params) function for runtime LFO control
affects: [03-composition-tools, 04-differentiators]

# Tech tracking
tech-stack:
  added: [Web MIDI API (browser native)]
  patterns:
    - pointer-speed velocity measurement using clientY delta / timestamp delta
    - graceful API degradation pattern (feature check + isSecureContext guard before use)
    - wet=0 by default for modulators in signal chain (in chain but inaudible)
    - fire-and-forget async init pattern for optional browser features

key-files:
  created:
    - input/midi.js
  modified:
    - input/touch.js
    - engine/effects.js
    - app.js

key-decisions:
  - "Velocity range 0.4-1.0: minimum 0.4 ensures notes are never silent; 3 px/ms maps to 1.0"
  - "First tap defaults to 0.6 (mid-range): no prior Y position to compute speed from"
  - "Tremolo must be .start()ed even at wet=0: Tone.Tremolo oscillator requires explicit start"
  - "filterLFO not started by default: only enabled when user activates via setLFO"
  - "connectInstrument routes into vibrato (chain head) instead of directly to reverb"

patterns-established:
  - "Velocity pattern: pointer speed 0-3 px/ms maps to 0.4-1.0 velocity range"
  - "MIDI status parsing: command = status & 0xf0, note-on velocity=0 treated as note-off"
  - "LFO pattern: insert at wet=0, expose setLFO() for runtime enable/configure"

requirements-completed: [PERF-01, PERF-02, PERF-03, SYNTH-04]

# Metrics
duration: 10min
completed: 2026-03-15
---

# Phase 2 Plan 03: Velocity, MIDI Input, and LFO Modulation Summary

**Velocity-sensitive touch input (0.4-1.0 from pointer speed), Web MIDI keyboard support with note-on/off/velocity, and LFO modulation chain (vibrato, tremolo, filter sweep) added to Tydal's instrument engine**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-15T17:55:13Z
- **Completed:** 2026-03-15T18:05:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Touch pads now send velocity based on how fast the pointer moves when tapping — harder/faster taps are louder (0.4 minimum ensures notes never sound silent)
- Web MIDI API handler in `input/midi.js`: note-on (with velocity mapping), note-off, running status note-off (velocity=0), device hotplug, graceful no-op on non-MIDI browsers
- Vibrato and tremolo inserted as first two nodes in the effects chain; filterLFO oscillates filterFX.frequency — all three controllable at runtime via `setLFO()`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add velocity to touch input and create MIDI handler** - `730c244` (feat)
2. **Task 2: Add LFO modulation nodes to effects chain** - `8cf1bb5` (feat)

## Files Created/Modified

- `input/touch.js` - Added pointer-speed velocity measurement (clientY delta / time delta), first-tap default 0.6, velocity reset on grid-rebuild
- `input/midi.js` - New file: Web MIDI API handler with initMIDI(), graceful degradation, hotplug support
- `engine/effects.js` - Added vibrato, tremolo, filterLFO nodes; updated signal chain and connectInstrument; added setLFO() export
- `app.js` - Added fire-and-forget initMIDI() call after initTouch

## Decisions Made

- Velocity range 0.4-1.0: minimum of 0.4 ensures that even a motionless tap (phone resting on pad) produces an audible note — never silent
- First tap defaults to 0.6 mid-range because there is no prior Y position to compute movement speed from
- Tremolo `.start()` called even at wet=0: Tone.Tremolo's internal oscillator must be running or it won't activate when wet is raised later
- filterLFO not started by default — starting an LFO immediately on load would audibly sweep the filter even when the user hasn't enabled it
- connectInstrument now routes synths into vibrato (chain head) rather than directly into reverb — this is required for vibrato to be in the signal path

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Velocity, MIDI, and LFO infrastructure are complete and ready for Phase 3 (Composition Tools)
- UI controls for setLFO() (rate, depth, wet knobs) can be wired in any subsequent phase
- MIDI requires HTTPS in production — existing concern tracked in STATE.md blockers
- Real iOS hardware testing still recommended for velocity sensitivity validation (tracked blocker from Phase 2)

## Self-Check: PASSED

All files verified present. Both task commits confirmed in git log.

---
*Phase: 02-instrument-quality*
*Completed: 2026-03-15*
