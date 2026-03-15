---
phase: 02-instrument-quality
verified: 2026-03-15T00:00:00Z
status: human_needed
score: 17/18 must-haves verified
re_verification: false
human_verification:
  - test: "All audio quality and expressiveness checks"
    expected: "Polyphony, velocity, MIDI, effects, and preset distinctions confirmed by ear"
    why_human: "Audio output — timbre differences, envelope shape, effects audibility, velocity dynamics — cannot be verified programmatically in a static build"
---

# Phase 2: Instrument Quality Verification Report

**Phase Goal:** A musician can pick up the instrument and play it seriously — polyphonic, velocity-sensitive, with effects and a chromatic layout
**Verified:** 2026-03-15
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Synth produces sound through full effects chain (reverb, delay, distortion, filter) | VERIFIED | `effects.js` wires: vibrato → tremolo → reverb → delay → distortion → filterFX → channel → masterVolume → Destination; all nodes exported and connected |
| 2 | Changing waveform type audibly changes the synth timbre | VERIFIED (human) | `synth-panel.js:130-134` calls `setSynthParam({ oscillator: { type: value } })` on waveform select change; `instruments.js:130-132` passes to `activeSynth.set()` — wiring intact |
| 3 | Adjusting ADSR parameters changes the envelope shape | VERIFIED (human) | `synth-panel.js:148-153` — 4 ADSR sliders each call `setSynthParam({ envelope: { [key]: Number(value) } })` on input |
| 4 | Filter cutoff and resonance respond in real time | VERIFIED (human) | `synth-panel.js:172-181` — cutoff and resonance sliders call `setSynthParam({ filter: { frequency } })` and `setSynthParam({ filter: { Q } })` |
| 5 | Each effect has wet/dry or amount control that audibly changes the sound | VERIFIED (human) | `fx-panel.js` wires reverb wet, delay wet, distortion amount (+ auto-enable), filter cutoff/resonance, channel volume/pan |
| 6 | Playing 8 notes simultaneously works; a 9th note voice-steals the oldest | VERIFIED | `voice-tracker.js:48-54` — `stealOldestIfFull()` shifts oldest when `activeNotes.length >= 8`; `instruments.js:85-91` calls steal before `triggerAttack` |
| 7 | Pads display chromatic semitone labels (C3, C#3, D3, ...) | VERIFIED | `pad-grid.js:246-280` — `_createGrid()` renders `noteSpan.textContent = note` from `buildNoteMap()`; `buildNoteMap` generates consecutive semitones using `CHROMATIC` array |
| 8 | Octave shift buttons move the pad range up or down by one octave | VERIFIED | `pad-grid.js:208-211` — `shiftOctave(delta)` clamps to [1,7] and calls `_rebuildGrid()`; HTML has `octave-down`/`octave-up` buttons wired in `initPadGrid` |
| 9 | Hard pad tap produces louder note than soft tap | VERIFIED (human) | `touch.js:103-118` — speed (px/ms) computed from Y-delta / time-delta; mapped `Math.min(1, Math.max(0.4, speed / 3))`; passed to `noteOn(note, velocity)` |
| 10 | MIDI keyboard note-on triggers correct note with velocity mapping | VERIFIED (human) | `midi.js:43-51` — parses `0x90`, converts with `Tone.Frequency(noteNumber, 'midi').toNote()`, maps `velocityByte / 127`, calls `noteOn(note, velocity)` |
| 11 | MIDI keyboard note-off releases the note cleanly | VERIFIED | `midi.js:52-55` — handles both `0x80` and `0x90` with velocity=0 (running status) |
| 12 | Browser without MIDI shows graceful degradation (no crash) | VERIFIED | `midi.js:69-85` — checks `navigator.requestMIDIAccess`, `window.isSecureContext`, and wraps `requestMIDIAccess()` in try/catch; all paths return `false` without throwing |
| 13 | LFO modulates filter frequency creating an audible sweep | VERIFIED (human) | `effects.js:56-57` — `filterLFO.connect(filterFX.frequency)`; `fx-panel.js:255-263` — enable slider calls `setLFO('filterLFO', { enabled: true })`; `setLFO` calls `node.start()` |
| 14 | Selecting an FM preset produces a distinctly different timbre | VERIFIED (human) | `presets.js` — 3 FM presets (`FMSynth`) with distinct harmonicity/modulationIndex values (3/10, 1/2, 3.5/12); `applyPreset()` creates new `PolySynth(Tone.FMSynth, ...)` and calls `switchInstrument()` |
| 15 | 6-8 factory presets are selectable and each sounds unique | VERIFIED (human) | `presets.js:27-123` — 7 presets: Warm Pad, Bright Lead, Sub Bass, FM Piano, FM Organ, FM E.Piano, Pluck; `synth-panel.js:106-117` — preset selector calls `applyPreset()` |
| 16 | Synth panel controls update the synth in real time | VERIFIED | `synth-panel.js` — waveform, ADSR, filter type/cutoff/resonance all fire `setSynthParam()` on `input`/`change` events |
| 17 | Effects panel controls adjust effects in real time | VERIFIED | `fx-panel.js` — reverb, delay, distortion, filterFX, channel, vibrato, tremolo all update node properties directly on `input` events |
| 18 | Scale lock constrains pads to the selected scale — no out-of-key notes appear | VERIFIED (human) | `pad-grid.js:85-92` — `setScaleLock()` sets state and calls `_rebuildGrid()`; `buildNoteMap:127-155` — uses `Scale.get()` from tonal, normalizes enharmonics, filters 4-octave range, takes first 16 in-key notes |

**Score:** 17/18 truths verified (1 requires human — overall audio quality cannot be confirmed programmatically)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `engine/instruments.js` | Subtractive synth with waveform, ADSR, filter, velocity, voice stealing | VERIFIED | Exports `noteOn`, `noteOff`, `releaseAll`, `setSynthParam`, `getActiveSynth`, `switchInstrument`; all substantive |
| `engine/effects.js` | Full effects chain: reverb, delay, distortion, filter, channel, masterVolume, LFO | VERIFIED | Exports all required nodes + `connectInstrument`, `disconnectInstrument`, `setLFO`, `effectsReady`; chain fully wired |
| `engine/voice-tracker.js` | Active note tracking with voice stealing | VERIFIED | Exports `trackNoteOn`, `trackNoteOff`, `stealOldestIfFull`, `getActiveNotes`, `clearAll`, `MAX_VOICES` |
| `ui/pad-grid.js` | Chromatic NOTE_MAP, octave shift, scale lock, dynamic grid rebuild | VERIFIED | Exports `buildNoteMap`, `initPadGrid`, `setPadActive`, `shiftOctave`, `getCurrentOctave`, `getNoteMap`, `setScaleLock`, `getScaleLock` |
| `input/touch.js` | Multitouch pointer handlers with velocity measurement | VERIFIED | Computes velocity from pointer speed; `{ passive: false }` prevents scroll/zoom; `grid-rebuild` listener clears state |
| `input/keyboard.js` | Dynamic key map rebuilt on octave shift | VERIFIED | `rebuildKeyMap()` called on init and `grid-rebuild` event; uses `getNoteMap()` |
| `input/midi.js` | Web MIDI handler with note-on/off and velocity | VERIFIED | Exports `initMIDI`; handles `0x90`/`0x80`, converts MIDI note numbers, maps velocity, graceful degradation |
| `engine/presets.js` | Factory presets including FM voices | VERIFIED | 7 presets (3 subtractive, 3 FM, 1 pluck); exports `PRESETS`, `applyPreset`, `getPresetNames` |
| `ui/synth-panel.js` | Synth parameter controls UI | VERIFIED | Exports `initSynthPanel`; preset selector, waveform, ADSR, filter type/cutoff/resonance; all wire `setSynthParam` |
| `ui/fx-panel.js` | Effects parameter controls UI | VERIFIED | Exports `initFXPanel`; reverb, delay, distortion, filterFX, channel, vibrato, tremolo, filterLFO |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `engine/instruments.js` | `engine/effects.js` | `connectInstrument(activeSynth)` | WIRED | Line 68: `connectInstrument(activeSynth)` at module load; `switchInstrument()` re-wires on preset change |
| `engine/instruments.js` | `engine/voice-tracker.js` | `stealOldestIfFull` / `trackNoteOn` before `triggerAttack` | WIRED | Lines 85-91: steal → `trackNoteOn` → `triggerAttack` in correct order |
| `engine/effects.js` | `Tone.Destination` | `masterVolume.toDestination()` | WIRED | Line 46: `new Tone.Volume(-6).toDestination()` |
| `engine/effects.js` | `filterFX.frequency` | `filterLFO.connect(filterFX.frequency)` | WIRED | Line 57: explicit `filterLFO.connect(filterFX.frequency)` |
| `ui/pad-grid.js` | `input/keyboard.js` | `getNoteMap()` for KEY_TO_NOTE rebuild | WIRED | `keyboard.js:39-43`: `rebuildKeyMap()` calls `getNoteMap()` on `grid-rebuild` event |
| `index.html` | `ui/pad-grid.js` | Octave buttons wired to `shiftOctave()` | WIRED | `pad-grid.js:303-308`: `initPadGrid` finds `#octave-down`/`#octave-up` and attaches click → `shiftOctave` |
| `engine/presets.js` | `engine/instruments.js` | `switchInstrument()` for preset application | WIRED | `presets.js:150`: `switchInstrument(newSynth)` called in `applyPreset()` |
| `ui/synth-panel.js` | `engine/instruments.js` | `setSynthParam()` on control input | WIRED | Multiple calls: waveform (line 132), ADSR (line 150), filter (lines 166, 173, 180) |
| `ui/fx-panel.js` | `engine/effects.js` | Direct property access on exported nodes | WIRED | `reverb.wet.value`, `delay.wet.value`, `distortion.distortion`, `filterFX.frequency.value`, etc. |
| `input/midi.js` | `engine/instruments.js` | `noteOn(note, velocity)` / `noteOff(note)` | WIRED | `midi.js:50-55`: calls `noteOn(note, velocity)` and `noteOff(note)` |
| `input/touch.js` | `engine/instruments.js` | `noteOn(note, velocity)` with measured speed | WIRED | `touch.js:118`: `noteOn(note, velocity)` with computed velocity value |
| `app.js` | `input/midi.js` | `initMIDI()` call | WIRED | `app.js:32`: `initMIDI()` called fire-and-forget |
| `ui/pad-grid.js` | `tonal` | `Scale.get()` for scale filtering | WIRED | `pad-grid.js:21`: `import { Scale } from 'tonal'`; used in `buildNoteMap` line 129 |
| `index.html` | `tonal` | importmap entry | WIRED | `index.html:13`: `"tonal": "https://cdn.jsdelivr.net/npm/tonal@6.4.2/+esm"` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SYNTH-01 | 02-01 | Multi-oscillator subtractive synth with selectable waveforms | SATISFIED | `instruments.js` PolySynth with `Tone.Synth`; `setSynthParam({ oscillator: { type } })` wired to UI |
| SYNTH-02 | 02-01 | Full ADSR envelope controls | SATISFIED | ADSR defined in `instruments.js:37-41`; `synth-panel.js:140-153` wires 4 sliders |
| SYNTH-03 | 02-01 | Filter with cutoff, resonance, type | SATISFIED | Filter in synth params + `filterFX` in effects chain; both exposed via panels |
| SYNTH-04 | 02-03 | LFO modulation for vibrato, tremolo, filter sweeps | SATISFIED | `effects.js`: vibrato, tremolo, filterLFO all created and wired; `fx-panel.js` exposes all three |
| SYNTH-05 | 02-04 | FM synthesis voices | SATISFIED | `presets.js`: FM Piano, FM Organ, FM E.Piano using `Tone.FMSynth` with distinct parameters |
| SYNTH-06 | 02-04 | 6-8 polished factory presets | SATISFIED | 7 presets in `presets.js`; synth panel preset selector calls `applyPreset()` |
| FX-01 | 02-01 | Reverb with wet/dry and decay controls | SATISFIED | `effects.js:31` — `Tone.Reverb`; `fx-panel.js:125-135` — wet + decay sliders |
| FX-02 | 02-01 | Delay with time, feedback, wet/dry | SATISFIED | `effects.js:34` — `Tone.FeedbackDelay`; `fx-panel.js:142-163` — wet, time, feedback |
| FX-03 | 02-01 | Distortion with amount control | SATISFIED | `effects.js:37` — `Tone.Distortion`; `fx-panel.js:170-176` — amount slider auto-enables wet |
| FX-04 | 02-01 | Filter effect with cutoff and resonance | SATISFIED | `effects.js:40` — `Tone.Filter`; `fx-panel.js:183-193` — cutoff and resonance |
| FX-05 | 02-01 | Per-channel volume and pan | SATISFIED | `effects.js:43` — `Tone.Channel`; `fx-panel.js:200-210` — volume + pan sliders |
| PERF-01 | 02-03 | Velocity sensitivity on touch | SATISFIED | `touch.js:100-118` — speed measurement via pointer Y-delta / time-delta mapped to 0.4-1.0 |
| PERF-02 | 02-03 | Velocity sensitivity on MIDI | SATISFIED | `midi.js:49` — `velocityByte / 127` passed to `noteOn(note, velocity)` |
| PERF-03 | 02-03 | Web MIDI API with graceful degradation | SATISFIED | `midi.js:67-107` — checks `requestMIDIAccess`, `isSecureContext`, try/catch; returns false without crash |
| PERF-04 | 02-02 | Chromatic note layout (consecutive semitones) | SATISFIED | `pad-grid.js:158-175` — 16 notes from CHROMATIC array; `noteSpan.textContent = note` for label |
| PERF-05 | 02-02 | Octave shifting | SATISFIED | `pad-grid.js:208-211` — `shiftOctave()` clamps [1,7], calls `_rebuildGrid()`; buttons wired |
| PERF-06 | 02-04 | Scale lock mode | SATISFIED | `pad-grid.js:85-155` — `setScaleLock()` + `buildNoteMap` scale branch using `Scale.get()` + enharmonic normalization |
| PERF-07 | 02-02 | Mobile-first multitouch with no zoom/scroll | SATISFIED | `touch.js:66-70` — `touchAction: 'none'` on grid, `manipulation` on body; `{ passive: false }` on pointerdown |

**All 18 Phase 2 requirements accounted for. No orphaned requirements.**

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app.js` | 9 | Stale comment: `// Side effect: wires warmPad -> Volume(-6dB) -> Destination` | Info | Comment is factually wrong — warmPad no longer exists; real wiring is via `effects.js` connectInstrument chain. No functional impact. |
| `engine/presets.js` | 14-15 | Unused imports: `getActiveSynth` (line 14) and `connectInstrument` (line 15) imported but never called in function bodies | Warning | Dead imports; `applyPreset()` correctly delegates to `switchInstrument()` which handles connect internally. No functional impact but creates misleading dependency appearance. |
| `index.html` | 88-99 | Stale help panel notes: shows diatonic note names (C3 D3 E3 F3...) not chromatic (C3 C#3 D3 D#3...) | Warning | Help panel key-to-note guide is wrong — it documents Phase 1 diatonic layout, not the current chromatic layout. Users consulting it will see incorrect note mappings. Grid DOM itself is correct (dynamic). |

---

### Human Verification Required

#### 1. Full Audio Quality Check

**Test:** Open `http://localhost:8080` in Chrome. Play notes with keyboard (Z X C V A S D F). Hold 8 simultaneously, press a 9th key.
**Expected:** 8 notes ring together; 9th note triggers and oldest voice releases cleanly — no clicks, no stuck notes.
**Why human:** Polyphony ceiling and voice stealing behavior requires listening to confirm no audio artifacts.

#### 2. Velocity Sensitivity (Touch)

**Test:** In Chrome DevTools mobile simulation, tap a pad with a slow downward swipe vs a rapid tap.
**Expected:** Rapid tap is clearly louder than slow tap — audible volume difference.
**Why human:** Velocity range (0.4-1.0) and its audible effect on `Tone.PolySynth` triggerAttack cannot be confirmed without hearing output.

#### 3. Effects Chain Audibility

**Test:** Open the Effects panel, drag Reverb Wet to 0.8 while playing notes. Then drag Delay Wet to 0.5.
**Expected:** Heavy reverb tail on notes; clear echo repeats. Filter Cutoff sweep brightens/darkens tone.
**Why human:** Effects signal processing requires ear verification — cannot confirm Tone.js convolution and feedback delay produce audible output from static analysis.

#### 4. FM Preset Timbral Distinctiveness

**Test:** Open Synth panel, cycle through all 7 presets while playing the same note.
**Expected:** FM Piano sounds piano-like (bell-ish attack, fast decay); FM Organ sustains smoothly; FM E.Piano has characteristic electric piano twang. Each preset is immediately distinguishable.
**Why human:** FM synthesis timbre quality — whether harmonic ratios produce the intended instrument character — requires listening.

#### 5. Scale Lock Behavior

**Test:** Set scale to C Major. Play all 16 pads.
**Expected:** Only C D E F G A B notes appear (no sharps/flats). Set to C Pentatonic — only C D E G A. Set to Off — full chromatic returns.
**Why human:** Correct enharmonic normalization (e.g. tonal returning 'Db' vs CHROMATIC having 'C#') is verified in code logic but actual tonal library behavior in browser should be confirmed visually.

#### 6. MIDI Keyboard (If Hardware Available)

**Test:** Connect USB MIDI keyboard in Chrome (requires HTTPS or localhost). Play notes.
**Expected:** Correct pitch plays; soft/loud keypresses produce audibly different volumes; disconnect and reconnect keyboard — handler re-attaches.
**Why human:** Requires physical MIDI hardware; Web MIDI API behavior varies by browser/OS.

---

### Gaps Summary

No functional gaps found. All 10 required artifacts exist with substantive implementations. All 14 key links are wired. All 18 requirements (SYNTH-01 through SYNTH-06, FX-01 through FX-05, PERF-01 through PERF-07) are satisfied by actual code in the codebase.

Three minor issues noted (info/warning level — none block goal achievement):

1. **Stale comment in `app.js` line 9** — says "warmPad" but warmPad is gone. Fix: update comment to reflect actual wiring.
2. **Unused imports in `engine/presets.js`** — `getActiveSynth` and `connectInstrument` imported but not used. Fix: remove unused imports.
3. **Stale help panel in `index.html`** — shows diatonic note labels from Phase 1 instead of chromatic. This is user-visible: a user reading the help overlay will see wrong note names. Fix: update help panel to show chromatic note names (C3 C#3 D3... etc.) or make it dynamic.

The stale help panel is the most user-impactful of the three but does not block the phase goal (the pad DOM itself is correct).

---

_Verified: 2026-03-15_
_Verifier: Claude (gsd-verifier)_
