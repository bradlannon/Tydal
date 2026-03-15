# Phase 2: Instrument Quality - Research

**Researched:** 2026-03-15
**Domain:** Tone.js synthesis, Web MIDI API, velocity sensitivity, effects chains, chromatic pad layout
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SYNTH-01 | Multi-oscillator subtractive synthesizer with selectable waveforms | Tone.PolySynth(Tone.Synth) + Tone.MonoSynth pattern; waveform selection via `set({ oscillator: { type } })` |
| SYNTH-02 | Full ADSR envelope controls per voice | PolySynth.set({ envelope: { attack, decay, sustain, release } }) applies to all voices |
| SYNTH-03 | Filter with cutoff, resonance, lowpass/highpass/bandpass modes | MonoSynth exposes `.filter` (Tone.Filter); Q for resonance; set({ filter: { frequency, Q, type } }) |
| SYNTH-04 | LFO modulation for vibrato, tremolo, filter sweeps | Tone.Vibrato and Tone.Tremolo built-ins; Tone.LFO.connect(filter.frequency) for filter sweeps |
| SYNTH-05 | FM synthesis voices for piano, organ, electric piano | Tone.PolySynth(Tone.FMSynth) with harmonicity + modulationIndex tuning |
| SYNTH-06 | 6-8 polished factory presets | Preset objects with instrument type + parameter snapshot; preset selector UI |
| FX-01 | Reverb with wet/dry and decay controls | Tone.Reverb — `await reverb.ready` required after construction |
| FX-02 | Delay with time, feedback, wet/dry | Tone.FeedbackDelay — delayTime, feedback, wet |
| FX-03 | Distortion with amount control | Tone.Distortion — distortion (0-1), wet, oversample |
| FX-04 | Filter effect with cutoff and resonance knobs | Tone.Filter — frequency, Q, type; insert in chain before masterVolume |
| FX-05 | Per-channel volume and pan | Tone.Volume + Tone.Panner per instrument; or Tone.Channel (vol + pan combined) |
| PERF-01 | Velocity sensitivity on touch — touch speed → note volume | Measure clientY delta / timestamp delta on pointerdown; map to 0-1 velocity |
| PERF-02 | Velocity sensitivity on MIDI — MIDI velocity byte → note volume | data[2] / 127 from MIDIMessageEvent; pass as velocity to triggerAttack |
| PERF-03 | MIDI input via Web MIDI API with graceful degradation | navigator.requestMIDIAccess(); no iOS Safari support — must degrade gracefully |
| PERF-04 | Chromatic note layout on pads | Replace diatonic NOTE_MAP in pad-grid.js with all 12 semitones per octave |
| PERF-05 | Octave shifting (+/- transposition) | State variable currentOctave; regenerate NOTE_MAP offsets; Tone.Frequency("C4").transpose(12) |
| PERF-06 | Scale lock mode — constrain pads to selected scale/key | tonal library Scale.get("C major").notes; filter NOTE_MAP; available via ESM CDN |
| PERF-07 | Mobile-first multitouch with touch-action: manipulation | Phase 1 set touch-action: none on grid; verify no zoom/scroll interference at page level |
</phase_requirements>

---

## Summary

Phase 2 builds on the Phase 1 audio foundation to deliver a playable instrument quality experience. The core work falls into four areas: (1) expanding the synthesis engine from a single warm pad to multiple instrument voices with full ADSR, filter, waveform, LFO, and FM synthesis capabilities; (2) adding an effects chain (reverb, delay, distortion, filter, channel controls) wired between instruments and master volume; (3) making pads performance-ready via chromatic layout, octave shifting, scale lock, and velocity sensitivity; and (4) adding MIDI keyboard support via the Web MIDI API.

