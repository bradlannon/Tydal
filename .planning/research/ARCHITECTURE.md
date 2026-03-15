# Architecture Patterns: Browser Musical Instrument (SoundForge)

**Domain:** Browser-based polyphonic musical instrument with synthesis, sequencing, and effects
**Researched:** 2026-03-15
**Overall confidence:** HIGH (Web Audio/Tone.js architecture is stable and well-documented)

---

## Recommended Architecture

SoundForge is best structured as a **layered module system** with strict separation between the audio engine, the sequencer/transport layer, the input handling layer, and the UI layer. These layers communicate downward only — UI dispatches commands, the audio engine never touches the DOM.

```
┌─────────────────────────────────────────────────────────┐
│                     UI Layer                            │
│  (HTML/CSS, pad grid, knobs, sequencer grid, presets)   │
│  Reads: state object   Writes: dispatches events/calls  │
└───────────────────────┬─────────────────────────────────┘
                        │ calls (imperative)
┌───────────────────────▼─────────────────────────────────┐
│               Input / Event Router                      │
│  (keyboard, touch, MIDI, gyroscope, gesture handler)    │
│  Normalizes input → note events, control changes        │
└──────────┬────────────────────────┬────────────────────-┘
           │ note on/off + velocity │ CC / param changes
┌──────────▼──────────┐   ┌────────▼───────────────────-─┐
│   Instrument Engine  │   │      Transport / Sequencer   │
│  (PolySynth voices,  │   │  (Tone.Transport, Pattern,   │
│   FM synths, drums)  │   │   Sequence, Loop, step grid) │
└──────────┬──────────┘   └────────┬────────────────────-─┘
           │                        │
           └────────────┬───────────┘
                        │ audio signal
┌───────────────────────▼─────────────────────────────────┐
│                  Effects Chain                          │
│  (per-instrument sends → master chain → Destination)    │
│  Reverb, Delay, Distortion, Filter, Volume              │
└───────────────────────┬─────────────────────────────────┘
                        │ audio signal (tapped before dest)
┌───────────────────────▼─────────────────────────────────┐
│                  Analyser / Meter                       │
│  (AnalyserNode tap → waveform + frequency data arrays)  │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              AudioContext Destination                   │
│                   (speakers / headphones)               │
└─────────────────────────────────────────────────────────┘
                        │ (read-only data path)
┌───────────────────────▼─────────────────────────────────┐
│                Visualizer (Canvas)                      │
│  (requestAnimationFrame loop reads analyser arrays)     │
│  Does NOT touch audio graph — reads only                │
└─────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

| Component | File(s) | Responsibility | Communicates With |
|-----------|---------|---------------|-------------------|
| **AudioEngine** | `engine/audio-engine.js` | Owns AudioContext lifecycle; initializes Tone.js; gates all audio behind user gesture | All audio components |
| **InstrumentEngine** | `engine/instruments.js` | Creates and owns PolySynth/FMSynth/DrumSynth instances; maps voice types to presets | Effects Chain, EventRouter |
| **EffectsChain** | `engine/effects.js` | Constructs and owns the effects signal graph; per-instrument sends + master bus | Analyser, Destination |
| **Transport** | `engine/transport.js` | Wraps Tone.Transport; owns Pattern/Sequence/Loop scheduling; exposes play/stop/BPM | InstrumentEngine |
| **Sequencer** | `engine/sequencer.js` | Manages step-grid state (which steps are active per instrument); drives Transport callbacks | Transport, UI |
| **Analyser** | `engine/analyser.js` | Owns AnalyserNode (tapped post-effects); exposes `getWaveform()` and `getFrequency()` methods | Visualizer, EffectsChain |
| **PresetManager** | `engine/presets.js` | Serializes/deserializes instrument+effects state to/from JSON; reads/writes localStorage | InstrumentEngine, EffectsChain |
| **MIDIHandler** | `input/midi.js` | Calls `navigator.requestMIDIAccess()`; normalizes note-on/off/CC; dispatches to EventRouter | EventRouter |
| **TouchHandler** | `input/touch.js` | Handles touchstart/touchend/touchmove; computes velocity from touch duration/speed; dispatches | EventRouter |
| **KeyboardHandler** | `input/keyboard.js` | Maps keydown/keyup to chromatic note layout; tracks held keys for note-off | EventRouter |
| **GestureHandler** | `input/gestures.js` | DeviceOrientation API for tilt/gyro; computes pitch bend, filter sweep values | EventRouter |
| **EventRouter** | `input/event-router.js` | Single hub all inputs flow into; routes note events to InstrumentEngine, CC to EffectsChain | InstrumentEngine, EffectsChain, Transport |
| **PadUI** | `ui/pad-grid.js` | Renders the touch pad grid; reflects active notes via CSS state; reads input events | EventRouter (listens for feedback) |
| **SequencerUI** | `ui/sequencer-grid.js` | Renders step grid; handles step toggle clicks; syncs playhead cursor to Transport position | Sequencer, Transport |
| **KnobUI** | `ui/knobs.js` | Renders parameter knobs (filter cutoff, resonance, ADSR, FX sends); dispatches param changes | EventRouter |
| **VisualizerUI** | `ui/visualizer.js` | Canvas 2D; rAF loop that reads Analyser data; no audio dependency beyond data arrays | Analyser |
| **PresetUI** | `ui/preset-panel.js` | Save/load/share preset UI; delegates to PresetManager | PresetManager |
| **AppController** | `app.js` | Top-level init: starts AudioContext on first gesture, wires all modules together | All components |
| **ServiceWorker** | `sw.js` | Cache-first for all app assets; precaches Tone.js CDN build; enables offline play | Browser fetch events |

---

## Audio Routing Graph (Detailed)

```
[PolySynth (Synth A)]──────────┐
[PolySynth (Synth B)]──────────┤
[FMSynth (Piano)]──────────────┼──► [Per-instrument GainNode (send level)]
[FMSynth (Organ)]──────────────┤         │
[DrumSynth (808)]──────────────┘         │
                                          ▼
                               [Distortion (optional insert)]
                                          │
                               [BiquadFilter (cutoff/res)]
                                          │
                    ┌─────────────────────┤
                    │                     │ (dry signal)
                    ▼                     │
           [FeedbackDelay]                │
                    │                     │
                    └──────────┬──────────┘
                               │
                    ┌──────────┤
                    │          │ (wet signal)
                    ▼          │
              [Reverb]         │
                    │          │
                    └──────────┤
                               │
                    ┌──────────▼──────────┐
                    │   Master Volume      │
                    │   (Tone.Volume)      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   AnalyserNode       │ ◄── Visualizer reads here
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Tone.Destination   │
                    │  (AudioDestination) │
                    └─────────────────────┘
