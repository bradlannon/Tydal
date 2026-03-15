# Phase 3: Composition Surface - Research

**Researched:** 2026-03-15
**Domain:** Tone.js drum synthesis, step sequencer, tap tempo, quantization, loop recording/overdub
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DRUM-01 | 808/909-style kick drum synthesis with pitch sweep, distortion, and sub-bass layering | Tone.MembraneSynth (pitchDecay + octaves sweep) layered with sine oscillator + Tone.Distortion |
| DRUM-02 | Snare synthesis with noise component + tonal body resonance | Tone.NoiseSynth (white noise + highpass) + Tone.Synth (sine/triangle at 185–349Hz) layered and mixed |
| DRUM-03 | Hi-hat synthesis (closed + open variants) with choke behavior | Tone.MetalSynth for metallic spectrum + short envelope for closed, longer for open; choke = triggerRelease open before closed fires |
| DRUM-04 | Clap synthesis with multi-burst noise and reverb tail | White noise × 4 staggered bursts (bandpass 400–3500Hz) via AmplitudeEnvelope + Tone.Reverb |
| DRUM-05 | Pre-allocated noise buffers for drum voices (no per-hit regeneration) | Tone.Noise with persistent start(); NoiseSynth reuse; MetalSynth instantiated once; no construction in hot path |
| COMP-01 | Step sequencer with per-instrument rows, 16-32 steps, playback cursor | Tone.Sequence (subdivision:"16n", loop:true); step counter in callback; Tone.Draw for visual cursor sync |
| COMP-02 | Step sequencer is tempo-aware (step length derived from BPM) | Tone.Transport.bpm.value; Sequence subdivision is BPM-relative ("16n" = one 16th note at current BPM) |
| COMP-03 | Tap tempo — set BPM by tapping rhythm | Accumulate tap timestamps; compute average inter-tap interval; BPM = 60000 / avgMs; reset after 2s silence; apply via Tone.Transport.bpm.value |
| COMP-04 | Quantization for recorded loops (snap-to-grid: 1/4, 1/8, 1/16, 1/32) | "@4n", "@8n", "@16n", "@32n" time notation: triggerAttackRelease(note, dur, "@16n") snaps to nearest 16th |
| COMP-05 | Recording with overdub support and undo stack | Tone.Part as mutable event store; record = push to activeRecording[]; overdub = new Tone.Part; undo = pop overdub array, dispose and remove Part |
</phase_requirements>

---

## Summary

Phase 3 adds two major capabilities on top of the Phase 1/2 foundation: (1) a drum synthesizer with four distinct voices (kick, snare, hi-hat, clap) and (2) a composition surface with a 16-step drum sequencer, tap tempo, quantized melody recording, and overdub with undo.

For drum synthesis, Tone.js provides specialized instruments that map directly to classic drum machine synthesis: `Tone.MembraneSynth` for kick (pitch sweep), `Tone.MetalSynth` for hi-hats (metallic FM spectrum), `Tone.NoiseSynth` for snare/clap (shaped noise). These are not sample players — they are real-time synthesis engines. Kick quality is enhanced by layering MembraneSynth with a sine sub-bass and a distortion stage. Snare quality requires a second tonal layer (two oscillators at 185Hz and 349Hz) mixed with filtered white noise. Clap requires four staggered noise bursts at bandpass 400–3500Hz. Hi-hat choke is implemented by releasing the open hat before the closed hat fires.

For the step sequencer, `Tone.Sequence` with `subdivision: "16n"` and `loop: true` is the standard pattern. The Sequence callback fires before audio time, so `Tone.Draw.schedule()` must bridge audio scheduling to DOM updates for the visual cursor — this is the critical insight most beginners miss. Tap tempo accumulates timestamps, computes an average inter-tap interval, and applies it via `Tone.Transport.bpm.value`. Quantized recording uses Tone.js's `"@8n"` time notation syntax to snap notes to the nearest subdivision. Overdub uses `Tone.Part` as a mutable event store for each recording pass, with an undo stack that disposes and removes the most recent Part.

**Primary recommendation:** Build `engine/drums.js` for the four drum voices (all pre-allocated, never constructed in the audio callback). Build `engine/sequencer.js` for the Sequence-based step sequencer. Build `ui/sequencer-ui.js` for the grid DOM and cursor rendering. Build `engine/recorder.js` for quantized loop recording and overdub. Tap tempo logic belongs in a small `ui/tap-tempo.js` module that writes directly to `Tone.getTransport().bpm.value`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tone.js | 15.1.22 | MembraneSynth, MetalSynth, NoiseSynth, Sequence, Part, Draw, Transport | Already installed; all drum and sequencer primitives built-in |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tonal | 6.4.2 | Scale/note utilities for melody quantization display | Already in importmap; no new install needed |

