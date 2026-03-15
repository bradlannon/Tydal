# Sound Pad -- Technical Analysis

Source: `/Users/brad/Apps/BI/public/apps/sound-pad.html`
Single-file app (~840 lines: ~325 CSS, ~65 HTML structure, ~390 JS).

---

## 1. Audio Engine

### AudioContext Initialization
- Lazy-initialized on first interaction via `initAudio()`. Uses `window.AudioContext || window.webkitAudioContext` for Safari compat.
- Handles `suspended` state resume (Chrome autoplay policy).
- Single global `audioCtx` and `analyser` -- no teardown or lifecycle management.

### Routing Chain
All audio flows through a single path:

```
OscillatorNode / BufferSourceNode
  --> GainNode (per-voice envelope)
    --> AnalyserNode (global, fftSize=256)
      --> AudioContext.destination
```

There is **no master gain node**. The analyser doubles as the pre-destination bus. This means:
- No master volume control is possible without rewiring.
- No effects insert point exists (no reverb, delay, chorus, EQ, compressor).
- No per-channel mixing -- every voice hits the same analyser at the same level.

Exception: the metronome and count-in bypass the analyser entirely and connect directly to `audioCtx.destination`, so they are invisible to the visualizer (intentional, presumably).

### Analyser Setup
- `fftSize = 256` yields `frequencyBinCount = 128`.
- Visualizer renders 64 bars, sampling every other bin (`step = Math.floor(128/64) = 2`).
- Uses `getByteFrequencyData` (0-255 unsigned) for frequency domain display.
- Runs on `requestAnimationFrame` -- never stops once started, even when silent. No idle optimization.
- Bar height mapped linearly: `(val / 255) * 50px`. Hue shifts from 168-188 (teal range).

---

## 2. Instrument Voices

### Piano (default)
```
Oscillator type: sine
Envelope: attack 0 -> 0.5 in 10ms, decay 0.5 -> 0.0001 over 590ms
Total duration: 1.2s (osc.stop)
```
This is a pure sine tone with a fast attack and medium decay. It sounds like a tuning fork, not a piano. Real piano timbre requires:
- Multiple detuned oscillators (or sampled partials)
- Inharmonic partials in the attack transient
- Sympathetic resonance / sustain pedal modeling
- Hammer noise in the attack

### Organ
```
Oscillator type: square
Envelope: instant 0.3, ramp to 0.2 over 1.0s
Total duration: 1.2s
```
A square wave with a very slow, gentle volume reduction. This mimics a sustained organ tone loosely, but real organ synthesis (Hammond-style) requires:
- Drawbar harmonics (9 additive sine oscillators at fixed harmonic ratios)
- Key click transient
- Rotary speaker (Leslie) simulation (amplitude and frequency modulation)
- No natural decay -- organ sustains at constant level while key is held

The current implementation sounds like a buzzy synth pad, not an organ.

### Electric
```
Oscillator type: triangle
Envelope: instant 0.4, fast decay to 0.0001 over 500ms
Total duration: 1.2s
```
A triangle wave with a fast decay. Intended to sound like an electric piano (Rhodes/Wurlitzer), but real EP synthesis needs:
- FM synthesis (operator stacks) for the bell-like Rhodes tone
- Tine/tone bar modeling
- Tremolo (amplitude modulation)
- Velocity-dependent timbre (brighter at higher velocity)

### Critical Shared Limitation: Single Oscillator Per Voice
Every instrument uses exactly one `OscillatorNode`. Each note creates a brand-new oscillator+gain pair, plays it, and schedules `osc.stop()` at a fixed time. There is:
- **No note-off event** -- notes always ring for the full duration regardless of key release.
- **No key-held sustain** -- pressing and holding a key does nothing extra.
- **No polyphony management** -- unlimited simultaneous oscillators can be created. Holding multiple keys or rapid playing will stack dozens of active nodes with no voice stealing.
- **No detuning, layering, or harmonic content** beyond the single oscillator type.

---