All required Tone.js building blocks (PolySynth, FMSynth, Reverb, FeedbackDelay, Distortion, Filter, LFO, Vibrato, Tremolo, Channel) exist in Tone.js 15.1.22, which is already installed. The existing signal chain in effects.js — `warmPad → masterVolume → Destination` — must be refactored to insert the effects chain between instrument output and the master volume. The chromatic NOTE_MAP refactor in pad-grid.js is surgical and non-breaking. MIDI input requires Web MIDI API which has no iOS Safari support and must degrade gracefully.

**Primary recommendation:** Refactor effects.js to build a full effects bus (instrument channel → reverb → delay → distortion → filter → Channel node → masterVolume → Destination). Use PolySynth(Synth) for subtractive and PolySynth(FMSynth) for FM presets. Track active notes in instruments.js with a timestamp array to implement voice stealing when PolySynth drops notes at maxPolyphony.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tone.js | 15.1.22 | All synthesis, effects, LFO, scheduling | Already installed; complete audio toolkit |
| Web MIDI API | Browser native | MIDI keyboard input | Standard W3C API; no library needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tonal | 6.4.x | Scale/key/note music theory | PERF-06 scale lock; available via ESM CDN |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tonal CDN | Hand-rolled scale arrays | Scale tables are ~100 lines but error-prone; tonal is authoritative and covers all edge cases (modes, enharmonics) |
| Tone.Reverb | Tone.JCReverb | JCReverb is cheaper CPU but lower quality; Reverb uses convolution which sounds more realistic |
| Tone.Channel | Separate Volume + Panner | Channel combines both cleanly; less graph complexity |

**Installation:**
No new npm installs. Tone.js already in importmap. Add tonal to importmap:
```javascript
// In index.html importmap:
"tonal": "https://cdn.jsdelivr.net/npm/tonal@6.4.2/+esm"
```
Verify the +esm path works before committing (same pattern used for Tone.js).

---

## Architecture Patterns

### Recommended Project Structure
```
engine/
├── audio-engine.js     # (existing) AudioContext singleton
├── instruments.js      # (refactor) multiple voices: subtractive, FM, presets
├── effects.js          # (refactor) full effects chain with insert points
├── voice-tracker.js    # (new) active note tracking for manual voice stealing
└── presets.js          # (new) 6-8 factory preset definitions

input/
├── keyboard.js         # (existing) keyboard input
├── touch.js            # (refactor) add velocity measurement
└── midi.js             # (new) Web MIDI API input handler

ui/
├── pad-grid.js         # (refactor) chromatic layout, octave shift, scale lock
├── overlay.js          # (existing) iOS overlay
├── synth-panel.js      # (new) ADSR/waveform/filter controls
└── fx-panel.js         # (new) reverb/delay/distortion/filter knobs
```

### Pattern 1: Full Effects Chain
**What:** Insert effects nodes between instrument output and master volume. Each instrument channel has send/return routing, and all effects have wet/dry controls.
**When to use:** Required for FX-01 through FX-05.
**Example:**
```javascript
// engine/effects.js — expanded signal chain
// Source: https://tonejs.github.io/docs/15.1.22/classes/Reverb.html
import * as Tone from 'tone';
import { activeSynth } from './instruments.js';

export const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 });
export const delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.35, wet: 0 });
export const distortion = new Tone.Distortion({ distortion: 0.3, wet: 0 });
export const filterFX = new Tone.Filter({ frequency: 4000, type: 'lowpass' });
export const channel = new Tone.Channel({ volume: 0, pan: 0 });
export const masterVolume = new Tone.Volume(-6).toDestination();

// Wire chain: instrument → reverb → delay → distortion → filterFX → channel → masterVolume
channel.connect(masterVolume);
filterFX.connect(channel);
distortion.connect(filterFX);
delay.connect(distortion);
reverb.connect(delay);

// CRITICAL: reverb requires async initialization
await reverb.ready;

export function connectInstrument(synth) {
  synth.connect(reverb);
}
```

