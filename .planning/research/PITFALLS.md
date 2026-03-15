# Domain Pitfalls: Browser-Based Musical Instrument

**Domain:** Browser musical instrument (Tone.js, MIDI, PWA, mobile-first touch)
**Researched:** 2026-03-15
**Sources:** Community research (reddit-research.md), Web Audio API GitHub issues, MDN documentation, Tone.js GitHub issues, Chrome developer blog

---

## Critical Pitfalls

Mistakes that cause rewrites, silent failures that only appear on mobile, or irreversible architectural lock-in.

---

### Pitfall 1: Multiple AudioContext Instances

**What goes wrong:** Creating more than one `AudioContext` silently exhausts browser resources. After roughly 50 context creations (often triggered by component remounts or re-initializations), Chrome starts throwing errors and audio output degrades unpredictably.

**Why it happens:** Developers scope context creation inside event handlers or component init functions, so each user interaction that triggers a re-init creates a fresh context without closing the old one.

**Consequences:** Crashes after extended use. Memory growth. Unreproducible bugs (works on page load, breaks after 10 minutes of playing).

**Warning signs:**
- Audio works on first load, fails after the user navigates away and back
- Chrome DevTools memory heap grows on every note trigger
- Console shows "AudioContext constructor: number of hardware contexts reached maximum" (Chrome ≥ 66)

**Prevention:**
- Create exactly one `AudioContext` (via Tone.js `getContext()`) at app bootstrap, never inside event handlers
- Store it as a module-level singleton
- If the page needs to tear down audio, call `context.close()` explicitly — do not let it go out of scope

**Phase:** Phase 1 (audio engine foundation). Get this right before building anything else on top of it.

---

### Pitfall 2: iOS Safari AudioContext Suspended / Interrupted State

**What goes wrong:** On iOS, every `AudioContext` starts in `"suspended"` state. It must be resumed inside a direct user-gesture handler (`click`, `touchstart`, `touchend`). Additionally, when the user locks their phone, switches tabs, or puts Safari in the background for ~20 seconds, the context transitions to `"interrupted"` — a distinct state from `"suspended"` that `resume()` does not reliably recover from.

**Why it happens:** Apple's WebKit policy prevents audio playback without explicit user interaction, enforced at the OS level. The `"interrupted"` state is an iOS-only extension not in the Web Audio spec, so generic `if (ctx.state === 'suspended') ctx.resume()` guards miss it entirely.

**Consequences:** Silent failure — the instrument appears to work (UI responds to touch) but produces no sound. Users on iOS will see a broken experience with no error message.

**Warning signs:**
- App works in Chrome desktop but produces no audio on iPhone
- Audio stops working after the phone is put in a pocket and taken back out
- `audioCtx.state` logs `"interrupted"` after backgrounding, and calling `resume()` does not change it back

**Prevention:**
```js
// Resume on ANY user interaction — not just the first one
document.addEventListener('touchstart', resumeAudio, { passive: true });
document.addEventListener('click', resumeAudio);

// Also listen for the statechange event to catch interruptions
audioCtx.addEventListener('statechange', () => {
  if (audioCtx.state === 'interrupted' || audioCtx.state === 'suspended') {
    resumeAudio();
  }
});

async function resumeAudio() {
  if (Tone.context.state !== 'running') {
    await Tone.start(); // Tone.js wrapper around context.resume()
  }
}
```
- Tone.js provides `Tone.start()` which wraps `context.resume()` — use it instead of calling `resume()` directly
- Show a persistent "Tap to enable audio" overlay until `context.state === 'running'`

**Phase:** Phase 1 (audio engine). Must be solved before any instrument is playable on iOS.

---

### Pitfall 3: AudioWorklet 128-Sample Buffer on Mobile (GitHub Issue #2632)