```

**Key routing principle:** Use Tone.js `chain()` for serial effects and `fan()` for parallel sends (e.g., dry signal + reverb send). The routing API is write-only — the application must maintain its own JS references to all nodes.

---

## Data Flow

### Note Trigger Flow (touch or MIDI)

```
User action (touch/key/MIDI)
        │
TouchHandler / KeyboardHandler / MIDIHandler
        │ normalized: { note, velocity, channel }
        ▼
EventRouter
        │ routes to active instrument
        ▼
InstrumentEngine.triggerAttack(note, velocity)
        │
PolySynth.triggerAttack(note, time, velocity)
        │ audio signal flows through routing graph
        ▼
EffectsChain → AnalyserNode → Destination
```

### Parameter Change Flow (knob turn or MIDI CC)

```
KnobUI drag / MIDI CC message
        │
EventRouter.onParamChange({ param, value })
        │
EffectsChain.setParam(param, value)   -- or --
InstrumentEngine.setParam(param, value)
        │ ramps Tone.js signal parameter (no clicks)
        ▼
Audio graph parameter updated (scheduled at audio time)
        │
KnobUI reflects new value (read from state object)
```

### Sequencer Step Flow

```
Tone.Transport tick (every 16th note)
        │
Sequencer callback: which steps active for current beat?
        │
InstrumentEngine.triggerAttackRelease(note, duration)
        │
Audio plays; SequencerUI.updatePlayhead(step)
        │ (UI update on main thread, audio on audio thread)
```

### Visualizer Flow (read-only, never writes to audio graph)

```
requestAnimationFrame callback (60fps)
        │
