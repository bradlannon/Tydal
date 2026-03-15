# Technology Stack: SoundForge

**Project:** SoundForge — professional browser musical instrument
**Researched:** 2026-03-15
**Constraint:** ES modules, no build step, portfolio integration (Express static server)

---

## Recommended Stack

### Audio Engine

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tone.js | 14.7.77 | Synthesis, scheduling, effects, transport | Handles AudioContext timing, polyphony, ADSR, FM synthesis, effects chain in a single library. Eliminates setTimeout-based timing (the root cause of the existing sound pad's problems). Provides PolySynth, FMSynth, MembraneSynth, Reverb, Delay, Distortion, Filter out of the box. |

**CDN import (no build step):**
```html
<script src="https://cdn.jsdelivr.net/npm/tone@14.7.77/build/Tone.js"></script>
```

Or as ESM via esm.sh (allows `import` syntax in modules):
```javascript
import * as Tone from 'https://esm.sh/tone@14.7.77';
```

**Why 14.7.77, not 15.x:** The search found references to `tone@15.1.22` on docs.io but the GitHub releases page shows 14.7.39 as the latest tagged stable release (July 2024). Version 15 appears in docs URLs but is not confirmed as a stable npm release. Use 14.7.77 (the highest 14.x patch seen on jsDelivr). Pin to a specific version — never use `@latest` for audio work where API changes break patches.

**Confidence:** MEDIUM. Version confirmed via multiple CDN and npm references. The 14.x vs 15.x ambiguity needs verification at project start with `npm info tone dist-tags`.

---

### MIDI Input

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| WebMIDI.js | 3.1.14 | MIDI controller input | Wraps the raw Web MIDI API in a clean event model (`noteon`, `pitchbend`, `controlchange`). Native Web MIDI API is Chrome/Firefox only — Safari will never support it (Apple's position, fingerprinting concerns). WebMIDI.js provides a graceful degradation path: detect support, show "connect MIDI controller" UI only when available, hide silently on Safari. |

**CDN import:**
```javascript
import { WebMidi } from 'https://esm.sh/webmidi@3.1.14';
```

**Safari situation:** No polyfill exists that works without a native plugin (Jazz-Plugin requires OS-level installation — not viable for a portfolio instrument). The correct approach is feature detection: `if (navigator.requestMIDIAccess)` then initialize MIDI, otherwise the instrument works keyboard/touch only. Document this clearly in the UI.

**Confidence:** HIGH. WebMIDI.js 3.1.14 confirmed on npm 5 months ago. Safari non-support is Apple's stated position per multiple sources.

---

### WAV Export

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| audiobuffer-to-wav | 1.0.0 | Convert AudioBuffer to WAV ArrayBuffer | 110-line pure function, no dependencies. Works with `OfflineAudioContext` for faster-than-realtime rendering. MediaRecorder does NOT support WAV natively across browsers — this is the correct alternative. |

**Pattern:**
```javascript
// Record into OfflineAudioContext, then:
import toWav from 'https://cdn.jsdelivr.net/npm/audiobuffer-to-wav@1.0.0/index.js';
const wav = toWav(audioBuffer);
const blob = new Blob([wav], { type: 'audio/wav' });
const url = URL.createObjectURL(blob);
// trigger download
```

**Confidence:** MEDIUM. Library confirmed on npm and jsDelivr. CDN ESM availability needs verification at project start — it's a CommonJS module and may need esm.sh for direct browser import.

---

### Visualization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Canvas 2D API | Browser native | Waveform + spectrum visualizer | No dependency. `AnalyserNode` from Web Audio provides FFT and time-domain data. Canvas handles 60fps at these data sizes (1024-2048 FFT bins) without hitting the ~3k-5k element limit where WebGL becomes necessary. Canvas + `requestAnimationFrame` is the standard pattern for every major web instrument visualizer (Drumbit, WebSynths, etc.). |

**Do NOT use WebGL/Three.js** for the core visualizer. WebGL adds ~200KB, initialization complexity, and GPU context management for no audible benefit. If a future "wow factor" 3D effect is desired, add it as an isolated enhancement — don't make it the architecture.

**Confidence:** HIGH. Well-established pattern confirmed across multiple sources. Performance benchmarks confirm Canvas is sufficient at audio visualizer data scales.

---

### PWA / Offline Support

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Service Worker (vanilla) | Browser native | Offline caching, installability | No Workbox needed for this use case. The asset list is static and known (HTML, JS modules, manifest.json, icons). A 60-line cache-first service worker covers it. Workbox is only worth the weight when you have dynamic routing or complex cache strategies. |
| Web App Manifest | Browser native | Installability, standalone display | Required for "Add to Home Screen" on mobile. Must include `name`, `short_name`, `start_url`, `display: "standalone"`, `theme_color`, and icons at 192px and 512px. |

**Service worker strategy:** Cache-first for all app assets (JS, CSS, HTML). Network-first for nothing — this is an instrument, not a news feed. On install, pre-cache the full asset list. Tone.js CDN URL must be included in the pre-cache list for offline to work.

**Audio file caching note:** Use `preload="none"` on any `<audio>` elements. `preload="metadata"` can cause service worker cache bypass (confirmed in community research).

**Confidence:** HIGH for the approach. MEDIUM for specific cache header behavior with CDN-served Tone.js — test early whether the CDN sets headers that allow service worker caching.

---

### Touch / Gesture Handling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Pointer Events API | Browser native | Multitouch, mouse, stylus unified | `pointerdown`/`pointerup`/`pointermove` with `setPointerCapture` is the modern way to handle multitouch without juggling `touchstart`/`mousedown` separately. Supported in all target browsers. |
| DeviceMotion API | Browser native | Gyroscope/tilt for pitch bend | Required for the "tilt to bend pitch" feature. Requires HTTPS and a user gesture to enable on iOS 13+. |

**Touch velocity calculation:**
```javascript
// On pointerdown: record timestamp
// On pointerup: calculate elapsed time
const elapsed = pointerUpTime - pointerDownTime; // ms
const velocity = Math.max(0, Math.min(1, 1 - elapsed / 300));
// Fast tap (~50ms) → velocity ~0.83; Slow press (~300ms) → velocity ~0
```

This matches how GarageBand measures velocity: speed of contact, not pressure (pressure is not reliably available in browsers).

**CSS to prevent double-tap zoom interference:**
```css
.pad { touch-action: manipulation; user-select: none; }
```

**Confidence:** HIGH. Pointer Events API is well-documented and universally supported. Velocity calculation pattern derived from community research and confirmed implementation logic.

---

### No-Build-Step Module Architecture

| Technology | Purpose | Why |
|------------|---------|-----|
| ES Modules (native browser) | Code organization | Matches existing portfolio architecture. `type="module"` script tags support `import`/`export` natively in all target browsers. No webpack, no Vite, no transpilation. |
| Import maps | Bare specifier aliasing | Allows `import { Tone } from 'tone'` syntax in modules without a bundler. Defined in a `<script type="importmap">` block. Chrome/Firefox support is solid; Safari 16.4+. Fallback: use full CDN URLs directly. |

**Import map example:**
```html
<script type="importmap">
{
  "imports": {
    "tone": "https://esm.sh/tone@14.7.77",
    "webmidi": "https://esm.sh/webmidi@3.1.14"
  }
}
</script>
<script type="module" src="./js/main.js"></script>
```

**Confidence:** HIGH for native ES modules. MEDIUM for import maps — Safari 16.4+ is fine but older Safari versions will fail silently. Test early; fall back to full CDN URLs in module imports if Safari compatibility issues emerge.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Audio engine | Tone.js 14.x | Raw Web Audio API | Tone.js solves AudioContext timing, voice management, and effects routing. Reimplementing these correctly is weeks of work and a known pitfall (setTimeout drift, click/pop on note stop). |
| Audio engine | Tone.js 14.x | Howler.js | Howler is a sample playback library. It has no synthesis, no transport, no effects chain. Wrong tool for an instrument. |
| MIDI | WebMIDI.js | Raw navigator.requestMIDIAccess | Raw API requires manual message parsing (status bytes, data bytes). WebMIDI.js provides `noteon`/`noteoff` events with note names and velocity already parsed. Same browser support, better DX. |
| Visualization | Canvas 2D | Three.js / WebGL | Three.js is ~160KB and adds GPU context management for visuals that Canvas handles at 60fps. Use if a 3D effect becomes a specific requirement — not as the base architecture. |
| Visualization | Canvas 2D | SVG | SVG redraws at audio rates (60fps of 1024-point waveforms) are DOM-intensive and janky. Canvas is the correct choice for real-time data. |
| WAV export | audiobuffer-to-wav | MediaRecorder | MediaRecorder does not support WAV format natively. It outputs WebM/Ogg. Cross-browser WAV requires manual encoding. |
| PWA | Vanilla service worker | Workbox | Workbox adds a build step and ~30KB. This project has a static, known asset list. Vanilla cache-all on install is simpler and sufficient. |
| Build system | None (ES modules) | Vite / Rollup | The portfolio has no build system. Adding one creates an integration mismatch and deployment complexity. ES modules + CDN imports work fine for this scale. |

---

## Size Budget

| Component | Estimated Size | Notes |
|-----------|---------------|-------|
| Tone.js (minified) | ~150KB | Confirmed in PROJECT.md; CDN-served |
| WebMIDI.js | ~30KB | Minified bundle |
| audiobuffer-to-wav | ~2KB | Tiny utility |
| App JS modules | ~30-50KB | Custom code estimate |
| **Total** | **~215-235KB** | Well under 500KB constraint |

---

## AudioWorklet Note

The community research (GitHub issue #2632) documents that AudioWorklet has "massive distortion across all mobile devices and browsers" with its forced 128-sample buffer. Tone.js 14.x does NOT require custom AudioWorklet processors — it uses the Web Audio API's native nodes (OscillatorNode, GainNode, BiquadFilterNode, etc.), which are implemented in the browser's native audio thread and are not affected by this issue. Do not add custom AudioWorklet processors for synthesis — use Tone.js's built-in synths.

---

## Installation Reference

No npm install needed (no build step). All CDN imports are pinned in the importmap. At project start, verify exact latest patch versions with:

```bash
npm info tone version          # Verify current stable
npm info webmidi version       # Verify current stable
```

Then pin those versions in the importmap.

---

## Sources

- [Tone.js GitHub Releases](https://github.com/Tonejs/Tone.js/releases) — version confirmation (14.7.39 latest tagged)
- [tone on jsDelivr](https://www.jsdelivr.com/package/npm/tone) — CDN availability
- [WebMIDI.js npm](https://www.npmjs.com/package/webmidi) — v3.1.14 confirmed
- [WebMIDI.js docs](https://webmidijs.org/docs/) — v3 API reference
- [Web MIDI API — Can I Use](https://caniuse.com/midi) — browser support matrix
- [audiobuffer-to-wav GitHub](https://github.com/Experience-Monks/audiobuffer-to-wav) — WAV encoding library
- [MDN: OfflineAudioContext](https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext) — faster-than-realtime rendering
- [MDN: Web Audio Visualizations](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API) — Canvas + AnalyserNode pattern
- [esm.sh](https://esm.sh/) — ESM CDN for no-build imports
- [web.dev: Web App Manifest](https://web.dev/learn/pwa/web-app-manifest) — PWA manifest reference
- [AudioWorklet disaster (GitHub #2632)](https://github.com/WebAudio/web-audio-api/issues/2632) — why to avoid custom AudioWorklet
- [SVG vs Canvas vs WebGL performance 2025](https://www.svggenie.com/blog/svg-vs-canvas-vs-webgl-performance-2025) — visualizer choice rationale