**What goes wrong:** The Web Audio API mandates a fixed 128-sample buffer size for AudioWorklet processors. At 44,100 Hz, this is ~2.9ms per block. On mobile devices — particularly Chrome on Android and all iOS browsers — this fixed, small buffer causes massive distortion, crackling, and audio degradation during any user interaction (scrolling, touch events, UI updates).

**Why it happens:** Mobile OS audio subsystems and browser scheduling cannot guarantee stable 128-sample delivery under the load of simultaneous touch event processing. The old `ScriptProcessorNode` used larger, configurable buffers (512–4096 samples) and worked reliably. AudioWorklet eliminated that control.

**Consequences:** The instrument sounds broken on mobile even though it works perfectly on desktop Chrome. This is the single most-reported mobile audio failure in the Web Audio community. There is currently no fix in the spec — the buffer size is not configurable.

**Warning signs:**
- Desktop Chrome sounds clean, mobile sounds crackly or distorted
- Distortion correlates with user interaction (touching the screen makes it worse)
- Issue appears in Tone.js instruments that internally use AudioWorklet (Reverb, certain effects)

**Prevention:**
- Prefer Tone.js effects that do NOT use AudioWorklet: `Tone.Reverb` uses OfflineAudioContext which is safer than a live AudioWorklet; verify which Tone.js nodes use AudioWorklets before adding them
- Test every effect and voice on actual iOS and Android hardware before committing to it
- For Reverb specifically, Tone.js `Reverb` generates its IR offline then uses a `ConvolverNode` — this is AudioWorklet-free and mobile-safe. Prefer this pattern.
- Avoid custom AudioWorklet code entirely in v1; stick to Tone.js built-ins that have been mobile-tested
- If distortion appears on mobile, first check which Tone.js nodes are active — the AudioWorklet-based ones are the most likely culprits

**Phase:** Phase 2 (effects chain). Validate every effect on mobile hardware before considering it complete.

---

### Pitfall 4: Click/Pop Artifacts When Starting or Stopping Oscillators

**What goes wrong:** Abruptly setting an oscillator's gain to 0 or calling `osc.stop()` while the waveform is mid-cycle creates a discontinuity in the audio signal that the output DAC renders as an audible click or pop. This is the most reliable indicator of amateur audio work — musicians notice it immediately.

**Why it happens:** The current `sound-pad.html` fires `osc.stop()` on a fixed timer with no envelope fade. Rapid note triggering during drum patterns makes this worse.

**Consequences:** Every note termination produces an audible click. Drum patterns sound like they're clipping. The instrument is immediately judged as low-quality.

**Warning signs:**
- Audible tick at the end of every note
- Worse on short notes / high BPM
- Reproducible even on desktop with good hardware

**Prevention:**
- Always ramp gain to a near-zero value before stopping: `gainNode.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.015)` then schedule `osc.stop(ctx.currentTime + 0.1)`
- Tone.js ADSR envelopes handle this automatically — use `triggerRelease()` rather than directly stopping oscillators
- Never call `osc.stop()` while the gain is non-zero
- For drum sounds: pre-bake the envelope into the gain node's automation, not into the buffer amplitude

**Phase:** Phase 1 (audio engine). Tone.js handles this for synths; manual drums need explicit care.

---

### Pitfall 5: Web MIDI API Not Available on iOS Safari (Any Browser)

**What goes wrong:** Apple has explicitly refused to implement the Web MIDI API in WebKit, citing security concerns (ability to send firmware updates to MIDI devices). Since all browsers on iOS are required to use WebKit as their engine, Web MIDI is unavailable on iOS regardless of which browser the user opens — Chrome, Firefox, and Edge on iOS all hit the same WebKit limitation.

**Why it happens:** Apple's entrenched position on this API has not changed despite years of requests. As of March 2026, there is no indication of imminent support.

**Consequences:** iOS users cannot connect MIDI keyboards or controllers, even though they represent a large portion of mobile musicians. If the app assumes MIDI is available without a graceful fallback, iOS users get a broken or confusing experience.