### Pattern 2: Multiple Instrument Voices
**What:** Multiple PolySynth instances (one subtractive, one FM) pre-built; active instrument switched by disconnecting old and connecting new.
**When to use:** Preset switching between synth types.
**Example:**
```javascript
// engine/instruments.js — dual-voice architecture
// Source: https://tonejs.github.io/docs/15.1.22/classes/PolySynth.html
import * as Tone from 'tone';

export const subtractiveSynth = new Tone.PolySynth(Tone.Synth, {
  maxPolyphony: 8,
  options: {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.4 },
    filter: { type: 'lowpass', frequency: 2800, Q: 1 },
    filterEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.8,
                      baseFrequency: 200, octaves: 3.5 },
  },
});

export const fmSynth = new Tone.PolySynth(Tone.FMSynth, {
  maxPolyphony: 8,
  options: {
    harmonicity: 3,
    modulationIndex: 10,
    oscillator: { type: 'sine' },
    modulation: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3 },
  },
});

let activeSynth = subtractiveSynth;

// Runtime parameter change via set() — affects all 8 voices at once
export function setSynthParam(path, value) {
  activeSynth.set(path);
}
```

### Pattern 3: Velocity-Sensitive noteOn
**What:** triggerAttack accepts velocity (0-1) as third argument; map touch speed and MIDI velocity byte to this range.
**When to use:** PERF-01 (touch) and PERF-02 (MIDI).
**Example:**
```javascript
// engine/instruments.js — velocity-aware noteOn
// Source: https://tonejs.github.io/docs/15.1.22/classes/PolySynth.html
export function noteOn(note, velocity = 0.8) {
  // velocity: 0-1 range; maps to amplitude of this voice
  activeSynth.triggerAttack(note, Tone.now(), velocity);
}

// input/touch.js — measure touch velocity
// Track last Y position to compute speed on pointerdown
let lastPointerY = null;
let lastPointerTime = null;

padGridEl.addEventListener('pointerdown', (e) => {
  // On rapid downward swipe: high velocity. On slow tap: low velocity.
  const now = e.timeStamp;
  const speed = lastPointerY !== null
    ? Math.abs(e.clientY - lastPointerY) / Math.max(1, now - lastPointerTime)
    : 0;
  // Clamp and map: 0 px/ms = 0.2 (minimum), ~3 px/ms = 1.0 (max)
  const velocity = Math.min(1, Math.max(0.2, speed / 3));
  lastPointerY = e.clientY;
  lastPointerTime = now;
  noteOn(note, velocity);
}, { passive: false });
```

### Pattern 4: MIDI Input
**What:** Request MIDI access, iterate inputs, attach onmidimessage handler, parse note-on/off and velocity.
**When to use:** PERF-02, PERF-03.
**Example:**
```javascript
// input/midi.js
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API
export async function initMIDI() {
  if (!navigator.requestMIDIAccess) {
    console.log('Web MIDI API not supported — MIDI disabled');
    return false;
  }
  try {
    const midiAccess = await navigator.requestMIDIAccess();
    midiAccess.inputs.forEach(input => {
      input.onmidimessage = handleMIDIMessage;
    });
    // Re-attach on new device connection
    midiAccess.onstatechange = (e) => {
      if (e.port.type === 'input' && e.port.state === 'connected') {
        e.port.onmidimessage = handleMIDIMessage;
      }
    };
    return true;
  } catch (err) {
    console.log('MIDI access denied:', err);
    return false;
  }
}

function handleMIDIMessage(event) {
  const [status, noteNumber, velocityByte] = event.data;
  const command = status & 0xf0;

  if (command === 0x90 && velocityByte > 0) {
    // Note On
    const note = Tone.Frequency(noteNumber, 'midi').toNote();
    const velocity = velocityByte / 127;
    noteOn(note, velocity);
  } else if (command === 0x80 || (command === 0x90 && velocityByte === 0)) {
    // Note Off (0x80) or Note On with velocity 0 (common encoding)
    const note = Tone.Frequency(noteNumber, 'midi').toNote();
    noteOff(note);
  }
}
```