Analyser.getWaveform() → Float32Array
Analyser.getFrequency() → Uint8Array
        │
VisualizerUI.draw(waveformData, freqData)
        │ draws to Canvas 2D context
        ▼
(no audio graph modification)
```

### Preset Load Flow

```
User clicks preset name
        │
PresetUI → PresetManager.load(presetName)
        │ fetches JSON from localStorage or bundled defaults
        ▼
InstrumentEngine.applyPreset(synthParams)
EffectsChain.applyPreset(fxParams)
        │ sets all Tone.js params (ramped to avoid clicks)
        ▼
KnobUI.refresh()  -- reflects new values in DOM
```

---

## Module File Structure

```
public/apps/sound-pad/
├── index.html              # Entry point: imports app.js as type="module"
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (cache-first strategy)
├── app.js                  # AppController: orchestrates init + wiring
├── engine/
│   ├── audio-engine.js     # AudioContext lifecycle, Tone.start() gate
│   ├── instruments.js      # PolySynth/FMSynth/DrumSynth creation + voice mgmt
│   ├── effects.js          # Effects graph construction + parameter API
│   ├── transport.js        # Tone.Transport wrapper, BPM, play/stop
│   ├── sequencer.js        # Step grid state + Transport callback wiring
│   ├── analyser.js         # AnalyserNode tap, waveform/freq accessor methods
│   └── presets.js          # Preset serialization, localStorage, default patches
├── input/
│   ├── event-router.js     # Central hub: all inputs → normalized events out
│   ├── midi.js             # Web MIDI API: requestMIDIAccess, note/CC parsing
│   ├── touch.js            # Touch events, multitouch, velocity from gesture speed
│   ├── keyboard.js         # Keyboard → chromatic note mapping, octave shift
│   └── gestures.js         # DeviceOrientation: tilt → pitch bend, filter sweep
├── ui/
│   ├── pad-grid.js         # Pad UI: layout, active state, octave display
│   ├── sequencer-grid.js   # Step grid render, playhead cursor, step toggles
│   ├── knobs.js            # Knob/slider controls, param display
│   ├── visualizer.js       # Canvas rAF loop, waveform + spectrum drawing
│   └── preset-panel.js     # Preset save/load/share UI
└── presets/
    ├── synth-lead.json     # Default synth preset
    ├── synth-pad.json      # Default pad preset
    ├── synth-bass.json     # Default bass preset
    ├── piano-fm.json       # FM piano preset
    ├── organ-fm.json       # FM organ preset
    ├── drums-808.json      # 808-style drum preset
    └── drums-909.json      # 909-style drum preset
```

---

## Patterns to Follow

### Pattern 1: Audio Context Gate

All audio must be blocked behind a single user gesture. Tone.js provides `Tone.start()` which must be called inside a user event handler. AudioContext starts in "suspended" state; `Tone.start()` resumes it.

```javascript
// audio-engine.js
let started = false;
export async function ensureStarted() {
  if (!started) {
    await Tone.start();
    started = true;
  }
}

// app.js — every touch/click on the instrument calls this first
document.getElementById('pad-grid').addEventListener('pointerdown', async () => {
  await ensureStarted();
  // then handle the note event
});
```

**Why:** iOS Safari and Chrome both block AudioContext until a user gesture. Failing to gate causes silent failure with no error on mobile.

### Pattern 2: Separate Audio Time from UI Time

Tone.js scheduling uses audio clock time (`Tone.now()`), not `Date.now()` or `setTimeout`. Never use `setTimeout` to schedule sound. Use `Tone.Transport.schedule()` or instrument trigger methods with explicit time parameters.

```javascript
// CORRECT: audio-clock scheduled
synth.triggerAttack(note, Tone.now());

// WRONG: UI-thread timed (causes drift and jank)
setTimeout(() => synth.triggerAttack(note), 0);
```

### Pattern 3: Ramp Parameter Changes

When changing synthesis parameters (filter cutoff, envelope times), ramp them over a short duration rather than jumping. Tone.js `Signal` objects support `.rampTo(value, rampTime)`.

```javascript
// Smooth filter sweep (no audio click artifacts)
filter.frequency.rampTo(newCutoff, 0.05);