**Warning signs:**
- `navigator.requestMIDIAccess` is `undefined` in Mobile Safari DevTools
- Feature detection shows MIDI unavailable on any iOS device

**Prevention:**
- Wrap all MIDI code in a feature-detection guard: `if (navigator.requestMIDIAccess)`
- Show a clear, friendly message on iOS: "MIDI keyboard support requires Chrome on desktop or Android"
- Do not let MIDI initialization failure break the rest of the instrument — make it an optional enhancement layer
- The touch interface must be fully functional without MIDI on iOS

**Phase:** Phase 3 (MIDI). Design the MIDI layer as progressive enhancement from the beginning, not as a core dependency.

---

### Pitfall 6: Web MIDI API Requires HTTPS and Explicit User Permission (Chrome)

**What goes wrong:** In Chrome 129+, `navigator.requestMIDIAccess()` requires: (1) HTTPS or localhost, (2) explicit browser permission prompt acceptance by the user. On HTTP origins, the call silently fails or throws. If the app is served over HTTP during development, MIDI will appear to not exist.

**Consequences:** MIDI works in local dev (`localhost`) but may fail if deployed to an HTTP test environment. The permission prompt may confuse non-technical users. If permission is denied, there is no recovery path without the user manually resetting site permissions.

**Warning signs:**
- MIDI works at `localhost:3000` but not on a staging URL
- `requestMIDIAccess()` returns a rejected promise with `DOMException: SecurityError`

**Prevention:**
- Always serve the portfolio over HTTPS (already the case in production)
- Handle the permission denial gracefully: catch the rejected promise, show a "MIDI not permitted" message with instructions to reset site permissions
- Do not call `requestMIDIAccess()` at page load — trigger it on a user action ("Connect MIDI Device" button)

**Phase:** Phase 3 (MIDI).

---

### Pitfall 7: Passive Touch Event Listeners Block `preventDefault()`

**What goes wrong:** Chrome 56+ sets `touchstart` and `touchmove` event listeners as passive by default on `document` and `window`. Passive listeners cannot call `preventDefault()`. If the instrument tries to prevent scrolling or double-tap zoom via `preventDefault()` in a passively-registered listener, Chrome silently ignores it and logs a warning. The browser then scrolls or zooms instead of triggering the note.

**Why it happens:** Chrome changed the default to improve scroll performance on mobile. Instrument developers who learned touch handling before Chrome 56 write `addEventListener('touchstart', handler)` without `{ passive: false }` and are surprised when `preventDefault()` stops working.

**Consequences:** Playing the instrument on mobile causes the page to scroll or zoom instead of (or simultaneously with) triggering notes. Multitouch produces erratic behavior.

**Warning signs:**
- Console: "Unable to preventDefault inside passive event listener"
- Touching pads scrolls the page on Android Chrome
- Double-tapping a pad zooms the page on iOS

**Prevention:**
- Register pad touch listeners with `{ passive: false }` explicitly when `preventDefault()` is needed
- Apply `touch-action: manipulation` via CSS to all interactive pad/button elements — this disables double-tap zoom without JavaScript and removes the 300ms click delay
- Apply `touch-action: none` to the pad grid container if you need to fully prevent default scroll behavior
- iOS Safari only supports `auto` and `manipulation` for `touch-action`; use `manipulation` for maximum compatibility

**Phase:** Phase 1 (touch input). Apply CSS `touch-action: manipulation` globally to pad elements from the first commit.

---

### Pitfall 8: `setTimeout`-Based Musical Timing Drift

**What goes wrong:** `setTimeout` has a minimum resolution of ~4ms and is subject to throttling, garbage collection pauses, and tab backgrounding. Loops built on `setTimeout` drift by tens of milliseconds per bar, which becomes perceptible rhythm error within 4-8 bars. The current `sound-pad.html` uses this approach for its loop playback.