## 3. Drum Synthesis

### Kick
- Sine oscillator, pitch sweep 150 Hz -> 30 Hz (exponential ramp, 150ms).
- Gain envelope: 1.0 -> 0.01 over 400ms.
- Reasonable approach for a basic 808-style kick. Missing: distortion/saturation, sub-bass layering, click transient.

### Snare
- White noise buffer (150ms), amplitude shaped by `Math.pow(1 - i/bufSize, 3)` (cubic decay baked into the buffer).
- Highpass filter at 2000 Hz. Gain 0.8.
- Missing: the tonal body component. Real snare = noise (snare wires) + sine/triangle body (drum head resonance). This sounds like filtered static. No tuning control.

### Hi-hat
- White noise buffer (50ms), amplitude shaped by `Math.pow(1 - i/bufSize, 6)` (very sharp decay).
- Highpass filter at 7000 Hz. Gain 0.4.
- Reasonable for a closed hi-hat. Missing: open hi-hat variant, no choke behavior (open hat cut by closed hat).

### Clap
- 3 short noise bursts (20ms each) spaced 15ms apart, each with bandpass filter at 2500 Hz.
- Each burst decays independently (gain 0.6 -> 0.01 over 80ms).
- The multi-burst approach is correct (simulates multiple hands), but the filter is static and there is no reverb tail, which is essential for a convincing clap.

### Shared Drum Issues
- All drum sounds are fire-and-forget. No velocity sensitivity.
- Noise buffers are regenerated on every hit (wasteful -- should be pre-allocated and reused).
- No sample-accurate triggering (`osc.start()` with no explicit time = "now," which means timing depends on JS call timing, not audio clock).

---

## 4. Recording / Looping

### Recording Mechanism
- `performance.now()` timestamps relative to `recordStartTime`.
- Events stored as `{ time: number, key: string }` in `recordedEvents[]` array.
- Only the key identifier is recorded -- no velocity, duration, instrument, or release event.
- When recording while looping ("overdub"), `recordStartTime` is set to align with the current loop cycle via modular arithmetic: `offset = (now - loopCycleStart) % loopLength`.

### Loop Playback
```js
function scheduleLoop() {
  loopCycleStart = performance.now();
  loopLength = recordedEvents[recordedEvents.length - 1].time || ...;
  recordedEvents.forEach(ev => {
    setTimeout(() => triggerKey(ev.key), ev.time);
  });
  loopTimer = setTimeout(scheduleLoop, loopLength);
}
```