// Jump causes audible click:
filter.frequency.value = newCutoff; // avoid during playback
```

### Pattern 4: PolySynth for All Pitched Instruments

All melodic voices (synths, FM piano) use `PolySynth` wrapping a monophonic voice type. `PolySynth` handles voice allocation, stealing, and 8-voice polyphony automatically.

```javascript
// instruments.js
const leadSynth = new Tone.PolySynth(Tone.Synth, {
  maxPolyphony: 8,
  voice: Tone.Synth,
  options: { /* synth params */ }
}).connect(effectsSend);
```

### Pattern 5: Tone.Sequence for the Step Sequencer

Use `Tone.Sequence` (not `setInterval` or custom transport logic) for step sequencer playback. Sequence callbacks fire on the audio thread clock, which is sample-accurate.

```javascript
// sequencer.js
const seq = new Tone.Sequence((time, step) => {
  if (stepGrid[step].active) {
    drumSynth.triggerAttackRelease(stepGrid[step].note, '16n', time);
  }
}, [...Array(16).keys()], '16n');
seq.start(0);
```

### Pattern 6: AnalyserNode as Passive Tap

Connect the AnalyserNode in parallel after the effects chain using `.fan()`. It never blocks the audio signal — it only reads from it.

```javascript
// effects.js
masterVolume.fan(analyserNode, Tone.Destination);
// analyser.js exports read-only getters:
export function getWaveform() {
  analyserNode.getFloatTimeDomainData(waveBuffer);
  return waveBuffer;
}
```

### Pattern 7: Import Map for Tone.js CDN

Since the portfolio has no build step, use an import map to load Tone.js from a CDN without a bundler. This keeps all app files as true ES modules.

```html
<!-- index.html -->
<script type="importmap">
{
  "imports": {
    "tone": "https://unpkg.com/tone@latest/build/Tone.js"
  }
}
</script>
<script type="module" src="./app.js"></script>
```

```javascript
// Any module file — clean named import
import * as Tone from 'tone';
```

**Confidence:** MEDIUM. Tone.js ships a UMD build; whether the unpkg build works cleanly as an ES module import via import map requires verification at implementation time. The pattern is architecturally correct; the specific CDN URL format may need adjustment.

### Pattern 8: Preset Serialization via JSON

All instrument and effects parameters serialize to plain JSON objects. `Tone.js` synths expose their current state via `.get()` and accept new state via `.set()`.

```javascript
// presets.js
export function capturePreset(synth, effects) {
  return {
    synth: synth.get(),
    effects: {
      reverb: { decay: effects.reverb.decay, wet: effects.reverb.wet.value },
      delay: { delayTime: effects.delay.delayTime.value, feedback: effects.delay.feedback.value }
    }
  };
}