**Why it happens:** It's the intuitive way to schedule recurring events in JS. The Web Audio API's `AudioContext.currentTime` is the correct alternative, but it's less familiar.

**Consequences:** Recorded loops drift out of time. Drum patterns feel "slippery." At higher BPMs the timing errors compound faster.

**Prevention:**
- Use `Tone.js Transport` exclusively for all time-based scheduling — it uses `AudioContext.currentTime` with a lookahead scheduler (Chris Wilson's two-clock pattern)
- Never use `setTimeout`, `setInterval`, or `requestAnimationFrame` to trigger notes or advance the sequencer
- `performance.now()` is acceptable for recording event timestamps, but convert to `AudioContext.currentTime` coordinates before scheduling playback

**Phase:** Phase 1 (audio engine). Using Tone.js as the foundation automatically avoids this if the Transport is used consistently.

---

## Moderate Pitfalls

---

### Pitfall 9: Tone.js CDN Import Without Import Maps (No-Build System)

**What goes wrong:** Tone.js 15.x uses `"type": "module"` and ESM-only exports. Importing it from a CDN via `<script type="module">` works, but Tone.js has internal relative imports between its own modules. A bare CDN URL like `import * as Tone from 'https://cdn.jsdelivr.net/npm/tone'` works with jsDelivr's ESM endpoint (`esm.run`) but NOT with the raw npm package URL, which returns CommonJS or requires a bundler.

**Consequences:** The entire Tone.js import fails silently in the browser, with a CORS or MIME type error in the console. The instrument produces no sound with no obvious error to the user.

**Warning signs:**
- Console: "Failed to resolve module specifier" or "The server responded with a non-JavaScript MIME type"
- `Tone` is `undefined` at runtime despite the import statement

**Prevention:**
- Use jsDelivr's ESM endpoint specifically: `import * as Tone from 'https://cdn.jsdelivr.net/npm/tone@15/+esm'`
- The `+esm` suffix on jsDelivr serves a properly transpiled ESM bundle
- Alternative: `https://esm.sh/tone@15` which also produces a valid browser ESM bundle
- Verify the CDN URL in a bare HTML file before writing application code around it
- Pin to a specific minor version (e.g., `tone@15.0.4`) not `tone@latest` to prevent breaking changes from auto-upgrading

**Phase:** Phase 1 (project setup). Validate the import before writing any Tone.js code.

---

### Pitfall 10: AudioWorklet Module MIME Type / Cross-Origin Failure in PWA

**What goes wrong:** `audioWorklet.addModule(url)` requires the script to be served with `application/javascript` MIME type AND be same-origin (or served with appropriate CORS headers). When a PWA service worker intercepts the request and returns a cached response with incorrect headers, or when a CDN serves the AudioWorklet module cross-origin without CORS, the `addModule()` call throws a `DOMException` and the AudioWorklet fails silently.

**Consequences:** Effects or instruments that use AudioWorklets (some Tone.js effects) stop working offline in the PWA, even though the service worker thinks everything is cached.

**Warning signs:**
- Instrument works online, specific effects break offline
- Console: "DOMException: Failed to execute 'addModule' on 'Worklet': Failed to load 'https://...'"
- Effects work in Chrome desktop but fail after PWA install

**Prevention:**
- Cache AudioWorklet module scripts explicitly in the service worker with `Cache-First` strategy, ensuring the cached response preserves the `Content-Type: application/javascript` header
- Prefer Tone.js effects that do not use AudioWorklet (see Pitfall 3)
- If using a CDN for Tone.js, ensure the CDN sets `Access-Control-Allow-Origin: *` (jsDelivr and esm.sh do; raw CDN URLs may not)

**Phase:** Phase 5 (PWA). Test offline functionality explicitly, don't assume caching works.

---

### Pitfall 11: WAV Export Requires Manual PCM Assembly — MediaRecorder Does Not Produce WAV

**What goes wrong:** `MediaRecorder` in Chrome records to WebM/Opus by default. Specifying `mimeType: 'audio/wav'` is ignored — the browser records WebM anyway. Firefox records to OGG. Neither produces a WAV file natively. Developers who expect WAV export to be a two-line `MediaRecorder` task discover this only after implementing the recording pipeline.

**Consequences:** The WAV export feature requires a manual PCM encoder (writing file headers, converting Float32Array samples to 16-bit PCM integers). This is 50-100 lines of non-trivial binary data manipulation.

**Prevention:**
- Plan WAV export as a custom implementation: tap into the Web Audio render graph via `ScriptProcessorNode` or `AudioWorklet` to collect raw PCM samples, then assemble the WAV file manually with correct RIFF/fmt/data headers
- Alternatively, use `OfflineAudioContext` to re-render the recorded event timeline at high quality and export that render
- Do not attempt to use MediaRecorder for WAV output — it will not produce WAV regardless of the MIME type argument

**Phase:** Phase 4 (recording/export). Budget extra implementation time for this feature.

---

### Pitfall 12: Velocity Sensitivity via Touch Speed — Not Touch Pressure

**What goes wrong:** Most touchscreens do not report pressure (`Touch.force` is 0 or 1 on non-Force-Touch devices). Developers who plan "velocity = pressure" discover this works only on iPhone 6s+ with 3D Touch or iPad Pro with Apple Pencil. On all Android devices and most iOS devices, pressure is unavailable. The result is every note plays at the same velocity despite the implementation effort.

**Consequences:** Velocity sensitivity is the most-cited differentiator between "toy" and "instrument" (per reddit-research.md). Implementing it incorrectly means the feature appears in the UI but has no musical effect for most users.

**Prevention:**
- Implement velocity as **touch speed**: measure the time delta between `touchstart` and when the finger has moved at least N pixels, or use the speed at which the touch point approaches the pad center
- GarageBand's approach: velocity = `1 - (duration from contact until full pressure / threshold)` where "full pressure" is estimated from the area of the touch contact point (`Touch.radiusX/Y`)
- `Touch.force` can be used as a bonus input on devices that support it (Force Touch iPhones), but must not be the primary mechanism
- Test velocity sensitivity with actual finger taps at different speeds on a real device

**Phase:** Phase 2 (touch input / expression). Design velocity measurement before building the polyphony layer.

---

### Pitfall 13: Gyroscope / DeviceMotion Permission Requires Explicit User Gesture on iOS 13+

**What goes wrong:** The PROJECT.md lists gyroscope/tilt for pitch bend as a feature. Since iOS 13, Safari requires `DeviceMotionEvent.requestPermission()` to be called inside a direct user gesture handler. This returns a Promise that resolves to `'granted'` or `'denied'`. Calling it at page load, from a timeout, or from a non-gesture handler causes a silent denial.

**Consequences:** The gyroscope feature appears to work (no errors thrown) but the `devicemotion` event never fires on iOS.

**Warning signs:**
- `DeviceMotionEvent.requestPermission` is a function on iOS 13+ — check for its existence
- On non-iOS and older iOS, `DeviceMotionEvent.requestPermission` is `undefined` (the event fires without permission)

**Prevention:**
```js
async function requestGyro() {
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    const state = await DeviceMotionEvent.requestPermission();
    if (state !== 'granted') return;
  }
  window.addEventListener('devicemotion', handleMotion);
}
// Call requestGyro() only from a button click/touch handler
```
- Separate permission requests for `DeviceMotionEvent` and `DeviceOrientationEvent` — one permission does not cover both
- Requires HTTPS (already satisfied by the portfolio's production server)
- Cache the granted state in localStorage so users are not prompted every visit

**Phase:** Phase 2 (unique interaction layer). Address at the start of that feature, not as an afterthought.

---

### Pitfall 14: Polyphony Without Voice Stealing Crashes Mobile Performance

**What goes wrong:** Without voice stealing, rapid note playing (fast arpeggios, chord slams, drum patterns) spawns unbounded Web Audio nodes. Each `OscillatorNode` + envelope `GainNode` pair consumes CPU even after the audible sound has decayed. The current `sound-pad.html` has exactly this problem. On desktop it degrades gracefully; on mobile it causes audio engine stuttering within seconds of rapid playing.

**Consequences:** The instrument performs well in a demo (single notes) but breaks in real playing conditions (chords, fast runs).

**Warning signs:**
- CPU usage climbs over time without recovering
- Chrome Task Manager shows audio process growing during rapid playing
- Slow performance on mobile only after 30+ seconds of playing

**Prevention:**
- Use `Tone.PolySynth` which has built-in voice management with `maxPolyphony` option (default: 32 voices, recommend 8-16 for mobile)
- Set a lower `maxPolyphony` for mobile: detect `navigator.maxTouchPoints > 1` as a mobile heuristic and halve the voice count
- Implement "oldest voice" stealing: when at voice limit, find the voice that has been playing longest and trigger its release before starting the new note
- Always call `triggerRelease()` on `touchend`/`keyup` — do not rely on envelope decay alone to free voices

**Phase:** Phase 2 (synthesis). Implement voice management before adding polyphony-heavy features like chords and sequencer.

---

## Minor Pitfalls

---

### Pitfall 15: Tone.js `PolySynth` with `FMSynth` Causes Firefox Performance Issues

**What goes wrong:** `FMSynth` with multiple voices in `PolySynth` has documented performance problems in Firefox (Tone.js GitHub issue #427). At 8+ voices it can cause audio stuttering on Firefox.

**Prevention:** If FM synthesis voices are required for piano/electric piano, test specifically on Firefox with 8 voices active. Reduce `maxPolyphony` to 4-6 for `FMSynth`-based presets.

**Phase:** Phase 2 (FM synthesis presets).

---

### Pitfall 16: PWA Audio Caching — Range Requests Break Service Worker Cache

**What goes wrong:** Service workers intercept all fetch requests. Audio files fetched via HTML `<audio>` tags use HTTP range requests (requesting specific byte ranges to enable seeking). The Fetch API in service workers does not natively support responding to range requests from a cached full file — the browser expects `206 Partial Content` but gets `200 OK` from the cache, which some browsers reject.

**Why this matters for SoundForge:** If audio samples (impulse responses for reverb, or any audio assets) are loaded via `fetch()` and cached by the service worker, they may fail to load offline if the browser makes a range request.

**Prevention:**
- Use `fetch()` to load audio assets into `AudioBuffer` via `ArrayBuffer` — do not use `<audio>` tags for instrument assets
- Service workers can handle `fetch()` requests to cache full ArrayBuffer responses without range request complications
- For Workbox: use `CacheFirst` strategy for audio assets, and explicitly handle range requests if needed (Workbox has a `rangeRequests` plugin)

**Phase:** Phase 5 (PWA).

---

### Pitfall 17: Visualizer `requestAnimationFrame` Loop Preventing Mobile Sleep / Battery Drain

**What goes wrong:** The current `sound-pad.html` runs its visualizer via `requestAnimationFrame` continuously, even when the instrument is silent. On mobile, this prevents the device from entering a low-power state while the app is open, draining the battery.

**Prevention:**
- Stop the rAF loop when the instrument is silent (track whether any notes are active)
- Resume the loop on the first note trigger
- Use a simple `isActive` flag: if no notes have played in 3 seconds, cancel the animation frame

**Phase:** Phase 3 (visualizer).

---

### Pitfall 18: Tone.js Version Lock-in via CDN — Breaking Changes in Minor Versions

**What goes wrong:** Tone.js has introduced breaking changes between minor versions (e.g., the move to ESM-only in v15, the single `addAudioWorkletModule` restriction). If the CDN URL uses `@latest` or an unpinned version, a Tone.js update can break the instrument without any code change.

**Prevention:**
- Pin to a specific patch version: `https://cdn.jsdelivr.net/npm/tone@15.0.4/+esm`
- Check the Tone.js CHANGELOG before upgrading versions
- Consider vendoring the built file into the repository for production stability

**Phase:** Phase 1 (project setup).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Audio engine bootstrap | Multiple AudioContext instances | Singleton pattern, module-level init |
| iOS audio unlock | Suspended / interrupted state not handled | `Tone.start()` on every interaction + `statechange` listener |
| Effects chain | AudioWorklet 128-sample mobile distortion | Test each effect on real iOS/Android before shipping |
| Touch input | Passive listener `preventDefault` failure | `{ passive: false }` + CSS `touch-action: manipulation` |
| Velocity sensitivity | Pressure unavailable on most touchscreens | Implement as touch speed, not force |
| MIDI integration | iOS has no Web MIDI support | Feature-detect, graceful fallback, show friendly message |
| MIDI permissions | HTTP fails, permission denial breaks MIDI | HTTPS required; trigger prompt on user action |
| Polyphony | Unbounded node spawning on mobile | Tone.PolySynth with maxPolyphony cap |
| Gyroscope interaction | iOS 13+ permission requirement | `DeviceMotionEvent.requestPermission()` in gesture handler |
| WAV export | MediaRecorder does not produce WAV | Custom PCM encoder required |
| Visualizer | Continuous rAF drains battery on mobile | Idle-detect and pause the loop |
| PWA caching | Audio range requests break service worker | Cache as ArrayBuffer via fetch(), not via audio element |
| CDN imports | Tone.js ESM import requires `+esm` suffix | Pin version, use jsDelivr esm.run endpoint |
| FM synthesis | FMSynth + PolySynth = Firefox performance issue | Test on Firefox, reduce maxPolyphony for FM voices |

---

## Sources

- GitHub: [AudioWorklet is a real world disaster (Issue #2632)](https://github.com/WebAudio/web-audio-api/issues/2632) — HIGH confidence, first-party spec repo
- GitHub: [AudioContext stuck on "interrupted" in Safari (Issue #2585)](https://github.com/WebAudio/web-audio-api/issues/2585) — HIGH confidence
- MDN: [BaseAudioContext state property](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state) — HIGH confidence
- Chrome Developers: [Web MIDI Permission Prompt](https://developer.chrome.com/blog/web-midi-permission-prompt) — HIGH confidence
- MDN: [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) — HIGH confidence
- MDN: [Touch events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events) — HIGH confidence
- Chrome Lighthouse: [Passive event listeners for scroll performance](https://developer.chrome.com/docs/lighthouse/best-practices/uses-passive-event-listeners) — HIGH confidence
- Tone.js GitHub: [Sound crackling on iOS (Issue #558)](https://github.com/Tonejs/Tone.js/issues/558) — MEDIUM confidence
- Tone.js GitHub: [FMSynth performance in Firefox (Issue #427)](https://github.com/Tonejs/Tone.js/issues/427) — MEDIUM confidence
- jsDelivr: [esm.run CDN for ES Modules](https://www.jsdelivr.com/esm) — HIGH confidence
- Medium: [How to Request DeviceMotion Permission in iOS 13](https://leemartin.dev/how-to-request-device-motion-and-orientation-permission-in-ios-13-74fc9d6cd140) — MEDIUM confidence
- Internal: `.planning/reddit-research.md` — MEDIUM confidence (community aggregation)
- Internal: `.planning/current-app-analysis.md` — HIGH confidence (direct code analysis)
- Mozilla Bugzilla: [Support WAV format for MediaRecorder](https://bugzilla.mozilla.org/show_bug.cgi?id=1379241) — HIGH confidence
