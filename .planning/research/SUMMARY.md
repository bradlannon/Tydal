# Project Research Summary

**Project:** SoundForge — Professional Browser Musical Instrument
**Domain:** Browser-based polyphonic instrument (synth + drum machine + step sequencer)
**Researched:** 2026-03-15
**Confidence:** HIGH

## Executive Summary

SoundForge is a complete rebuild of the existing sound pad into a professional browser instrument. The research consensus is clear: build on Tone.js as the audio engine foundation, structure the codebase as a layered module system with strict separation between audio, input, and UI, and solve the fundamental audio correctness problems (AudioContext lifecycle, timing precision, voice management, click artifacts) before adding any differentiating features. The existing app's core failure modes — setTimeout-based timing, unbounded oscillator spawning, no note-off handling, fixed-gain cuts — are textbook pitfalls that Tone.js directly solves when used correctly.

The recommended stack is minimal by design: Tone.js 14.x for synthesis and scheduling, WebMIDI.js for MIDI input, `audiobuffer-to-wav` for WAV export, native Canvas 2D for visualization, and a vanilla service worker for PWA. No build step, no bundler, no WebGL — these would conflict with the portfolio's Express static server architecture and add complexity with no audible benefit. The entire dependency footprint is under 235KB, well within budget. The single technology decision requiring early verification is the Tone.js ESM CDN import path: the `+esm` jsDelivr suffix must be validated before any application code is written around it.

The primary risks are all mobile-specific and well-documented: iOS AudioContext suspension requiring resume on every interaction, AudioWorklet's unfixable 128-sample buffer distortion on mobile (mitigated by sticking to Tone.js built-in synths), Web MIDI's complete absence on iOS (mitigated by progressive enhancement), and WAV export requiring a manual PCM encoder rather than MediaRecorder. None of these are blockers — each has a clear prevention strategy — but ignoring any one of them produces a broken mobile experience that appears to work on desktop. Test on real iOS hardware early.

## Key Findings

### Recommended Stack

The stack is intentionally thin and dependency-light. Tone.js handles the hard parts of browser audio: AudioContext timing precision, polyphonic voice management, ADSR envelopes, effects routing, and the Transport scheduler that makes sample-accurate sequencing possible without setTimeout. All other libraries are small, single-purpose, and additive.

**Core technologies:**
- **Tone.js 14.7.x** (CDN, pinned): Audio engine, synthesis, transport scheduling, effects — eliminates the entire class of timing and voice-management bugs in the current app
- **WebMIDI.js 3.1.14** (CDN, ESM): MIDI controller input with clean event model — Safari will never support Web MIDI, so this must be progressive enhancement only
- **audiobuffer-to-wav 1.0.0** (CDN): WAV export via OfflineAudioContext — MediaRecorder does not produce WAV natively, this is the correct alternative
- **Canvas 2D API** (native): Waveform + spectrum visualizer at 60fps — WebGL adds complexity with no benefit at audio visualizer data scales
- **Pointer Events API** (native): Unified multitouch/mouse/stylus handling with `setPointerCapture` for reliable gesture tracking
- **Vanilla Service Worker** (native): Cache-first PWA, no Workbox needed for a static asset list

See `/Users/brad/Apps/BI/.planning/research/STACK.md` for full rationale, CDN URLs, and alternatives considered.

### Expected Features

The research draws a sharp line between "toy" and "tool": a browser instrument crosses that line when a musician can connect a MIDI keyboard and jam without embarrassment. The table stakes features are the minimum to reach that threshold.

**Must have (table stakes):**
- Proper note lifecycle (note-on/note-off, held notes) — the current app has zero keyup handling
- 8-voice polyphony with voice stealing via `Tone.PolySynth` — unlimited spawning causes mobile crashes
- AudioContext-based timing via `Tone.Transport` — setTimeout drift is audible within 4-8 bars
- Anti-click envelopes on all note stops — audible clicks signal amateur code to any musician
- Filter with cutoff/resonance — the most fundamental synth parameter after the oscillator
- Effects chain: reverb + delay — dry sound signals a developer who doesn't know music
- Velocity sensitivity (touch speed, not pressure — pressure is unavailable on most devices)
- Chromatic note layout + octave shift — the current non-chromatic layout with gaps confuses anyone with musical training
- Master volume control
- MIDI input (progressive enhancement — iOS has no Web MIDI support)

