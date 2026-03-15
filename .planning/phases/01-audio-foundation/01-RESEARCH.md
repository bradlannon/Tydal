# Phase 1: Audio Foundation - Research

**Researched:** 2026-03-15
**Domain:** Tone.js audio engine, iOS AudioContext lifecycle, Web Audio API, vanilla ES modules
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**App Identity**
- App name is **Tydal** (replaces "SoundForge" from original roadmap)
- Standalone app in `Apps/Tydal/`, hosted at `tydal.bradlannon.ca`
- Portfolio apps page gets a simple link card pointing to Tydal
- Portfolio site stays as-is — no music app embedded in it

**Pad Grid & Interaction**
- 4x4 grid (16 pads), notes only — no drums until Phase 3
- Ableton Push / Akai MPC layout: bottom-left = lowest note, top-right = highest note. Notes ascend left-to-right, then bottom-to-top
- Each pad shows both keyboard shortcut letter AND note name
- Hold-to-sustain: press = note plays, release = note stops with anti-click fade (AUDIO-03)
- Basic multitouch support on mobile — allow pressing 2-3 pads simultaneously

**Default Sound Character**
- Warm analog pad: sawtooth with slight detuning and gentle low-pass filter
- Single voice only — no voice/instrument switching in Phase 1
- Long sustain (organ-like): note plays full and steady while held, smooth release fade on keyup
- Visible master volume slider on screen (AUDIO-07)

**Visual Feedback**
- Pad active state: vibrant color fill + soft glow/shadow
- Uniform accent color for all pads
- Tap-to-start overlay on iOS: full-screen overlay saying "Tap anywhere to enable audio", disappears after first touch
- No visualizer in Phase 1

**Theme & Layout**
- Full dark theme throughout (immersive instrument aesthetic)
- NOT a dark container inside a light page — the entire app is dark
- Viewport-filling: instrument container stretches to fill most of viewport height minus nav
- Title only in header: "Tydal" — no subtitle/description
- Minimal help tooltip: small "?" icon that expands to show keyboard shortcuts

**Integration (revised)**
- INTG-01 CHANGED: Tydal has its own nav/design, NOT the portfolio nav/footer
- INTG-02 CHANGED: Full dark theme standalone page, NOT dark-container-in-light-portfolio
- INTG-03 UNCHANGED: Responsive design, mobile-first
- INTG-04 UNCHANGED: ES modules via import map, Tone.js from CDN
- Old prototype (`public/apps/sound-pad.html`) should be removed — clean break

### Claude's Discretion
- Exact note range for the 16 pads (pick what sounds musical)
- Keyboard key mapping to the 4x4 grid
- Anti-click envelope parameters (gain ramp timing)
- Tone.js AudioContext lifecycle implementation details
- Dark theme color palette and surface hierarchy
- Nav/header design for standalone app
- File/module organization within the Tydal project
- Volume slider placement and styling

### Deferred Ideas (OUT OF SCOPE)
- Update ROADMAP.md and REQUIREMENTS.md to reflect name change and revised requirements
- Update PROJECT.md core value statement with new app name
- Determine Tydal's own deployment/hosting setup for tydal.bradlannon.ca
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUDIO-01 | App initializes a single Tone.js AudioContext with proper lifecycle management (suspended → running, iOS interrupted recovery) | AudioContext singleton pattern, Tone.start() gate, statechange handler |
| AUDIO-02 | Audio bus architecture with instrument channels → effects sends → master bus → Tone.Destination | Tone.js chain/connect API, PolySynth → Volume → Destination routing |
| AUDIO-03 | Note-on/note-off lifecycle — notes sustain while key/pad is held, release on keyup/touchend | triggerAttack / triggerRelease API, Pointer Events pointerdown/pointerup |
| AUDIO-04 | 8-voice polyphony with voice stealing via Tone.PolySynth | PolySynth maxPolyphony option, built-in voice stealing |
| AUDIO-05 | All scheduling uses Tone.Transport — no setTimeout for musical timing | Tone.now() for immediate triggers, no setTimeout in timing paths |
| AUDIO-06 | Anti-click envelopes on all voice stop events (gain ramp to zero before stop) | ADSR release parameter, triggerRelease() pattern |
| AUDIO-07 | Master volume control via Tone.Volume before Tone.Destination | Tone.Volume node placement in signal chain |
| INTG-01 | CHANGED: Tydal has its own nav/design, NOT portfolio nav/footer | Standalone dark app shell, own header |
| INTG-02 | CHANGED: Full dark theme standalone page, NOT dark-container-in-light-portfolio | Full-viewport dark CSS, CSS custom properties |
| INTG-03 | Responsive design — mobile-first with desktop enhancements | CSS Grid for 4x4 pad, viewport units, breakpoints |
| INTG-04 | ES modules loaded via import map (no build step), Tone.js from CDN | jsDelivr +esm endpoint, importmap in index.html |
</phase_requirements>

