---
phase: 03-composition-surface
plan: 01
subsystem: audio-engine
tags: [drums, sequencer, tone.js, synthesis, 808, 909, transport]
dependency_graph:
  requires: [engine/effects.js, engine/audio-engine.js]
  provides: [engine/drums.js, engine/sequencer.js]
  affects: [ui/drum-sequencer.js, ui/pad-grid.js]
tech_stack:
  added: [Tone.MembraneSynth, Tone.NoiseSynth, Tone.MetalSynth, Tone.Sequence, Tone.Transport]
  patterns: [pre-allocated synths, drum-bus routing, Tone.Draw visual sync, CustomEvent loose coupling]
key_files:
  created: [engine/drums.js, engine/sequencer.js]
  modified: []
decisions:
  - "drumBus Tone.Channel routes all drum voices to masterVolume, bypassing the melodic effects chain (vibrato/tremolo/reverb/delay/distortion) — drums need their own signal path"
  - "Hi-hat choke implemented with 5ms offset (triggerAttack at time+0.005) to prevent envelope overlap click artifact"
  - "Clap 4-burst stagger uses irregular offsets (0/8/16/28ms) with last burst '64n' for natural hand-slap texture"
  - "Tone.getDraw fallback chain: getDraw() → Draw.schedule → requestAnimationFrame with console.warn on first fallback use"
  - "stopSequencer dispatches sequencer-step {step:-1} to clear UI cursor without an animation frame race"
metrics:
  duration: "~2 minutes"
  completed: "2026-03-15"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 3 Plan 01: Drum Synthesis and Step Sequencer Summary

808/909-style drum synthesis engine (4 voices via MembraneSynth/NoiseSynth/MetalSynth) routed through a dedicated drumBus, plus a 16-step Tone.Sequence sequencer with Transport BPM control and Tone.Draw visual sync.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create drum synthesis engine with four pre-allocated voices | 9529d64 | engine/drums.js |
| 2 | Create step sequencer engine with Transport control and BPM | 6ad39c0 | engine/sequencer.js |

## What Was Built

### engine/drums.js

Four pre-allocated 808/909-style drum voices, all routed through a dedicated `drumBus` (Tone.Channel at 0 dB) to `masterVolume`, bypassing the melodic effects chain.

- **Kick (DRUM-01):** `Tone.MembraneSynth` with pitchDecay:0.08, octaves:6 for deep sub-bass pitch sweep. Layered with `Tone.Distortion` (0.4 distortion, 0.3 wet) for saturation. Triggers at C1.
- **Snare (DRUM-02):** `Tone.NoiseSynth` (white noise) through `Tone.Filter` highpass@1800Hz for rattle, plus `Tone.Synth` triangle at E3 for tonal body crack. Both feed drumBus independently.
- **Hi-hat (DRUM-03):** Two `Tone.MetalSynth` instances — closedHat (decay:0.07) and openHat (decay:0.5). Shared `Tone.Gain` at -6 dB (MetalSynth amplitude control). Choke: opposite hat triggers release then self triggers at time+0.005s to prevent click.
- **Clap (DRUM-04):** `Tone.NoiseSynth` through `Tone.Filter` bandpass@1200Hz (Q:0.5) then `Tone.Reverb` (decay:0.8, wet:0.4). Triggers 4 staggered bursts at 0/8/16/28ms; last burst uses '64n' for shorter tail.
- **DRUM-05:** Zero `new Tone.*` calls inside any trigger function — all synths constructed at module top level.

### engine/sequencer.js

16-step drum sequencer using `Tone.Sequence` at `'16n'` subdivision with Tone.Transport control.

- **Grid:** `{ kick, snare, hihat, clap }` — each an `Array(16).fill(false)`. Accessed via `setStep/getStep/getGrid`.
- **Transport:** `initTransport(bpm)` sets `loop:true`, `loopStart:0`, `loopEnd:'1m'`. `setBPM` clamps 40–240.
- **Sequence callback:** Reads grid state, fires trigger functions with audio-thread `time`, dispatches `'sequencer-step'` CustomEvent via Tone.Draw (fallback chain: `getDraw()` → `Draw.schedule` → `requestAnimationFrame`).
- **Controls:** `startSequencer()` awaits `ensureAudioStarted()` before Transport start. `stopSequencer()` resets playhead to 0 and dispatches `{step: -1}` to clear cursor.
- **Event interface:** `sequencer-step` fires on `document` with `{detail: {step}}` — no UI module needs to import sequencer directly.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] engine/drums.js exists
- [x] engine/sequencer.js exists
- [x] Commit 9529d64 exists
- [x] Commit 6ad39c0 exists
