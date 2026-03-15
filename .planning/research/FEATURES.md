# Feature Landscape: SoundForge Browser Instrument

**Domain:** Professional browser-based musical instrument (synth + drum machine + sequencer)
**Researched:** 2026-03-15
**Context:** Milestone build — upgrading from a basic sound pad to a professional instrument

---

## Framing: The "Toy vs Tool" Line

Community research consistently identifies the same threshold: a browser instrument crosses from toy to tool when a musician can connect their MIDI keyboard and jam without embarrassment. Every table-stakes feature below sits on one side of that line. Missing any of them keeps the instrument in demo territory.

---

## Table Stakes

Features users expect. Missing any one of these causes a musician to close the tab.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Proper note lifecycle (note-on/note-off)** | Every real instrument has held and released notes. Without this, nothing sustains — every note is a blip. | Low | Tone.js `triggerAttack` / `triggerRelease`. The current app has zero keyup handling. |
| **8-voice polyphony with voice stealing** | Playing a chord requires multiple simultaneous notes. Unlimited spawning (current state) causes crashes. | Low-Med | `Tone.PolySynth` wraps any synth voice. Voice stealing algorithm built in. |
| **Effects chain: reverb + delay** | Every professional instrument has spatial effects. Dry sound signals "this was made by someone who doesn't know music." | Low | `Tone.Reverb`, `Tone.FeedbackDelay` — both built into Tone.js. Chain via `.chain()`. |
| **Filter with cutoff and resonance** | The filter is the most fundamental synth parameter after the oscillator. Without it there is no sound design. | Low | `Tone.Filter` — lowpass/highpass/bandpass, frequency, Q parameters. |
| **Master volume control** | The current app has no master gain node — volume cannot be adjusted without rewiring the graph. | Low | Add a `Tone.Volume` node before `Tone.Destination`. |
| **Velocity sensitivity** | Every note at the same volume is the single most recognizable indicator of an amateur web instrument. | Med | On touch: measure speed between `touchstart` and `touchend` (pixels/ms, smoothed over last 100ms). On MIDI: map MIDI velocity byte (0-127) directly. |
| **MIDI input support** | Non-negotiable for any musician with a controller. MIDI keyboards are the minimum viable external input. | Med | `navigator.requestMIDIAccess()` — Chrome/Edge/Opera/Brave supported natively. Safari does NOT support Web MIDI API (fingerprinting concerns, confirmed 2025). Fallback: WebMIDIAPI polyfill. |
| **Chromatic note layout** | The current non-chromatic layout with duplicates confuses anyone with musical training. | Low | Map pads to consecutive semitones with octave shift. One sharps row above naturals row is standard (piano keyboard layout). |
| **Octave shifting** | A fixed 2-octave range with gaps is too limiting for any melodic playing. | Low | +/- octave transposition applied to the note mapping table. |
| **Proper audio graph (bus architecture)** | No effects insert point, no master gain, no per-channel mixing currently. All downstream features require this. | Med | Instrument buses → effects sends → master bus → `Tone.Destination`. Foundation for everything else. |
| **Anti-click envelope on note stop** | Audible clicks/pops when notes cut off immediately signal amateur code. | Low | Use `setTargetAtTime` to ramp gain to 0 before `stop()` (~20ms). The current app does this on piano but not drums. |
| **Tap tempo / BPM control** | Musicians set tempo by feel, not by typing numbers. Tap tempo is the ergonomic minimum. | Low | Track timestamps of successive taps, average the intervals. |
| **AudioContext-based timing (no setTimeout)** | `setTimeout` drift makes loops slide out of sync within seconds. | Med | Use `Tone.Transport` and `Tone.Part` for all scheduled events. Chris Wilson's lookahead scheduler pattern. |

---

## Differentiators

