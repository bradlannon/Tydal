---
phase: 01-audio-foundation
plan: 01
subsystem: audio
tags: [tone.js, web-audio, ios, polysyth, esm, importmap, css-custom-properties]

# Dependency graph
requires: []
provides:
  - Tydal standalone app scaffold (index.html, styles.css)
  - Tone.js 15.1.22 loaded via importmap from jsDelivr CDN
  - AudioContext singleton with iOS interrupted-state recovery (ensureAudioStarted)
  - PolySynth warm pad voice (sawtooth, lowpass, ADSR with anti-click release:0.4)
  - Signal chain: PolySynth -> Volume(-6dB) -> Tone.Destination
  - iOS tap-to-start overlay with audio-interrupted event recovery
  - Master volume slider wired to Volume.rampTo
  - Full dark theme CSS with responsive pad grid foundation
affects:
  - 01-audio-foundation (plan 02 adds input handlers + pad grid rendering on top of this)
  - All subsequent phases (signal chain + AudioContext singleton used throughout)

# Tech tracking
tech-stack:
  added:
    - Tone.js 15.1.22 (CDN +esm via importmap, no npm install)
  patterns:
    - importmap for browser-native ES module resolution without a build step
    - AudioContext singleton pattern — single module owns Tone.start(), all others import
    - statechange listener on rawContext for iOS lifecycle recovery
    - Tone.now() for all timing (zero setTimeout in engine code)
    - Side-effect imports to establish signal chain (effects.js wires on import)

key-files:
  created:
    - index.html
    - styles.css
    - engine/audio-engine.js
    - engine/instruments.js
    - engine/effects.js
    - ui/overlay.js
    - app.js
  modified: []

key-decisions:
  - "Tone.js 15.1.22 imported via importmap +esm CDN — no build step, matches project constraints"
  - "AudioContext singleton: only audio-engine.js calls Tone.start(), all other modules import ensureAudioStarted"
  - "warmPad release:0.4s chosen for anti-click fade without audible tail — satisfies AUDIO-06"
  - "masterVolume at -6dB default headroom — prevents clipping when multiple pads active"
  - "audio-interrupted custom event dispatched from audio-engine.js, consumed by overlay.js — decoupled lifecycle"

patterns-established:
  - "Signal chain pattern: create instruments in instruments.js, wire through effects.js (side effect import)"
  - "Tone.now() everywhere: no setTimeout in any engine or input file"
  - "Hidden overlay via HTML hidden attribute — overlay.hidden toggled by overlay.js"
  - "CSS custom properties on :root for full dark theme — --bg-body, --accent, --accent-glow, etc."

requirements-completed: [AUDIO-01, AUDIO-02, AUDIO-04, AUDIO-05, AUDIO-06, INTG-01, INTG-02, INTG-04]

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 1 Plan 01: Audio Foundation Scaffold Summary

**Tone.js 15.1.22 imported via importmap, PolySynth warm pad wired through Volume(-6dB) to Destination, iOS AudioContext lifecycle managed via statechange recovery overlay**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-15T05:28:08Z
- **Completed:** 2026-03-15T05:29:53Z
- **Tasks:** 2
- **Files modified:** 7 created, 0 modified

## Accomplishments
- Complete Tydal standalone app scaffold with dark theme — no portfolio nav/footer anywhere
- Tone.js 15.1.22 loaded browser-natively via importmap + jsDelivr CDN (+esm), zero build step
- AudioContext singleton (`ensureAudioStarted`) with iOS statechange recovery and `audio-interrupted` custom event
- PolySynth warm pad: sawtooth oscillator, detune -8, lowpass filter at 2800Hz, ADSR with release:0.4 (anti-click)
- Full signal chain: warmPad -> masterVolume(-6dB) -> Tone.Destination established in effects.js
- iOS tap-to-start overlay: shows on load, hides after tap, reappears on audio-interrupted event
- Master volume slider wired to `masterVolume.volume.rampTo(value, 0.05)` in app.js bootstrap
- Zero setTimeout calls in engine/ or app.js — all timing via Tone.now()

## Task Commits

Each task was committed atomically:

1. **Task 1: Create HTML entry point with importmap and dark theme CSS** - `5de137a` (feat)
2. **Task 2: Build audio engine, signal chain, overlay module, and app bootstrap** - `ccb7924` (feat)

## Files Created/Modified

- `index.html` - Entry point: DOCTYPE, importmap pinning tone@15.1.22/+esm, module script, HTML shell with overlay and volume slider
- `styles.css` - Full dark theme (--bg-body: #0a0a0a), responsive pad grid (.pad-grid, .pad, .pad.active), controls bar, overlay styles, mobile-first
- `engine/audio-engine.js` - ensureAudioStarted() singleton, iOS statechange listener, audio-interrupted event dispatch
- `engine/instruments.js` - warmPad PolySynth with sawtooth/detune/lowpass/ADSR, noteOn/noteOff exports using Tone.now()
- `engine/effects.js` - masterVolume Volume(-6dB).toDestination(), warmPad.connect(masterVolume) signal chain wiring
- `ui/overlay.js` - showAudioOverlay/hideAudioOverlay exports, click handler, audio-interrupted listener, initial state check
- `app.js` - Bootstrap: imports effects.js (side-effect wiring), overlay.js (side-effect setup), volume slider event wiring

## Decisions Made

- Used Tone.js 15.1.22 (not 14.x) — resolves the version discrepancy noted in STATE.md blockers; 15.x is current stable
- `ensureAudioStarted` is a guard function not a constructor — safe to call multiple times from any event handler
- `masterVolume.volume.rampTo(value, 0.05)` uses 50ms linear ramp to prevent audible zipper noise on slider drag
- Audio overlay uses HTML `hidden` attribute (not CSS display) — semantically correct, easily toggled in JS
- Overlay click uses `{ once: false }` pattern implicitly (no removeEventListener) so it triggers again after interruption

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. The Tone.js +esm CDN path verified in RESEARCH.md was used as specified.

## User Setup Required

None — no external service configuration required. Page loads via any local HTTP server (e.g. `python3 -m http.server` or `npx serve .`).

## Next Phase Readiness

- Plan 02 (Input Handlers + Pad Grid) can import `noteOn`, `noteOff` from `engine/instruments.js` and `ensureAudioStarted` from `engine/audio-engine.js`
- `.pad-grid` and `.pad` CSS classes ready in styles.css — Plan 02 just needs to inject the grid DOM
- `#instrument` container in index.html is empty and waiting for pad grid injection
- Signal chain is live — once a pad calls `noteOn()` with a valid note name, audio will play
- Blocker resolved: Tone.js 15.x +esm CDN path confirmed and implemented

## Self-Check: PASSED

All 7 source files confirmed on disk. Both task commits (5de137a, ccb7924) confirmed in git log.

---
*Phase: 01-audio-foundation*
*Completed: 2026-03-15*
