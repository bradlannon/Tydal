# Requirements: SoundForge

**Defined:** 2026-03-15
**Core Value:** When someone opens SoundForge on their phone and plays a few notes, their reaction should be "holy shit, this is in a browser?" — a musician should be able to connect a MIDI keyboard and genuinely jam with it.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

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

- [ ] **DRUM-01**: 808/909-style kick drum synthesis with pitch sweep, distortion, and sub-bass layering
- [ ] **DRUM-02**: Snare synthesis with noise component + tonal body resonance
- [ ] **DRUM-03**: Hi-hat synthesis (closed + open variants) with choke behavior
- [ ] **DRUM-04**: Clap synthesis with multi-burst noise and reverb tail
- [ ] **DRUM-05**: Pre-allocated noise buffers for drum voices (no per-hit regeneration)

### Performance & Expression

- [x] **PERF-01**: Velocity sensitivity on touch input — measure touch speed (pixels/ms) mapped to note volume
- [x] **PERF-02**: Velocity sensitivity on MIDI input — map MIDI velocity byte (0-127) to note volume
- [x] **PERF-03**: MIDI input support via Web MIDI API with graceful degradation on unsupported browsers
- [x] **PERF-04**: Chromatic note layout on pads with consecutive semitones (no duplicates)
- [x] **PERF-05**: Octave shifting (+/- octave transposition)
- [x] **PERF-06**: Scale lock mode — constrain pads to a selected scale and key
- [x] **PERF-07**: Mobile-first multitouch support with touch-action: manipulation (no zoom/scroll interference)

### Composition

- [ ] **COMP-01**: Step sequencer with per-instrument rows, 16-32 steps, and playback cursor
- [ ] **COMP-02**: Step sequencer is tempo-aware (step length derived from BPM)
- [ ] **COMP-03**: Tap tempo — set BPM by tapping rhythm
- [ ] **COMP-04**: Quantization for recorded loops (snap-to-grid: 1/4, 1/8, 1/16, 1/32)
- [ ] **COMP-05**: Recording with overdub support and undo stack

### Visualizer

- [ ] **VIZ-01**: Real-time frequency spectrum visualizer with AnalyserNode (fftSize >= 2048)
- [ ] **VIZ-02**: Waveform / oscilloscope display mode
- [ ] **VIZ-03**: Visuals react expressively to audio — pitch-colored waveforms, intensity-driven animations
- [ ] **VIZ-04**: Visual transient detection — particle bursts or glow effects on drum hits and note attacks

### Unique Interaction

- [ ] **UX-01**: Gyroscope/tilt control — device tilt maps to pitch bend or filter sweep
- [ ] **UX-02**: iOS DeviceMotion permission request UI (required on iOS 13+)
- [ ] **UX-03**: Jitter smoothing on gyroscope data for stable control output

### Platform

- [ ] **PLAT-01**: PWA with Web App Manifest — installable to home screen with standalone display mode
- [ ] **PLAT-02**: Service worker with offline caching (Tone.js + all app assets precached)
- [ ] **PLAT-03**: WAV audio export of recordings/loops
- [ ] **PLAT-04**: Preset system — save/recall patches to localStorage
- [ ] **PLAT-05**: Preset sharing via URL encoding (base64-encoded JSON in query string/hash)

### Integration

- [x] **INTG-01**: Portfolio theme integration — same nav (nav-links + search box), footer, #FAFAFA background
- [x] **INTG-02**: Dark instrument container (card-style) within the light portfolio page
- [x] **INTG-03**: Responsive design — mobile-first with desktop enhancements
- [x] **INTG-04**: ES modules loaded via import map (no build step), Tone.js from CDN

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Composition

- **COMP-V2-01**: Swing/shuffle control (±% delay on even steps)
- **COMP-V2-02**: Pattern chaining — link multiple step sequencer patterns
- **COMP-V2-03**: MIDI export of recorded performances

### Sound Design

- **SYNTH-V2-01**: Wavetable synthesis mode
- **SYNTH-V2-02**: Additional FM presets (bells, brass, strings)
- **SYNTH-V2-03**: User-designed custom presets with full parameter editing UI

### Platform

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
| DRUM-01 | Phase 3 | Pending |
| DRUM-02 | Phase 3 | Pending |
| DRUM-03 | Phase 3 | Pending |
| DRUM-04 | Phase 3 | Pending |
| DRUM-05 | Phase 3 | Pending |
| COMP-01 | Phase 3 | Pending |
| COMP-02 | Phase 3 | Pending |
| COMP-03 | Phase 3 | Pending |
| COMP-04 | Phase 3 | Pending |
| COMP-05 | Phase 3 | Pending |
| VIZ-01 | Phase 4 | Pending |
| VIZ-02 | Phase 4 | Pending |
| VIZ-03 | Phase 4 | Pending |
| VIZ-04 | Phase 4 | Pending |
| UX-01 | Phase 4 | Pending |
| UX-02 | Phase 4 | Pending |
| UX-03 | Phase 4 | Pending |
| PLAT-04 | Phase 4 | Pending |
| PLAT-05 | Phase 4 | Pending |
| PLAT-01 | Phase 5 | Pending |
| PLAT-02 | Phase 5 | Pending |
| PLAT-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 51 total
- Mapped to phases: 51
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-15 after roadmap creation — all requirements mapped*