### Pattern 5: Chromatic Pad Layout with Octave Shift
**What:** Replace diatonic NOTE_MAP with chromatic 16-note slice. Octave state variable shifts the root note by ±12 semitones.
**When to use:** PERF-04, PERF-05.
**Example:**
```javascript
// ui/pad-grid.js — chromatic layout with octave shift
const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const KEYS = ['z','x','c','v', 'a','s','d','f', 'q','w','e','r', '1','2','3','4'];

let currentOctave = 3; // C3 = lowest pad by default

export function buildNoteMap(octave = currentOctave) {
  // 16 pads = C3 to D#4 (or similar 16-note chromatic window)
  const notes = [];
  let oct = octave;
  let chromIdx = 0; // start at C
  for (let i = 0; i < 16; i++) {
    notes.push({
      note: `${CHROMATIC[chromIdx]}${oct}`,
      key: KEYS[i],
      padIndex: i,
    });
    chromIdx++;
    if (chromIdx >= 12) { chromIdx = 0; oct++; }
  }
  return notes;
}

export function shiftOctave(delta) {
  currentOctave = Math.max(1, Math.min(7, currentOctave + delta));
  rebuildGrid();
}
```

### Pattern 6: Scale Lock Mode
**What:** Filter the chromatic NOTE_MAP to only include notes belonging to the selected scale and key. Uses tonal library.
**When to use:** PERF-06.
**Example:**
```javascript
// ui/pad-grid.js — scale lock
import { Scale } from 'tonal';

let scaleLock = null; // null = chromatic (all notes), e.g. { key: 'C', scale: 'major' }

export function setScaleLock(key, scaleName) {
  scaleLock = key && scaleName ? { key, scale: scaleName } : null;
  rebuildGrid();
}

function getScaleNotes(key, scaleName) {
  // Returns pitch classes: ["C", "D", "E", "F", "G", "A", "B"]
  return Scale.get(`${key} ${scaleName}`).notes;
}

function buildScaleFilteredMap(octave) {
  const allNotes = buildNoteMap(octave);
  if (!scaleLock) return allNotes;

  const scaleNotes = getScaleNotes(scaleLock.key, scaleLock.scale);
  // Filter to scale tones, then re-assign keyboard keys sequentially
  const filtered = allNotes.filter(({ note }) => {
    const pitchClass = note.replace(/\d+$/, '').replace('b', 'b'); // strip octave
    return scaleNotes.includes(pitchClass);
  });
  return filtered.map((entry, i) => ({ ...entry, key: KEYS[i] }));
}
```

### Anti-Patterns to Avoid

- **Building effects manually with Web Audio API nodes:** Don't hand-roll convolver reverb, feedback delay, or waveshaper distortion. Tone.js has tested, well-tuned implementations for all of these.
- **Using `await` without checking reverb.ready:** Tone.Reverb generates an impulse response asynchronously. Using it before `await reverb.ready` produces silence.
- **Calling `Tone.start()` in effects.js:** AudioContext must still be user-gesture gated — all `Tone.start()` calls stay in audio-engine.js via `ensureAudioStarted()`.
- **Connecting MIDI noteOn directly to warmPad:** MIDI input must go through the same `noteOn(note, velocity)` function in instruments.js that all other inputs use, to benefit from voice management and signal routing.
- **Changing NOTE_MAP in-place during play:** Rebuilding the grid while notes are held causes stuck notes. Call `noteOff` on all held notes before rebuilding.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Convolution reverb | ConvolverNode + IR generation | Tone.Reverb | Correct async IR generation, Offline context handling |
| Feedback delay | Manual delay node loop | Tone.FeedbackDelay | Feedback stability, wet/dry signal splitter |
| Waveshaper distortion | Curve buffer math | Tone.Distortion | Correct pre-gain, oversample option, tested curve |
| LFO vibrato | Custom oscillator → delayTime | Tone.Vibrato | Stereo spread, phase, depth parameters |
| LFO tremolo | Custom oscillator → gain | Tone.Tremolo | Stereo spread, consistent depth mapping |
| Music theory scales | SCALE_DATA array | tonal library | Handles enharmonics, 7 modes, 17+ scale types, edge cases |
| MIDI note → frequency | Frequency formula (440 * 2^...) | Tone.Frequency(midiNote, 'midi').toNote() | Handles all MIDI edge cases, returns Tone note string |
| Voice channel with pan | Separate Volume + StereoPanner | Tone.Channel | Single node for volume + pan + mute |