### No New Dependencies
Both `tone` and `tonal` are already in the `index.html` importmap. Phase 3 introduces no new library dependencies.

**Installation:**
```bash
# No new packages needed
# Existing importmap in index.html:
# "tone": "https://cdn.jsdelivr.net/npm/tone@15.1.22/+esm"
# "tonal": "https://cdn.jsdelivr.net/npm/tonal@6.4.2/+esm"
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tone.MembraneSynth | Raw OscillatorNode + ScriptProcessor | MembraneSynth handles pitch ramp + amplitude envelope in one API call; raw approach adds 40+ lines of lifecycle code |
| Tone.MetalSynth | Tone.NoiseSynth for hi-hats | MetalSynth uses 6 FM oscillators tuned to 808 cymbal ratios — far more metallic. NoiseSynth sounds "random" not "metallic" |
| Tone.Sequence | Tone.Transport.scheduleRepeat + counter | Sequence is cleaner: built-in step array, looping, subdivision; scheduleRepeat requires manual step tracking |
| Tone.Part for recording | Array of scheduled Transport events | Part provides add()/remove() API and loop control; direct Transport scheduling lacks mutable event store |

---

## Architecture Patterns

### Recommended Project Structure
```
engine/
├── audio-engine.js      # (existing) AudioContext singleton
├── instruments.js       # (existing) subtractive synth
├── effects.js           # (existing) effects chain
├── voice-tracker.js     # (existing) voice stealing
├── presets.js           # (existing) factory presets
├── drums.js             # (NEW) four drum voices: kick, snare, hihat, clap
├── sequencer.js         # (NEW) Tone.Sequence step sequencer, Transport control
└── recorder.js          # (NEW) Tone.Part loop recording, overdub, undo stack

ui/
├── overlay.js           # (existing) iOS tap overlay
├── pad-grid.js          # (existing) 4x4 melodic pad grid
├── synth-panel.js       # (existing) synth controls
├── fx-panel.js          # (existing) FX controls
├── sequencer-ui.js      # (NEW) step sequencer grid DOM, cursor, BPM slider
└── tap-tempo.js         # (NEW) tap tempo button logic

input/
├── keyboard.js          # (existing)
├── touch.js             # (existing)
└── midi.js              # (existing)
```

### Pattern 1: Drum Voice Pre-Allocation (DRUM-05)
**What:** All drum synths are constructed once at module load, never inside audio callbacks.
**When to use:** All four drum voices — kick, snare, hi-hat, clap.
**Example:**
```javascript
// engine/drums.js
// Source: https://tonejs.github.io/docs/15.1.22/classes/MembraneSynth.html

import * as Tone from 'tone';
import { masterVolume } from './effects.js';

// --- Kick (808-style: pitch sweep + sub layer + distortion) ---
// MembraneSynth provides the pitch ramp; octaves controls sweep range
export const kick = new Tone.MembraneSynth({
  pitchDecay: 0.08,       // 80ms pitch sweep
  octaves: 6,             // sweeps 6 octaves down from attack pitch
  envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 },
}).connect(kickDist);

const kickDist = new Tone.Distortion({ distortion: 0.4, wet: 0.3 });
kickDist.toDestination(); // connect to master chain

// --- Snare (noise body + tonal resonance) ---
// NoiseSynth handles the rattle; oscillator layer adds the body "crack"
export const snareNoise = new Tone.NoiseSynth({
  noise: { type: 'white' },
  envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 },
}).connect(snareFilter);

const snareFilter = new Tone.Filter({ type: 'highpass', frequency: 1800 });
snareFilter.toDestination();

export const snareTone = new Tone.Synth({
  oscillator: { type: 'triangle' },
  envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
}).toDestination();

// --- Hi-hat (closed + open; MetalSynth for 808-style metallic spectrum) ---
export const hihatClosed = new Tone.MetalSynth({
  frequency: 400,
  envelope: { attack: 0.001, decay: 0.07, release: 0.01 },
  harmonicity: 5.1,
  modulationIndex: 32,
  resonance: 4000,
  octaves: 1.5,
}).toDestination();

export const hihatOpen = new Tone.MetalSynth({
  frequency: 400,
  envelope: { attack: 0.001, decay: 0.5, release: 0.2 },
  harmonicity: 5.1,
  modulationIndex: 32,
  resonance: 4000,
  octaves: 1.5,
}).toDestination();

// --- Clap (4 staggered white noise bursts, bandpass 400-3500Hz) ---
// Each burst is a short NoiseSynth triggered with slight time offset
export const clap = new Tone.NoiseSynth({
  noise: { type: 'white' },
  envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.02 },
}).connect(clapFilter);

