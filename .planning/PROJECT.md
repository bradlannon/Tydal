# SoundForge

## What This Is

A professional-grade browser musical instrument that lives within Brad Lannon's portfolio site. Mobile-first, PWA-enabled, built on Tone.js. It combines multi-oscillator synthesis, FM-based realistic instruments, and 808/909-style drum machines with an effects chain, MIDI support, velocity sensitivity, and a real-time visualizer. The instrument should feel unique across visuals, interaction, and sound — not a clone of any existing web instrument.

## Core Value

When someone opens SoundForge on their phone and plays a few notes, their reaction should be "holy shit, this is in a browser?" — a musician should be able to connect a MIDI keyboard and genuinely jam with it.

## Requirements

### Validated

- ✓ Portfolio integration (nav, footer, background theme) — existing
- ✓ Basic sound pad with keyboard-mapped pads — existing (will be rebuilt)

### Active

- [ ] Multi-oscillator synthesis with ADSR envelopes, filters, and LFO
- [ ] FM synthesis for realistic piano, organ, and electric piano voices
- [ ] 808/909-style drum synthesis with pattern sequencer
- [ ] Effects chain (reverb, delay, distortion, filter with cutoff/resonance)
- [ ] MIDI input support (Web MIDI API)
- [ ] Velocity sensitivity (touch speed on mobile, MIDI velocity on controllers)
- [ ] 8-voice polyphony with voice stealing
- [ ] Proper AudioContext timing via Tone.js Transport (no setTimeout)
- [ ] WAV audio export of recordings/loops
- [ ] Chromatic note layout with octave shifting
- [ ] Scale lock mode (constrain pads to a specific scale/key)
- [ ] Tap tempo and BPM control
- [ ] Real-time visualizer (waveform + frequency spectrum)
- [ ] Preset system (save/recall/share patches)
- [ ] PWA with offline support (installable, works without internet)
- [ ] 6-8 polished instrument presets (2-3 synths, 2 realistic, 1-2 drum kits)
- [ ] Unique visual design — visualizer that reacts expressively to what you play
- [ ] Unique interaction — gyroscope/tilt for pitch bend, swipe for filter sweeps, shake for effects
- [ ] Unique sound — unexpected synthesis combinations, generative pattern options
- [ ] Mobile-first touch interface with multitouch support
- [ ] Master volume and per-channel mixing
- [ ] Note-on/note-off with sustain (keyup tracking)
- [ ] Quantization options for recording (snap-to-grid)
- [ ] Step sequencer with per-instrument rows, playback cursor, tempo-aware grid

### Out of Scope

- Full DAW / multi-track recording — this is an instrument, not a production suite
- MIDI output — input only for v1
- MIDI clock sync with external hardware
- Plugin ecosystem / VST support — browser limitation
- Social features / SoundCloud integration — keep it self-contained
- Video recording of performances
- Collaborative / multi-user jamming
- Custom sample upload / sampler mode

## Context

**Existing codebase:** The current sound pad (`public/apps/sound-pad.html`) is a single-file toy with single oscillators, setTimeout-based timing, no effects, no MIDI, no velocity. Full analysis at `.planning/current-app-analysis.md`.

**Community research:** Reddit/HN/forum research at `.planning/reddit-research.md` identified latency, velocity sensitivity, effects, and MIDI as the key differentiators between "toy" and "tool." Tone.js is the recommended framework. AudioWorklet has known mobile issues (GitHub #2632).

**Portfolio integration:** Must match the portfolio theme — same nav (nav-links + search box), footer, `#FAFAFA` background. The instrument UI itself uses a dark container (card-style) within the light page. Already aligned in the recent theme fix commit.

**Codebase map:** Full analysis at `.planning/codebase/` — portfolio is static HTML served via Express, no build system, inline styles, Chart.js for dashboards.

**Target quality bar:** A musician friend connects their MIDI keyboard and jams for 10+ minutes. Hiring managers see serious audio/JS engineering. First-time visitors say "holy shit, this is in a browser?"

## Constraints

- **Tech stack**: Tone.js for audio engine, vanilla JS modules (no React/framework), HTML/CSS for UI. Must work without a build step — ES modules loaded directly.
- **Integration**: Must live at `/public/apps/sound-pad/` and integrate with portfolio nav/footer/theme
- **Performance**: Target <30ms round-trip latency on desktop, graceful degradation on mobile
- **Browser**: Chrome primary, Firefox and Safari secondary. Mobile Safari requires special AudioContext handling.
- **Size**: Tone.js is ~150KB — acceptable. Total app bundle should stay under 500KB.
- **No build system**: The portfolio has no webpack/vite. Use ES module imports, possibly a CDN for Tone.js.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tone.js over vanilla Web Audio | Handles scheduling, transport, effects, synth architecture. Solves setTimeout timing problem. | — Pending |
| Mobile-first, desktop secondary | Portfolio visitors increasingly on mobile; touch is the primary interaction | — Pending |
| ES modules, no build step | Matches existing portfolio architecture (static HTML, Express server) | — Pending |
| 6-8 focused presets over broad collection | Polish > quantity. Each preset should sound genuinely good. | — Pending |
| PWA with offline support | Musicians want to use instruments anywhere (subway, plane). High-value differentiator. | — Pending |
| Single-page app in /sound-pad/ directory | Clean separation from monolithic single-file. JS modules for maintainability. | — Pending |

---
*Last updated: 2026-03-14 after initialization*