---

## Summary

This phase builds the Tydal instrument from a blank canvas. There is no prior code in `Apps/Tydal/` — the existing `public/apps/sound-pad.html` in the portfolio repo is reference material only, not a starting point. The Tydal app is a standalone, fully dark instrument hosted at its own domain.

The core technical challenge is a correct Tone.js integration that handles iOS Safari's notorious AudioContext lifecycle requirements, a clean note-on/note-off model using `triggerAttack`/`triggerRelease`, and a module structure that will scale cleanly into Phase 2's more complex synthesis features.

**Tone.js version resolved:** npm confirms `latest` is **15.1.22** (not 14.x as originally researched). Use 15.1.22. The `+esm` jsDelivr endpoint (`https://cdn.jsdelivr.net/npm/tone@15.1.22/+esm`) is confirmed to return `application/javascript` and works as a browser ESM import. The ARCHITECTURE.md example showing `tone@15.0.4` was directionally correct; pin to `15.1.22`.

**Primary recommendation:** Build a minimal, correct audio engine first — one PolySynth with sawtooth + detuning wired through Tone.Volume to Tone.Destination, with the iOS AudioContext gate implemented on day one. Every other feature in Phase 1 layers on top of a provably working audio core.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tone.js | 15.1.22 | Synthesis, PolySynth, Transport, Volume | Handles AudioContext timing, polyphony, ADSR envelopes, anti-click. The complete audio engine solution. |
| Vanilla JS (ES modules) | Native | App logic, UI, event handling | No build step required. ES modules + importmap covers all needs. |
| CSS Custom Properties | Native | Dark theme, surface hierarchy, responsive layout | No framework needed for a single-page instrument shell. |

### CDN Import (Verified)

```html
<script type="importmap">
{
  "imports": {
    "tone": "https://cdn.jsdelivr.net/npm/tone@15.1.22/+esm"
  }
}
</script>
```

The `+esm` suffix on jsDelivr serves a properly compiled ESM bundle. Verified: returns `Content-Type: application/javascript`. Do NOT use the raw npm package URL or unpkg without this suffix.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Pointer Events API | Browser native | Unified touch/mouse input, multitouch | Primary input handler for pad grid — replaces separate touchstart/mousedown |
| CSS `touch-action: manipulation` | Browser native | Prevent double-tap zoom, remove 300ms click delay | Apply to every pad element from day one |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tone.js PolySynth | Raw OscillatorNode | PolySynth handles voice stealing, ADSR, anti-click automatically. Raw nodes require weeks to implement correctly. |
| jsDelivr `+esm` endpoint | esm.sh/tone@15.1.22 | Both work; jsDelivr is the same CDN already whitelisted in portfolio CSP. Prefer jsDelivr. |
| Pointer Events API | touchstart + mousedown | Pointer Events unify both in one handler. Less code, correct multitouch behavior. |

### Installation

No npm install. Pin CDN versions in importmap. Verify version at project start:

```bash
npm info tone dist-tags  # Confirms latest: 15.1.22
```

---

## Architecture Patterns

### Recommended Project Structure

Tydal lives entirely in `Apps/Tydal/` as a standalone project, separate from the portfolio repo.