**Should have (differentiators):**
- Step sequencer (functional, tempo-aware, per-instrument rows via `Tone.Sequence`)
- FM synthesis voices (piano, organ, electric piano) — rare in browser instruments, sounds dramatically better
- 808/909-style drum synthesis (not samples) — more expressive than sample playback
- Real-time visualizer (expressive, pitch-reactive — not just frequency bars)
- Scale lock mode — constrains pads to a key/scale, liberating for non-musicians
- Preset system with URL sharing via base64-encoded JSON
- PWA with offline support via service worker
- WAV export via OfflineAudioContext + manual PCM encoder
- Gyroscope/tilt interaction for pitch bend

**Defer (v2+):**
- Swing/shuffle control (easy after sequencer is solid, lower priority)
- Distortion effect (add after reverb/delay)
- Per-channel mixing — useful but adds UI complexity before core experience is polished
- Quantization for recorded loops — valuable only after sequencer and recording are stable

**Anti-features (do not build):**
- Full DAW / multi-track recording, MIDI output, custom sample upload, social features, collaborative jamming, piano roll, video recording

See `/Users/brad/Apps/BI/.planning/research/FEATURES.md` for the full feature dependency graph and MVP ordering.

### Architecture Approach

SoundForge uses a layered module system with strict downward-only communication: UI dispatches commands, the audio engine never touches the DOM. The architecture separates five concerns into distinct file groups: the audio engine (AudioContext lifecycle), instrument engine (voice types and presets), effects chain (signal routing), input layer (keyboard, touch, MIDI, gyroscope — all normalized through a central EventRouter), and UI layer (pad grid, sequencer grid, knobs, visualizer). The AnalyserNode is a passive tap after the master bus — it reads from the audio graph and never writes to it.

**Major components:**
1. **AudioEngine** (`engine/audio-engine.js`) — AudioContext singleton, `Tone.start()` gate on first gesture; everything else depends on this
2. **InstrumentEngine** (`engine/instruments.js`) — PolySynth/FMSynth/DrumSynth instances; maps voice types to presets
3. **EffectsChain** (`engine/effects.js`) — signal routing: per-instrument sends → filter → delay → reverb → master volume → analyser → Destination
4. **Transport + Sequencer** (`engine/transport.js`, `engine/sequencer.js`) — Tone.Transport wrapper; step-grid state driving Tone.Sequence callbacks
5. **EventRouter** (`input/event-router.js`) — single hub; all inputs (touch, keyboard, MIDI, gestures) normalize here before reaching the audio engine
6. **PresetManager** (`engine/presets.js`) — serialize/deserialize via `synth.get()` / `synth.set()`; localStorage + URL base64 encoding
7. **Visualizer** (`ui/visualizer.js`) — Canvas 2D rAF loop; reads Analyser data only, never touches audio graph

See `/Users/brad/Apps/BI/.planning/research/ARCHITECTURE.md` for the full component boundary table, audio routing diagram, data flow diagrams, and file structure.

### Critical Pitfalls

1. **Multiple AudioContext instances** — Create exactly one context at bootstrap as a module-level singleton. Never create contexts inside event handlers. After ~50 contexts Chrome degrades silently. Phase 1 risk.

2. **iOS AudioContext suspension / interruption** — iOS contexts start suspended and transition to `"interrupted"` (not just `"suspended"`) when backgrounded. `Tone.start()` must be called on every user interaction, not just the first. Listen to `statechange` events. Silent failure — the UI responds but produces no sound. Phase 1 risk.