**Key insight:** Tone.js effects are not thin wrappers — they handle async initialization (reverb), signal topology (wet/dry split), and CPU optimization (distortion oversampling). Building replacements introduces subtle bugs.

---

## Common Pitfalls

### Pitfall 1: Reverb silent on first use
**What goes wrong:** `new Tone.Reverb()` is constructed synchronously but the impulse response generates asynchronously. Connecting to it before `await reverb.ready` produces silence.
**Why it happens:** Reverb uses `Tone.Offline` to generate the IR buffer. This is async by design — you cannot control this.
**How to avoid:** In effects.js, make the initialization an async function and `await reverb.ready` before calling `connectInstrument()`. Use a `ready` flag to gate note playback.
**Warning signs:** Reverb effect silently not working despite wet > 0 and chain connected.

### Pitfall 2: PolySynth drops 9th note instead of stealing
**What goes wrong:** `PolySynth` logs "Max polyphony exceeded. Note dropped." when maxPolyphony (8) voices are active and a 9th note arrives. The 9th note is silently dropped — no voice steal.
**Why it happens:** Tone.js PolySynth v15 allocates voices dynamically up to maxPolyphony, then drops notes rather than stealing. This is by design in the current implementation.
**How to avoid:** Maintain a timestamp-sorted array of active notes in instruments.js. Before calling `triggerAttack`, check if `activeSynth.activeVoices >= maxPolyphony`. If so, call `triggerRelease` on the oldest active note first (voice steal). Then trigger the new note.
**Warning signs:** Success criterion 1 ("9th note voice-steals cleanly") fails — no audio for 9th note, no release of oldest note.

```javascript
// Manual voice stealing wrapper in instruments.js
const MAX_VOICES = 8;
const activeNotes = []; // [{ note, startedAt }] ordered by time

export function noteOn(note, velocity = 0.8) {
  // If at capacity, steal oldest voice
  if (activeNotes.length >= MAX_VOICES) {
    const oldest = activeNotes.shift();
    activeSynth.triggerRelease(oldest.note, Tone.now());
  }
  activeNotes.push({ note, startedAt: Tone.now() });
  activeSynth.triggerAttack(note, Tone.now(), velocity);
}

export function noteOff(note) {
  const idx = activeNotes.findIndex(n => n.note === note);
  if (idx !== -1) activeNotes.splice(idx, 1);
  activeSynth.triggerRelease(note, Tone.now());
}
```

### Pitfall 3: MIDI note-on with velocity 0 treated as note-on
**What goes wrong:** Some MIDI keyboards send Note On (0x90) with velocity 0 to mean Note Off. If you only check for command 0x80 for note off, these notes get stuck.
**Why it happens:** MIDI spec allows this encoding as a bandwidth optimization.
**How to avoid:** In handleMIDIMessage, check `command === 0x90 && velocityByte === 0` as a note-off condition (shown in Pattern 4).
**Warning signs:** Notes hang when released on certain MIDI hardware.

### Pitfall 4: Touch velocity always returns 0 on first tap
**What goes wrong:** The first tap on a cold grid has no previous pointer position to measure speed from.
**Why it happens:** lastPointerY is null — no prior movement to compute delta.
**How to avoid:** Default to a mid-range velocity (0.6) when no prior measurement exists. Only compute velocity-from-movement on subsequent taps.
**Warning signs:** First note played is always silent or very quiet.

