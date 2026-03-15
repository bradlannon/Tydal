---
phase: 04-differentiators
plan: "03"
subsystem: preset-storage
tags: [persistence, localStorage, url-sharing, serialization, patches]
dependency_graph:
  requires: [engine/presets.js, engine/instruments.js, engine/effects.js]
  provides: [engine/preset-storage.js]
  affects: [ui/synth-panel.js, app.js]
tech_stack:
  added: []
  patterns: [localStorage CRUD with 50-patch cap, base64 URL hash fragments via btoa/atob, ESM module imports]
key_files:
  created:
    - engine/preset-storage.js
  modified:
    - ui/synth-panel.js
    - app.js
    - styles.css
decisions:
  - "captureCurrentPatch always stores full synth params from synth.get() rather than detecting factory preset name — avoids needing to track active preset name across modules"
  - "patchToURL uses encodeURIComponent(json) before btoa() to safely handle non-ASCII characters in patch names or param strings"
  - "loadPatch still checks factoryPreset field for forward-compatibility — caller can explicitly set it; captureCurrentPatch leaves it null"
  - "Share clipboard fallback: if navigator.clipboard.writeText fails, window.prompt shows URL so user can copy manually"
  - "URL patch restore runs after all panel inits (end of app.js) so the full audio chain is wired before loadPatch applies effects"
metrics:
  duration: "3 minutes"
  completed: "2026-03-15"
  tasks_completed: 2
  files_modified: 4
---

# Phase 4 Plan 03: Preset Persistence Summary

**One-liner:** Full patch serialization to localStorage and shareable base64 URL hash fragments, with Save/Load/Delete/Share UI in the synth panel.

## What Was Built

Patch persistence and URL sharing for Tydal:

- `engine/preset-storage.js` — Core serialization module with 7 exports: `captureCurrentPatch`, `savePatch`, `loadPatch`, `listPatches`, `deletePatch`, `patchToURL`, `patchFromURL`
- Patch schema (version 1) captures synth type + all params via `synth.get()`, plus reverb/delay/distortion/filter/channel/vibrato/tremolo/filterLFO state
- localStorage CRUD with automatic pruning to 50 patches (oldest removed first)
- base64 URL encoding via `btoa(encodeURIComponent(json))` for safe hash fragments
- `ui/synth-panel.js` — Added User Patches section: dropdown listing saved patches, Save/Delete/Share buttons
- `app.js` — On startup, checks `location.hash` for `#patch=` fragment and restores via `loadPatch()`
- `styles.css` — Added `.panel-btn`, `.panel-btn--small`, `.panel-patch-controls`, `.panel-patch-actions` styles

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Patch serialization engine | 7153328 | engine/preset-storage.js |
| 2 | Save/Load/Share UI + URL restore | f5ab5ee | ui/synth-panel.js, app.js, styles.css |

## Deviations from Plan

None — plan executed exactly as written. Added a CSS rule for the new buttons (not explicitly in the plan but required for correct styling — Rule 2 critical functionality).

## Self-Check: PASSED

All created files exist on disk. Both task commits (7153328, f5ab5ee) confirmed in git log.