export function applyPreset(synth, effects, preset) {
  synth.set(preset.synth);  // applies all synth params
  effects.reverb.decay = preset.effects.reverb.decay;
  effects.reverb.wet.rampTo(preset.effects.reverb.wet, 0.1);
  // etc.
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Monolithic Single File

**What:** Putting all engine, UI, and input logic in one `<script>` block (the current `sound-pad.html` pattern).
**Why bad:** Impossible to test components in isolation; audio logic gets coupled to DOM; preset system has no clean boundary to serialize.
**Instead:** The module structure above — each file has a single responsibility and explicit imports.

### Anti-Pattern 2: setTimeout / setInterval for Audio Scheduling

**What:** Using `setTimeout` to trigger notes or advance the sequencer.
**Why bad:** JavaScript timers are not sample-accurate; they drift under CPU load; causes audible timing errors above 120 BPM.
**Instead:** `Tone.Transport`, `Tone.Sequence`, `Tone.Pattern` — all backed by the audio clock.

### Anti-Pattern 3: Mutating Audio Graph During Playback

**What:** Disconnecting and reconnecting nodes while audio is playing (e.g., rebuilding the effects chain on preset load).
**Why bad:** Causes audio glitches (pops, clicks, dropouts). Also expensive — creating new AudioNodes mid-performance.
**Instead:** Keep nodes connected always; adjust parameters via `.rampTo()` or `.set()`. For structural changes, crossfade: spin up new node at 0 gain, ramp old to 0, then disconnect.

### Anti-Pattern 4: Reading from Audio Graph Nodes on Demand

**What:** Trying to query `filter.frequency.value` in a UI update loop to display the current state.
**Why bad:** `Tone.js` connections are write-only (as documented). Reading `.value` gives the scheduled value, not the current audio-thread value. Can create subtle sync bugs.
**Instead:** Maintain a separate JS state object that mirrors all parameter values. UI reads state; audio graph receives commands.

### Anti-Pattern 5: AudioWorklet for Core Synthesis

**What:** Building custom DSP processors in AudioWorklet for the synthesis engine.
**Why bad:** AudioWorklet has known mobile issues (GitHub #2632 in the web-audio-api repo). Tone.js handles scheduling better than hand-rolled AudioWorklet. Tone.js is already tested across mobile browsers.
**Instead:** Use Tone.js built-in synths. Only consider AudioWorklet if you need custom DSP that Tone.js genuinely cannot provide (unlikely for this instrument's scope).

### Anti-Pattern 6: Blocking Main Thread with Audio Init

**What:** Initializing Tone.js and creating all synth voices synchronously at page load before user interaction.
**Why bad:** Large AudioContext graph creation can block the main thread briefly; also wasted work if user never plays. Additionally, mobile browsers will not allow AudioContext creation before a gesture on some configurations.
**Instead:** Lazy-init: create the AudioContext on first user gesture, then initialize synth voices. Use a loading state in the UI.

---

## Scalability Considerations

| Concern | At 1 instrument | At 6 instruments (target) | At >6 instruments |
|---------|----------------|--------------------------|-------------------|
| Voice polyphony | 8 voices trivial | 8 voices per instrument = 48 active AudioNodes — fine | Memory pressure; implement voice stealing across instruments |
| Effects chain | One chain trivial | Per-instrument sends to shared master bus — recommended pattern | Route to aux buses by category (drums, synths) |
| Sequencer | One pattern trivial | 6 patterns, shared Transport — no issue | Multiple patterns may need pattern bank with mute groups |
| Preset storage | One preset in memory | 7 bundled defaults + user saves in localStorage | Export/import JSON files; localStorage caps at ~5MB |
| Visualizer | 60fps waveform trivial | Single analyser on master bus — no scaling needed | Multiple analysers per channel would need Worker offload |

---

## PWA / Service Worker Strategy

**Strategy:** Cache-first for all app assets. The instrument must work completely offline — no CDN calls after first load.

```
sw.js precache list:
- /apps/sound-pad/index.html
- /apps/sound-pad/app.js
- /apps/sound-pad/engine/*.js       (all engine modules)
- /apps/sound-pad/input/*.js        (all input modules)
- /apps/sound-pad/ui/*.js           (all UI modules)
- /apps/sound-pad/presets/*.json    (all preset files)
- /apps/sound-pad/manifest.json
- https://unpkg.com/tone@[locked-version]/build/Tone.js
```

**Critical:** Lock Tone.js to a specific version in the import map (not `@latest`) so the service worker can cache a deterministic URL. `@latest` will cause cache misses on every Tone.js release.

**Audio assets:** This instrument uses synthesized audio only (no sample files), so the service worker does not need to handle the range request complexity of audio file caching.

---

## Build Order (Phase Dependency Graph)

Components have dependencies — build in this order:

```
Phase 1: Foundation
  AudioEngine → (required by everything)
  InstrumentEngine (basic single voice, no polyphony yet)

Phase 2: Input
  EventRouter → (required by all input handlers)
  TouchHandler, KeyboardHandler → EventRouter
  Depends on: AudioEngine, InstrumentEngine

Phase 3: Effects + Routing
  EffectsChain → connects after InstrumentEngine
  Depends on: AudioEngine, InstrumentEngine

Phase 4: Visualizer
  Analyser → tap from EffectsChain output
  VisualizerUI → reads Analyser
  Depends on: EffectsChain

Phase 5: Polyphony + Voice Management
  Upgrade InstrumentEngine to PolySynth
  Depends on: working single-voice InstrumentEngine

Phase 6: Sequencer + Transport
  Transport → Tone.Transport wrapper
  Sequencer (state) → Transport callbacks
  SequencerUI → Sequencer state
  Depends on: InstrumentEngine (to trigger notes), working audio

Phase 7: Presets
  PresetManager → serialize InstrumentEngine + EffectsChain state
  PresetUI → PresetManager
  Depends on: stable InstrumentEngine and EffectsChain APIs

Phase 8: MIDI + Advanced Input
  MIDIHandler → EventRouter
  GestureHandler → EventRouter
  Depends on: EventRouter (already built in Phase 2)

Phase 9: PWA
  manifest.json, sw.js
  Depends on: stable file list (all modules finalized)
```

**Rationale for this order:**
- You cannot test input handling without a working audio engine.
- You cannot build a polyphonic voice stealer until single-voice works correctly.
- The effects chain needs an instrument signal source to verify routing.
- Visualizer needs the effects chain to have an output to tap.
- The preset system needs stable parameter APIs from instrument and effects modules — build it last, otherwise preset format changes break saves constantly.
- MIDI is an enhancement layer on top of the input system, not foundational.
- Service worker goes last because it caches a specific file inventory — adding it early means constant cache invalidation as files are added.

---

## Entry Point: `index.html`

The HTML file is minimal — it is a shell, not a monolith:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SoundForge | Brad Lannon</title>
  <link rel="manifest" href="manifest.json">
  <!-- Portfolio nav/footer styles from shared CSS -->
  <link rel="stylesheet" href="/css/portfolio.css">
  <link rel="stylesheet" href="./styles.css">
  <script type="importmap">
  {
    "imports": {
      "tone": "https://unpkg.com/tone@15.0.4/build/Tone.js"
    }
  }
  </script>
</head>
<body>
  <!-- Portfolio nav (matches site navigation) -->
  <nav>...</nav>

  <main id="soundforge-app">
    <!-- UI mounts here via ui/ modules -->
  </main>

  <footer>...</footer>

  <script type="module" src="./app.js"></script>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js');
    }
  </script>
</body>
</html>
```

---

## Cross-Cutting Concerns

### AudioContext Lifecycle (Mobile Safari)

Mobile Safari will suspend AudioContext on: incoming call, switching apps, locking screen, removing headphones. The app must handle the `statechange` event on the AudioContext and automatically resume when it returns to "running" state.

```javascript
// audio-engine.js
Tone.getContext().rawContext.addEventListener('statechange', () => {
  if (Tone.context.state === 'suspended') {
    // Show "tap to resume" UI overlay
  }
});
```

### Cross-Origin Isolation for SharedArrayBuffer

The existing portfolio server does NOT set COEP/COOP headers globally (only for `/apps/webimager`). SoundForge uses no SharedArrayBuffer (no WASM, no Workers), so this is not required. Do not add isolation headers to sound-pad unnecessarily — they break image loading from CDNs.

### Content Security Policy

The existing CSP in `server.js` allows CDN scripts from `cdnjs.cloudflare.com`. `unpkg.com` may need to be added to the CSP `script-src` directive for Tone.js to load. This is a server-side change, not a module change.

---

## Sources

- [Tone.js Official Documentation](https://tonejs.github.io/docs/) — HIGH confidence
- [Tone.js Wiki: Instruments](https://github.com/Tonejs/Tone.js/wiki/Instruments) — HIGH confidence
- [Tone.js Wiki: Connections & Routing](https://github.com/Tonejs/Tone.js/wiki/Connections) — HIGH confidence
- [Tone.js Wiki: Effects](https://github.com/Tonejs/Tone.js/wiki/Effects) — HIGH confidence
- [MDN: Web Audio API Visualizations](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API) — HIGH confidence
- [MDN: Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — HIGH confidence
- [Chrome Developers: AudioWorklet Design Patterns](https://developer.chrome.com/blog/audio-worklet-design-pattern) — HIGH confidence
- [AudioWorklet known mobile issues #2632](https://github.com/WebAudio/web-audio-api/issues/2632) — HIGH confidence (referenced in project research)
- [Tone.js Autoplay / User Gesture](https://github.com/Tonejs/Tone.js/wiki/Autoplay) — HIGH confidence
- [Web MIDI API Spec](https://webaudio.github.io/web-midi-api/) — HIGH confidence
- [PWA Caching Strategies — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching) — HIGH confidence

---

*Architecture research: 2026-03-15*