const clapFilter = new Tone.Filter({ type: 'bandpass', frequency: 1200, Q: 0.5 });
const clapVerb = new Tone.Reverb({ decay: 0.8, wet: 0.4 });
clapFilter.connect(clapVerb);
clapVerb.toDestination();
```

### Pattern 2: Hi-Hat Choke (DRUM-03)
**What:** When a closed hi-hat fires while an open hi-hat is sounding, the open hat is silenced immediately.
**When to use:** Standard 808/909 behavior — closed hat "chokes" open hat.
**Example:**
```javascript
// engine/drums.js — choke pattern
// Source: Verified against 808/909 circuit behavior; standard pattern

export function triggerHihat(type, time) {
  if (type === 'closed') {
    // Silence open hat immediately
    hihatOpen.triggerRelease(time);
    hihatClosed.triggerAttack(time);
  } else if (type === 'open') {
    // Silence closed hat and let open ring
    hihatClosed.triggerRelease(time);
    hihatOpen.triggerAttack(time);
  }
}
```

### Pattern 3: Clap Multi-Burst (DRUM-04)
**What:** A realistic clap is 3–4 noise bursts fired with 8–12ms spacing to simulate multiple hands.
**When to use:** DRUM-04 clap synthesis.
**Example:**
```javascript
// engine/drums.js — multi-burst clap
// Source: https://www.nickwritesablog.com/drum-synthesis-in-javascript/ (technique)

export function triggerClap(time) {
  // 4 bursts: t+0ms, t+8ms, t+16ms, t+28ms (irregular spacing is more natural)
  clap.triggerAttackRelease('16n', time);
  clap.triggerAttackRelease('16n', time + 0.008);
  clap.triggerAttackRelease('16n', time + 0.016);
  clap.triggerAttackRelease('32n', time + 0.028); // shorter last burst
}
```

### Pattern 4: Step Sequencer with Tone.Sequence (COMP-01, COMP-02)
**What:** 16-step boolean grid per instrument row. Sequence fires callback every "16n". Tone.Draw syncs cursor visuals to audio.
**When to use:** Core sequencer loop.
**Example:**
```javascript
// engine/sequencer.js
// Source: https://tonejs.github.io/examples/stepSequencer
//         https://tonejs.github.io/docs/14.7.58/Draw (Draw.schedule pattern)

import * as Tone from 'tone';
import { triggerKick, triggerSnare, triggerHihat, triggerClap } from './drums.js';

// 4 drum rows × 16 steps, default all off
export const ROWS = ['kick', 'snare', 'hihat', 'clap'];
export const NUM_STEPS = 16;
const grid = {
  kick:  new Array(NUM_STEPS).fill(false),
  snare: new Array(NUM_STEPS).fill(false),
  hihat: new Array(NUM_STEPS).fill(false),
  clap:  new Array(NUM_STEPS).fill(false),
};

let currentStep = 0;

// Use an event array of step indices for the Sequence
const stepIndices = Array.from({ length: NUM_STEPS }, (_, i) => i);

export const sequence = new Tone.Sequence(
  (time, step) => {
    currentStep = step;

    // Trigger active drum voices at the audio-scheduled time
    if (grid.kick[step])  triggerKick(time);
    if (grid.snare[step]) triggerSnare(time);
    if (grid.hihat[step]) triggerHihat('closed', time);
    if (grid.clap[step])  triggerClap(time);

    // Sync visual cursor to audio time using Tone.Draw
    // CRITICAL: never update DOM directly from this callback — use Draw
    Tone.getDraw().schedule(() => {
      updateCursor(step);
    }, time);
  },
  stepIndices,
  '16n'
);

sequence.loop = true;

export function setStep(row, step, active) {
  grid[row][step] = active;
}

export function startSequencer() {
  Tone.getTransport().start();
  sequence.start(0);
}

export function stopSequencer() {
  sequence.stop();
  Tone.getTransport().stop();
  currentStep = 0;
}
```

### Pattern 5: BPM and Transport Loop Setup (COMP-02)
**What:** Transport controls global tempo. Sequence subdivision "16n" automatically tracks BPM. Setting a 1-bar loop keeps the Transport cycling without manual restart.
**When to use:** Sequencer initialization.
**Example:**
```javascript
// engine/sequencer.js — Transport setup
// Source: https://github.com/tonejs/tone.js/wiki/Transport

const transport = Tone.getTransport();

export function initTransport(bpm = 120) {
  transport.bpm.value = bpm;
  transport.loop = true;
  transport.loopStart = 0;
  transport.loopEnd = '1m';    // 1 measure = 4 beats = 16 sixteenth notes
}

export function setBPM(bpm) {
  // Apply immediately — all scheduled events auto-adjust
  transport.bpm.value = Math.max(40, Math.min(240, bpm));
}

export function getBPM() {
  return transport.bpm.value;
}
```

### Pattern 6: Tap Tempo (COMP-03)
**What:** Record tap timestamps, compute average interval between consecutive taps, convert to BPM, apply to Transport. Reset buffer after 2 seconds of silence.
**When to use:** Tap tempo button in the UI.
**Example:**
```javascript
// ui/tap-tempo.js
// Algorithm: average consecutive intervals (not linear regression — simpler, sufficient for live use)
// Source: Standard tap tempo algorithm pattern (verified against multiple implementations)