Features that set SoundForge apart. Not universally expected, but they produce the "holy shit" reaction.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **FM synthesis voices (piano, organ, electric piano)** | Browser instruments almost always use single oscillators. Actual FM synthesis for a Rhodes-style EP or Hammond organ is rare and sounds dramatically better. | Med-High | `Tone.FMSynth` for operator stacking. Piano needs inharmonic partials in attack; organ needs drawbar-style additive harmonics. Each preset requires individual parameter tuning — this is sound design work, not just wiring. |
| **808/909-style drum synthesis (not samples)** | Most browser drum machines use sample playback. Synthesis-based drums are rarer, more expressive, and don't require loading assets. | Med | Kick: sine oscillator with exponential pitch sweep + distortion. Snare: noise + tonal body component. Current app has direction right but missing body on snare and click on kick. |
| **Step sequencer (functional, tempo-aware)** | The current "sequencer" is display-only and hardcoded to a 1-second window. A real per-instrument-row sequencer with playback cursor is a major capability jump. | High | Per-drum-instrument rows × 16-32 steps. Steps trigger via `Tone.Sequence`. Playback cursor driven by Transport `position`. Step length = `(60 / BPM) / 4` seconds. |
| **Real-time visualizer (expressive, reactive)** | Frequency bars are ubiquitous. A visualizer that reacts expressively — waveform morphing, particle bursts on transients, color tied to note pitch — differentiates visually. | Med | `AnalyserNode` with `fftSize=2048` for spectrum + `getByteTimeDomainData` for waveform. Canvas 2D or WebGL for rendering. Key: increase `fftSize` from the current 256 (too coarse) and drive visual parameters from audio data, not just bar height. |
| **Scale lock mode** | Constraining pads to a specific scale/key eliminates wrong notes. Liberating for non-musicians; useful for melodic jamming. Rare in browser instruments. | Low | Rebuild the note mapping table at runtime, filtering to only the scale's pitch classes. Display current key + scale name. |
| **Preset system with URL sharing** | Waveform (wavetable synth) does this and it drives adoption — people share patches. URL encoding of synth parameters as a query string is a shareable, stateless mechanism. | Med | `localStorage` for saved presets (JSON-serialized patch object). URL encoding for sharing: `btoa(JSON.stringify(patch))` in the hash or query string. Build a preset picker with 6-8 curated factory presets, plus user slots. |
| **PWA with offline support** | Musicians use instruments on planes and subways. Installability and offline capability are requested frequently in community forums. | Med | Service worker (Workbox) precaching the JS, Tone.js CDN bundle, CSS, HTML. Web App Manifest with icons and `display: standalone`. Main complication: Tone.js from CDN must be cached by the service worker on first load, or bundled locally. |
| **WAV export of recordings** | Making something with an instrument and being able to save it is table stakes for production use. Web instruments that export are used more. | Med-High | `MediaRecorder` captures `AudioContext.destination` as a stream. Chrome records WebM/Opus by default — need `extendable-media-recorder` + WAV encoder for uncompressed WAV, or use `OfflineAudioContext` to render to a buffer and manually encode PCM to WAV. Note: `OfflineAudioContext` cannot record a real-time MediaStream (Firefox bug 968109 confirms this limitation). |
| **Gyroscope / tilt interaction** | Pitch bend via tilt, filter sweep via roll — no browser instrument does this well. The "unique interaction" requirement from the project spec. | Med | `DeviceOrientationEvent` (requires user permission on iOS 13+, Android Chrome). Map beta/gamma to Tone.js `detune` or filter frequency. Clamp and smooth the values (raw gyro is jittery). Show a permission request UI before accessing. |
| **Unique visual design** | Matching the portfolio theme (dark instrument card on `#FAFAFA` background) is a baseline. The visualizer needs to feel intentional — particle systems on drum hits, pitch-colored waveforms — not just bars. | Med | Design decision more than implementation complexity. Canvas 2D is sufficient. Key: couple audio analysis to non-bar-chart visuals. |
| **Quantization options** | Snap-to-grid for recorded loops converts loose playing into locked-in grooves. Genuinely useful and rare in browser instruments. | Med | Snap each event timestamp to nearest `(60/BPM)/subdivision` boundary post-recording. Offer 1/4, 1/8, 1/16, 1/32 options. |
| **Swing / shuffle control** | The difference between a groove and a metronome. Adds ±% delay to even-numbered 1/16th steps. Essential for hip-hop and funk feels. | Low-Med | In the step sequencer, offset `even_step_time += swing_amount * step_duration`. Tone.js Transport has a `swing` property. |
| **Per-channel mixing (volume + pan)** | Independent level and pan per drum voice, or per synth layer. Gives users sound design control without a full mixer. | Med | One `Tone.Volume` + `Tone.Panner` per instrument channel, all feeding the master bus. UI: per-row sliders in the sequencer or a fold-out mixer panel. |

---

## Anti-Features

