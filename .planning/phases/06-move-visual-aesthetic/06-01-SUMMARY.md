---
phase: 06-move-visual-aesthetic
plan: "01"
subsystem: visual
tags: [css, design-tokens, aesthetic, move]
dependency_graph:
  requires: []
  provides: [move-token-system, black-canvas, label-stripped-ui]
  affects: [public/styles.css, public/index.html, public/ui/sequencer-ui.js]
tech_stack:
  added: []
  patterns: [css-custom-properties, move-hardware-aesthetic]
key_files:
  created: []
  modified:
    - public/styles.css
    - public/index.html
    - public/ui/sequencer-ui.js
decisions:
  - "Move token system: --move-black/#000 as the universal background; no gray surfaces or borders — only lit elements have visual presence"
  - "Toolbar abbreviations SYN/FX/DRM/MCR accepted as minimal hardware-style printed labels"
  - "Gyro and note-repeat button text (Gyro: On/Off, RPT) retained — transient/interactive controls not static labels"
  - "All .panel-label, .seq-row-label, .lane-label, .cell-note hidden via CSS display:none — JS DOM creation removed where possible (BPM label, row labels)"
metrics:
  duration: "~3 minutes"
  completed_date: "2026-03-17"
  tasks_completed: 2
  files_modified: 3
---

# Phase 6 Plan 01: Move Visual Aesthetic Foundation Summary

**One-liner:** Pure #000 black canvas with Move token system — all CSS vars replaced, header and help panel removed, every static text label hidden, hardware surface aesthetic established.

## What Was Built

Transformed Tydal's visual system from a dark-themed web instrument into Ableton Move's matte black hardware aesthetic. The entire CSS custom property system was replaced with Move-palette tokens, the body is now pure black with zero visible borders or surfaces, and all static text labels have been eliminated from the main instrument surface.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Move CSS token system and black canvas overhaul | 31ed3e8 | public/styles.css, public/index.html |
| 2 | Strip text labels from JS-generated UI elements | 6436196 | public/ui/sequencer-ui.js |

## Key Changes

**styles.css:**
- Replaced all old tokens (`--bg-body`, `--bg-surface`, `--accent`, `--text-primary`, `--border-subtle`, `--step-*`) with Move palette: `--move-black: #000`, `--move-surface: #111`, `--move-dim: #1a1a1a`, `--move-glow-green: #00ff5a`, `--move-glow-white: #ffffff`, `--move-text-dim: #555`, `--move-border: transparent`
- Body background: `var(--move-black)` (#000)
- Toolbar: background black, no border-top, buttons transparent with `#444` dim color; active state = `#fff` text; play.playing = `--move-glow-green`
- All `.panel-label`, `.panel-heading`, `.lane-label`, `.page-label`, `.seq-row-label`, `.cell-note`, `.octave-display`, `.bpm-control label` set to `display: none`
- `.grid-cell` border-radius: 6px → 4px (Move proportions)
- All non-active box-shadow glows removed
- Bottom sheets: black background, `#333` handle, `#444` title
- Added `.move-hidden` utility class

**index.html:**
- Removed `<header class="app-header">` entirely
- Removed `<span id="octave-display">` text span (octave +/- buttons remain)
- Removed help button (`#help-btn`) and entire help panel (`#help-panel`) — JS guards with `if (helpBtn && helpPanel)` prevent errors
- Toolbar button text: "Synth"→"SYN", "FX"→"FX", "Drums"→"DRM", "Macro"→"MCR"

**sequencer-ui.js:**
- Removed `bpmLabel` element creation (was adding "BPM" text node to DOM)
- Removed `seq-row-label` span creation in drum grid row loop (was adding "Kick", "Snare" etc.)

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

## Decisions Made

1. **Move token naming:** `--move-black`, `--move-surface`, `--move-dim`, `--move-glow-green`, `--move-glow-white` — clear hardware-metaphor names that communicate intent
2. **Toolbar abbreviations:** SYN/FX/DRM/MCR kept as minimal printed-label equivalents (Move hardware has tiny printed labels below buttons)
3. **Interactive control text retained:** "Gyro: On/Off" and "RPT" button text kept — these are interactive state indicators, not static labels
4. **CSS-first label hiding:** `.panel-label` and similar classes hidden via CSS `display:none` rather than removing from JS, keeping sheet-internal labels available for future re-enable if needed

## Self-Check: PASSED

Files confirmed:
- public/styles.css — contains `--move-black` and `#000`, no `--bg-body`
- public/index.html — no `app-header`, no `help-btn`, no `octave-display`
- public/ui/sequencer-ui.js — no `bpmLabel` creation, no `seq-row-label` creation

Commits confirmed:
- 31ed3e8: feat(06-01): Move CSS token system and black canvas overhaul
- 6436196: feat(06-01): strip JS-generated text labels from sequencer UI