import { setBPM } from '../engine/sequencer.js';

const TAP_TIMEOUT_MS = 2000;   // reset tap history after 2s silence
const MIN_TAPS = 2;            // need at least 2 taps to compute interval
const MAX_TAPS = 8;            // cap history to last 8 taps for responsiveness

let tapTimes = [];
let tapTimeout = null;

export function recordTap() {
  const now = performance.now();

  // Clear stale history after 2s silence
  clearTimeout(tapTimeout);
  tapTimeout = setTimeout(() => { tapTimes = []; }, TAP_TIMEOUT_MS);

  tapTimes.push(now);

  // Keep last MAX_TAPS only
  if (tapTimes.length > MAX_TAPS) {
    tapTimes = tapTimes.slice(-MAX_TAPS);
  }

  if (tapTimes.length < MIN_TAPS) return;

  // Compute average inter-tap interval
  let totalInterval = 0;
  for (let i = 1; i < tapTimes.length; i++) {
    totalInterval += tapTimes[i] - tapTimes[i - 1];
  }
  const avgMs = totalInterval / (tapTimes.length - 1);
  const bpm = Math.round(60000 / avgMs);

  setBPM(bpm);
}
```

### Pattern 7: Quantized Melody Recording (COMP-04)
**What:** When recording is active, note-on events are captured with quantized time using Tone.js "@subdivision" notation. Events are stored in a Tone.Part for loop playback.
**When to use:** COMP-04 quantization; COMP-05 recording.
**Example:**
```javascript
// engine/recorder.js
// Source: https://tonejs.github.io/examples/quantization.html
//         https://github.com/tonejs/tone.js/wiki/Time (@ quantize syntax)

import * as Tone from 'tone';
import { noteOn, noteOff } from './instruments.js';

let isRecording = false;
let quantization = '16n';   // default: snap to nearest 16th note

// Stack of Tone.Part objects, one per overdub pass
const overdubStack = [];

// The Part being actively recorded into
let activePart = null;

export function setQuantization(subdiv) {
  quantization = subdiv;   // '4n', '8n', '16n', '32n'
}

export function startRecording() {
  isRecording = true;
  // Create a new Part for this recording pass
  activePart = new Tone.Part((time, event) => {
    noteOn(event.note, event.velocity);
    // Schedule note-off after event.duration
    Tone.getTransport().scheduleOnce(() => {
      noteOff(event.note);
    }, time + event.duration);
  }, []);

  activePart.loop = true;
  activePart.loopStart = 0;
  activePart.loopEnd = '1m';
  activePart.start(0);
}

export function stopRecording() {
  isRecording = false;
  if (activePart) {
    overdubStack.push(activePart);
    activePart = null;
  }
}

// Called from noteOn handler while recording is active
export function recordNote(note, velocity, duration = '8n') {
  if (!isRecording || !activePart) return;
  // "@16n" snaps capture time to nearest 16th note boundary on Transport
  const quantizedTime = `@${quantization}`;
  activePart.add(quantizedTime, { note, velocity, duration: Tone.Time(duration).toSeconds() });
}

export function undoLastOverdub() {
  const last = overdubStack.pop();
  if (last) {
    last.stop();
    last.dispose();
  }
}

export function clearAllRecordings() {
  overdubStack.forEach(p => { p.stop(); p.dispose(); });
  overdubStack.length = 0;
}
```

### Pattern 8: Tone.Draw for Visual Cursor Sync (COMP-01)
**What:** Transport callbacks run on the audio thread, before audio time. DOM updates from Transport callbacks cause visual jitter. Tone.Draw.schedule() defers the DOM update to the nearest animation frame at the correct moment.
**When to use:** Any visual update triggered by a Tone.Sequence or Transport callback.
**Example:**
```javascript
// Source: https://tonejs.github.io/docs/14.7.58/Draw

// WRONG — jittery, runs too early:
const sequence = new Tone.Sequence((time, step) => {
  updateCursor(step);  // BAD: runs before audio time, not animation-frame-aligned
}, stepIndices, '16n');

