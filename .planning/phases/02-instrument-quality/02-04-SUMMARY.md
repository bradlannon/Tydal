---
phase: 02-instrument-quality
plan: "04"
subsystem: synthesis
tags: [presets, fm-synthesis, synth-panel, fx-panel, scale-lock, tonal, ui-controls]

# Dependency graph
requires:
  - phase: 02-instrument-quality/02-01
    provides: switchInstrument(), setSynthParam(), getActiveSynth() in instruments.js
  - phase: 02-instrument-quality/02-02
    provides: initPadGrid, buildNoteMap, shiftOctave in pad-grid.js
  - phase: 02-instrument-quality/02-03
    provides: vibrato, tremolo, filterLFO, setLFO() in effects.js
provides:
  - 7 factory presets (Warm Pad, Bright Lead, Sub Bass, FM Piano, FM Organ, FM E.Piano, Pluck)
  - applyPreset() hot-swaps PolySynth voice via switchInstrument()
  - Collapsible synth control panel (preset, waveform, ADSR, filter)
  - Collapsible FX control panel (reverb, delay, distortion, filter FX, channel, vibrato, tremolo, filter LFO)
  - Scale lock mode constrains pads to selected key/scale using tonal library
  - tonal@6.4.2 added to importmap
affects: [03-composition-tools, 04-differentiators]

# Tech tracking
tech-stack:
  added:
    - tonal@6.4.2 (via CDN importmap ESM) — Scale.get() for scale filtering
    - Tone.FMSynth — FM synthesis with harmonicity + modulationIndex
    - Tone.PolySynth(Tone.FMSynth) — polyphonic FM voices
  patterns:
    - preset-hot-swap: new PolySynth(voice, params) → switchInstrument() for seamless preset changes
    - collapsible-panel: header toggle + .panel-body.expanded display toggle
    - enharmonic-normalization: flat→sharp pitch class mapping for tonal/CHROMATIC compatibility
    - scale-filter: tonal Scale.get() → filter 4-octave chromatic range → take first 16 in-key notes

key-files:
  created:
    - engine/presets.js
    - ui/synth-panel.js
    - ui/fx-panel.js
  modified:
    - ui/pad-grid.js
    - index.html
    - styles.css
    - app.js

key-decisions:
  - "applyPreset uses new PolySynth each time: ensures FM params are fully applied on voice switch (set() doesn't reconstruct modulator graph)"
  - "Scale filter uses 4-octave window from currentOctave: enough range to always find 16 in-key notes even for pentatonic (5 notes/octave x 4 = 20 candidates)"
  - "Enharmonic normalization uses explicit map: tonal returns flats (Db, Eb) but CHROMATIC uses sharps (C#, D#); case-insensitive map handles all cases"
  - "FM waveform selector disabled (opacity 0.4) when FM preset active: FM oscillator is always sine; disabling prevents confusing no-op UI"
  - "Panel body default display:none with .expanded toggle: avoids layout reflow on page load; panels stay collapsed until user explicitly opens"

# Metrics
duration: 25min
completed: 2026-03-15
---

# Phase 2 Plan 04: FM Presets, Control Panels, and Scale Lock Summary

**7-voice preset system with FM synthesis (piano/organ/e-piano), collapsible synth and FX control panels with real-time parameter adjustment, and scale lock mode constraining pads to 6 musical scales via tonal library**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-15T18:10:00Z
- **Completed:** 2026-03-15T18:35:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- 7 factory presets selectable from the synth panel: Warm Pad (sawtooth subtractive), Bright Lead (square subtractive), Sub Bass (sine subtractive), FM Piano (Tone.FMSynth harmonicity:3), FM Organ (FM harmonicity:1), FM E.Piano (FM harmonicity:3.5), Pluck (triangle percussive). Each preset hot-swaps a new PolySynth into the effects chain via `switchInstrument()`.
- Synth panel (collapsible): preset selector, waveform selector (disabled for FM presets), 4 ADSR sliders, filter type/cutoff/resonance — all wired to `setSynthParam()` for real-time timbre change.
- FX panel (collapsible): reverb (wet/decay), delay (wet/time/feedback), distortion (amount), filter FX (cutoff/Q), channel (volume/pan), vibrato (depth/rate), tremolo (depth/rate), filter LFO (enable/rate) — all wired to `effects.js` nodes.
- Scale lock: selecting a key (12 chromatic keys + Off) and scale type (major, minor, dorian, mixolydian, pentatonic, blues) constrains all 16 pads to in-key notes. Enharmonic equivalents handled so tonal's flat notation (Db, Eb) maps to the CHROMATIC array's sharp notation.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create FM synth voices and factory presets** - `8ce16cd` (feat)
2. **Task 2: Create synth and effects control panels** - `0eff0a2` (feat)
3. **Task 3: Add scale lock mode to pad grid** - `daf3e53` (feat)

## Files Created/Modified

- `engine/presets.js` — New file: PRESETS object, applyPreset(), getPresetNames()
- `ui/synth-panel.js` — New file: initSynthPanel() with preset/waveform/ADSR/filter controls
- `ui/fx-panel.js` — New file: initFXPanel() with all effects parameter controls
- `ui/pad-grid.js` — Added Scale import from tonal; scaleLock state; setScaleLock/getScaleLock; scale-aware buildNoteMap; initPadGrid wires scale selectors
- `index.html` — Added tonal to importmap; added synth-panel and fx-panel divs; added scale-control selectors in controls-bar
- `styles.css` — Added panel-section/header/body/row/label/heading/select styles; added scale-control styles; app-main overflow-y:auto for scrollable panels
- `app.js` — Added initSynthPanel and initFXPanel imports and calls

## Decisions Made

- `applyPreset` creates a new PolySynth each time: ensures FM params (harmonicity, modulationIndex, modulation type) are applied cleanly — `set()` on an existing PolySynth does not reconstruct the FM modulator graph
- Scale filter uses a 4-octave window from currentOctave: guarantees 16 candidates even for 5-note scales (pentatonic: 5 notes/octave × 4 octaves = 20 candidates)
- Enharmonic normalization via explicit flat→sharp map: tonal returns Db/Eb/Gb/Ab/Bb; CHROMATIC uses C#/D#/F#/G#/A# — explicit map is reliable and handles all 7 enharmonic cases
- FM waveform selector visually disabled (opacity 0.4, disabled attribute) when FM preset active: FM oscillator is always sine; disabling prevents a confusing no-op interaction
- Panels default collapsed: keeps the primary pad grid visible at all times; users opt-in to parameter editing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Preset system and FM synthesis are complete — Phase 3 composition tools can rely on `applyPreset()` for sound variation
- Scale lock infrastructure is in place for composition features (looper, arpeggiator) to respect current scale
- Control panels provide hands-on sound design capability
- tonal library in importmap — available to any future module that needs music theory utilities

## Self-Check: PASSED

All files verified present. All three task commits confirmed in git log.

---
*Phase: 02-instrument-quality*
*Completed: 2026-03-15*
