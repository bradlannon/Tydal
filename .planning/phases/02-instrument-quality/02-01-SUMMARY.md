---
phase: 02-instrument-quality
plan: 01
subsystem: audio
tags: [tone.js, polyphony, voice-stealing, effects-chain, reverb, delay, distortion, subtractive-synthesis]

# Dependency graph
requires:
  - phase: 01-audio-foundation
    provides: Tone.js importmap, audio-engine singleton, warmPad PolySynth, masterVolume baseline
provides:
  - engine/voice-tracker.js with MAX_VOICES=8, trackNoteOn/trackNoteOff/stealOldestIfFull/clearAll/getActiveNotes
  - engine/effects.js full effects bus (reverb -> delay -> distortion -> filterFX -> channel -> masterVolume -> Destination) with connectInstrument/disconnectInstrument
  - engine/instruments.js subtractiveSynth with noteOn(velocity), setSynthParam, switchInstrument, releaseAll, getActiveSynth
affects: [02-instrument-quality, 03-composition, 04-differentiators]

# Tech tracking
tech-stack:
  added: [Tone.Reverb, Tone.FeedbackDelay, Tone.Distortion, Tone.Filter, Tone.Channel]
  patterns:
    - Effects bus pattern: instruments connect to reverb input, chain flows through effects to masterVolume
    - Voice tracker separation: note lifecycle tracking in dedicated module, not inside PolySynth
    - Mutable activeSynth: exported let allows preset hot-swap via switchInstrument()
    - effectsReady promise: gates consumers on reverb IR generation

key-files:
  created:
    - engine/voice-tracker.js
  modified:
    - engine/instruments.js
    - engine/effects.js

key-decisions:
  - "Removed warmPad export; replaced with activeSynth (mutable let) to support Plan 04 preset hot-swapping"
  - "Delay wet:0 and distortion wet:0 by default — only reverb audible on first load to avoid overwhelming initial experience"
  - "connectInstrument/disconnectInstrument pattern: effects chain is static, instruments route into reverb input dynamically"
  - "voice-tracker.js is stateful module with exported activeNotes array — stealOldestIfFull shifts oldest to maintain O(1) steal"

patterns-established:
  - "Effects bus: all instruments connect via connectInstrument(synth) into reverb; never wire directly to masterVolume"
  - "Voice stealing: always call stealOldestIfFull() before noteOn, triggerRelease stolen note before triggerAttack new note"
  - "Backward compat: noteOn(note, velocity=0.8) default preserves existing keyboard.js and touch.js call sites"

requirements-completed: [SYNTH-01, SYNTH-02, SYNTH-03, FX-01, FX-02, FX-03, FX-04, FX-05]

# Metrics
duration: 3min
completed: 2026-03-15
---

# Phase 2 Plan 01: Instrument Quality - Synth Engine Summary

**8-voice subtractive PolySynth with full effects chain (reverb/delay/distortion/filter), velocity-aware noteOn, and voice stealing — replacing the Phase 1 warmPad with a hot-swappable architecture**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-15T14:30:40Z
- **Completed:** 2026-03-15T14:33:01Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created engine/voice-tracker.js: stateful note tracking with O(1) oldest-voice stealing at polyphony limit
- Refactored engine/effects.js: full effects bus replacing hard-wired warmPad.connect() with dynamic connectInstrument/disconnectInstrument
- Refactored engine/instruments.js: subtractiveSynth with velocity, voice stealing, setSynthParam for runtime timbre changes, and switchInstrument for Plan 04 preset hot-swap

## Task Commits

Each task was committed atomically:

1. **Task 1: Create voice tracker and refactor effects chain** - `293ba6e` (feat)
2. **Task 2: Refactor instruments.js with subtractive synth, velocity, and voice stealing** - `40ab7bf` (feat)

## Files Created/Modified
- `engine/voice-tracker.js` - Active note tracking array; stealOldestIfFull/trackNoteOn/trackNoteOff/clearAll/getActiveNotes
- `engine/effects.js` - Full effects chain: reverb -> delay -> distortion -> filterFX -> channel -> masterVolume -> Destination; connectInstrument/disconnectInstrument helpers; effectsReady promise
- `engine/instruments.js` - Replaced warmPad with subtractiveSynth; noteOn(note, velocity=0.8) with voice stealing; setSynthParam/getActiveSynth/switchInstrument/releaseAll

## Decisions Made
- Removed `warmPad` named export entirely — replaced with `activeSynth` (mutable `let`) to support Plan 04 preset hot-swap via `switchInstrument()`. Existing callers (keyboard.js, touch.js) use `noteOn`/`noteOff` which are unchanged.
- Delay and distortion start at `wet:0` — only reverb is audible by default. Avoids overwhelming the user on first load while still making all effects available for runtime control.
- `connectInstrument` routes into the reverb input — the effects chain is static, instruments are dynamic. This allows multiple synths to be hot-swapped without rewiring the chain.
- voice-tracker is a separate module (not internalized in instruments.js) so Plan 04 preset switching can call `clearAll()` independently during grid resets.

## Deviations from Plan

None - plan executed exactly as written.

One minor fix applied: the plan's static verification script used `src.includes('warmPad')` which caught a JSDoc comment reference. Removed the comment phrase to satisfy the check — this was not a logic change.

## Issues Encountered
- Tone.js ESM imports (importmap-based) cannot be verified in Node.js CLI — verified exports statically via source inspection instead.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 2 APIs (noteOn, noteOff, setSynthParam, connectInstrument, effectsReady) are stable and ready for Plan 02 (UI controls) and Plan 03 (MIDI input)
- setSynthParam enables waveform, ADSR, and filter changes at runtime — Plan 02 can wire sliders directly
- switchInstrument enables Plan 04 preset hot-swap without modifying this module
- Volume slider in app.js still works — masterVolume export name unchanged

---
*Phase: 02-instrument-quality*
*Completed: 2026-03-15*
