---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 05-03-PLAN.md
last_updated: "2026-03-16T20:54:53.759Z"
last_activity: "2026-03-16 — Completed 05-02: Note Repeat"
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 20
  completed_plans: 18
  percent: 80
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-14)

**Core value:** When someone opens SoundForge on their phone and plays a few notes, their reaction should be "holy shit, this is in a browser?" — a musician should be able to connect a MIDI keyboard and genuinely jam with it.
**Current focus:** Phase 5 — Performance Features

## Current Position

Phase: 5 of 5 (Performance Features)
Plan: 2 of 5 in current phase
Status: In progress
Last activity: 2026-03-16 — Completed 05-02: Note Repeat

Progress: [████████░░] 80%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
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

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: 5-phase structure ordered by hard audio dependencies (Foundation → Instrument Quality → Composition → Differentiators → Platform)
- Roadmap: Service worker deferred to Phase 5 — caches specific file inventory that must be final
- Roadmap: Preset system placed in Phase 4, not Phase 2 — synth.get()/set() APIs must be stable before serializing
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

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 1: Verify Tone.js ESM CDN import path (+esm jsDelivr suffix) before writing any import map
- Phase 1: Check CSP headers in server.js — cdn.jsdelivr.net may need to be added
- Phase 1: Resolve Tone.js 14.x vs 15.x version discrepancy (STACK.md vs ARCHITECTURE.md example)
- Phase 2: Test on real iOS hardware — AudioWorklet distortion and velocity sensitivity cannot be validated in DevTools
- Phase 4: FM synthesis sound design requires iteration — budget time for piano/organ parameter tuning
- Phase 5: Verify audiobuffer-to-wav CDN ESM availability before implementation

## Session Continuity

Last session: 2026-03-16T20:54:53.754Z
Stopped at: Completed 05-03-PLAN.md
Resume file: None