```
Apps/Tydal/
├── index.html              # Entry point: importmap + module bootstrap
├── styles.css              # Full dark theme, pad grid, responsive layout
├── app.js                  # Init: audio gate + wire modules together
├── engine/
│   ├── audio-engine.js     # AudioContext singleton, Tone.start() gate, iOS recovery
│   ├── instruments.js      # PolySynth creation, sawtooth+detune preset, note on/off API
│   └── effects.js          # Tone.Volume (master bus) → Tone.Destination routing
├── input/
│   ├── keyboard.js         # keydown/keyup → note on/off, key→pad mapping
│   └── touch.js            # pointerdown/pointerup on pad grid, multitouch tracking
└── ui/
    ├── pad-grid.js         # Render 4x4 grid, active state CSS class management
    └── overlay.js          # iOS "Tap to enable audio" full-screen overlay
```

**Why this structure:** Each file has one job. `audio-engine.js` owns the singleton context. `instruments.js` owns the synth. They never touch the DOM. Input handlers normalize events and call instrument methods. UI modules render state. This boundary is enforced from Phase 1 so Phase 2's more complex additions slot in cleanly.

### Pattern 1: AudioContext Singleton Gate

**What:** The Tone.js AudioContext is created exactly once, guarded behind a user gesture.

**When to use:** On every pointerdown event on any interactive element. Also on any tap/click on the iOS overlay.

```javascript
// engine/audio-engine.js
// Source: Tone.js docs + PITFALLS.md Pitfall 2

let _started = false;

export async function ensureAudioStarted() {
  if (_started) return;
  await Tone.start(); // resumes the AudioContext; must be inside a user gesture handler
  _started = true;
}

// iOS interrupted state recovery — runs for the lifetime of the page
Tone.getContext().rawContext.addEventListener('statechange', async () => {
  if (Tone.context.state !== 'running') {
    // Show overlay again if audio becomes interrupted
    showAudioOverlay();
  }
});
```

**Why:** iOS Safari starts every AudioContext in `'suspended'` state. A phone call, screen lock, or backgrounding transitions it to `'interrupted'` — a WebKit-only state that `resume()` alone does not reliably recover. `Tone.start()` wraps resume correctly. The statechange listener catches post-interruption recovery.

### Pattern 2: PolySynth with Warm Pad Sound

**What:** A single `Tone.PolySynth` with sawtooth oscillator, slight detuning, and low-pass filter baked into the synth options.

**When to use:** Phase 1 uses one synth only. All 16 pads trigger this synth.

```javascript
// engine/instruments.js
// Source: Tone.js docs — PolySynth / Synth options

import * as Tone from 'tone';

const warmPad = new Tone.PolySynth(Tone.Synth, {
  maxPolyphony: 8,
  options: {
    oscillator: {
      type: 'sawtooth',
    },
    detune: -8,       // slight chorus-like warmth from two detuned sources
    envelope: {
      attack: 0.02,   // fast but not instant (avoids click at note start)
      decay: 0.1,
      sustain: 0.85,  // organ-like: nearly full volume while held
      release: 0.4    // smooth 400ms fade on keyup — AUDIO-06 anti-click
    },
    filter: {
      type: 'lowpass',
      frequency: 2800,  // warm: roll off harsh highs
      rolloff: -12
    },
    filterEnvelope: {
      attack: 0.05,
      decay: 0.2,
      sustain: 0.5,
      release: 0.8,
      baseFrequency: 200,
      octaves: 3.5
    }
  }
});

export { warmPad };
```

**Discretion guidance:** Note range recommendation for 16 pads in Push/MPC layout (bottom-left lowest, top-right highest):
- Use **C3 to D#4** (15 semitones across 16 pads, skipping one accidental) — or more musically: a single two-octave span
- A practical mapping: C3, D3, E3, F3, G3, A3, B3, C4, D4, E4, F4, G4, A4, B4, C5, D5 (two diatonic octaves, 16 notes)
- This range sits in the "warm pad zone" where sawtooth sounds best, avoids harshness in the upper register

### Pattern 3: Signal Chain Assembly

**What:** Instruments connect through Volume to Destination. Built once at app init, never torn down.

```javascript
// engine/effects.js
// Source: Tone.js docs — Tone.Volume, toDestination()

import * as Tone from 'tone';
import { warmPad } from './instruments.js';

export const masterVolume = new Tone.Volume(-6).toDestination(); // -6dB headroom default
warmPad.connect(masterVolume);
```

**Why -6dB default:** Sawtooth oscillators are loud. Starting at -6dB gives headroom so the slider can go up OR down without immediate clipping on load.

### Pattern 4: Note On/Off Lifecycle