3. **AudioWorklet 128-sample buffer on mobile** — Fixed buffer size causes crackling and distortion on all mobile browsers during touch interaction. No spec fix exists. Mitigation: use only Tone.js built-in synths (which use native audio nodes, not custom AudioWorklets). Never write custom AudioWorklet processors. Test every effect on real iOS/Android hardware. Phase 2 risk.

4. **setTimeout-based timing drift** — Audible within 4-8 bars. Use `Tone.Transport` and `Tone.Sequence` exclusively for all audio scheduling. `requestAnimationFrame` is acceptable only for visualizer rendering, never for note timing. Phase 1 risk.

5. **WAV export via MediaRecorder** — MediaRecorder does not produce WAV regardless of the `mimeType` argument. Requires a custom PCM encoder (50-100 lines of binary assembly) or the `audiobuffer-to-wav` library with OfflineAudioContext. Budget significant implementation time. Phase 5 risk.

6. **Velocity via touch pressure** — Most touchscreens do not report pressure reliably. Implement velocity as touch speed (time from `touchstart` to movement threshold), not `Touch.force`. Phase 2 risk.

7. **Passive touch listeners** — Chrome 56+ makes `touchstart`/`touchmove` listeners passive by default. Apply `touch-action: manipulation` via CSS from the first commit; use `{ passive: false }` only where `preventDefault()` is genuinely needed. Phase 1 risk.

See `/Users/brad/Apps/BI/.planning/research/PITFALLS.md` for the full 18-pitfall catalog with code prevention examples.

## Implications for Roadmap

Both the FEATURES.md MVP recommendation and the ARCHITECTURE.md build order graph converge on the same phase structure. The ordering is driven by hard dependencies: you cannot build polyphony before single-voice works, cannot build effects before there is an instrument signal source, cannot build the preset system before the instrument and effects APIs are stable, and the service worker must go last because it caches a specific file inventory.

### Phase 1: Audio Foundation

**Rationale:** Everything else depends on a correct audio engine. The three most critical pitfalls (multiple AudioContext, iOS suspension, setTimeout timing) must be solved here or they corrupt every phase that follows.
**Delivers:** A working single-voice instrument with correct lifecycle — notes start, hold, and release without clicks, on both desktop and iOS, with sample-accurate timing.
**Addresses:** AudioContext singleton, Tone.js import verification, note-on/note-off, anti-click envelopes, CSS `touch-action` on pad elements, iOS `statechange` handler.
**Avoids:** Pitfalls 1 (multiple contexts), 2 (iOS suspension), 4 (setTimeout timing), 7 (passive listeners), 18 (Tone.js version pinning).

### Phase 2: Instrument Quality (Toy-to-Tool Line)

**Rationale:** With a correct foundation, layer the features that cross the "toy vs tool" threshold before adding complexity. Velocity, polyphony, filter, and effects are the minimum for a musician to take the instrument seriously.
**Delivers:** 8-voice polyphony, velocity-sensitive touch input, filter with cutoff/resonance, reverb + delay chain, 3-4 polished subtractive synth presets, chromatic layout with octave shift.
**Uses:** `Tone.PolySynth`, `Tone.Reverb`, `Tone.FeedbackDelay`, `Tone.Filter`, Pointer Events API for velocity measurement.
**Avoids:** Pitfalls 3 (AudioWorklet mobile distortion — validate each effect), 12 (velocity via pressure), 14 (polyphony without voice stealing).

### Phase 3: Composition Surface

**Rationale:** Once the instrument is playable, add the composition tools that enable musical expression beyond single-note improvisation.
**Delivers:** Functional step sequencer (per-instrument rows, 16 steps, playback cursor), improved 808/909 drum synthesis, tap tempo, Transport-based BPM control.
**Uses:** `Tone.Sequence`, `Tone.Transport`, `Tone.MembraneSynth`, `Tone.NoiseSynth`.
**Avoids:** Pitfall 8 (setTimeout timing in sequencer — Tone.Sequence uses audio clock).

### Phase 4: Differentiators

