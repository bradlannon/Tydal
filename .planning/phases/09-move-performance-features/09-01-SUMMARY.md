---
phase: 09-move-performance-features
plan: "01"
subsystem: engine/ui
tags: [arpeggiator, swing, performance, groove]
dependency_graph:
  requires: [instruments.js, sequencer.js, melodic-sequencer.js, encoder-row.js, track-manager.js]
  provides: [arpeggiator.js, swing control, ARP UI]
  affects: [instruments.js, melodic-sequencer.js, encoder-row.js, app.js]
tech_stack:
  added: []
  patterns: [setInterval BPM-synced tick, 5ms noteOff-noteOn gap, circular ES module safe pattern, long-press mode cycle]
key_files:
  created:
    - public/engine/arpeggiator.js
  modified:
    - public/engine/sequencer.js
    - public/engine/melodic-sequencer.js
    - public/engine/instruments.js
    - public/ui/encoder-row.js
    - public/app.js
    - public/index.html
    - public/styles.css
decisions:
  - "Use _triggerNoteOn/_triggerNoteOff in arpeggiator.js to bypass arp routing check — avoids infinite recursion since instruments.js imports arpeggiator.js which imports instruments.js"
  - "Circular import instruments.js <-> arpeggiator.js is safe: ES module deferred binding resolves because both only export functions"
  - "Swing source of truth is sequencer.js getSwing() — melodic-sequencer imports it rather than maintaining duplicate state"
  - "Visual playhead is NOT swung — cursor stays on-grid even when swing is applied to audio timing"
  - "Swing encoder replaces Vibrato at index 7 in melodic mapping — Vibrato rarely used, swing is performance-critical"
metrics:
  duration: 242s
  completed_date: "2026-03-17"
  tasks_completed: 2
  files_modified: 7
---

# Phase 9 Plan 01: Arpeggiator and Swing Summary

Arpeggiator engine with Up/Down/Random modes and BPM-synced swing groove control applied to both drum and melodic sequencers.

## What Was Built

### Arpeggiator Engine (arpeggiator.js)
BPM-synced arp cycling held notes in Up, Down, or Random order. Uses `setInterval` with the same `rateToMs()` pattern as note-repeat.js. Exports `addArpNote`, `removeArpNote`, `setArpEnabled`, `isArpEnabled`, `setArpMode`, `getArpMode`, `setArpRate`.

Key design: uses `_triggerNoteOn`/`_triggerNoteOff` (bypass functions on instruments.js) to avoid circular recursion — instruments.js routes through arp when enabled, arp calls bypass functions to trigger synth directly.

### Swing Timing
- `setSwing(amount)` / `getSwing()` added to sequencer.js (single source of truth)
- Odd steps (1, 3, 5...) delayed by `swingAmount × (60/BPM/4)` seconds — one 16th note duration times swing factor
- Applied identically in both sequencer.js (drums) and melodic-sequencer.js (melodic tracks)
- Visual playhead cursor is NOT swung — stays on-grid for clarity

### ARP UI (app.js, index.html, styles.css)
- ARP button added to toolbar. Short press toggles on/off with green glow active state.
- Long-press (500ms) cycles Up→Down→Random→Up modes, shows mode on OLED for 1 second.
- Same long-press pattern as track-buttons.js (`pointerdown + setTimeout, pointerup cancel`).

### Swing Encoder (encoder-row.js)
- Replaces 'Clap Verb' placeholder at DRUM_MAPPING index 3 with functional Swing encoder (0–100%)
- Replaces Vibrato at melodic mapping index 7 with Swing encoder in `buildTrackMelodicMapping`
- Swing appears in both drum and melodic encoder mappings

### instruments.js Routing
noteOn/noteOff check `isArpEnabled()` — if active, call `addArpNote`/`removeArpNote` and return early. All input sources (keyboard, touch, MIDI) automatically get arp behavior.

## Deviations from Plan

### Auto-added: _triggerNoteOn/_triggerNoteOff bypass functions
- **Found during:** Task 2 integration
- **Issue:** Plan specified instruments.js imports arpeggiator.js AND arpeggiator.js imports noteOn/noteOff from instruments.js. Without bypass functions, arp tick calling noteOn would re-enter addArpNote infinitely.
- **Fix:** Added `_triggerNoteOn`/`_triggerNoteOff` exports to instruments.js that bypass arp routing. Arpeggiator imports these directly. Public `noteOn`/`noteOff` check arp state, internal `_trigger*` functions always go straight to synth.
- **Files modified:** public/engine/instruments.js, public/engine/arpeggiator.js

## Self-Check

## Self-Check: PASSED

- FOUND: public/engine/arpeggiator.js
- FOUND: 09-01-SUMMARY.md
- FOUND commit 741d6fc (Task 1)
- FOUND commit fffd04e (Task 2)