### Pitfall 5: Octave shift causes stuck notes
**What goes wrong:** A note is held (pointerdown), octave shift button pressed, grid rebuilds — the pad now has a different note. When the finger lifts, pointerup fires but touchedPads Map still has the old note key. The old note is never released.
**Why it happens:** touchedPads Map in touch.js stores note at pointerdown time; grid rebuild changes pad data-note values while pointers are active.
**How to avoid:** Disallow octave shift while any pointer is active (`touchedPads.size > 0`), OR call `noteOff` on all notes in touchedPads before rebuilding the grid.
**Warning signs:** Stuck notes on mobile when octave shift is used mid-play.

### Pitfall 6: Web MIDI permissions on HTTPS only
**What goes wrong:** `navigator.requestMIDIAccess()` throws or rejects on HTTP (non-secure context).
**Why it happens:** Web MIDI API requires a secure context (HTTPS or localhost).
**How to avoid:** MIDI init code must check `window.isSecureContext` or use try/catch with clear user messaging.
**Warning signs:** MIDI fails on deployed site but works on localhost.

### Pitfall 7: Rebuilding pad grid DOM while notes are held
**What goes wrong:** Changing scale lock or octave while notes are active destroys and recreates pad elements, breaking DOM queries in setPadActive and losing pointer tracking.
**Why it happens:** initPadGrid clears and recreates all pad elements.
**How to avoid:** Update a `noteMap` state variable and re-render pads without destroying the grid's event listener attachment. Use a data-update approach rather than full re-init.

---

## Code Examples

Verified patterns from official sources:

### Tone.Reverb initialization
```javascript
// Source: https://tonejs.github.io/docs/15.1.22/classes/Reverb.html
const reverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.02, wet: 0.3 });
await reverb.ready; // REQUIRED — IR generates asynchronously
reverb.connect(destination);
```

### PolySynth with FMSynth
```javascript
// Source: https://tonejs.github.io/docs/15.1.22/classes/PolySynth.html
const fmPoly = new Tone.PolySynth(Tone.FMSynth, {
  maxPolyphony: 8,
  options: {
    harmonicity: 3,
    modulationIndex: 10,
  },
});
// Velocity in triggerAttack third parameter
fmPoly.triggerAttack(['C4', 'E4', 'G4'], Tone.now(), 0.7);
```

### PolySynth set() for runtime parameter changes
```javascript
// Source: https://tonejs.github.io/docs/15.1.22/classes/PolySynth.html
poly.set({ envelope: { attack: 0.25, release: 1.0 } });
poly.set({ oscillator: { type: 'square' } });
poly.set({ filter: { frequency: 1200, Q: 3 } });
```

### LFO connected to filter
```javascript
// Source: https://tonejs.github.io/docs/15.1.22/classes/LFO.html
const lfo = new Tone.LFO({ frequency: 2, min: 400, max: 4000, type: 'sine' });
lfo.connect(filter.frequency);
lfo.start();
```

### Tone.Channel for per-voice volume and pan
```javascript
// Source: https://tonejs.github.io/docs/15.1.22/classes/Channel.html
const channel = new Tone.Channel({ volume: 0, pan: 0.2 });
synth.connect(channel);
channel.connect(Tone.getDestination());
channel.volume.value = -6;
channel.pan.value = -0.3;
```

### Web MIDI complete setup
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API
const midi = await navigator.requestMIDIAccess();
for (const input of midi.inputs.values()) {
  input.onmidimessage = (e) => {
    const [status, note, velocity] = e.data;
    if ((status & 0xf0) === 0x90 && velocity > 0) {
      noteOn(Tone.Frequency(note, 'midi').toNote(), velocity / 127);
    } else if ((status & 0xf0) === 0x80 || ((status & 0xf0) === 0x90 && velocity === 0)) {
      noteOff(Tone.Frequency(note, 'midi').toNote());
    }
  };
}
```

### tonal scale lookup
```javascript
// Source: https://github.com/tonaljs/tonal
import { Scale } from 'tonal';
Scale.get('C major').notes; // ['C', 'D', 'E', 'F', 'G', 'A', 'B']
Scale.get('D dorian').notes; // ['D', 'E', 'F', 'G', 'A', 'B', 'C']
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tone.r13 PolySynth had voice stealing | Tone.js 14+ PolySynth drops notes instead of stealing | ~v14 | Must implement manual voice tracking |
| Tone.js importmap `tone` bare specifier | `tone` with +esm suffix on jsDelivr | Current | Already implemented in Phase 1 |
| Web MIDI only in Chrome | Firefox 108+, Edge 79+, Chrome 43+ | 2023 | Good desktop coverage; iOS Safari still unsupported |
| Custom scale arrays | tonal library | Current | Authoritative, ESM-compatible |