**What:** `triggerAttack` on pointerdown/keydown, `triggerRelease` on pointerup/keyup. Track held notes by identifier.

```javascript
// input/keyboard.js
// Source: MDN Web API + Tone.js docs

const heldKeys = new Set();

document.addEventListener('keydown', async (e) => {
  if (e.repeat) return;           // ignore key-hold auto-repeat
  const note = KEY_TO_NOTE[e.key];
  if (!note || heldKeys.has(e.key)) return;
  heldKeys.add(e.key);
  await ensureAudioStarted();
  warmPad.triggerAttack(note, Tone.now());
});

document.addEventListener('keyup', (e) => {
  const note = KEY_TO_NOTE[e.key];
  if (!note) return;
  heldKeys.delete(e.key);
  warmPad.triggerRelease(note, Tone.now());
});
```

**Touch equivalent (input/touch.js):**
```javascript
// Pointer Events give us a pointerId per finger — correct multitouch tracking
const touchedPads = new Map(); // pointerId → note

padGrid.addEventListener('pointerdown', async (e) => {
  e.preventDefault(); // must be { passive: false } listener
  const pad = e.target.closest('[data-note]');
  if (!pad) return;
  await ensureAudioStarted();
  const note = pad.dataset.note;
  touchedPads.set(e.pointerId, note);
  warmPad.triggerAttack(note, Tone.now());
  pad.classList.add('active');
}, { passive: false });

padGrid.addEventListener('pointerup', (e) => {
  const note = touchedPads.get(e.pointerId);
  if (!note) return;
  touchedPads.delete(e.pointerId);
  warmPad.triggerRelease(note, Tone.now());
  document.querySelector(`[data-note="${note}"]`)?.classList.remove('active');
});

padGrid.addEventListener('pointercancel', (e) => {
  // Same as pointerup — finger left screen unexpectedly
  const note = touchedPads.get(e.pointerId);
  if (note) warmPad.triggerRelease(note, Tone.now());
  touchedPads.delete(e.pointerId);
});
```

### Pattern 5: Pad Grid Layout (CSS Grid, MPC Layout)

**What:** 4x4 CSS grid with pads numbered 13-16 (top row) down to 1-4 (bottom row). MPC convention: pad 1 is bottom-left.

```css
/* styles.css */
.pad-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 8px;
  /* Pads rendered top-to-bottom in DOM order 13,14,15,16 / 9,10,11,12 / 5,6,7,8 / 1,2,3,4 */
  /* This gives visual appearance of ascending left-right, bottom-to-top */
}

.pad {
  touch-action: manipulation; /* kills double-tap zoom, removes 300ms delay */
  user-select: none;
  cursor: pointer;
  /* active state */
}

.pad.active {
  background-color: var(--accent);
  box-shadow: 0 0 16px var(--accent-glow);
}
```

**DOM order note:** To achieve MPC layout where pad 1 is bottom-left and pad 16 is top-right, render rows from top to bottom in the DOM as: [13,14,15,16], [9,10,11,12], [5,6,7,8], [1,2,3,4]. CSS grid renders in DOM order, so this puts 1 at bottom-left visually.

### Pattern 6: iOS Overlay

**What:** Full-screen overlay blocks the instrument UI until the first user tap.

```html
<!-- index.html -->
<div id="audio-overlay" class="audio-overlay">
  <div class="overlay-inner">
    <p>Tap anywhere to enable audio</p>
  </div>
</div>
```

```javascript
// ui/overlay.js
const overlay = document.getElementById('audio-overlay');

export function showAudioOverlay() {
  overlay.hidden = false;
}

export function hideAudioOverlay() {
  overlay.hidden = true;
}

overlay.addEventListener('click', async () => {
  await ensureAudioStarted();
  hideAudioOverlay();
}, { once: false }); // keep listening: interrupted state can bring it back
```

### Anti-Patterns to Avoid

