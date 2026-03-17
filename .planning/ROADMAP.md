# Roadmap: Tydal

## Overview

Tydal is built across two milestones. v1.0 (phases 1-5) delivered a complete browser instrument — correct audio engine, polyphonic synthesis, drum/step sequencer, expressive performance features, and presets. v1.1 (phases 6-9) transforms the visual design and interaction model to match Ableton Move's hardware aesthetic: matte black canvas, RGB pad coloring, encoder-based controls, a 4-track system, and Move-style performance features.

v1.1 phases are ordered by dependency: the visual aesthetic is the foundation all subsequent phases build on. Encoder layout and contextual display come next (controls exist before multi-track wires them per-track). Multi-track requires the layout to be in place. Performance features go last as they layer on top of a stable multi-track engine.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

**v1.0 (complete)**

- [x] **Phase 1: Audio Foundation** - Correct audio engine with note lifecycle, timing, and portfolio integration (completed 2026-03-15)
- [x] **Phase 2: Instrument Quality** - Cross the toy-to-tool line with polyphony, velocity, effects, and chromatic layout (completed 2026-03-15)
- [x] **Phase 3: Composition Surface** - Drum synthesis and step sequencer for pattern-based music making (completed 2026-03-15)
- [x] **Phase 4: Differentiators** - FM voices, expressive visualizer, scale lock, and preset system (completed 2026-03-16)
- [x] **Phase 5: Performance Features** - Push 3-inspired expression, note repeat, macros, randomize, preset browser (completed 2026-03-16)

**v1.1 — Ableton Move Redesign**

- [x] **Phase 6: Move Visual Aesthetic** - Matte black canvas overhaul, RGB pad coloring, green playhead, step button restyling (completed 2026-03-17)
- [x] **Phase 7: Encoder Layout & Contextual Display** - 9 rotary encoders, OLED-style display, 16 step button row, jog wheel browser (completed 2026-03-17)
- [ ] **Phase 8: Multi-Track System** - 4-track engine, track switching, per-track sequencer/effects, track buttons, track color coding
- [ ] **Phase 9: Move Performance Features** - Arpeggiator, capture mode, swing/groove control, per-step automation

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
- [x] 01-01-PLAN.md — Scaffold app shell, dark theme CSS, audio engine, signal chain, iOS overlay
- [x] 01-02-PLAN.md — 4x4 pad grid UI, keyboard and touch input handlers, volume control, help tooltip

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
**Plans**: 5 plans

Plans:
- [x] 02-01-PLAN.md — Synth engine refactor + full effects chain (reverb, delay, distortion, filter, voice stealing)
- [x] 02-02-PLAN.md — Chromatic pad layout, octave shift, multitouch hardening
- [x] 02-03-PLAN.md — Touch velocity, Web MIDI input, LFO modulation
- [x] 02-04-PLAN.md — FM synthesis presets, synth/FX control panels, scale lock
- [x] 02-05-PLAN.md — Human verification of all Phase 2 success criteria

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
**Plans**: 4 plans

Plans:
- [x] 03-01-PLAN.md — Drum synthesis engine (kick, snare, hi-hat, clap) + step sequencer engine
- [x] 03-02-PLAN.md — Sequencer UI grid, cursor, play/stop, BPM slider, tap tempo
- [x] 03-03-PLAN.md — Quantized melody recording with overdub and undo
- [x] 03-04-PLAN.md — Human verification of all Phase 3 success criteria

### Phase 4: Differentiators
**Goal**: Tydal sounds and feels unlike any other browser instrument — FM voices, expressive visuals, scale lock, and shareable presets
**Depends on**: Phase 3
**Requirements**: VIZ-01, VIZ-02, VIZ-03, VIZ-04, UX-01, UX-02, UX-03, PLAT-04, PLAT-05
**Success Criteria** (what must be TRUE):
  1. Selecting the piano preset produces a clearly piano-like timbre; organ and electric piano are similarly distinctive
  2. The visualizer reacts expressively to playing — waveform color shifts with pitch, drum hits produce particle bursts or glow pulses
  3. Tilting the phone while playing bends pitch or sweeps the filter in a musically useful range
  4. A patch can be saved to localStorage and recalled after page reload; sharing the URL restores the same patch in another browser
  5. Enabling scale lock constrains pads to a chosen key and scale — no out-of-key notes are possible