**Deprecated/outdated:**
- `Tone.r13` API patterns (callback-based everything): Replaced by Promise-based APIs in 14+
- `Tone.Frequency.midi()`: Now `Tone.Frequency(midiNote, 'midi').toNote()`

---

## Open Questions

1. **Reverb async initialization in module load order**
   - What we know: `await reverb.ready` is required before playback; effects.js currently uses side-effect imports
   - What's unclear: Whether the existing synchronous module pattern in effects.js can cleanly incorporate an async reverb.ready await at module top level (top-level await requires module type, already in use)
   - Recommendation: Use top-level `await reverb.ready` in effects.js (valid in ES modules); test that instruments.js import of warmPad still fires before this resolves

2. **tonal ESM CDN path verification**
   - What we know: `https://cdn.jsdelivr.net/npm/tonal@6.4.2/+esm` should work via jsDelivr +esm pattern
   - What's unclear: Exact version and whether the +esm build exports all submodules (Scale, Note, etc.) from the root tonal package
   - Recommendation: Verify in browser console before committing to importmap. Alternative: `https://esm.run/tonal` via esm.sh

3. **iOS MIDI via WebMIDI polyfill**
   - What we know: iOS Safari does not support Web MIDI API natively
   - What's unclear: Whether the project should include a polyfill (JZZ, WebMIDI.js) for iOS MIDI support
   - Recommendation: Per PERF-03 ("graceful degradation"), skip polyfill in Phase 2 — show a "MIDI not supported on this browser" message on iOS. Polyfill can be added as enhancement in Phase 4.

4. **PolySynth preset switching: reconnect vs set()**
   - What we know: `set()` can change all parameters on existing voices; switching between Synth and FMSynth requires different PolySynth instances
   - What's unclear: Whether `disconnect()` + `connect()` between two pre-created PolySynths is click-free during live play
   - Recommendation: Pre-create both PolySynths; on preset switch, trigger `releaseAll()` on old synth, then disconnect/reconnect. Brief gap between voices is acceptable.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | No test framework detected — manual browser verification |
| Config file | none |
| Quick run command | `open http://localhost:8080` (manual) |
| Full suite command | Manual checklist in verify step |