// CORRECT — smooth, frame-aligned:
const sequence = new Tone.Sequence((time, step) => {
  // Audio work in callback:
  if (grid.kick[step]) triggerKick(time);

  // Visual work via Draw:
  Tone.getDraw().schedule(() => {
    updateCursor(step);  // GOOD: fires on nearest rAF to audio time
  }, time);
}, stepIndices, '16n');
```

### Anti-Patterns to Avoid

- **Constructing drum synths in the Sequence callback:** Never `new Tone.MembraneSynth()` inside a Tone.Sequence or Transport callback — construction has GC overhead and async initialization. Pre-allocate all voices at module load.
- **Updating DOM directly in Transport callbacks:** Audio callbacks run on a separate clock before audio time. DOM updates here cause "jitter" where the cursor appears to skip. Always use `Tone.getDraw().schedule(() => {...}, time)`.
- **Calling `Tone.Transport.start()` without `ensureAudioStarted()` first:** The AudioContext must be running (user gesture gated) before the Transport can advance. The sequencer start button must call `ensureAudioStarted()` from `audio-engine.js` before `Tone.getTransport().start()`.
- **Setting `sequence.start()` without starting the Transport:** The Sequence will not fire. Transport must also start. Order: `ensureAudioStarted()` → `transport.start()` → `sequence.start(0)`.
- **Using "1m" as loopEnd without verifying time signature:** `Tone.getTransport().timeSignature` defaults to 4/4. "1m" = 4 beats = 16 sixteenth notes. If the time signature is changed, "1m" has different step counts. For a 16-step sequencer, `loopEnd = "1m"` is correct in 4/4 only.
- **Calling `triggerAttack` on MetalSynth without a note:** MetalSynth.triggerAttack() accepts an optional note (frequency). If omitted, it uses the `frequency` property set at construction. Always pass the same consistent frequency.
- **Recording quantized notes before Transport is running:** The "@16n" quantize syntax works by snapping to the nearest Transport grid position. If the Transport is stopped, the position is always 0, so all notes record at the same time.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Kick pitch sweep | Manual OscillatorNode + ScriptProcessor frequency ramp | Tone.MembraneSynth | pitchDecay + octaves encapsulate the 808-style ramp cleanly; custom ramp is 30+ lines with GC issues |
| Metallic hi-hat | Random noise + filter | Tone.MetalSynth | MetalSynth uses 6 FM oscillators tuned to TR-808 cymbal ratios — no DIY approximation comes close |
| Transport step counter | setInterval with drift correction | Tone.Sequence | Sequence uses Transport's sample-accurate clock; setInterval drifts 10–50ms per minute |
| Visual cursor sync | requestAnimationFrame polling | Tone.getDraw().schedule() | rAF polling has up to 16ms error; Draw.schedule fires within one frame of the exact audio moment |
| Note quantization | Manual time rounding math | "@16n" time notation | Tone.js handles BPM-relative rounding, Transport position alignment, and edge cases automatically |
| Noise buffer management | AudioBuffer generation per hit | Tone.Noise with persistent start() or Tone.NoiseSynth | NoiseSynth pre-fills a noise buffer; re-triggering reuses it — no per-hit allocation |

**Key insight:** The Tone.js drum instruments (MembraneSynth, MetalSynth, NoiseSynth) are not convenience wrappers — they embed specific synthesis algorithms (808 cymbal tuning ratios, pitch ramp mathematics) that took years to reverse-engineer. Building replacements will sound wrong.

---

## Common Pitfalls

### Pitfall 1: Sequence fires but no audio
**What goes wrong:** Sequence callback runs, drum trigger functions called, but silence.
**Why it happens:** `Tone.Transport` is not started, OR `Tone.start()` (AudioContext) was not called before transport start.
**How to avoid:** Always sequence the startup: `await ensureAudioStarted()` → `transport.start()` → `sequence.start(0)`. All three must happen in order after a user gesture.
**Warning signs:** No console errors but complete silence; `Tone.getTransport().state` is `"stopped"`.

### Pitfall 2: Visual cursor lags or jitters
**What goes wrong:** Step highlight updates don't match audio; cursor appears to skip steps or lag by ~100ms.
**Why it happens:** DOM update was done directly inside the Sequence callback instead of via `Tone.getDraw().schedule()`.
**How to avoid:** Always wrap DOM mutations in `Tone.getDraw().schedule(() => { ... }, time)` using the audio `time` from the Sequence callback.
**Warning signs:** Cursor visually correct on average but inconsistent timing; worse at higher BPMs.

### Pitfall 3: Tap tempo resets to starting BPM after a few taps
**What goes wrong:** Tapping the button quickly seems to set BPM briefly but then resets.
**Why it happens:** The timeout is too short, or there's a UI event listener that also handles keydown and applies a stale BPM from a different source.
**How to avoid:** Only one code path should write to `transport.bpm.value`. Use 2000ms reset timeout. Log computed BPM to console during development.
**Warning signs:** BPM display flickers between new value and 120.

### Pitfall 4: Overdub recording notes pile up at position 0
**What goes wrong:** All recorded notes play at the start of the loop, not at the time they were played.
**Why it happens:** Transport was stopped when `recordNote()` was called. "@16n" snaps to nearest 16th note on the Transport timeline, which is 0 when stopped.
**How to avoid:** Recording must be active only while the Transport is running. Disable record button when sequencer is stopped.
**Warning signs:** All recorded notes trigger in a cluster on beat 1.

### Pitfall 5: Undo removes the wrong notes
**What goes wrong:** Undo removes notes from the wrong recording pass; sometimes removes more than expected.
**Why it happens:** Multiple overdubs share a single Tone.Part, or Part indices are miscounted.
**How to avoid:** One Tone.Part per recording pass. The overdubStack array stores discrete Part objects. `undoLastOverdub()` calls `.stop()`, `.dispose()`, and removes from stack.
**Warning signs:** Undo removes notes from the current pass, not the previous one.

### Pitfall 6: Hi-hat choke causes double-trigger artifacts
**What goes wrong:** When closing an open hi-hat, both `triggerRelease` on open and `triggerAttack` on closed fire, causing a brief overlap or click.
**Why it happens:** MetalSynth.triggerRelease() has a 10–20ms release tail. If triggerAttack on closed fires at the same time, the envelopes overlap.
**How to avoid:** Fire triggerRelease for open hat at `time`, and schedule closed hat at `time + 0.005` (5ms later) to let the release envelope begin cleanly.
**Warning signs:** Audible click or "double-tap" sound on closed hi-hat when open was ringing.

### Pitfall 7: Pre-buffer noise violates DRUM-05 — NoiseSynth triggerAttack behavior
**What goes wrong:** Calling `noiseSynth.triggerAttackRelease()` multiple times in rapid succession causes audio glitches.
**Why it happens:** NoiseSynth re-starts its noise buffer on each trigger. If triggers overlap (step sequencer firing every 16th note), earlier releases may conflict.
**How to avoid:** Ensure envelope `decay + release` fits comfortably within one 16th note at max BPM (240 BPM = 62.5ms per 16th). Keep decay under 50ms for hi-hats and clap at high tempos. Alternatively, create one NoiseSynth per drum voice and never share.
**Warning signs:** Hi-hat or clap sounds "stuttering" or "chopped" at high BPM.

### Pitfall 8: MembraneSynth pitch note affects kick character
**What goes wrong:** Kick sounds too high-pitched or the pitch sweep is wrong.
**Why it happens:** `triggerAttack(note, time)` — the `note` parameter sets the bottom frequency. Using "C1" (≈32Hz) gives deep sub-bass; "C2" gives a snappier kick. The octaves parameter sets the top of the sweep.
**How to avoid:** Use "C1" or "D1" for deep 808-style kick; "C2" for 909-style snappier kick. Document the note parameter in drums.js.
**Warning signs:** Kick sounds thin or too high; adjust the note passed to `triggerAttack`.

---

## Code Examples

Verified patterns from official sources:

### Tone.MembraneSynth (Kick)
```javascript
// Source: https://tonejs.github.io/docs/15.1.22/classes/MembraneSynth.html
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.05,   // 50ms sweep
  octaves: 6,         // 6 octaves above note at peak, sweeps to note
  envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 },
}).toDestination();