**Rationale:** With a solid instrument and composition surface, add the features that produce the "this is something different" reaction and drive portfolio impact.
**Delivers:** FM synthesis voices (piano, organ, electric piano), scale lock mode, expressive real-time visualizer (waveform morphing, pitch-reactive color, not just bars), preset system with localStorage save + URL sharing.
**Uses:** `Tone.FMSynth`, Canvas 2D `AnalyserNode` with `fftSize=2048`, `btoa(JSON.stringify(patch))` for URL encoding.
**Avoids:** Pitfall 15 (FMSynth + PolySynth Firefox performance — test with 4-6 voices, not 8).

### Phase 5: Platform Polish

**Rationale:** Once the instrument is feature-complete, wrap it with platform capabilities. Service worker goes last because it caches a specific file inventory — adding it early causes constant cache invalidation as files are added.
**Delivers:** PWA with offline support, WAV export, gyroscope/tilt pitch bend, per-channel mixing.
**Uses:** Vanilla service worker (cache-first), `audiobuffer-to-wav` + OfflineAudioContext, DeviceOrientation API with iOS 13+ permission handling.
**Avoids:** Pitfalls 11 (WAV/MediaRecorder), 13 (gyroscope iOS permission), 16 (PWA audio range requests), 10 (AudioWorklet MIME type in PWA).

### Phase Ordering Rationale

- Foundation before features: the ARCHITECTURE.md build order graph shows AudioEngine as the prerequisite for every other component. This is non-negotiable.
- Polyphony after single-voice: voice stealing requires a working voice to steal. Building PolySynth wrapping a broken monophonic voice produces two broken things.
- Effects before visualizer: the AnalyserNode taps from the effects chain output. Without the effects chain the visualizer has no meaningful signal to read.
- Preset system in Phase 4, not Phase 2: preset serialization relies on stable `synth.get()` / `synth.set()` parameter APIs. Building presets while the synth parameter structure is still changing causes constant format breakage.
- Service worker last: the precache list references specific files by path. Adding the SW before the file structure is final means the cache is always stale during development.
- MIDI as progressive enhancement throughout: MIDI is an input path, not a foundation. It slots into the EventRouter (built in Phase 1/2) and does not block any other phase.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (FM synthesis voices):** Achieving realistic piano/organ timbre with `Tone.FMSynth` requires sound design iteration on operator ratios and modulation index. The API is documented; the parameter values for realistic sounds are not. Budget time for experimentation, or plan a "good enough" approximation.
- **Phase 5 (WAV export):** The `audiobuffer-to-wav` library is confirmed on npm, but its CDN ESM availability is unverified. May need to use esm.sh or vendor the file. Verify before implementation.

Phases with standard patterns (skip research-phase):
- **Phase 1 (audio foundation):** Tone.js patterns are thoroughly documented with official sources. AudioContext singleton and iOS handling patterns are well-established.
- **Phase 2 (instrument quality):** PolySynth, Filter, Reverb, FeedbackDelay are all Tone.js built-ins with official docs. Velocity-as-touch-speed is confirmed community consensus.
- **Phase 3 (step sequencer):** `Tone.Sequence` + `Tone.Transport` is the canonical pattern for browser step sequencers. Well-documented.
- **Phase 5 (PWA):** Cache-first service worker for a static asset list is a mature, well-documented pattern.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core stack (Tone.js, Canvas, Pointer Events) is HIGH confidence. Two items need early verification: Tone.js ESM CDN import path (`+esm` suffix on jsDelivr) and `audiobuffer-to-wav` CDN ESM availability. Run `npm info tone version` at project start to confirm current stable version. |
| Features | HIGH | Table stakes and differentiators are well-validated against community research and comparable instruments (Drumbit, WebSynths, Drumhaus). The feature dependency graph is logically sound. FM synthesis voice quality (MEDIUM) is the only area with implementation uncertainty. |
| Architecture | HIGH | Web Audio / Tone.js architecture is stable and thoroughly documented. The layered module pattern is the established approach across all major web instrument implementations. Build order graph is grounded in hard technical dependencies, not opinion. |
| Pitfalls | HIGH | All critical pitfalls are sourced from first-party documentation (MDN, Chrome DevTools, spec repo GitHub issues, Tone.js issues). iOS AudioContext behavior and AudioWorklet mobile issues are confirmed by multiple independent sources including the spec maintainers. |

