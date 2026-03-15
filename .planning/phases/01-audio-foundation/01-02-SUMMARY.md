---
phase: 01-audio-foundation
plan: 02
subsystem: ui
tags: [tone.js, web-audio, touch-events, pointer-events, keyboard-input, pad-grid, responsive]

# Dependency graph
requires:
  - phase: 01-audio-foundation-plan-01
    provides: audio engine (Tone.PolySynth warmPad), noteOn/noteOff exports, ensureAudioStarted, iOS overlay, masterVolume
provides:
  - 4x4 pad grid with MPC layout ordering (bottom-left=C3, top-right=D5)
  - Keyboard input handler (ZXCV/ASDF/QWER/1234 mapped to pads 1-16) with hold-sustain and anti-repeat
  - Pointer/touch input handler with multitouch tracking and pointercancel stuck-note prevention
  - Visual pad feedback (teal glow on active pad)
  - Help tooltip with keyboard shortcut reference
  - Fully playable 16-pad instrument via keyboard and touch
affects:
  - 02-instrument-quality
  - all future phases consuming input/keyboard.js, input/touch.js, ui/pad-grid.js

# Tech tracking
tech-stack:
  added: []
  patterns:
    - pointerId Map for multitouch tracking (touchedPads Map keyed by e.pointerId)
    - heldKeys Set for keyboard debounce and anti-repeat (e.repeat guard + Set membership check)
    - MPC layout: logical pad array ordered 1-16, DOM rows rendered in reverse for visual ascending layout
    - pointercancel mirrors pointerup — prevents stuck notes on focus loss, scroll interruption, OS gestures
    - passive: false on pointerdown to allow e.preventDefault() without Chrome warning

key-files:
  created:
    - ui/pad-grid.js
    - input/keyboard.js
    - input/touch.js
  modified:
    - app.js
    - index.html
    - styles.css

key-decisions:
  - "MPC layout via reversed DOM row rendering: logical order 1-16, top DOM row = pads 13-16, bottom = 1-4"
  - "pointercancel + pointerleave both mirror pointerup to prevent stuck notes on iOS gesture interruptions"
  - "passive: false on pointerdown event listener required for e.preventDefault() to suppress iOS scroll"
  - "setPadActive exported from pad-grid.js so both keyboard.js and touch.js share a single visual feedback path"

patterns-established:
  - "Input modules import noteOn/noteOff from engine/instruments.js — input layer never touches Tone.js directly"
  - "ensureAudioStarted() called on first user interaction in both keyboard and touch handlers (AudioContext gate)"
  - "Zero setTimeout in input/audio code — all timing via Tone.now() inside noteOn/noteOff"

requirements-completed: [AUDIO-03, AUDIO-07, INTG-03]

# Metrics
duration: ~45min
completed: 2026-03-15
---

# Phase 1 Plan 02: Interactive Pad Grid and Input Handlers Summary

**4x4 MPC-layout pad grid with keyboard (ZXCV/ASDF/QWER/1234) and multitouch pointer input, hold-sustain per voice, visual feedback, and help tooltip — completing the Phase 1 playable instrument.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-03-15
- **Completed:** 2026-03-15
- **Tasks:** 3 (2 auto + 1 checkpoint:human-verify, approved)
- **Files modified:** 6

## Accomplishments

- Created ui/pad-grid.js with NOTE_MAP (C3-D5 diatonic), MPC layout, and setPadActive visual feedback
- Created input/keyboard.js with heldKeys Set, e.repeat guard, hold-sustain on keydown/keyup
- Created input/touch.js with touchedPads Map for multitouch, pointercancel for stuck-note prevention
- Wired all modules into app.js; help tooltip toggle added to index.html
- Responsive styles finalized: mobile fills width, desktop constrained at 500px, pad aspect-ratio:1
- User verified instrument plays correctly in browser (keyboard, touch, volume, visual feedback, help panel)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create pad grid, keyboard input, touch input** - `d1e8c91` (feat)
2. **Task 2: Wire input modules into app.js, add help tooltip, finalize styles** - `9f8ab53` (feat)
3. **Task 3: Verify playable instrument in browser** - checkpoint approved by user (no code commit)

## Files Created/Modified

- `ui/pad-grid.js` - NOTE_MAP array, initPadGrid() with MPC DOM layout, setPadActive() for visual feedback
- `input/keyboard.js` - KEY_TO_NOTE map, heldKeys Set, keydown/keyup lifecycle with ensureAudioStarted
- `input/touch.js` - touchedPads Map, pointerdown/pointerup/pointercancel/pointerleave handlers
- `app.js` - Imports and calls initPadGrid, initKeyboard, initTouch; help panel toggle
- `index.html` - Help button and help panel markup added to controls area
- `styles.css` - Pad grid responsive layout, aspect-ratio:1 pads, hover media query, help panel styles

## Decisions Made

- MPC layout rendered by reversing row iteration in initPadGrid — logical array stays ordered 1-16, DOM rows output top-to-bottom as rows 4,3,2,1 so lowest pads appear at bottom visually.
- pointercancel and pointerleave both delegate to the same release handler as pointerup — prevents stuck notes when the OS interrupts a touch gesture (common on iOS with swipe-to-home).
- `{ passive: false }` required on pointerdown listener so `e.preventDefault()` suppresses native scroll and double-tap zoom on the pad grid.
- setPadActive lives in pad-grid.js and is exported — both input modules share one visual feedback path rather than each querying the DOM independently.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all verification criteria passed on first build.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 complete: audio engine + playable 16-pad instrument verified on desktop
- Ready for Phase 2 (Instrument Quality): AudioWorklet distortion investigation, velocity sensitivity, real iOS hardware test
- Blockers carried forward: real iOS hardware test required (AudioWorklet distortion cannot be validated in DevTools)

---
*Phase: 01-audio-foundation*
*Completed: 2026-03-15*