**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md — Audio visualizer with spectrum/waveform modes, pitch coloring, transient glow
- [x] 04-02-PLAN.md — Gyroscope tilt control with iOS permission and jitter smoothing
- [x] 04-03-PLAN.md — Preset save/load to localStorage and URL-based sharing
- [ ] 04-04-PLAN.md — Human verification of all Phase 4 success criteria

### Phase 5: Performance Features
**Goal**: Push 3-inspired performance features — pad slide expression, note repeat, macro knobs, randomize with variations, and preset browser with preview
**Depends on**: Phase 4
**Requirements**: EXPR-01, EXPR-02, EXPR-03, EXPR-04, EXPR-05
**Success Criteria** (what must be TRUE):
  1. Holding a note pad and sliding finger produces audible pitch bend (X) and filter sweep (Y) that reset on release
  2. With Note Repeat enabled, holding a pad auto-retriggers the note at the selected BPM-synced rate
  3. Moving a macro slider simultaneously controls multiple effect parameters (e.g., Darkness closes filter + increases reverb)
  4. Tapping Randomize produces a new musically usable sound; saving to a variation slot and loading it back restores the exact sound
  5. Tapping a preset in the browser plays an audible preview chord; canceling restores the original sound
**Plans**: 5 plans

Plans:
- [x] 05-01-PLAN.md — MPE-lite pad slide expression (X->pitch bend, Y->filter sweep)
- [x] 05-02-PLAN.md — Note repeat at BPM-synced rates with RPT toggle and rate selector
- [x] 05-03-PLAN.md — 4 macro knobs (Darkness, Grit, Motion, Space) controlling multiple params
- [x] 05-04-PLAN.md — Randomize with musical constraints and 4 variation snapshot slots
- [x] 05-05-PLAN.md — Preset browser with tap-to-audition preview flow

