---
phase: 09-move-performance-features
plan: "03"
subsystem: sequencer-automation
tags: [automation, step-sequencer, encoders, ui]
dependency_graph:
  requires: ["09-01"]
  provides: [per-step-automation, hold-step-interaction, automation-visual-indicators]
  affects: [melodic-sequencer, drum-sequencer, step-buttons, encoder-row]
tech_stack:
  added: []
  patterns: [per-step-automation, tap-vs-hold-detection, CustomEvent-pipeline]
key_files:
  created: []
  modified:
    - public/engine/track-manager.js
    - public/engine/melodic-sequencer.js
    - public/engine/sequencer.js
    - public/ui/step-buttons.js
    - public/ui/encoder-row.js
    - public/styles.css
decisions:
  - "One automation param per step (last encoder turned wins) — matches Move hardware model"
  - "Apply automation BEFORE triggerAttackRelease so synth plays with automated value"
  - "200ms tap-vs-hold threshold on step buttons distinguishes toggle from automation capture"
  - "encoder-change CustomEvent is a passive notification — does not affect encoder behavior"
  - "Drum automation (Drum Vol/Reverb/Delay) stays applied until next automated step changes it"
metrics:
  duration: "~8 min"
  completed_date: "2026-03-17"
  tasks_completed: 2
  files_modified: 6
---

# Phase 09 Plan 03: Per-Step Automation Summary

Per-step parameter automation for the step sequencer: hold a step button + turn an encoder to write a parameter snapshot that plays back when the sequencer reaches that step.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Per-step automation data structure and playback application | 15c2b2d |
| 2 | Hold-step + encoder-turn interaction and visual indicators | 1ffbc27 |

## What Was Built

### Task 1: Automation Data Structure and Playback

**track-manager.js** gained:
- `automation` array on every track (melodic and drum): `Array(16).fill(null)` — each slot is `null` or `{ paramName, value }`
- `setStepAutomation(trackId, step, paramName, value)` — writes automation, dispatches `automation-update`
- `getStepAutomation(trackId, step)` — reads automation for a step
- `clearStepAutomation(trackId, step)` — clears automation, dispatches `automation-update`

**melodic-sequencer.js** gained:
- Automation application in the `Tone.Sequence` callback — reads `track.automation[step]` and calls `_applyAutomation(track, auto)` BEFORE triggering notes
- `_applyAutomation` helper maps param names (Cutoff, Res, Reverb, Delay, Attack, Release) to `synth.set()` and `effectsChain.*` writes

**sequencer.js** gained:
- Drum automation check at each step via `drumTrack.automation[step]`
- `_applyDrumAutomation` helper handles Drum Vol, Reverb, Delay
- Added `drumBus` import from drums.js and `reverb`/`delay` imports from effects.js

### Task 2: Hold+Turn Interaction and Visual Indicators

**encoder-row.js** gained:
- `document.dispatchEvent(new CustomEvent('encoder-change', { detail: { index, name, value } }))` inside every encoder's `onChange` callback — passive notification, no behavior change

**step-buttons.js** gained:
- `_heldStep` / `_holdTimer` module state for tap-vs-hold tracking
- `_onStepPointerDown` replaces `_onStepTap` — sets `_heldStep`, starts 200ms timer
- `_onStepPointerUp` — if timer still running (<200ms), it's a tap; calls `_doStepTap()`; clears `_heldStep`
- `_onEncoderChange` — if `_heldStep >= 0`, calls `setStepAutomation()` with encoder's name/value
- `_refreshButtons` updated to toggle `has-automation` class using `getStepAutomation()`
- Listens for `automation-update` → `_refreshButtons` to keep indicators current
- New imports: `getActiveTrackId`, `setStepAutomation`, `getStepAutomation` from track-manager

**styles.css** gained:
- `.step-btn.has-automation` — `box-shadow: 0 2px 0 0 #00b3f4` (blue underline indicator)
- `.step-btn.has-automation.active` — preserves blue underline when step is active
- `.step-btn.has-automation.playhead` — preserves blue underline during playhead pass

## Key Architecture Decisions

**One automation param per step:** Move's hardware model — last encoder turned while holding a step wins. Simple and sufficient for musical expression.

**Apply before trigger:** `_applyAutomation` runs before `triggerAttackRelease` in the Tone.Sequence callback, ensuring the synth voice starts with the automated value.

**Passive encoder-change event:** The dispatch in encoder-row.js doesn't change encoder behavior; step-buttons.js listens passively. Clean separation of concerns.

**200ms threshold:** Distinguishes accidental brushes from intentional holds. Tap behavior is fully preserved — no regression on the primary step toggle interaction.

## Verification

Success criteria confirmed:
- Hold step + turn encoder writes `{ paramName, value }` to `track.automation[step]`
- Melodic sequencer applies automation values before each note trigger
- Blue underline (`box-shadow: 0 2px 0 0 #00b3f4`) distinguishes automated steps
- Quick tap (<200ms) still toggles step notes — `_doStepTap` called on short press
- Automation stored in `track.automation[]` alongside `track.grid[]` — survives track switching

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written, with one minor addition:

**[Rule 2 - Missing functionality] Preserved playhead box-shadow for automated steps**
- Added `.step-btn.has-automation.playhead` rule to merge green glow + blue underline
- The plan only specified `.active.playhead` override; this extends it to the playhead case for visual completeness

## Self-Check

- [x] `public/engine/track-manager.js` — automation arrays and setStepAutomation/getStepAutomation/clearStepAutomation present
- [x] `public/engine/melodic-sequencer.js` — `_applyAutomation` called in sequence callback
- [x] `public/engine/sequencer.js` — drum automation applied via `_applyDrumAutomation`
- [x] `public/ui/step-buttons.js` — `_heldStep`, `_onStepPointerDown`, `_onEncoderChange`, `has-automation` class toggle
- [x] `public/ui/encoder-row.js` — `encoder-change` event dispatched in onChange
- [x] `public/styles.css` — `.has-automation` rule with blue underline
- [x] Commits: 15c2b2d, 1ffbc27