Features to deliberately NOT build. Each one risks scope explosion, technical debt, or misaligned purpose.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Full DAW / multi-track recording** | This is an instrument, not a production suite. Building a timeline editor, track management, and non-destructive editing is a multi-year scope. | Export a single WAV of a performance. That's the right tool boundary. |
| **MIDI output** | Output requires routing to external software/hardware — complex to test, low payoff for a portfolio instrument. The Web MIDI spec supports it but the use case is narrow. | MIDI input only for v1, as stated in PROJECT.md. |
| **Custom sample upload / sampler mode** | File handling, IndexedDB storage management, sample slicing, and mapping UI is a full separate instrument type. | Curate 6-8 synthesized presets. Synthesis-only is a design constraint, not a limitation. |
| **Social features / SoundCloud integration** | SoundCloud's API has changed and their platform has had instability. Social features require server-side work (auth, storage) that conflicts with the static portfolio architecture. | WAV export lets users share their audio anywhere they want. |
| **Collaborative / multi-user jamming** | Requires WebRTC or WebSockets, server infrastructure, and latency coordination. Fundamentally changes the architecture. | Out of scope. Single-player instrument. |
| **Video recording of performances** | `MediaRecorder` can capture canvas + audio, but the output quality is variable and the use case is marginal for a portfolio instrument. | Screen recording by the user is good enough. |
| **Plugin ecosystem / VST support** | Browsers cannot host VST/AU/AAX plugins. This is a platform constraint, not a design choice. | The Tone.js effects chain is the plugin system. Build 4-5 good effects instead of trying to host arbitrary code. |
| **MIDI clock sync with external hardware** | Requires MIDI output, which is out of scope. Also requires sample-accurate timing that browser environments cannot guarantee reliably. | Tap tempo and manual BPM are sufficient sync mechanisms for a standalone instrument. |
| **Aftertouch / pressure-sensitivity** | Touchscreen `Force Touch` (3D Touch) is iOS-only and deprecated as of iPhone 12. Android has no equivalent. Web APIs do not expose reliable pressure data. | Velocity (touch speed) is the achievable expression axis. Gyroscope adds a second dimension. |
| **Piano roll / timeline editor** | Building a graphical event editor with drag-and-drop is a major UI project that competes with the instrument interaction itself. | The step sequencer grid is the composition surface. Keep it there. |
| **Pitch detection / auto-tune** | Requires microphone input, signal processing pipeline, and display — a separate tool category. | Out of scope for this instrument. |

---

## Feature Dependencies

```
Proper audio graph (bus architecture)
  → Effects chain (reverb, delay, filter, distortion)
  → Per-channel mixing (volume + pan per instrument)
  → WAV export (requires a node to tap for MediaRecorder)
  → Real-time visualizer (AnalyserNode placement matters)

Note lifecycle (note-on/note-off)
  → Voice polyphony (need to track active voices to release them)
  → Velocity sensitivity (velocity applied at triggerAttack time)
  → MIDI input (MIDI noteOn/noteOff messages map to note lifecycle)

AudioContext-based timing (Tone.Transport)
  → Step sequencer (Tone.Sequence runs on Transport)
  → Quantization (snap to Transport grid)
  → Swing (Transport.swing property)
  → WAV export timing accuracy

Chromatic note layout
  → Scale lock (filter the chromatic layout to scale pitches)
  → Octave shifting (transpose the layout by 12 semitones)

Preset system
  → All synth parameters must be serializable (flat JSON)
  → URL sharing (base64-encode the preset JSON)
  → PWA offline (presets stored in localStorage survive offline)

PWA / Service Worker
  → Offline support (requires manifest + service worker)
  → Tone.js must be locally bundled OR the CDN URL cached in SW precache list

MIDI input
  → Velocity sensitivity (MIDI already carries velocity byte — free)
  → Note lifecycle (MIDI noteOn/noteOff map directly)
  → No additional UI needed; MIDI is a parallel input path

FM synthesis voices
  → Requires understanding of operator ratios, modulation index — sound design work
  → Preset system becomes essential so users can recall good FM patches
  → Higher CPU cost: test polyphony limit on mobile before committing to 8 voices

Step sequencer
  → AudioContext timing (cannot use setTimeout for steps)
  → Per-channel mixing (sequencer needs one row per drum instrument)
  → Swing (applied per-step in the sequence)
  → Quantization (steps are inherently quantized; real-time recording can snap to steps)
```

---

## MVP Recommendation

Given the existing app is a full rebuild anyway, prioritize in this order:

