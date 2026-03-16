---
phase: 05-performance-features
plan: 04
subsystem: randomizer
tags: [randomizer, synth, variation, ux, musical-constraints]
dependency_graph:
  requires:
    - engine/instruments.js (setSynthParam)
    - engine/effects.js (reverb, delay, distortion, vibrato, tremolo)
    - engine/preset-storage.js (captureCurrentPatch, loadPatch)
    - ui/synth-panel.js (Randomize section integration)
  provides:
    - engine/randomizer.js (randomizePatch, saveVariation, loadVariation, listVariations)
  affects:
    - ui/synth-panel.js (adds Randomize heading, button, 4 variation slots)
    - styles.css (variation-slot-btn styles)
tech_stack:
  added: []
  patterns:
    - Chaos budget pattern: total effect wetness cap prevents wall-of-noise
    - Exponential frequency distribution: expRandom(min, max) for musical filter sweeps
    - Module-level state: 4-slot variations array persists within session
key_files:
  created:
    - engine/randomizer.js
  modified:
    - ui/synth-panel.js
    - styles.css
decisions:
  - Chaos budget cap of 1.5 total wet gives audible effects without overwhelming; reverb allowed first in chain priority
  - expRandom uses log-uniform distribution (min * (max/min)^t) matching human frequency perception
  - Slot click logic: empty=save, filled=load, dblclick=overwrite eliminates need for separate save/load buttons
  - Slots are session-only (no localStorage) — lightweight A/B comparison without polluting saved patches
metrics:
  duration: "9 minutes"
  completed_date: "2026-03-16"
  tasks_completed: 2
  files_created: 1
  files_modified: 2
---

# Phase 5 Plan 4: Randomizer and Variation Slots Summary

One-liner: Chaos-budget randomizer with expRandom filter distribution and 4 session-scoped variation snapshot slots integrated into the synth panel.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Randomizer engine with musical constraints and variation snapshots | f913f11 | engine/randomizer.js (created) |
| 2 | Randomize button and variation slots in synth panel | 2330967 | ui/synth-panel.js, styles.css |

## What Was Built

### engine/randomizer.js (new)

- `randomizePatch()` — applies randomized synth params + effects with musical constraints:
  - `randomChoice()` for oscillator waveform selection
  - `randomRange()` for ADSR, filter Q, detune
  - `expRandom()` for filter frequency (log-uniform: biased toward musically useful low-mid range)
  - Chaos budget: tracks `totalWet`; caps cumulative effect wetness at 1.5 to prevent wall-of-noise
  - Each effect has 60% chance off (30% for tremolo); conservative ranges when active
- `saveVariation(slot)` — captures current patch to slot 0-3 via `captureCurrentPatch()`
- `loadVariation(slot)` — restores saved patch via `loadPatch()`; returns false if slot empty
- `listVariations()` — returns array of 4 slot names (null for empty)

### ui/synth-panel.js (modified)

- Imports all 4 randomizer exports
- Added at bottom of panel body:
  - `panel-heading` "Randomize"
  - Randomize button row: calls `randomizePatch()` on click
  - 4 variation slot buttons (1-4):
    - Empty slot click: saves current patch, marks active
    - Filled slot click: loads that variation, marks active
    - Double-click: overwrites slot with current patch
    - `refreshSlotStates()` syncs button visual state after any change

### styles.css (modified)

- `.panel-btn--randomize`: flex:1, uppercase, letter-spacing
- `.panel-row--variations`: flex row with gap
- `.variation-slot-btn`: 28x28px compact square, monospace font, dim opacity when empty
- `.variation-slot-btn.filled`: accent border and color (slot has data)
- `.variation-slot-btn.active-slot`: solid accent background (currently loaded slot)

## Decisions Made

- **Chaos budget at 1.5:** Allows up to 2-3 effects active simultaneously at moderate levels without drowning the dry signal. Reverb gets first allocation as it's most forgiving.
- **expRandom distribution:** `min * (max/min)^t` is the correct log-uniform formula; matches how humans perceive pitch (octaves = equal perceived distance). This gives ~3x more values in 200-1600Hz range vs 1600-8000Hz.
- **Session-only variation storage:** Variations are held in module memory (not localStorage). They reset on page reload — intentional. The existing savePatch/loadPatch system handles persistence. Variation slots are for rapid A/B comparison during a jam session.
- **Slot UX:** Single-click empty=save, filled=load removes decision overhead. Double-click overwrite provides escape hatch without a separate "overwrite" button.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] engine/randomizer.js exists and passes all verification checks
- [x] ui/synth-panel.js contains randomizePatch, saveVariation, loadVariation, Randomize label
- [x] styles.css contains variation-slot styling
- [x] Task 1 commit: f913f11
- [x] Task 2 commit: 2330967