**Timing precision problems:**
1. **`setTimeout` for musical timing is fundamentally unreliable.** `setTimeout` has ~4ms minimum resolution and can drift much more under load, tab throttling, or GC pauses. Professional Web Audio apps use `AudioContext.currentTime` scheduling with a lookahead pattern (Chris Wilson's "A Tale of Two Clocks").
2. **Loop length is derived from the last event's timestamp**, not quantized to any musical boundary. If you record 4 beats but the last note lands at 1.97 seconds, the loop is 1.97 seconds -- not 2.0 seconds (at 120 BPM). There is no bar/beat quantization.
3. **No quantization at all.** Events play back at exactly the recorded times. No snap-to-grid option, no swing, no humanize.
4. **Overdub alignment is approximate.** The modular offset calculation uses `performance.now()` which is in a different time domain than `AudioContext.currentTime`. Clock drift between the two will accumulate over multiple loop cycles.
5. **No way to set loop length independently of recorded content.** You cannot define "4 bars at 120 BPM" as a loop boundary.

### Undo System
- Deep-copies `recordedEvents` via `JSON.parse(JSON.stringify(...))` before destructive operations.
- 20-level undo stack. No redo.
- Undo only works for the event list, not for instrument/tempo/other state.

---

## 5. Step Sequencer

### Structure
- 16 steps rendered as buttons in a grid.
- Steps are **purely visual indicators**, not a true sequencer.

### Event Mapping
```js
recordedEvents.some(ev => Math.abs(ev.time - (i * 62.5)) < 62.5)
```
Each step represents a 62.5ms window. At 120 BPM, a beat = 500ms, so 16 steps = 1000ms = 2 beats. This is **hardcoded** -- changing BPM does not change the step mapping. The sequencer always shows a fixed 1-second window regardless of tempo.

### Click-to-Toggle
- Clicking a step **only removes** events in that window. There is no way to add events via the sequencer -- it is delete-only.
- The `toggleStep` function finds events near `step * 62.5` and removes them, but never inserts new ones.

### Limitations
- Not a real step sequencer: cannot add notes, cannot select which sound to place, cannot set velocity.
- Fixed to 16 steps / 1-second window regardless of tempo.
- No playback cursor / step highlight to show current position.
- No per-row instrument lanes (a real drum machine sequencer has one row per sound).
- On mobile (768px breakpoint), grid collapses to 8 columns but still has 16 steps, so rows wrap.

---

## 6. UI/UX

### Pad Layout
- 10-column grid. Row 1: Q-P (10 pads). Row 2: A-L (9 pads + 1 empty spacer). Row 3: Z-M (7 pads, 3 empty cells).
- Pads have `aspect-ratio: 1` for square shape.
- Mobile breakpoint at 640px collapses to 5 columns.

### Note Mapping
The note assignment is **not chromatic** and has significant oddities:
- Row 1 (Q-P): C4, D4, E4, F4, G4, A4, B4, C#5, D#5, F#5 -- starts diatonic in C major, then jumps to sharps at the end with gaps (skips C5, D5, E5).
- Row 2 (A-L): G3, A3, B3, C5, F4, G4, A4, B4, D5 -- starts below row 1, jumps up to C5, then goes back down to F4. Duplicates: F4 (R and G), G4 (T and H), A4 (Y and J), B4 (U and K).
- Row 3 (Z-M): Kick, Snare, Hi-Hat, Clap, F#3, G#3, A#3 -- drums then bass notes.
- Multiple notes are duplicated across rows (F4, G4, A4, B4 each appear twice). The layout does not follow any standard instrument mapping (not chromatic, not diatonic scale, not isomorphic grid).

### Keyboard Mapping
- `keydown` listener with `e.repeat` guard (prevents key-repeat triggering).
- Number keys 1-8 are control commands, not notes.
- No `keyup` handling (no note-off, no sustain).
- No visual indication of which keyboard keys map to which function (the instructions mention it but the mapping is not discoverable from the UI alone).

### Visual Feedback
- `.active` class added on pad press, removed after fixed 200ms timeout. This is cosmetic only -- does not correspond to actual sound duration.
- Status bar shows loop/recording/BPM state as text.
- No waveform display, no note indicator, no MIDI-style piano roll view.
- Radial gradient overlay on active pads (`::after` pseudo-element with `currentColor`).

### Responsiveness
- Three breakpoints: 1024px (hides search), 768px (adjusts padding, sequencer to 8-col), 640px (pads to 5-col).
- Touch support: `touchstart` with `preventDefault()` on pads only. No multi-touch handling.
- No landscape/portrait detection.

---

## 7. Gaps vs Professional Instruments

### Audio Architecture
- **No master gain / volume control** -- cannot adjust overall output level.
- **No effects chain** -- no reverb, delay, chorus, flanger, distortion, or EQ. These are table-stakes for any music production tool.
- **No compressor / limiter** -- stacking multiple voices can clip the output.
- **No per-voice or per-channel mixing** -- everything at fixed levels.
- **No stereo panning** -- all voices are mono-center.

### Synthesis Quality
- **Single oscillator per voice** -- real synthesizers use 2-3 oscillators minimum, with detuning, unison, and different waveforms layered.
- **No filter controls** -- no lowpass/highpass/bandpass with cutoff and resonance. This is the most fundamental synth parameter after oscillator type.
- **No LFO (Low Frequency Oscillator)** -- no vibrato, tremolo, filter sweeps, or any modulation.
- **No FM/AM synthesis** -- electric piano and bell sounds require frequency modulation.
- **No wavetable or sample playback** -- only basic oscillator waveforms (sine, square, triangle, sawtooth).
- **No noise generator** for tonal instruments (only used in drum synthesis).

### Performance / Expression
- **No velocity sensitivity** -- every note plays at the same volume regardless of how hard you press. No touch pressure / Force Touch support.
- **No aftertouch or pressure response.**
- **No pitch bend or mod wheel equivalent.**
- **No sustain pedal** (no concept of held notes vs released notes).
- **No legato / portamento / glide** between notes.
- **No note-off / key release tracking** -- every note plays its full envelope regardless of key state.

### Polyphony
- **No voice management** -- every keypress spawns new audio nodes with no limit. Rapid playing will create dozens of simultaneous oscillator+gain pairs.
- **No voice stealing** -- older notes are not cut when voice count is exceeded.
- **No monophonic mode option** -- cannot force single-note priority for bass/lead sounds.

### Timing & Sequencing
- **`setTimeout`-based loop playback** -- will drift, especially over long loops or when the tab is backgrounded.
- **No quantization** -- recorded notes play back at exact recorded times, not snapped to a grid.
- **No time signature support** -- no concept of bars, beats, or subdivisions.
- **No swing / shuffle** -- straight timing only.
- **Step sequencer is display-only** -- cannot add notes, only remove them.
- **Step sequencer is hardcoded to 1-second window** -- does not respond to tempo changes.
- **No multi-track recording** -- single event stream, no separation of drums/bass/melody.
- **No audio export** -- only exports raw event JSON, not WAV/MP3. Cannot share or play back outside the app.

### MIDI
- **No MIDI input support** -- cannot connect a MIDI keyboard or controller. Web MIDI API is widely supported.
- **No MIDI output** -- cannot drive external instruments or DAWs.
- **No MIDI clock sync** -- cannot sync tempo with external hardware.

### UX / Workflow
- **No preset / patch system** -- cannot save or recall instrument settings.
- **No visual piano roll or timeline view** -- no way to see or edit recorded events graphically.
- **No waveform / oscilloscope view** -- only frequency spectrum bars.
- **Note layout is non-standard and duplicated** -- confusing for anyone with musical training.
- **No octave shift** -- limited to a fixed ~2-octave range with gaps.
- **No scale lock / key constraint** -- cannot constrain pads to a specific scale for jamming.
- **No BPM tap-tempo** -- only slider and +/- 5 BPM buttons.
- **Active pad highlight is fixed 200ms** -- does not match actual sound duration.
- **No dark/light theme toggle** (though the dark pad area is fine for a music app).
- **No accessibility** -- no ARIA roles, no screen reader support, no high-contrast mode.

### Technical Debt
- All code in a single `<script>` block with no modules, no state management pattern, no separation of concerns.
- Global mutable state (`isRecording`, `isLooping`, `bpm`, `recordedEvents`, etc.) with no encapsulation.
- Noise buffers for drums are regenerated on every hit instead of being cached.
- Visualizer runs continuously via `requestAnimationFrame` with no idle detection.
- `setTimeout` IDs stored in single variables (`loopTimer`, `metronomeInterval`) -- scheduling multiple overlapping loops would overwrite the reference and leak timers.

---

## Summary: Priority Areas for Rebuild

| Area | Current State | Impact |
|------|--------------|--------|
| Audio routing | Flat chain, no master gain, no effects bus | Cannot add any effects or mixing |
| Synthesis | 1 oscillator, 3 waveform presets | Sounds nothing like real instruments |
| Note lifecycle | Fire-and-forget, no note-off | No sustain, no expression |
| Timing | setTimeout-based | Drifts, cannot quantize |
| Sequencer | Display-only, hardcoded timing | Not functional as a composition tool |
| MIDI | None | Cannot use with real controllers |
| Voice management | Unlimited spawning | Performance risk, no musical control |
| Export | JSON only | Cannot produce audio files |