### Phase 6: Move Visual Aesthetic
**Goal**: The app looks unmistakably like an Ableton Move — pure black canvas where only illuminated elements have visual presence, with RGB pad coloring and Move-style step sequencer styling
**Depends on**: Phase 5
**Requirements**: MVIS-01, MVIS-02, MVIS-03, MVIS-04, MLAY-03
**Success Criteria** (what must be TRUE):
  1. The app background is pure black (#000); controls, labels, and borders that were previously visible on the dark container are gone — only lit elements exist
  2. Root note pads glow in the active track color, in-scale pads show dim gray, out-of-scale pads are nearly unlit
  3. The step sequencer playhead indicator is green; active steps are white; inactive steps are dark
  4. No static text labels appear on controls — the surface looks like hardware, not a web form
  5. The 4x8 pad grid visually matches Move's layout proportions and lighting behavior
**Plans**: 2 plans

Plans:
- [x] 06-01-PLAN.md — Move CSS token system, black canvas overhaul, strip all text labels
- [x] 06-02-PLAN.md — RGB pad coloring, green playhead, white active steps, grid proportions

### Phase 7: Encoder Layout & Contextual Display
**Goal**: Sliders and panels are replaced by 9 rotary encoders with a small OLED-style info display, a 16-step horizontal button row, and a jog wheel for browsing — the layout matches Move's physical hardware
**Depends on**: Phase 6
**Requirements**: MVIS-05, MLAY-01, MLAY-02, MLAY-05, MPERF-05
**Success Criteria** (what must be TRUE):
  1. Nine rotary encoders appear in a horizontal row; touching one reveals its parameter name and current value in a small monochrome display panel
  2. Step buttons appear as a single row of 16 with beat grouping markers (beat groups of 4); tapping activates/deactivates steps
  3. The OLED display shows parameter name and value only while interacting — it goes dark when not in use
  4. A jog wheel element allows scrolling through presets and sounds with the OLED display showing the current item
  5. Encoders auto-map to the selected track's relevant parameters — drum track shows drum parameters, melodic track shows synth parameters
**Plans**: 3 plans

Plans:
- [ ] 08-01-PLAN.md — Track engine core: 4-track audio architecture with per-track synths, effects chains, and simultaneous sequencer playback
- [ ] 08-02-PLAN.md — Track switching UI: 4 track buttons, pad color/step pattern/encoder mapping per track
- [ ] 08-03-PLAN.md — Per-track effects, volume, and mute controls

Plans:
- [ ] 07-01-PLAN.md — Rotary encoder component, OLED display, and 9-encoder row with synth/FX mapping
- [ ] 07-02-PLAN.md — 16-step horizontal button row replacing 4x8 step zone
- [ ] 07-03-PLAN.md — Jog wheel preset browser and contextual encoder auto-mapping

### Phase 8: Multi-Track System
**Goal**: Four simultaneous tracks (1 drum + 3 melodic) each with independent instrument, effects, and step pattern — selecting a track switches what the pads play and shows that track's sequence
**Depends on**: Phase 7
**Requirements**: MVIS-06, MLAY-04, MTRK-01, MTRK-02, MTRK-03, MTRK-04, MTRK-05
**Success Criteria** (what must be TRUE):
  1. Four track buttons are visible with distinct color indicators; tapping a track button switches the active track and the pad grid immediately reflects that track's instrument and color
  2. All four tracks play their 16-step patterns simultaneously during sequencer playback
  3. Switching to a different track shows that track's step pattern in the step row; edits only affect the selected track
  4. Each track can have up to 2 effects applied independently; switching tracks does not bleed effects between tracks
  5. Per-track volume and mute are accessible via the track buttons; muting a track silences it without stopping the sequencer
**Plans**: 3 plans

Plans:
- [ ] 08-01-PLAN.md — Track engine core: 4-track audio architecture with per-track synths, effects chains, and simultaneous sequencer playback
- [ ] 08-02-PLAN.md — Track switching UI: 4 track buttons, pad color/step pattern/encoder mapping per track
- [ ] 08-03-PLAN.md — Per-track effects, volume, and mute controls

### Phase 9: Move Performance Features
**Goal**: Move's signature performance features are available — arpeggiator for melodic tracks, capture mode for retroactive recording, swing control for groove, and per-step encoder automation
**Depends on**: Phase 8
**Requirements**: MPERF-01, MPERF-02, MPERF-03, MPERF-04
**Success Criteria** (what must be TRUE):
  1. Enabling the arpeggiator on a melodic track and holding pads produces Up, Down, or Random arpeggiated note output at the current BPM
  2. Playing a spontaneous melody then pressing Capture commits the last performance to the active track's step sequence without interrupting playback
  3. Adjusting swing from 0% to 100% produces audible triplet-feel groove on step playback; 0% is straight, higher values push off-beats
  4. Holding a step button and turning an encoder sets a per-step parameter value; that step plays with the automation value when the sequencer reaches it
**Plans**: 3 plans

Plans:
- [ ] 08-01-PLAN.md — Track engine core: 4-track audio architecture with per-track synths, effects chains, and simultaneous sequencer playback
- [ ] 08-02-PLAN.md — Track switching UI: 4 track buttons, pad color/step pattern/encoder mapping per track
- [ ] 08-03-PLAN.md — Per-track effects, volume, and mute controls

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Audio Foundation | 2/2 | Complete | 2026-03-15 |
| 2. Instrument Quality | 5/5 | Complete | 2026-03-15 |
| 3. Composition Surface | 4/4 | Complete | 2026-03-15 |
| 4. Differentiators | 3/4 | In Progress | -- |
| 5. Performance Features | 5/5 | Complete | 2026-03-16 |
| 6. Move Visual Aesthetic | 2/2 | Complete   | 2026-03-17 |
| 7. Encoder Layout & Contextual Display | 3/3 | Complete   | 2026-03-17 |
| 8. Multi-Track System | 1/3 | In Progress|  |
| 9. Move Performance Features | 0/? | Not started | -- |
