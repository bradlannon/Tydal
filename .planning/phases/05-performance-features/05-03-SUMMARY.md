---
phase: 05-performance-features
plan: "03"
subsystem: ui
tags: [macros, effects, tone.js, bottom-sheet, sliders]

# Dependency graph
requires:
  - phase: 05-performance-features
    provides: effects chain (reverb, delay, distortion, filterFX, vibrato, tremolo)
provides:
  - Macro engine with 4 predefined multi-parameter mappings (engine/macros.js)
  - Bottom sheet Macro panel with 4 labeled range sliders (ui/macro-panel.js)
  - Toolbar Macro button wired into existing bottom sheet system
affects: [future sound design features, preset system (macros not yet serialized)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Macro pattern: 0-1 slider drives multiple effect params via linear interpolation min+(max-min)*v"
    - "Tone .set() handles both Signal and plain property targets uniformly"

key-files:
  created:
    - engine/macros.js
    - ui/macro-panel.js
  modified:
    - index.html
    - app.js

key-decisions:
  - "Tone .set({[param]: value}) used for all macro param writes — handles Signal and plain property targets without branching"
  - "MACROS exported as named object (not array) so UI can iterate Object.keys() and get stable macro names"

patterns-established:
  - "Macro engine pattern: static MACROS config object + applyMacro/getMacroValue API"

requirements-completed: [EXPR-03]

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 5 Plan 03: Macro Knobs Summary

**4 macro sliders (Darkness, Grit, Motion, Space) each morphing 2-4 Tone.js effect parameters simultaneously via linear interpolation, with a bottom sheet panel UI**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-16T22:11:24Z
- **Completed:** 2026-03-16T22:13:28Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Macro engine with 4 predefined multi-parameter mappings: Darkness (filter+reverb+delay), Grit (distortion+resonance), Motion (vibrato+tremolo), Space (reverb+delay)
- Linear interpolation maps 0-1 slider to per-parameter min/max ranges
- Bottom sheet panel with 4 labeled range sliders reusing existing panel-row styles
- Toolbar Macro button integrates with existing bottom sheet toggle system

## Task Commits

Each task was committed atomically:

1. **Task 1: Macro engine with 4 predefined mappings** - `90bb456` (feat)
2. **Task 2: Macro panel UI, bottom sheet, and app wiring** - `241e949` (feat)

## Files Created/Modified
- `engine/macros.js` - MACROS config, applyMacro(), getMacroValue() exports
- `ui/macro-panel.js` - initMacroPanel() renders 4 slider rows into container
- `index.html` - macro-sheet bottom sheet div + Macro toolbar button
- `app.js` - import initMacroPanel, call with #macro-panel element

## Decisions Made
- Tone .set({[param]: value}) used for all macro param writes — Tone handles both Signal (.rampTo internally) and plain property targets uniformly, avoiding branching per-param type detection
- MACROS exported as named object keyed by macro name so UI can iterate Object.keys() and access names without a separate name field lookup

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Macro engine ready; preset serialization could include macroValues if desired in a future plan
- All 4 macros functional: Darkness closes filter + adds reverb/delay, Grit adds distortion + resonance, Motion adds vibrato + tremolo, Space adds long reverb + echo

---
*Phase: 05-performance-features*
*Completed: 2026-03-16*