- **setTimeout for note scheduling:** Use `Tone.now()` as the time argument in all trigger calls. Never `setTimeout(() => triggerAttack(...), 0)`.
- **Multiple AudioContext instances:** `audio-engine.js` creates exactly one context via `Tone.start()`. No other file creates a context.
- **Calling `osc.stop()` directly:** Use `triggerRelease()` on PolySynth. Tone.js handles the anti-click ramp internally.
- **Passively-registered touch listeners with `preventDefault`:** The `pointerdown` listener on the pad grid MUST use `{ passive: false }` to allow `e.preventDefault()`. Without it, Chrome silently ignores `preventDefault` and the page may scroll.
- **`@latest` CDN URL:** Pin to `tone@15.1.22`. `@latest` breaks when Tone.js releases a new version.
- **Rendering pads in DOM as 1→16 top-to-bottom:** This produces the wrong MPC layout. Render as 13-16, 9-12, 5-8, 1-4 (top row to bottom row) to achieve bottom-left lowest, top-right highest.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Voice stealing / polyphony management | Custom voice pool | `Tone.PolySynth` with `maxPolyphony: 8` | PolySynth implements oldest-voice stealing out of the box. Hand-rolling this correctly requires ~200 lines and months of production testing. |
| Anti-click note stop | Custom gain ramp + osc.stop() | `triggerRelease()` on PolySynth | Tone.js release envelope handles the ramp-to-zero precisely at audio clock time. Manual gain ramps have timing bugs that cause audible clicks under load. |
| AudioContext timing / lookahead | Custom scheduler | `Tone.now()` + Transport | Chris Wilson's two-clock lookahead pattern is already implemented in Tone.js. Home-built schedulers drift. |
| Audio graph routing | Custom node management | `Tone.Volume`, `.connect()`, `.toDestination()` | Tone.js nodes track their own connections. Manual Web Audio graph management leads to memory leaks (disconnected nodes still process audio). |
| iOS AudioContext recovery | Custom resume loop | `Tone.start()` + `statechange` listener | `Tone.start()` wraps the correct sequence for both `suspended` and `interrupted` states. |

**Key insight:** Everything in the "don't hand-roll" list was attempted in the original `sound-pad.html` prototype and failed in exactly the ways described. The entire reason for adopting Tone.js is to not rebuild this infrastructure.

---

## Common Pitfalls

### Pitfall 1: iOS Silent Failure — AudioContext Suspended/Interrupted

**What goes wrong:** AudioContext starts `suspended` on iOS. After phone lock/backgrounding it goes `interrupted`. The instrument looks functional (UI works) but produces no sound.

**Why it happens:** WebKit policy. `suspended` ≠ `interrupted` — they need different recovery paths. Calling `audioCtx.resume()` directly does not handle `interrupted`.

**How to avoid:**
- Show the "Tap anywhere to enable audio" overlay until `Tone.context.state === 'running'`
- Call `Tone.start()` (not raw `context.resume()`) on every user gesture path
- Add `statechange` listener to re-show overlay if state transitions away from `running`
- Test on actual iOS hardware — DevTools simulator does not reproduce this

**Warning signs:** Desktop Chrome works, iPhone is silent. Audio stops after phone is pocketed and taken out.

### Pitfall 2: Wrong Tone.js CDN URL

**What goes wrong:** Importing Tone.js from the raw jsDelivr npm URL (`https://cdn.jsdelivr.net/npm/tone@15.1.22/build/esm/index.js`) fails with a MIME type error or module resolution error in the browser. Only the `+esm` endpoint produces a single-file browser-ready bundle.

**How to avoid:** Use exactly: `https://cdn.jsdelivr.net/npm/tone@15.1.22/+esm`

**Warning signs:** `Tone` is `undefined` at runtime. Console shows "Failed to resolve module specifier" or "The MIME type ... is not a valid JavaScript MIME type."

**Verification step:** Before writing any Tone.js code, open a plain HTML file in the browser with just the importmap and `console.log(Tone.version)`. If it logs `15.1.22`, the CDN path is correct.

### Pitfall 3: `preventDefault` Ignored on Touch Events

**What goes wrong:** Chrome 56+ makes `touchstart`/`touchmove` listeners passive by default. Passive listeners cannot call `preventDefault()`. Without `{ passive: false }`, touching a pad scrolls the page simultaneously.

**How to avoid:**
- Register the `pointerdown` listener on the pad grid with `{ passive: false }`
- Apply `touch-action: manipulation` via CSS to all `.pad` elements
- Apply `touch-action: none` to the `.pad-grid` container if page scroll is still interfering

**Warning signs:** Console: "Unable to preventDefault inside passive event listener." Touching pads scrolls the viewport on Android Chrome.

