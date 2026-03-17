---
phase: 06-move-visual-aesthetic
plan: "02"
subsystem: visual
tags: [css, rgb-pads, sequencer-colors, move-aesthetic, pad-grid]
dependency_graph:
  requires: [move-token-system, black-canvas, label-stripped-ui]
  provides: [rgb-pad-coloring, green-playhead, white-active-steps, move-pad-proportions]
  affects: [public/styles.css, public/ui/pad-grid.js]
tech_stack:
  added: []
  patterns: [inline-style-rgb-coloring, data-attribute-role-storage, tonal-scale-query]
key_files:
  created: []
  modified:
    - public/ui/pad-grid.js
    - public/styles.css
decisions:
  - "Inline styles for pad RGB coloring — CSS classes can't express per-pad dynamic colors; data-roleColor/data-roleGlow store role for active state restore"
  - "Chromatic mode (no scale lock): all pads #2a2a2a dim gray — no root distinction without a key center"
  - "setPadActive() manages white flash inline and restores role color on release — avoids CSS specificity wars with !important"
  - "Step playhead is solid green (#00ff5a) not just a border — more visible and matches Move hardware precisely"
  - "Drum seq-cell.playing uses rgba(0,255,90,0.15) tint for the full playhead column (inactive cells), green only on active.playing"
metrics:
  duration: "~2 minutes"
  completed_date: "2026-03-17"
  tasks_completed: 2
  files_modified: 2
---

# Phase 6 Plan 02: Move Visual Aesthetic — RGB Pads & Sequencer Colors Summary

**One-liner:** RGB pad coloring via `_applyPadColors()` — root pads glow Move orange, in-scale dim gray, out-of-scale near-black; step sequencer playhead solid green, active steps flat white.

## What Was Built

Completed the Move hardware aesthetic with dynamic pad RGB coloring and sequencer color language. The note pad grid now communicates musical information through color: root note pads glow the track's orange-amber, in-scale pads are dim warm gray, and out-of-scale pads nearly disappear into the black background. The step sequencer playhead column is solid green (#00ff5a) and active steps are flat white — matching Move's distinctive "only lit things exist" visual grammar. Both the main grid step-zone and the drum sequencer sheet share this color language.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | RGB pad coloring system | d68ccc8 | public/ui/pad-grid.js, public/styles.css |
| 2 | Green playhead and white active steps | 9588cec | public/styles.css |
| 3 | Visual verification checkpoint | — | (auto-approved) |

## Key Changes

**pad-grid.js:**
- Added `export const TRACK_COLOR = '#e87a20'` — Move orange-amber, Phase 8 can swap per track
- Added `_applyPadColors()` — queries all `.note-cell` elements, extracts pitch class from `data-note`, checks against tonal Scale.get() result to determine root/in-scale/out-of-scale role, sets `cell.style.backgroundColor` and `cell.style.boxShadow` inline
- Stores role values in `cell.dataset.roleColor` and `cell.dataset.roleGlow` for restore on release
- `_createGrid()` now calls `_applyPadColors()` inside `requestAnimationFrame` after DOM is built
- `_rebuildGrid()` calls `requestAnimationFrame(_applyPadColors)` so colors update on scale/octave change
- `setPadActive()` sets `#fff` + white glow inline on press; restores `dataset.roleColor/roleGlow` on release

**styles.css:**
- `.note-zone` gap: 4px → 3px (tighter Move hardware proportions)
- `.note-cell` base: removed explicit background (JS handles it), removed hover effect entirely, border-radius 3px
- `.step-cell` base: `#111` dark, `border: none`, `border-radius: 3px`
- `.step-cell.step-playhead`: solid `var(--move-glow-green)` + green glow (was just a green border)
- `.step-cell.step-active`: flat `#fff`, no glow
- `.step-cell.step-empty`: `#080808` near-invisible for empty lanes
- `.step-cell.step-selected-lane`: `#1a1a1a` subtle lane highlight
- `.seq-cell` base: `#111`, `border: none`, `border-radius: 3px`
- `.seq-cell.playing`: rgba green tint on playhead column
- `.seq-cell.active.playing`: full `var(--move-glow-green)`
- `.seq-cell.beat-start`: `1px solid #222` subtle beat grouping

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

1. **Inline styles for RGB coloring:** CSS classes cannot express per-pad dynamic colors determined by scale position. Inline `backgroundColor` set directly; `data-roleColor`/`data-roleGlow` attributes store each pad's musical role for restore after active state clears.
2. **Step playhead solid green (not just border):** Plan specified solid background for `.step-playhead`. This is more visible and matches Move hardware where the playhead column is clearly lit.
3. **Drum seq-cell.playing tint approach:** Inactive cells in the playhead column get a subtle `rgba(0,255,90,0.15)` green tint; active cells at playhead get full green. This creates a visible column sweep without overwhelming the white active step indicators.

## Self-Check: PASSED

Files confirmed:
- public/ui/pad-grid.js — contains `_applyPadColors`, `TRACK_COLOR`, `roleColor`
- public/styles.css — contains `--move-glow-green`, step-cell green playhead, seq-cell updated

Commits confirmed:
- d68ccc8: feat(06-02): RGB pad coloring system with scale-aware colors
- 9588cec: feat(06-02): green playhead and white active steps on sequencers
