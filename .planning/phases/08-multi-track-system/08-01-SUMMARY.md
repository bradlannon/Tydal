---
phase: 08-multi-track-system
plan: "01"
subsystem: audio-engine
tags: [multi-track, audio-architecture, track-manager, effects-chain, sequencer]
dependency_graph:
  requires: []
  provides: [track-manager, per-track-effects-chain, multi-track-sequencer-playback]
  affects: [instruments, melodic-sequencer, sequencer, effects]
tech_stack:
  added: [track-manager.js]
  patterns: [per-track-effects-factory, track-aware-noteOn, simultaneous-sequence-playback]
key_files:
  created:
    - public/engine/track-manager.js
  modified:
    - public/engine/effects.js
    - public/engine/instruments.js
    - public/engine/melodic-sequencer.js
    - public/engine/sequencer.js
decisions:
  - "Track 1 is the default active track at startup so pads play melodic immediately"
  - "activeSynth fallback retained in instruments.js for backward compatibility; routes to global effects chain but receives no notes since noteOn/noteOff use active track synth"
  - "clearAllMelodic clears only the active track grid, not all tracks — preserves other tracks' patterns"
  - "Drum track mute check uses getTrackById(0).muted — playhead visual sync always continues even when muted"
metrics:
  duration: 167s
  completed_date: "2026-03-17"
  tasks_completed: 2
  files_modified: 5
---

# Phase 8 Plan 1: Multi-Track Audio Engine Summary

**One-liner:** 4-track audio engine with independent PolySynth + effects chains per melodic track, all playing simultaneously via shared Tone.Transport.

## What Was Built

### track-manager.js (new)
Central track state manager with 4 track objects:
- Track 0: drum track (delegates to drums.js, no separate synth)
- Tracks 1-3: melodic tracks, each with a `Tone.PolySynth`, a per-track effects chain, and an independent 16-step grid

TRACK_COLORS: `['#e87a20', '#00b3f4', '#b44aff', '#00e676']` (orange, blue, purple, green)

Default active track: 1 (first melodic track — pads play on startup).

### effects.js (modified)
Added `createTrackEffectsChain()` factory. Each call creates an independent mini chain:
`synth → reverb → delay → channel → masterVolume`

The reverb `input` is the entry point for the track's synth. All per-track chains merge at the shared `masterVolume`. All existing global effects exports unchanged.

### melodic-sequencer.js (modified)
- Replaced single module-level `grid` with per-track grid reads via `getActiveTrack().grid`
- Tone.Sequence callback now iterates ALL 3 melodic tracks for simultaneous playback (skips muted tracks)
- `toggleStep`, `hasNoteAtStep`, `clearAllMelodic`, `setSelectedNote`, `getSelectedNote` all operate on the active track's state

### instruments.js (modified)
- `noteOn`/`noteOff`/`releaseAll`/`getActiveSynth` all use `getActiveTrack().synth` when a melodic track is active
- `switchInstrument` swaps the synth on the active track object and reconnects to its per-track effects chain
- `activeSynth` retained as a fallback for backward compatibility

### sequencer.js (modified)
- Added `getTrackById(0).muted` check before triggering drum voices
- Visual playhead sync (sequencer-step event) always fires regardless of mute state

## Architecture

```
Transport
  ├── Sequence (sequencer.js) — drum track
  │     └── drumBus → masterVolume
  └── Sequence (melodic-sequencer.js) — all melodic tracks
        ├── Track 1: PolySynth → reverb → delay → channel ─┐
        ├── Track 2: PolySynth → reverb → delay → channel ─┤→ masterVolume → Destination
        └── Track 3: PolySynth → reverb → delay → channel ─┘
```

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

All created/modified files confirmed present. Both task commits verified.
- FOUND: public/engine/track-manager.js
- FOUND: public/engine/effects.js
- FOUND: public/engine/instruments.js
- FOUND: public/engine/melodic-sequencer.js
- FOUND: public/engine/sequencer.js
- FOUND commit: 2186978 (Task 1)
- FOUND commit: 7f5f4b1 (Task 2)