kick.triggerAttack('C1', time); // C1 ~32Hz = deep sub-bass kick
```

### Tone.NoiseSynth (Snare / Hi-hat)
```javascript
// Source: https://tonejs.github.io/docs/15.1.22/classes/NoiseSynth.html
const snare = new Tone.NoiseSynth({
  noise: { type: 'white' },
  envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.05 },
}).toDestination();

snare.triggerAttackRelease('16n', time);
```

### Tone.MetalSynth (Hi-Hat)
```javascript
// Source: https://tonejs.github.io/docs/15.1.22/classes/MetalSynth.html
const closedHat = new Tone.MetalSynth({
  frequency: 400,
  envelope: { attack: 0.001, decay: 0.06, release: 0.01 },
  harmonicity: 5.1,
  modulationIndex: 32,
  resonance: 4000,
  octaves: 1.5,
}).toDestination();

closedHat.triggerAttack(time);  // no note param — uses frequency property
```

### Tone.Sequence (Step Sequencer)
```javascript
// Source: https://tonejs.github.io/docs/15.1.22/classes/Sequence.html
const seq = new Tone.Sequence(
  (time, step) => {
    // Audio work here
    if (kickGrid[step]) kick.triggerAttack('C1', time);

    // Visual work via Draw (CRITICAL)
    Tone.getDraw().schedule(() => {
      highlightStep(step);
    }, time);
  },
  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
  '16n'   // subdivision: one step = one 16th note
);
seq.loop = true;
```

### Transport BPM + Loop
```javascript
// Source: https://github.com/tonejs/tone.js/wiki/Transport
const transport = Tone.getTransport();
transport.bpm.value = 120;
transport.loop = true;
transport.loopStart = 0;
transport.loopEnd = '1m';   // 1 measure = 4 beats in 4/4

transport.start();    // start after ensureAudioStarted()
transport.stop();

