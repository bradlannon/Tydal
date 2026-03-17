# Requirements: Tydal

**Defined:** 2026-03-15
**Core Value:** When someone opens Tydal on their phone and plays a few notes, their reaction should be "holy shit, this is in a browser?" — a musician should be able to connect a MIDI keyboard and genuinely jam with it.

## v1.1 Requirements — Ableton Move Redesign

Requirements for Move-inspired redesign. Phases 6+.

### Move Visual Design

- [x] **MVIS-01**: Matte black canvas aesthetic — pure black body (#000) where only illuminated elements have visual presence
- [x] **MVIS-02**: RGB pad coloring — root notes in track color, in-scale notes light gray, out-of-scale notes dark/unlit
- [x] **MVIS-03**: Green playhead indicator on step sequencer (replacing current teal), white for active steps
- [x] **MVIS-04**: No visible text labels on controls — contextual backlit icons that appear/disappear based on current mode
- [x] **MVIS-05**: OLED-style contextual display — small monochrome white-on-black info panel showing parameter name + value when touching a control
- [x] **MVIS-06**: Track color coding — each of 4 tracks has a distinct color that propagates to pads, steps, and buttons

### Move Layout

- [x] **MLAY-01**: 9 rotary encoder controls in a row above the pad grid (replacing slider-based panels) with touch-to-reveal parameter display
- [x] **MLAY-02**: 16 step buttons in a single horizontal row below encoders (replacing 4×8 step grid) with beat grouping markers
- [x] **MLAY-03**: 4×8 note pad grid below step buttons (32 pads — already matches, needs visual update)
- [x] **MLAY-04**: 4 track selection buttons on the left side with track color indicators
- [x] **MLAY-05**: Jog wheel / scroll browser element paired with OLED display for preset and sound browsing

### Multi-Track

- [x] **MTRK-01**: 4-track system — 1 drum track + 3 melodic tracks, each with independent instrument and effects
- [x] **MTRK-02**: Track switching — selecting a track changes which instrument the pads play and which step sequence is shown
- [x] **MTRK-03**: Per-track sequencer state — each track has its own 16-step pattern that plays simultaneously
- [x] **MTRK-04**: Per-track effects — each track can have up to 2 audio effects from the existing effects library
- [x] **MTRK-05**: Track mixing — per-track volume and mute accessible via track buttons

### Move Performance

- [x] **MPERF-01**: Arpeggiator with Up, Down, and Random modes for melodic tracks
- [x] **MPERF-02**: Capture mode — retroactively save the last played performance as a sequence (records into a rolling buffer, commit on demand)
- [x] **MPERF-03**: Swing/groove control — adjustable triplet 16th swing 0–100% applied to step playback
- [ ] **MPERF-04**: Per-step parameter automation — hold a step button + turn an encoder to set per-step values
- [x] **MPERF-05**: Contextual encoder mapping — encoders auto-map to relevant parameters based on selected track's instrument type

## v1 Requirements

Requirements for initial release (complete). Mapped to phases 1–5.

### Audio Core

- [x] **AUDIO-01**: App initializes a single Tone.js AudioContext with proper lifecycle management (suspended → running, iOS interrupted recovery)
- [x] **AUDIO-02**: Audio bus architecture with instrument channels → effects sends → master bus → Tone.Destination
- [x] **AUDIO-03**: Note-on/note-off lifecycle — notes sustain while key/pad is held, release on keyup/touchend
- [x] **AUDIO-04**: 8-voice polyphony with voice stealing via Tone.PolySynth
- [x] **AUDIO-05**: All scheduling uses Tone.Transport — no setTimeout for musical timing
- [x] **AUDIO-06**: Anti-click envelopes on all voice stop events (gain ramp to zero before stop)
- [x] **AUDIO-07**: Master volume control via Tone.Volume before Tone.Destination

### Sound Design

- [x] **SYNTH-01**: Multi-oscillator subtractive synthesizer with selectable waveforms (sine, square, sawtooth, triangle)
- [x] **SYNTH-02**: Full ADSR envelope controls (attack, decay, sustain, release) per voice
- [x] **SYNTH-03**: Filter with cutoff frequency and resonance (lowpass, highpass, bandpass modes)
- [x] **SYNTH-04**: LFO modulation for vibrato, tremolo, and filter sweeps
- [x] **SYNTH-05**: FM synthesis voices for realistic piano, organ, and electric piano timbres
- [x] **SYNTH-06**: 6-8 polished factory presets (2-3 synths, 2 FM realistic, 1-2 drum kits)

### Effects

- [x] **FX-01**: Effects chain: reverb (Tone.Reverb) with wet/dry and decay controls
- [x] **FX-02**: Effects chain: delay (Tone.FeedbackDelay) with time, feedback, and wet/dry controls
- [x] **FX-03**: Effects chain: distortion (Tone.Distortion) with amount control
- [x] **FX-04**: Effects chain: filter effect with cutoff and resonance knobs
- [x] **FX-05**: Per-channel volume and pan controls for independent instrument mixing

### Drums

- [x] **DRUM-01**: 808/909-style kick drum synthesis with pitch sweep, distortion, and sub-bass layering
- [x] **DRUM-02**: Snare synthesis with noise component + tonal body resonance
- [x] **DRUM-03**: Hi-hat synthesis (closed + open variants) with choke behavior
- [x] **DRUM-04**: Clap synthesis with multi-burst noise and reverb tail
- [x] **DRUM-05**: Pre-allocated noise buffers for drum voices (no per-hit regeneration)

### Performance & Expression

- [x] **PERF-01**: Velocity sensitivity on touch input — measure touch speed (pixels/ms) mapped to note volume
- [x] **PERF-02**: Velocity sensitivity on MIDI input — map MIDI velocity byte (0-127) to note volume
- [x] **PERF-03**: MIDI input support via Web MIDI API with graceful degradation on unsupported browsers
- [x] **PERF-04**: Chromatic note layout on pads with consecutive semitones (no duplicates)
- [x] **PERF-05**: Octave shifting (+/- octave transposition)
- [x] **PERF-06**: Scale lock mode — constrain pads to a selected scale and key
- [x] **PERF-07**: Mobile-first multitouch support with touch-action: manipulation (no zoom/scroll interference)

### Composition

- [x] **COMP-01**: Step sequencer with per-instrument rows, 16-32 steps, and playback cursor
- [x] **COMP-02**: Step sequencer is tempo-aware (step length derived from BPM)
- [x] **COMP-03**: Tap tempo — set BPM by tapping rhythm
- [x] **COMP-04**: Quantization for recorded loops (snap-to-grid: 1/4, 1/8, 1/16, 1/32)
- [x] **COMP-05**: Recording with overdub support and undo stack

### Visualizer

- [x] **VIZ-01**: Real-time frequency spectrum visualizer with AnalyserNode (fftSize >= 2048)
- [x] **VIZ-02**: Waveform / oscilloscope display mode
- [x] **VIZ-03**: Visuals react expressively to audio — pitch-colored waveforms, intensity-driven animations
- [x] **VIZ-04**: Visual transient detection — particle bursts or glow effects on drum hits and note attacks

### Unique Interaction

- [x] **UX-01**: Gyroscope/tilt control — device tilt maps to pitch bend or filter sweep
- [x] **UX-02**: iOS DeviceMotion permission request UI (required on iOS 13+)
- [x] **UX-03**: Jitter smoothing on gyroscope data for stable control output

### Performance Expression

- [x] **EXPR-01**: MPE-lite pad slide — finger X/Y within held pad controls pitch bend (detune ±200 cents) and filter sweep (200–6000 Hz) with EMA smoothing
- [x] **EXPR-02**: Note repeat — BPM-synced auto-retrigger at selectable rates (1/4, 1/8, 1/16, 1/32) while holding a pad
- [x] **EXPR-03**: Macro knobs — 4 sliders (Darkness, Grit, Motion, Space) each controlling multiple effect parameters simultaneously
- [x] **EXPR-04**: Macro randomize — one-tap random sound generation with musical constraints (chaos budget) and 4 variation snapshot slots
- [x] **EXPR-05**: Preset browser with preview — browsable preset list with tap-to-audition test chord and backup/restore flow

### Platform

- [ ] **PLAT-01**: PWA with Web App Manifest — installable to home screen with standalone display mode
- [ ] **PLAT-02**: Service worker with offline caching (Tone.js + all app assets precached)
- [ ] **PLAT-03**: WAV audio export of recordings/loops
- [x] **PLAT-04**: Preset system — save/recall patches to localStorage
- [x] **PLAT-05**: Preset sharing via URL encoding (base64-encoded JSON in query string/hash)

### Integration

- [x] **INTG-01**: Portfolio theme integration — same nav (nav-links + search box), footer, #FAFAFA background
- [x] **INTG-02**: Dark instrument container (card-style) within the light portfolio page
- [x] **INTG-03**: Responsive design — mobile-first with desktop enhancements
- [x] **INTG-04**: ES modules loaded via import map (no build step), Tone.js from CDN

## Future Requirements

Deferred to future releases. Tracked but not in current roadmap.

### Composition

- **COMP-V2-02**: Pattern chaining — link multiple step sequencer patterns
- **COMP-V2-03**: MIDI export of recorded performances

### Sound Design

- **SYNTH-V2-01**: Wavetable synthesis mode
- **SYNTH-V2-02**: Additional FM presets (bells, brass, strings)
- **SYNTH-V2-03**: User-designed custom presets with full parameter editing UI

### Platform

- **PLAT-01**: PWA with Web App Manifest — installable to home screen with standalone display mode
- **PLAT-02**: Service worker with offline caching (Tone.js + all app assets precached)
- **PLAT-03**: WAV audio export of recordings/loops
- **PLAT-V2-01**: MIDI output to external instruments
- **PLAT-V2-02**: MIDI clock sync with external hardware

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full DAW / multi-track recording | Instrument, not production suite — scope explosion |
| Custom sample upload / sampler mode | Separate instrument type, file handling complexity |
| Social / SoundCloud integration | Requires server-side auth, conflicts with static architecture |
| Collaborative multi-user jamming | WebRTC/WebSocket infrastructure, fundamentally different architecture |
| Video recording of performances | Variable quality, marginal use case — users can screen record |
| Plugin ecosystem / VST support | Browser platform constraint |
| Aftertouch / pressure sensitivity | Force Touch deprecated, no reliable cross-platform web API |
| Piano roll / timeline editor | Major UI project — step sequencer is the composition surface |
| Pitch detection / auto-tune | Separate tool category, requires microphone input |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIO-01 | Phase 1 | Complete |
| AUDIO-02 | Phase 1 | Complete |
| AUDIO-03 | Phase 1 | Complete |
| AUDIO-04 | Phase 1 | Complete |
| AUDIO-05 | Phase 1 | Complete |
| AUDIO-06 | Phase 1 | Complete |
| AUDIO-07 | Phase 1 | Complete |
| INTG-01 | Phase 1 | Complete |
| INTG-02 | Phase 1 | Complete |
| INTG-03 | Phase 1 | Complete |
| INTG-04 | Phase 1 | Complete |
| SYNTH-01 | Phase 2 | Complete |
| SYNTH-02 | Phase 2 | Complete |
| SYNTH-03 | Phase 2 | Complete |
| SYNTH-04 | Phase 2 | Complete |
| SYNTH-05 | Phase 2 | Complete |
| SYNTH-06 | Phase 2 | Complete |
| FX-01 | Phase 2 | Complete |
| FX-02 | Phase 2 | Complete |
| FX-03 | Phase 2 | Complete |
| FX-04 | Phase 2 | Complete |
| FX-05 | Phase 2 | Complete |
| PERF-01 | Phase 2 | Complete |
| PERF-02 | Phase 2 | Complete |
| PERF-03 | Phase 2 | Complete |
| PERF-04 | Phase 2 | Complete |
| PERF-05 | Phase 2 | Complete |
| PERF-06 | Phase 2 | Complete |
| PERF-07 | Phase 2 | Complete |
| DRUM-01 | Phase 3 | Complete |
| DRUM-02 | Phase 3 | Complete |
| DRUM-03 | Phase 3 | Complete |
| DRUM-04 | Phase 3 | Complete |
| DRUM-05 | Phase 3 | Complete |
| COMP-01 | Phase 3 | Complete |
| COMP-02 | Phase 3 | Complete |
| COMP-03 | Phase 3 | Complete |
| COMP-04 | Phase 3 | Complete |
| COMP-05 | Phase 3 | Complete |
| VIZ-01 | Phase 4 | Complete |
| VIZ-02 | Phase 4 | Complete |
| VIZ-03 | Phase 4 | Complete |
| VIZ-04 | Phase 4 | Complete |
| UX-01 | Phase 4 | Complete |
| UX-02 | Phase 4 | Complete |
| UX-03 | Phase 4 | Complete |
| PLAT-04 | Phase 4 | Complete |
| PLAT-05 | Phase 4 | Complete |
| EXPR-01 | Phase 5 | Complete |
| EXPR-02 | Phase 5 | Complete |
| EXPR-03 | Phase 5 | Complete |
| EXPR-04 | Phase 5 | Complete |
| EXPR-05 | Phase 5 | Complete |
| MVIS-01 | Phase 6 | Complete |
| MVIS-02 | Phase 6 | Complete |
| MVIS-03 | Phase 6 | Complete |
| MVIS-04 | Phase 6 | Complete |
| MVIS-05 | Phase 7 | Complete |
| MVIS-06 | Phase 8 | Complete |
| MLAY-01 | Phase 7 | Complete |
| MLAY-02 | Phase 7 | Complete |
| MLAY-03 | Phase 6 | Complete |
| MLAY-04 | Phase 8 | Complete |
| MLAY-05 | Phase 7 | Complete |
| MTRK-01 | Phase 8 | Complete |
| MTRK-02 | Phase 8 | Complete |
| MTRK-03 | Phase 8 | Complete |
| MTRK-04 | Phase 8 | Complete |
| MTRK-05 | Phase 8 | Complete |
| MPERF-01 | Phase 9 | Complete |
| MPERF-02 | Phase 9 | Complete |
| MPERF-03 | Phase 9 | Complete |
| MPERF-04 | Phase 9 | Pending |
| MPERF-05 | Phase 7 | Complete |

**Coverage:**
- v1 requirements: 51 complete
- v1.1 requirements: 21 total
- Mapped to phases: 72
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-16 after v1.1 milestone requirements*