**Phase 1 — Foundation (without these nothing else works)**
1. Proper audio bus architecture (master gain, effects bus, instrument channels)
2. Note lifecycle (note-on/note-off, held notes, release)
3. 8-voice polyphony with voice stealing (`Tone.PolySynth`)
4. AudioContext-based timing (`Tone.Transport`)
5. Anti-click envelopes on all voices

**Phase 2 — Instrument quality (crosses the toy-to-tool line)**
6. Filter with cutoff/resonance
7. Effects chain: reverb + delay (Tone.js built-ins)
8. Velocity sensitivity on touch + MIDI input
9. Chromatic layout + octave shift
10. 3-4 polished synthesizer presets (subtractive synth basis)

**Phase 3 — Composition surface**
11. Step sequencer (functional, tempo-aware, per-instrument rows)
12. 808/909 drum synthesis improvements
13. Tap tempo
14. Quantization for recorded loops

**Phase 4 — Differentiators**
15. FM synthesis voices (piano, organ, EP)
16. Scale lock mode
17. Real-time visualizer (expressive, not just bars)
18. Preset system with URL sharing

**Phase 5 — Platform**
19. PWA + service worker for offline
20. WAV export
21. Gyroscope / tilt interaction
22. Per-channel mixing

**Defer indefinitely:**
- Swing (easy, but only matters after sequencer is solid)
- Distortion effect (add after reverb/delay are done; lower priority)
- Unique visual design beyond the visualizer (design pass at end)

---

## Confidence Assessment

| Feature Area | Confidence | Source |
|--------------|------------|--------|
| Velocity sensitivity (touch speed approach) | HIGH | Community consensus + `touch-velocity` npm package + GarageBand precedent |
| MIDI input via Web MIDI API | HIGH | MDN + caniuse.com — confirmed Chrome/Edge support, confirmed Safari non-support |
| Effects chain (Tone.js) | HIGH | Tone.js official docs — Reverb, FeedbackDelay, Distortion, Filter all present |
| Preset via localStorage + URL encoding | HIGH | Standard browser APIs, confirmed storage limits adequate for JSON patches |
| PWA + service worker | HIGH | Mature APIs, Workbox 2026 is stable, service worker support universal |
| WAV export via MediaRecorder | MEDIUM | Chrome records WebM by default; WAV requires polyfill or manual PCM encoding |
| Step sequencer with Tone.Sequence | HIGH | Tone.js official docs confirm `Tone.Sequence` and `Tone.Transport` |
| Gyroscope interaction | MEDIUM | DeviceOrientationEvent works in Chrome Android + iOS (with permission); jitter smoothing required |
| FM synthesis voice quality | MEDIUM | `Tone.FMSynth` exists; achieving realistic piano/organ timbre requires sound design iteration |
| AudioWorklet mobile stability | LOW | GitHub issue #2632 still open; 128-sample buffer causes mobile distortion. Tone.js abstracts this but the underlying problem persists. |

---

## Sources

- [MDN: Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
- [caniuse.com: Web MIDI API](https://caniuse.com/midi) — confirms Safari non-support
- [Tone.js: Reverb](https://tonejs.github.io/docs/14.9.17/classes/Reverb.html)
- [Tone.js: PolySynth](https://tonejs.github.io/docs/PolySynth)
- [GitHub: touch-velocity npm package](https://github.com/xcoderzach/touch-velocity)
- [MDN: DeviceMotionEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent)
- [MDN: Visualizations with Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API)
- [GitHub: audioMotion-analyzer](https://github.com/hvianna/audioMotion-analyzer)
- [GitHub: AudioWorklet disaster issue #2632](https://github.com/WebAudio/web-audio-api/issues/2632)
- [W3C: Audio latency in browser-based DAWs](https://www.w3.org/2021/03/media-production-workshop/talks/ulf-hammarqvist-audio-latency.html)
- [npm: extendable-media-recorder](https://www.npmjs.com/package/extendable-media-recorder) — WAV export polyfill
- [MDN: Offline and background operation (PWA)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
- [Smashing Magazine: Guide to designing touch keyboards](https://www.smashingmagazine.com/2013/08/guide-to-designing-touch-keyboards-with-cheat-sheet/)
- [Drumhaus](https://drumha.us/) — referenced step sequencer implementation
- [Tone.js Instruments wiki](https://github.com/Tonejs/Tone.js/wiki/Instruments)