// Runtime BPM change — all Sequence events auto-adjust
transport.bpm.value = 140;
```

### Quantized Recording with "@" Syntax
```javascript
// Source: https://tonejs.github.io/examples/quantization.html
// "@16n" = snap to nearest 16th note on Transport timeline
synth.triggerAttackRelease('C4', '8n', '@16n');

// For Part-based recording, capture quantized position:
// Tone.getTransport().position gives current position string "0:1:2"
// Use "@16n" as the time argument to Part.add():
part.add('@16n', { note: 'C4', velocity: 0.8, duration: 0.25 });
```

### Tone.Draw Pattern
```javascript
// Source: https://tonejs.github.io/docs/14.7.58/Draw
Tone.Transport.schedule((time) => {
  Tone.Draw.schedule(() => {
    // DOM update here — fires on nearest animation frame to `time`
    document.querySelector('.step.active')?.classList.remove('active');
    document.querySelector(`.step[data-step="${step}"]`)?.classList.add('active');
  }, time);
}, '+0');
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Tone.Transport` property | `Tone.getTransport()` function | Tone.js 14+ | Transport is now deprecated as a direct property; use getTransport() |
| `Tone.Draw` property | `Tone.getDraw()` function | Tone.js 14+ | Same deprecation pattern as Transport |
| `Tone.Transport.scheduleRepeat` | `Tone.Sequence` | Current | Sequence encapsulates step array + subdivision; scheduleRepeat still works but requires manual counter |
| Sample-based drum kits | Synthesis-based drums (MembraneSynth, MetalSynth, NoiseSynth) | Current | Synthesis has no sample loading latency; all synthesis engines are available in Tone.js 15 |
| Manual noise buffer allocation | Tone.NoiseSynth pre-fills buffer | Current | NoiseSynth handles buffer lifecycle; DRUM-05 requires avoiding per-hit allocation |

**Deprecated/outdated:**
- `Tone.Transport` (direct property access): Still works in 15.1.22 but flagged deprecated — use `Tone.getTransport()`
- `Tone.Draw` (direct property access): Still works but use `Tone.getDraw()`

---

## Open Questions

1. **Tone.Part "@" quantization with looping Parts**
   - What we know: `"@16n"` snaps to the nearest 16th note on the Transport timeline; works when Transport is running
   - What's unclear: Whether adding `"@16n"` to a looping Part that already has events creates duplicate notes at the same Transport position on loop 2+
   - Recommendation: Test with a simple single-note recording loop. If duplicates occur, convert `"@16n"` to an absolute Transport position before adding to Part (`Tone.getTransport().quantize('16n')`)

2. **getDraw() availability in Tone.js 15.1.22 ESM build**
   - What we know: `Tone.getDraw()` is documented at 14.7.58; the API was introduced before 15.x
   - What's unclear: Whether `getDraw()` is exported from the `+esm` CDN build at exactly `https://cdn.jsdelivr.net/npm/tone@15.1.22/+esm`
   - Recommendation: In Wave 1, import `{ getDraw }` and log it to console. If undefined, fall back to `import { Draw } from 'tone'` and use `Draw.schedule()` (deprecated but functional)

3. **Sequencer vs. pad grid AudioContext sharing**
   - What we know: All audio goes through the single AudioContext managed by `audio-engine.js`; the sequencer will also need `ensureAudioStarted()` before Transport.start()
   - What's unclear: Whether adding 4 new drum synths (MembraneSynth + effects + MetalSynth × 2 + NoiseSynth × 2) significantly increases AudioContext node count or CPU at high BPM
   - Recommendation: Start with direct toDestination() for drum voices (bypass the main effects chain); add per-drum effects (kick distortion, clap reverb) as separate lightweight chains. Profile in DevTools on mobile after implementing.

4. **Transport loop conflict with melody recording Part loop**
   - What we know: `transport.loopEnd = "1m"` and `part.loopEnd = "1m"` should align; both loop at the 1-measure boundary
   - What's unclear: Whether having both the Transport loop and the Part loop enabled causes the Part to reset twice (once by its own loop, once when Transport loops)
   - Recommendation: Disable `part.loop = true` and rely only on the Transport loop to restart playback. Part events scheduled in the first measure will replay naturally as the Transport loops.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | No test framework — manual browser verification (same as Phase 2) |
| Config file | none |
| Quick run command | `open http://localhost:8080` (manual) |
| Full suite command | Manual checklist covering all 10 phase requirements |

