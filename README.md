# Tydal

A Push 3-inspired web instrument — synth, drums, step sequencer, effects chain, and expressive performance features, all running in the browser with Tone.js.

**Live:** [tydal.bradlannon.ca](https://tydal.bradlannon.ca)

## Features

**Instrument**
- 8-voice polyphonic synth with sawtooth, square, sine, triangle waveforms
- FM synthesis presets (piano, organ, electric piano)
- 7 factory presets + user patch save/load/share
- Full ADSR envelope and filter controls

**Performance**
- MPE-lite pad slide — finger X/Y controls pitch bend and filter sweep
- Note repeat — BPM-synced auto-retrigger at 1/4, 1/8, 1/16, 1/32 rates
- 4 macro knobs (Darkness, Grit, Motion, Space) for multi-param control
- Randomize with chaos budget + 4 variation snapshot slots
- Preset browser with tap-to-audition preview

**Composition**
- 16-step drum sequencer with kick, snare, hi-hat, clap synthesis
- Melodic step sequencer with 4 note lanes
- Quantized recording with overdub and undo
- Tap tempo

**Effects**
- Reverb, delay, distortion, filter, vibrato, tremolo
- Gyroscope tilt control for filter/pitch (iOS + Android)
- Real-time audio visualizer with spectrum and waveform modes

**Input**
- Touch (multitouch, velocity-sensitive)
- Keyboard (4×8 key mapping)
- MIDI (Web MIDI API)

## Tech Stack

- **Tone.js** — audio engine, synthesis, effects, transport
- **Tonal** — music theory, scale generation
- **Express** — static file server
- **No build step** — ES modules via import map, CDN dependencies

## Run Locally

```bash
npm install
npm start
```

Opens at [localhost:3000](http://localhost:3000).

## Layout

```
public/
├── index.html          # App shell
├── app.js              # Bootstrap and wiring
├── styles.css          # Dark theme, mobile-first
├── engine/             # Audio engine, synth, effects, sequencer
├── input/              # Touch, keyboard, MIDI handlers
└── ui/                 # Panels, grid, visualizer
server.js               # Express entry point
```

## License

MIT