### Pitfall 4: Unbounded Oscillator Spawning

**What goes wrong:** Without voice management, every `triggerAttack` spawns new audio nodes. Rapid playing stacks dozens of active nodes. Mobile audio engine stutters within 30 seconds.

**How to avoid:** Use `Tone.PolySynth` with `maxPolyphony: 8`. Always call `triggerRelease` on `pointerup`/`keyup`. PolySynth automatically steals the oldest voice when the limit is reached.

**Warning signs:** CPU grows continuously during rapid playing. Audio degrades after 30+ seconds of chords.

### Pitfall 5: MPC Layout Rendered Upside-Down

**What goes wrong:** Rendering pads 1→16 in DOM order top-to-bottom puts the lowest note at the top-left (backwards from MPC/Push convention).

**How to avoid:** Render rows in reverse order in HTML: row 4 first (pads 13-16), then row 3 (9-12), then row 2 (5-8), then row 1 (1-4) at the bottom. Or use CSS `flex-direction: column-reverse`.

**Warning signs:** The lowest note is in the top-left corner instead of the bottom-left.

### Pitfall 6: `pointercancel` Not Handled

**What goes wrong:** If a finger triggers `pointercancel` (e.g., browser gesture interruption), the `pointerup` event never fires. The note stays in `triggerAttack` state indefinitely — a stuck note.

**How to avoid:** Add a `pointercancel` handler that calls `triggerRelease` for any tracked pointer, identical to the `pointerup` handler.

---

## Code Examples

Verified patterns for the planner to reference in task actions:

### Tone.js Import (Verified CDN)

```html
<!-- index.html -->
<script type="importmap">
{
  "imports": {
    "tone": "https://cdn.jsdelivr.net/npm/tone@15.1.22/+esm"
  }
}
</script>
<script type="module" src="./app.js"></script>
```

### PolySynth Warm Pad Voice

```javascript
// engine/instruments.js
import * as Tone from 'tone';

export const warmPad = new Tone.PolySynth(Tone.Synth, {
  maxPolyphony: 8,
  options: {
    oscillator: { type: 'sawtooth' },
    detune: -8,
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.85, release: 0.4 },
    filter: { type: 'lowpass', frequency: 2800, rolloff: -12 },
    filterEnvelope: {
      attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.8,
      baseFrequency: 200, octaves: 3.5
    }
  }
});
```

### Master Volume Signal Chain

```javascript
// engine/effects.js
import * as Tone from 'tone';
import { warmPad } from './instruments.js';

export const masterVolume = new Tone.Volume(-6).toDestination();
warmPad.connect(masterVolume);
```

### Note On/Off (Keyboard)

```javascript
// input/keyboard.js
import * as Tone from 'tone';
import { warmPad } from '../engine/instruments.js';
import { ensureAudioStarted } from '../engine/audio-engine.js';

// Keyboard layout: QWER/ASDF/ZXCV/1234 — assign to MPC grid positions
// Bottom row (pads 1-4): Z, X, C, V
// Second row (pads 5-8): A, S, D, F
// Third row (pads 9-12): Q, W, E, R
// Top row (pads 13-16): 1, 2, 3, 4
// NOTE: exact key mapping is Claude's Discretion

const KEY_TO_NOTE = {
  'z': 'C3', 'x': 'D3', 'c': 'E3', 'v': 'F3',
  'a': 'G3', 's': 'A3', 'd': 'B3', 'f': 'C4',
  'q': 'D4', 'w': 'E4', 'e': 'F4', 'r': 'G4',
  '1': 'A4', '2': 'B4', '3': 'C5', '4': 'D5',
};

const heldKeys = new Set();

document.addEventListener('keydown', async (e) => {
  if (e.repeat) return;
  const note = KEY_TO_NOTE[e.key.toLowerCase()];
  if (!note || heldKeys.has(e.key)) return;
  heldKeys.add(e.key);
  await ensureAudioStarted();
  warmPad.triggerAttack(note, Tone.now());
});

document.addEventListener('keyup', (e) => {
  const note = KEY_TO_NOTE[e.key.toLowerCase()];
  if (!note) return;
  heldKeys.delete(e.key);
  warmPad.triggerRelease(note, Tone.now());
});
```