Phase 3 requirements are all audio/interaction behaviors (drum timbre, sequencer timing, tap tempo responsiveness, quantization accuracy, overdub fidelity). These require real browser testing and cannot be automated without significant test infrastructure that would conflict with the project's no-build-step architecture.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DRUM-01 | Kick has distinct sub-bass with pitch sweep, audible distortion | manual-audio | — | N/A |
| DRUM-02 | Snare has both noisy rattle and tonal body crack | manual-audio | — | N/A |
| DRUM-03 | Closed hi-hat is short/metallic; open is longer; open chokes when closed fires | manual-audio | — | N/A |
| DRUM-04 | Clap has multi-burst texture with reverb tail | manual-audio | — | N/A |
| DRUM-05 | No GC pauses or audio glitches at 240 BPM after extended playback | manual-performance | — | N/A |
| COMP-01 | 16-step grid renders; cursor advances step-by-step with audio | manual-visual | — | N/A |
| COMP-02 | Changing BPM slider changes step speed; cursor and audio stay in sync | manual-audio | — | N/A |
| COMP-03 | Tapping rhythm sets BPM; sequencer immediately adopts new tempo | manual-interaction | — | N/A |
| COMP-04 | Notes recorded over loop snap to selected quantization grid | manual-audio | — | N/A |
| COMP-05 | Overdub adds notes without erasing existing; undo removes last overdub only | manual-interaction | — | N/A |

### Sampling Rate
- **Per task commit:** Load page, verify the implemented feature works at 120 BPM (30 seconds)
- **Per wave merge:** All requirements in that wave manually verified, including mobile touch
- **Phase gate:** All 10 requirements pass before `/gsd:verify-work`

### Wave 0 Gaps
- None — no test infrastructure is needed. Verification is manual browser interaction.
- Ensure local HTTP server available: `python3 -m http.server 8080` from `/Users/brad/Apps/Tydal/`

---

## Sources

### Primary (HIGH confidence)
- `https://tonejs.github.io/docs/15.1.22/classes/MembraneSynth.html` — pitchDecay, octaves, triggerAttack note param
- `https://tonejs.github.io/docs/15.1.22/classes/MetalSynth.html` — harmonicity, modulationIndex, resonance, octaves, triggerAttack
- `https://tonejs.github.io/docs/15.1.22/classes/NoiseSynth.html` — noise.type, envelope, triggerAttackRelease
- `https://tonejs.github.io/docs/15.1.22/classes/Noise.html` — white/pink/brown types, start/stop/restart
- `https://tonejs.github.io/docs/15.1.22/classes/AmplitudeEnvelope.html` — ADSR on audio signals, drum synthesis application
- `https://tonejs.github.io/docs/15.1.22/classes/Sequence.html` — constructor, subdivision, loop, callback(time, value)
- `https://tonejs.github.io/docs/15.1.22/classes/Part.html` — add(), remove(), loop, loopEnd, start, stop, dispose
- `https://tonejs.github.io/docs/14.7.58/Draw` — schedule(callback, time), anticipation, rAF synchronization
- `https://github.com/tonejs/tone.js/wiki/Transport` — bpm.rampTo, scheduleRepeat, loop/loopStart/loopEnd
- `https://tonejs.github.io/examples/quantization.html` — "@" quantize notation, triggerAttackRelease with "@16n"
- `https://tonejs.github.io/examples/stepSequencer` — Sequence callback pattern, Tone.Draw integration

### Secondary (MEDIUM confidence)
- `https://www.nickwritesablog.com/drum-synthesis-in-javascript/` — Kick (30–120Hz + pitch sweep), Clap (4×noise burst, bandpass 400–3500Hz), Hi-hat synthesis techniques; verified against MembraneSynth/MetalSynth behavior
- `https://blog.cofx.nl/browser-beats-snare-and-hi-hat.html` — Snare: two triangle oscillators at 185Hz + 349Hz + highpass noise at 2kHz; verified against NoiseSynth + Synth layering approach
- Multiple verified: `Tone.getDraw()` replaces `Tone.Draw` as preferred access pattern in 15.x

### Tertiary (LOW confidence)
- Clap reverb tail duration (0.8s decay) — derived from common drum machine practice, not verified against specific 808/909 spec
- Hi-hat choke 5ms offset timing — derived from synthesis practice; exact value may need tuning

---

## Metadata

**Confidence breakdown:**
- Drum synthesis (DRUM-01 through DRUM-05): HIGH — MembraneSynth, MetalSynth, NoiseSynth all verified in Tone.js 15.1.22 docs with correct parameters
- Step sequencer (COMP-01, COMP-02): HIGH — Tone.Sequence verified; Tone.Draw pattern verified in 14.7.58 docs (same API in 15.x)
- Tap tempo (COMP-03): HIGH — average-interval algorithm is well-established; Tone.Transport.bpm.value is documented
- Quantization (COMP-04): HIGH — "@" syntax verified in Tone.js examples/quantization.html
- Overdub/undo (COMP-05): MEDIUM — Tone.Part API verified; overdub undo pattern is architectural (not from official example), but Part.dispose() is documented

**Research date:** 2026-03-15
**Valid until:** 2026-09-15 (Tone.js 15.x is stable; drum synthesis techniques are timeless)
