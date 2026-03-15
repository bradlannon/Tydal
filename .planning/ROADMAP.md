# Roadmap: SoundForge

## Overview

SoundForge is built in five phases ordered by hard technical dependencies. The audio engine must be correct before instruments can be layered on top; instruments must be playable before composition tools make sense; the composition surface must be stable before differentiating features (FM synthesis, visualizer, presets) are added; and platform capabilities (PWA, WAV export) go last because the service worker caches a specific file inventory that must be final. Every phase delivers something a musician can play with — nothing is purely internal infrastructure.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Audio Foundation** - Correct audio engine with note lifecycle, timing, and portfolio integration
- [ ] **Phase 2: Instrument Quality** - Cross the toy-to-tool line with polyphony, velocity, effects, and chromatic layout
- [ ] **Phase 3: Composition Surface** - Drum synthesis and step sequencer for pattern-based music making
- [ ] **Phase 4: Differentiators** - FM voices, expressive visualizer, scale lock, and preset system
- [ ] **Phase 5: Platform Polish** - PWA offline support, WAV export, and gyroscope interaction

## Phase Details

### Phase 1: Audio Foundation
**Goal**: A correct Tone.js audio engine with iOS AudioContext lifecycle, warm pad synth, 4x4 MPC-layout pad grid, keyboard and touch input, and standalone dark theme app shell
**Depends on**: Nothing (first phase)
**Requirements**: AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04, AUDIO-05, AUDIO-06, AUDIO-07, INTG-01, INTG-02, INTG-03, INTG-04
**Success Criteria** (what must be TRUE):
  1. Opening the app on iOS Safari produces sound on the first tap with no silent failure
  2. Holding a pad key sustains the note; releasing the key stops it without an audible click
  3. The app is a standalone dark-themed instrument at its own domain (not embedded in portfolio)
  4. All audio scheduling uses Tone.now() — no setTimeout calls exist in timing-critical paths
  5. Multiple rapid note starts do not spawn unbounded oscillators or crash the page
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Scaffold app shell, dark theme CSS, audio engine, signal chain, iOS overlay
- [ ] 01-02-PLAN.md — 4x4 pad grid UI, keyboard and touch input handlers, volume control, help tooltip

### Phase 2: Instrument Quality
**Goal**: A musician can pick up the instrument and play it seriously — polyphonic, velocity-sensitive, with effects and a chromatic layout
**Depends on**: Phase 1
**Requirements**: SYNTH-01, SYNTH-02, SYNTH-03, SYNTH-04, SYNTH-05, SYNTH-06, FX-01, FX-02, FX-03, FX-04, FX-05, PERF-01, PERF-02, PERF-03, PERF-04, PERF-05, PERF-06, PERF-07
**Success Criteria** (what must be TRUE):
  1. Playing 8 notes simultaneously produces 8 voices without crash or degradation; a 9th note voice-steals cleanly
  2. Hard touch vs soft touch on mobile pads produces audibly different note volumes
  3. Connecting a MIDI keyboard and playing triggers notes with correct velocity mapping
  4. Pads are laid out chromatically with semitone labels; octave shift buttons move the range up and down
  5. Reverb and delay effects are audible and adjustable via on-screen controls; filter cutoff/resonance respond in real time
**Plans**: TBD

### Phase 3: Composition Surface
**Goal**: Users can program and play drum patterns — 808/909-style synthesis in a tempo-accurate step sequencer
**Depends on**: Phase 2
**Requirements**: DRUM-01, DRUM-02, DRUM-03, DRUM-04, DRUM-05, COMP-01, COMP-02, COMP-03, COMP-04, COMP-05
**Success Criteria** (what must be TRUE):
  1. Kick, snare, hi-hat, and clap pads each have distinct synthesis character (not generic sine waves)
  2. A 16-step drum pattern plays back with a visible cursor tracking the current step, locked to BPM
  3. Tapping a rhythm on the tap tempo button adjusts BPM; the sequencer immediately syncs to the new tempo
  4. Recording a melody over a running drum loop snaps notes to the selected quantization grid
  5. Overdubbing adds notes without erasing existing ones; undo removes the last overdub
**Plans**: TBD

### Phase 4: Differentiators
**Goal**: SoundForge sounds and feels unlike any other browser instrument — FM voices, expressive visuals, scale lock, and shareable presets
**Depends on**: Phase 3
**Requirements**: VIZ-01, VIZ-02, VIZ-03, VIZ-04, UX-01, UX-02, UX-03, PLAT-04, PLAT-05
**Success Criteria** (what must be TRUE):
  1. Selecting the piano preset produces a clearly piano-like timbre; organ and electric piano are similarly distinctive
  2. The visualizer reacts expressively to playing — waveform color shifts with pitch, drum hits produce particle bursts or glow pulses
  3. Tilting the phone while playing bends pitch or sweeps the filter in a musically useful range
  4. A patch can be saved to localStorage and recalled after page reload; sharing the URL restores the same patch in another browser
  5. Enabling scale lock constrains pads to a chosen key and scale — no out-of-key notes are possible
**Plans**: TBD

### Phase 5: Platform Polish
**Goal**: SoundForge is installable, works offline, can export recordings, and performs correctly on real mobile hardware
**Depends on**: Phase 4
**Requirements**: PLAT-01, PLAT-02, PLAT-03
**Success Criteria** (what must be TRUE):
  1. Adding SoundForge to the iOS home screen launches it in standalone mode with no browser chrome
  2. Turning off WiFi after install and reopening the app produces full functionality with no network errors
  3. Recording a loop and pressing Export downloads a valid WAV file that plays correctly in any audio player
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Audio Foundation | 1/2 | In Progress|  |
| 2. Instrument Quality | 0/TBD | Not started | - |
| 3. Composition Surface | 0/TBD | Not started | - |
| 4. Differentiators | 0/TBD | Not started | - |
| 5. Platform Polish | 0/TBD | Not started | - |