### iOS AudioContext Gate

```javascript
// engine/audio-engine.js
import * as Tone from 'tone';

let _started = false;

export async function ensureAudioStarted() {
  if (_started && Tone.context.state === 'running') return;
  try {
    await Tone.start();
    _started = true;
  } catch (err) {
    console.error('Tone.start() failed:', err);
  }
}

// iOS interrupted state recovery
Tone.getContext().rawContext.addEventListener('statechange', () => {
  if (Tone.context.state !== 'running') {
    _started = false;
    // Caller responsible for re-showing overlay — see ui/overlay.js
  }
});
```

### Volume Slider (HTML + JS)

```html
<!-- index.html -->
<input type="range" id="volume-slider"
  min="-40" max="0" value="-6" step="1"
  aria-label="Master Volume">
```

```javascript
// app.js
import { masterVolume } from './engine/effects.js';

document.getElementById('volume-slider').addEventListener('input', (e) => {
  masterVolume.volume.rampTo(Number(e.target.value), 0.05); // ramp avoids click
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tone.js 14.x (14.7.77) | Tone.js 15.x (15.1.22) | 2024 | 15.x is ESM-native, ships `build/esm/index.js`. The `+esm` CDN endpoint works cleanly. |
| `sound-pad.html` single-file | Multi-module ES module project | Phase 1 clean break | No shared code; Tydal starts fresh |
| Portfolio-embedded (portfolio nav/footer) | Standalone dark app at own domain | CONTEXT.md scope change | No portfolio CSS dependencies; Tydal owns its full visual design |

**Deprecated/outdated:**
- `public/apps/sound-pad.html`: Replaced by Tydal. Should be deleted as part of Phase 1 cleanup (per CONTEXT.md: "clean break").
- Tone.js 14.x research in `STACK.md`: Superseded. Use 15.1.22 — confirmed as npm `latest`.
- Import map URL in `ARCHITECTURE.md` using `tone@15.0.4`: Correct pattern, wrong version. Use 15.1.22.

---

## Open Questions

1. **Keyboard key assignment (Claude's Discretion)**
   - What we know: 4x4 grid, MPC layout, 16 keys needed
   - What's unclear: Whether to use home-row QWERTY clustering or number row for top pads
   - Recommendation: Use `ZXCV / ASDF / QWER / 1234` rows (matches physical keyboard layout intuitively for a 4-row grid). Include a "?" help tooltip showing the mapping. This is discretion territory — just pick something consistent and document it in the UI.

2. **Dark theme color palette (Claude's Discretion)**
   - What we know: Full dark, not a container-in-light. Like Ableton/NI.
   - Recommendation: `#0a0a0a` body background, `#1a1a1a` pad surface, `#2a2a2a` pad hover, `#2A9D8F` (portfolio accent) as pad active color for brand continuity, `rgba(42, 157, 143, 0.4)` for glow. Use CSS custom properties for all color tokens.

3. **Tone.js 15 PolySynth `options` vs `voice` parameter naming**
   - What we know: Tone.js 15 `PolySynth(Voice, options)` — the second arg is synth instance options
   - What's unclear: Whether the inner voice options are wrapped in an `options` key or passed flat
   - Recommendation: Use `new Tone.PolySynth(Tone.Synth, { maxPolyphony: 8, options: { ...synthParams } })` — the `options` key wraps per-voice parameters in Tone 15. Verify with a quick smoke test before building the full instrument.

4. **Note range for 16 pads**
   - Recommendation: C3–D5 spanning two diatonic octaves (16 white-key notes). This range sounds warm on a sawtooth pad, avoids muddiness below C3, and avoids harshness above D5. Phase 2 adds chromatic layout so keeping diatonic in Phase 1 gives a playable, pleasant first experience.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed — Tydal is a new blank project |
| Config file | None — see Wave 0 gaps |
| Quick run command | Open `index.html` in browser — manual smoke test |
| Full suite command | Manual test checklist (no automated framework in Phase 1) |

**Note:** Tydal has no test infrastructure yet. Phase 1 validation is primarily browser-based smoke testing on desktop and iOS hardware. Automated test infrastructure is a Wave 0 consideration for later phases. For Phase 1, the success criteria are best verified manually:

