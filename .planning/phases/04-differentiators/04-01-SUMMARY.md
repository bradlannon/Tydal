---
phase: 04-differentiators
plan: "01"
subsystem: visualizer
tags: [canvas, web-audio, analyser, visualizer, real-time]
dependency_graph:
  requires: [engine/effects.js (masterVolume)]
  provides: [engine/visualizer.js, ui/visualizer-ui.js]
  affects: [app.js, index.html, styles.css]
tech_stack:
  added: [AnalyserNode (raw Web Audio API), zero-crossing rate pitch detection]
  patterns: [fan-out tap on masterVolume, requestAnimationFrame render loop, ring buffer RMS]
key_files:
  created:
    - engine/visualizer.js
    - ui/visualizer-ui.js
  modified:
    - index.html
    - styles.css
    - app.js
decisions:
  - "AnalyserNode created via Tone.getContext().rawContext.createAnalyser() to access raw Web Audio API"
  - "masterVolume fan-out tap: masterVolume.connect(analyserNode) adds a listener without inserting into chain"
  - "Transient detection: rolling RMS ring buffer (10 frames), threshold 1.8x average — avoids false positives on sustained notes"
  - "Pitch estimation: zero-crossing rate on time-domain data; maps C2(65Hz)=hue:0 through C6(1046Hz)=hue:300"
  - "Glow decay: 0.05/frame at 60fps = ~150ms fade from peak; snap-up on transient detection avoids missed frames"
  - "Canvas width set via containerEl.clientWidth at init and on window resize — avoids stretched rendering"
metrics:
  duration: "99 seconds"
  completed: "2026-03-15"
  tasks_completed: 1
  files_created: 2
  files_modified: 3
---

# Phase 4 Plan 1: Real-Time Audio Visualizer Summary

**One-liner:** Canvas visualizer with AnalyserNode tap on masterVolume, rainbow spectrum bars and pitch-colored ZCR waveform, plus RMS transient glow for drum hits.

## What Was Built

A real-time audio visualizer with two display modes:

1. **Spectrum mode** — 128 FFT frequency bars with HSL rainbow gradient (bass=red hue:0, treble=purple hue:300); bar brightness increases with amplitude.
2. **Waveform mode** — continuous oscilloscope line with pitch-responsive color; ZCR estimates fundamental frequency and maps to HSL hue across 4 octaves (C2–C6); defaults to teal (#00FFCC) during silence.
3. **Transient glow** — white overlay flash (35% max opacity) that snaps up on drum hits and decays at 0.05/frame (~150ms at 60fps).
4. **Mode toggle button** — styled to match existing panel-header dark theme with teal accent text.

## Files Created

- `/Users/brad/Apps/Tydal/engine/visualizer.js` — AnalyserNode setup, FFT data extraction, transient detection (ring buffer RMS)
- `/Users/brad/Apps/Tydal/ui/visualizer-ui.js` — Canvas render loop, spectrum/waveform modes, pitch coloring, transient glow

## Files Modified

- `/Users/brad/Apps/Tydal/index.html` — Added `<div id="visualizer">` between instrument-container and synth-panel
- `/Users/brad/Apps/Tydal/styles.css` — Added #visualizer, .visualizer-canvas, .visualizer-toggle rules
- `/Users/brad/Apps/Tydal/app.js` — Imported initVisualizer, called after initSequencerUI

## Task Commits

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Audio analysis engine and canvas visualizer with spectrum/waveform modes | b4309b0 |

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

Files exist:
- engine/visualizer.js: FOUND
- ui/visualizer-ui.js: FOUND

Commit b4309b0 exists in git log.