**Overall confidence:** HIGH

### Gaps to Address

- **Tone.js version confirmation:** STACK.md identifies ambiguity between 14.x and 15.x. Run `npm info tone dist-tags` at project start to confirm current stable. The ARCHITECTURE.md index.html example references 15.0.4 while STACK.md recommends pinning to 14.7.x — resolve this discrepancy before writing any import map.
- **CDN ESM import validation:** Before writing application code, validate the Tone.js CDN import in a bare HTML file. The `+esm` jsDelivr suffix is the documented approach for no-build ESM; confirm it works with the pinned version.
- **CSP header update:** The existing portfolio `server.js` CSP allows `cdnjs.cloudflare.com` for scripts. `unpkg.com` or `cdn.jsdelivr.net` may need to be added. This is a one-line server change but must happen before Tone.js will load in production.
- **FM synthesis sound design:** Research confirms the API exists; achieving musically useful piano/organ presets requires iterative parameter tuning. This is a time budget concern, not a technical blocker.
- **Mobile hardware testing:** Several pitfalls (AudioWorklet distortion, iOS AudioContext interruption, velocity sensitivity) cannot be validated in DevTools alone. Real iOS and Android device testing should happen at the end of Phase 2, not at the end of Phase 5.

## Sources

### Primary (HIGH confidence)
- [Tone.js Official Documentation](https://tonejs.github.io/docs/) — API reference for all Tone.js classes used
- [Tone.js GitHub Releases](https://github.com/Tonejs/Tone.js/releases) — version confirmation
- [MDN: Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — AudioContext, AnalyserNode, OfflineAudioContext
- [MDN: Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) — browser support, permission model
- [caniuse.com: Web MIDI API](https://caniuse.com/midi) — confirmed Safari non-support
- [GitHub: AudioWorklet issue #2632](https://github.com/WebAudio/web-audio-api/issues/2632) — mobile 128-sample buffer distortion
- [GitHub: AudioContext interrupted state #2585](https://github.com/WebAudio/web-audio-api/issues/2585) — iOS interruption handling
- [Chrome Developers: Web MIDI Permission Prompt](https://developer.chrome.com/blog/web-midi-permission-prompt) — HTTPS + gesture requirements
- [MDN: Touch events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events) — passive listener defaults
- [jsDelivr: esm.run CDN](https://www.jsdelivr.com/esm) — ESM module delivery

### Secondary (MEDIUM confidence)
- [WebMIDI.js npm](https://www.npmjs.com/package/webmidi) — v3.1.14 confirmed, 5 months ago
- [audiobuffer-to-wav GitHub](https://github.com/Experience-Monks/audiobuffer-to-wav) — library confirmed; CDN ESM path unverified
- [Tone.js GitHub: FMSynth Firefox issue #427](https://github.com/Tonejs/Tone.js/issues/427) — performance concern at 8+ voices
- [Mozilla Bugzilla: WAV MediaRecorder](https://bugzilla.mozilla.org/show_bug.cgi?id=1379241) — confirmed MediaRecorder does not produce WAV
- [Medium: iOS 13 DeviceMotion permission](https://leemartin.dev/how-to-request-device-motion-and-orientation-permission-in-ios-13-74fc9d6cd140) — permission pattern
- Internal `.planning/reddit-research.md` — community consensus on toy-vs-tool threshold, velocity approaches

### Tertiary (LOW confidence)
- SVG vs Canvas vs WebGL performance benchmarks — visualizer choice rationale; well-reasoned but not run against this specific workload
- FM synthesis parameter values for realistic piano/organ timbre — no sourced reference; requires implementation-time experimentation

---
*Research completed: 2026-03-15*
*Ready for roadmap: yes*