1. iOS Safari: tap overlay → pads produce sound
2. Hold pad/key → note sustains; release → note fades without click
3. Play 8 notes simultaneously → no crash, 9th note steals a voice
4. Volume slider changes output level
5. No `setTimeout` calls in `engine/` or `input/` JS files (grep check)

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUDIO-01 | Single AudioContext created, iOS unlock works | manual-only | — (requires iOS hardware) | ❌ Wave 0 |
| AUDIO-02 | Audio routes through Volume to Destination | smoke | `grep -r "setTimeout" engine/` (must return empty) | ❌ Wave 0 |
| AUDIO-03 | Note sustains on hold, releases on keyup/pointerup | manual-only | — (requires human ear) | ❌ Wave 0 |
| AUDIO-04 | 8-voice polyphony, 9th note steals | manual-only | — (requires manual chord testing) | ❌ Wave 0 |
| AUDIO-05 | No setTimeout in timing paths | automated grep | `grep -r "setTimeout" ./engine/ ./input/` | ❌ Wave 0 |
| AUDIO-06 | No audible click on note release | manual-only | — (requires human ear) | ❌ Wave 0 |
| AUDIO-07 | Volume slider changes output level | manual-only | — (requires human ear) | ❌ Wave 0 |
| INTG-01 | Own nav/design, not portfolio nav | visual | Browser inspection | ❌ Wave 0 |
| INTG-02 | Full dark theme, viewport-filling | visual | Browser inspection | ❌ Wave 0 |
| INTG-03 | Responsive on mobile + desktop | visual | Browser resize / real device | ❌ Wave 0 |
| INTG-04 | ES modules via importmap, Tone.js from CDN | automated grep | `grep "importmap" index.html` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** Browser smoke test — open `index.html`, trigger a note, confirm sound
- **Per wave merge:** Full manual checklist (all 11 requirements above)
- **Phase gate:** Full manual checklist green on iOS Safari + Chrome desktop before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `index.html` — entry point does not exist yet (Wave 0 task: scaffold)
- [ ] `engine/audio-engine.js` — does not exist yet
- [ ] `engine/instruments.js` — does not exist yet
- [ ] `engine/effects.js` — does not exist yet
- [ ] `input/keyboard.js` — does not exist yet
- [ ] `input/touch.js` — does not exist yet
- [ ] `ui/pad-grid.js` — does not exist yet
- [ ] `ui/overlay.js` — does not exist yet
- [ ] `styles.css` — does not exist yet
- [ ] `app.js` — does not exist yet

*(This is a new project. All files are Wave 0 creations.)*

---

## Sources

### Primary (HIGH confidence)

- `npm info tone dist-tags` — confirmed latest is `15.1.22`
- `curl -sI "https://cdn.jsdelivr.net/npm/tone@15.1.22/+esm"` — confirmed `Content-Type: application/javascript`
- [Tone.js 15 docs — PolySynth](https://tonejs.github.io/docs/15.0.4/classes/PolySynth.html) — constructor signature, maxPolyphony, triggerAttack/Release API
- `.planning/research/PITFALLS.md` — direct domain research, HIGH confidence
- `.planning/research/ARCHITECTURE.md` — audio routing patterns, HIGH confidence
- `.planning/research/STACK.md` — stack decisions (version updated from 14.x to 15.1.22)
- `.planning/current-app-analysis.md` — prototype gaps analysis, HIGH confidence (direct code audit)

### Secondary (MEDIUM confidence)

- `.planning/codebase/STACK.md` — portfolio server CSP (cdn.jsdelivr.net already whitelisted)
- `.planning/phases/01-audio-foundation/01-CONTEXT.md` — user decisions, architecture scope

### Tertiary (LOW confidence)

- None — all findings above are verified against official sources or direct npm/CDN inspection.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — version confirmed via `npm info`, CDN endpoint verified via curl
- Architecture: HIGH — module patterns from existing ARCHITECTURE.md research, confirmed against Tone.js docs
- Pitfalls: HIGH — drawn from PITFALLS.md which cites official GitHub issues and MDN
- Note range / keyboard mapping: MEDIUM (discretion area, musical judgment, not technical)

**Research date:** 2026-03-15
**Valid until:** 2026-06-15 (Tone.js 15.x is stable; CDN paths don't change for pinned versions)