Phase 2 requirements are all audio/interaction behaviors. They require real browser/device testing and cannot be fully automated with unit tests in this no-build-step architecture. Verification is structured as a manual checklist in the verify phase.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SYNTH-01 | Waveform selector changes timbre audibly | manual-audio | — | ❌ Wave 0 |
| SYNTH-02 | ADSR controls change envelope audibly | manual-audio | — | ❌ Wave 0 |
| SYNTH-03 | Filter cutoff + resonance respond in real time | manual-audio | — | ❌ Wave 0 |
| SYNTH-04 | LFO modulates vibrato, tremolo, filter sweep | manual-audio | — | ❌ Wave 0 |
| SYNTH-05 | FM preset sounds like piano/organ/e-piano | manual-audio | — | ❌ Wave 0 |
| SYNTH-06 | 6-8 presets selectable; each has distinct character | manual-audio | — | ❌ Wave 0 |
| FX-01 | Reverb wet slider audibly adds room | manual-audio | — | ❌ Wave 0 |
| FX-02 | Delay feedback and time audible | manual-audio | — | ❌ Wave 0 |
| FX-03 | Distortion amount adds grit | manual-audio | — | ❌ Wave 0 |
| FX-04 | Filter cutoff + resonance knobs respond | manual-audio | — | ❌ Wave 0 |
| FX-05 | Per-channel volume + pan adjustable | manual-audio | — | ❌ Wave 0 |
| PERF-01 | Hard vs soft pad hit produces different volumes | manual-device | — | ❌ Wave 0 |
| PERF-02 | MIDI keyboard velocity maps to note volume | manual-midi | — | ❌ Wave 0 |
| PERF-03 | MIDI keyboard triggers correct notes | manual-midi | — | ❌ Wave 0 |
| PERF-04 | Pads show chromatic semitone labels | visual | — | ❌ Wave 0 |
| PERF-05 | Octave shift moves note range up/down | manual-audio | — | ❌ Wave 0 |
| PERF-06 | Scale lock constrains pads to scale | manual-audio | — | ❌ Wave 0 |
| PERF-07 | Multitouch 8 simultaneous notes, no zoom/scroll | manual-device | — | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Load page, trigger 3-4 notes, verify audio (30 seconds)
- **Per wave merge:** Full manual checklist covering all requirements in that wave
- **Phase gate:** All 17 requirements manually verified before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No test files needed — verification is manual browser interaction
- [ ] Ensure local HTTP server script available: `python3 -m http.server 8080` or `npx serve .`

---

## Sources

### Primary (HIGH confidence)
- `https://tonejs.github.io/docs/15.1.22/classes/PolySynth.html` — triggerAttack velocity param, set(), maxPolyphony, activeVoices
- `https://tonejs.github.io/docs/15.1.22/classes/Reverb.html` — decay, preDelay, wet, async ready pattern
- `https://tonejs.github.io/docs/15.1.22/classes/FeedbackDelay.html` — delayTime, feedback, wet
- `https://tonejs.github.io/docs/15.1.22/classes/Distortion.html` — distortion (0-1), wet, oversample
- `https://tonejs.github.io/docs/15.1.22/classes/Filter.html` — frequency, Q, type, rolloff
- `https://tonejs.github.io/docs/15.1.22/classes/LFO.html` — frequency, min, max, connect pattern
- `https://tonejs.github.io/docs/15.1.22/classes/Tremolo.html` — frequency, depth, wet, type
- `https://tonejs.github.io/docs/15.1.22/classes/Vibrato.html` — frequency, depth, type
- `https://tonejs.github.io/docs/15.1.22/classes/FMSynth.html` — harmonicity, modulationIndex, modulation
- `https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API` — requestMIDIAccess, onmidimessage, MIDIAccess
- `https://caniuse.com/midi` — Web MIDI browser support: Chrome/Firefox/Edge yes; iOS Safari no
- `https://github.com/tonaljs/tonal` — Scale.get() API, CDN availability

### Secondary (MEDIUM confidence)
- `https://cdn.jsdelivr.net/npm/tone@15.1.22/build/esm/instrument/PolySynth.js` — voice drop (not steal) behavior confirmed in source
- `https://www.jsdelivr.com/package/npm/tonal` — tonal CDN path format

### Tertiary (LOW confidence)
- Touch velocity measurement pattern (pixels/ms → velocity 0-1) — no authoritative web audio standard; pattern derived from common practice in web instruments

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Tone.js 15.1.22 already installed; all effect/synth classes verified in official docs
- Architecture: HIGH — signal chain pattern extends Phase 1 cleanly; all patterns sourced from official Tone.js docs
- Pitfalls: HIGH for reverb async and MIDI note-off-via-velocity-0; MEDIUM for voice stealing (source code inspection)
- Web MIDI browser support: HIGH — verified against caniuse.com

**Research date:** 2026-03-15
**Valid until:** 2026-09-15 (stable Tone.js API; Web MIDI support unlikely to change dramatically)
