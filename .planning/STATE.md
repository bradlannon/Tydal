---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Completed 08-02-PLAN.md
last_updated: "2026-03-17T03:54:39.171Z"
last_activity: 2026-03-16 — v1.1 roadmap created (phases 6–9)
progress:
  total_phases: 9
  completed_phases: 6
  total_plans: 28
  completed_plans: 26
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-16)

**Core value:** When someone opens Tydal on their phone and plays a few notes, their reaction should be "holy shit, this is in a browser?" — a musician should be able to connect a MIDI keyboard and genuinely jam with it.
**Current focus:** v1.1 — Ableton Move Redesign

## Current Position

Phase: 6 — Move Visual Aesthetic (not started)
Plan: —
Status: Roadmap complete, ready for Phase 6 planning
Last activity: 2026-03-16 — v1.1 roadmap created (phases 6–9)

Progress: [░░░░░░░░░░] 0% (v1.1 milestone)

## Performance Metrics

**Velocity:**
- Total plans completed: 0 (v1.1)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 6. Move Visual Aesthetic | TBD | — | — |
| 7. Encoder Layout & Contextual Display | TBD | — | — |
| 8. Multi-Track System | TBD | — | — |
| 9. Move Performance Features | TBD | — | — |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

**v1.0 Historical (for reference):**
| Phase 01-audio-foundation P01 | 2 | 2 tasks | 7 files |
| Phase 01-audio-foundation P02 | 45 | 3 tasks | 6 files |
| Phase 02-instrument-quality P01 | 3 | 2 tasks | 3 files |
| Phase 02-instrument-quality P02 | 3 | 2 tasks | 6 files |
| Phase 02-instrument-quality P03 | 10 | 2 tasks | 4 files |
| Phase 02-instrument-quality P04 | 25 | 3 tasks | 7 files |
| Phase 02-instrument-quality P05 | 1 | 1 tasks | 0 files |
| Phase 03-composition-surface P01 | 2 | 2 tasks | 2 files |
| Phase 03-composition-surface P02 | 2 | 2 tasks | 5 files |
| Phase 03-composition-surface P03 | 4min | 2 tasks | 3 files |
| Phase 03-composition-surface P04 | 1 | 1 tasks | 0 files |
| Phase 04-differentiators P01 | 99s | 1 tasks | 5 files |
| Phase 04-differentiators P02 | 2 | 1 tasks | 5 files |
| Phase 04-differentiators P03 | 3 | 2 tasks | 4 files |
| Phase 05-performance-features P01 | 7 | 2 tasks | 3 files |
| Phase 05-performance-features P02 | 5 | 2 tasks | 7 files |
| Phase 05-performance-features P04 | 9 | 2 tasks | 3 files |
| Phase 05-performance-features P03 | 2 | 2 tasks | 4 files |
| Phase 05-performance-features P05 | 2 | 2 tasks | 5 files |
| Phase 06-move-visual-aesthetic P01 | 3min | 2 tasks | 3 files |
| Phase 06-move-visual-aesthetic P02 | 2min | 2 tasks | 2 files |
| Phase 07 P02 | 198s | 2 tasks | 3 files |
| Phase 07 P01 | 25min | 2 tasks | 6 files |
| Phase 07-encoder-layout-contextual-display P03 | 163 | 2 tasks | 4 files |
| Phase 08-multi-track-system P01 | 167 | 2 tasks | 5 files |
| Phase 08-multi-track-system P02 | 230 | 2 tasks | 6 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: 5-phase v1.0 structure ordered by hard audio dependencies (Foundation → Instrument Quality → Composition → Differentiators → Platform)
- Roadmap: v1.1 phases 6–9 ordered by visual dependency (Aesthetic → Layout → Multi-Track → Performance)
- [Phase 01-audio-foundation]: Tone.js 15.1.22 via importmap +esm CDN — no build step, resolves version discrepancy
- [Phase 01-audio-foundation]: AudioContext singleton: only audio-engine.js calls Tone.start(); statechange recovery dispatches audio-interrupted event to overlay
- [Phase 01-audio-foundation]: warmPad PolySynth: sawtooth + lowpass 2800Hz + release:0.4s anti-click; masterVolume at -6dB default headroom
- [Phase 01-audio-foundation]: MPC layout via reversed DOM row rendering: logical order 1-16, top DOM row = pads 13-16, bottom = 1-4
- [Phase 01-audio-foundation]: pointercancel + pointerleave mirror pointerup to prevent stuck notes on iOS gesture interruptions
- [Phase 02-instrument-quality]: Removed warmPad export; replaced with mutable activeSynth let for Plan 04 preset hot-swapping via switchInstrument()
- [Phase 02-instrument-quality]: Effects bus pattern: connectInstrument/disconnectInstrument route synths into static reverb->...->masterVolume chain
- [Phase 02-instrument-quality]: Delay wet:0 and distortion wet:0 by default — only reverb audible on first load
- [Phase 02-instrument-quality]: Full DOM teardown/rebuild for grid on octave shift: simpler than in-place updates; rebuilds are infrequent
- [Phase 02-instrument-quality]: 'grid-rebuild' CustomEvent: pad-grid.js dispatches, input modules subscribe independently for loose coupling
- [Phase 02-instrument-quality]: Velocity range 0.4-1.0: minimum 0.4 ensures notes are never silent; 3 px/ms maps to 1.0
- [Phase 02-instrument-quality]: Tremolo must be started even at wet=0: Tone.Tremolo oscillator requires explicit start
- [Phase 02-instrument-quality]: filterLFO not started by default: only enabled when user activates via setLFO()
- [Phase 02-instrument-quality]: applyPreset creates new PolySynth each time to ensure FM modulator graph is fully reconstructed
- [Phase 02-instrument-quality]: Scale filter uses 4-octave window: ensures 16 in-key notes for pentatonic (5 notes/octave)
- [Phase 02-instrument-quality]: Enharmonic normalization via explicit flat-to-sharp map for tonal/CHROMATIC compatibility
- [Phase 02-instrument-quality]: Phase 2 verified complete: all 5 success criteria confirmed — polyphony/voice stealing, velocity sensitivity, MIDI input, chromatic layout, effects chain
- [Phase 03-composition-surface]: drumBus Tone.Channel routes all drum voices to masterVolume, bypassing melodic effects chain
- [Phase 03-composition-surface]: Hi-hat choke uses 5ms offset at time+0.005 to prevent envelope overlap click
- [Phase 03-composition-surface]: Tone.getDraw fallback chain: getDraw() -> Draw.schedule -> requestAnimationFrame with warning
- [Phase 03-composition-surface]: Play button calls initTransport(currentBPM) before startSequencer() each time — ensures Transport loop is configured even on first press
- [Phase 03-composition-surface]: After each tap, getBPM() is read back and synced to slider and display — tap tempo sets engine BPM and UI reflects it immediately
- [Phase 03-composition-surface]: Circular import instruments.js <-> recorder.js is safe: ES module deferred binding resolves because both only export functions
- [Phase 03-composition-surface]: Record button auto-starts sequencer (DAW pattern): pressing Record implies Play
- [Phase 03-composition-surface]: activePart.loop=false during recording, true after stop: prevents double-triggering during live capture
- [Phase 03-composition-surface]: Phase 3 verification checkpoint auto-approved by orchestrator — all 5 success criteria confirmed by user pre-approval
- [Phase 04-differentiators]: AnalyserNode via rawContext fan-out tap on masterVolume — no signal chain disruption
- [Phase 04-differentiators]: ZCR pitch estimation maps C2-C6 to HSL hue 0-300 for waveform color; teal default during silence
- [Phase 04-differentiators]: Gyroscope EMA alpha=0.15: responsive sub-100ms while eliminating zipper noise
- [Phase 04-differentiators]: Exponential gamma-to-frequency mapping (200 * 40^x) gives musically natural filter sweep distribution
- [Phase 04-differentiators]: captureCurrentPatch stores full synth.get() params rather than detecting factory preset name — avoids cross-module tracking
- [Phase 04-differentiators]: URL patch restore runs after all panel inits in app.js so audio chain is fully wired before loadPatch() applies effects
- [Phase 05-performance-features]: EMA alpha=0.3 for pad expression: more responsive than gyroscope (0.15) because finger contact has inherent mechanical smoothing
- [Phase 05-performance-features]: stopExpression resets detune to -8 and filter to 4000Hz matching instruments.js/effects.js defaults
- [Phase Phase 05-performance-features]: 5ms noteOff→noteOn gap prevents envelope click artifacts during repeat ticks
- [Phase Phase 05-performance-features]: setRepeatRate immediately restarts active repeats so rhythm changes are felt in real time
- [Phase 05-performance-features]: Chaos budget cap 1.5 total wet: allows 2-3 effects simultaneously without drowning dry signal
- [Phase 05-performance-features]: Variation slots are session-only (module memory, not localStorage) — lightweight A/B comparison without polluting saved patches
- [Phase 05-performance-features]: Tone .set({[param]: value}) used for all macro param writes — handles Signal and plain property targets uniformly
- [Phase 05-performance-features]: MACROS exported as named object keyed by macro name so UI can iterate Object.keys() and get stable names
- [Phase 05-performance-features]: CustomEvent dispatch (open-preset-browser/close-preset-browser) decouples preset-browser.js from app.js sheet system
- [Phase 05-performance-features]: Browse button placed alongside existing preset select — retains quick-select while adding browse-with-preview
- [Phase 06-move-visual-aesthetic]: Move token system: --move-black/#000 universal background — only lit elements have visual presence against black void
- [Phase 06-move-visual-aesthetic]: Toolbar abbreviations SYN/FX/DRM/MCR as minimal printed-label equivalents for Move hardware aesthetic
- [Phase 06-move-visual-aesthetic]: Inline styles for pad RGB coloring — data-roleColor/data-roleGlow store role for active state restore; setPadActive() manages white flash inline
- [Phase 06-move-visual-aesthetic]: Step sequencer playhead is solid green (#00ff5a background), not just a border — matches Move hardware; active steps flat white with no glow
- [Phase 07-02]: initStepButtons receives push-grid container directly, appends .step-button-row inside — avoids nested identical divs
- [Phase 07-02]: beat-start class uses margin-left for beat grouping gaps in flex step-button-row
- [Phase 07]: Encoder dot rotation uses full-size arm element rotating at 50% 50% — works at any encoder size without measuring pixels
- [Phase 07]: OLED active state via CSS class toggle + opacity transition — clean separation of state and animation
- [Phase 07-encoder-layout-contextual-display]: liveParams indirection for setEncoderMapping: onChange closures index into liveParams[] array so swapping mappings works without closure rebuilds
- [Phase 07-encoder-layout-contextual-display]: mode-change CustomEvent: app.js dispatches on toolbar open/close; encoder-row.js and jog-wheel.js listen independently for clean decoupling
- [Phase 08-multi-track-system]: Track 1 is default active track at startup so pads play melodic immediately
- [Phase 08-multi-track-system]: activeSynth fallback retained in instruments.js for backward compat; noteOn/noteOff route to active track synth
- [Phase 08-multi-track-system]: buildTrackMelodicMapping targets per-track synth.set() and effectsChain; global distortion/vibrato are shared fallbacks
- [Phase 08-multi-track-system]: DRM sheet open saves lastMelodicTrackId and switches to track 0; close restores it via track-change cascade

### Pending Todos

None.

### Blockers/Concerns

- Phase 6: CSS overhaul will touch nearly every UI file — establish dark canvas token system early to avoid per-element hacks
- Phase 7: Rotary encoder interaction on mobile (no scroll wheel) requires drag-based or touch gesture implementation decision
- Phase 8: Multi-track engine is a significant architecture change — existing single-instrument audio chain must be generalized to 4 tracks
- Phase 9: Capture mode requires a rolling audio/note buffer running at all times — memory and performance implications to evaluate

## Session Continuity

Last session: 2026-03-17T03:54:39.166Z
Stopped at: Completed 08-02-PLAN.md
Resume file: None
