---
phase: 08-multi-track-system
plan: "03"
subsystem: audio-engine, ui
tags: [multi-track, volume, mute, effects-isolation, encoder]
dependency_graph:
  requires: [08-01, 08-02]
  provides: [per-track-volume, per-track-mute, effects-isolation]
  affects: [track-manager, track-buttons, encoder-row, drums, styles]
tech_stack:
  added: []
  patterns: [CustomEvent-sync, audio-channel-mute, rampTo-smoothing]
key_files:
  created: []
  modified:
    - public/engine/track-manager.js
    - public/ui/track-buttons.js
    - public/ui/encoder-row.js
    - public/styles.css
decisions:
  - setTrackVolume/setTrackMute route all audio channel mutations through track-manager for single source of truth
  - drumBus import in track-manager uses direct ES module import (no circular dependency)
  - DRUM_MAPPING Drum Vol encoder now routes through setTrackVolume(0) to keep track state in sync
  - buildTrackMelodicMapping Volume encoder renamed to Trk Vol and uses setTrackVolume for state consistency
  - Mute visual: opacity 0.3 + ::after diagonal strikethrough pseudo-element for clear muted indicator
  - _toggleMute in track-buttons.js delegates to setTrackMute; track-mute event drives UI class update
metrics:
  duration: 118s
  completed_date: "2026-03-17"
  tasks: 2
  files_modified: 4
---

# Phase 8 Plan 3: Per-Track Volume, Mute, and Effects Isolation Summary

Per-track volume/mute controls via `setTrackVolume`/`setTrackMute` helpers in track-manager.js, routing drum bus and melodic channel audio nodes independently, with track button long-press mute and encoder Trk Vol per-track.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Per-track volume/mute helpers and drum track volume wiring | ffaa5cc | public/engine/track-manager.js |
| 2 | Track button volume/mute indicators and encoder volume per-track | 96f3b7e | public/ui/track-buttons.js, public/ui/encoder-row.js, public/styles.css |

## What Was Built

### Task 1 — setTrackVolume and setTrackMute in track-manager.js

Added two exported functions to `/Users/brad/Apps/Tydal/public/engine/track-manager.js`:

- `setTrackVolume(trackId, volumeDb)`: Updates `track.volume`, ramps `drumBus.volume` (track 0) or `effectsChain.channel.volume` (tracks 1-3), dispatches `track-volume` CustomEvent.
- `setTrackMute(trackId, muted)`: Updates `track.muted`, sets `drumBus.mute` (track 0) or `effectsChain.channel.mute` (tracks 1-3), dispatches `track-mute` CustomEvent.

`melodic-sequencer.js` was already checking `track.muted` in its Sequence callback (added in 08-01), so the belt-and-suspenders check remains. The `drumBus.mute` approach means drum silencing works at the audio channel level without any sequencer callback modification needed.

### Task 2 — UI wiring: track buttons and encoder row

**track-buttons.js:**
- `_toggleMute` now calls `setTrackMute(trackId, !track.muted)` instead of directly mutating `track.muted` and dispatching the event manually.
- Added `track-mute` CustomEvent listener to update the `.muted` CSS class on the correct button, enabling external mute changes (e.g. from MIDI) to reflect in UI.

**encoder-row.js:**
- Imported `setTrackVolume` from `track-manager.js`.
- `buildTrackMelodicMapping` "Volume" encoder renamed to "Trk Vol" and now calls `setTrackVolume(track.id, val)` so track state stays synchronized.
- `DRUM_MAPPING` "Drum Vol" encoder updated from direct `drumBus.volume.rampTo` to `setTrackVolume(0, val)` for consistent state tracking.

**styles.css:**
- Added `position: relative` to `.track-btn` (required for `::after` positioning).
- Added `.track-btn.muted::after` pseudo-element: diagonal strikethrough line (2px white at 50% opacity, rotated 45deg) layered on top of the existing `opacity: 0.3` for a clear visual muted state.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

All automated checks pass:

```
public/ui/track-buttons.js:setTrackMute
public/ui/encoder-row.js:setTrackVolume (line 32 import, line 163 drum vol, line 439 trk vol)
.track-btn.muted — opacity 0.3
.track-btn.muted::after — diagonal strikethrough
melodic-sequencer.js: track.muted check in Sequence callback (existing from 08-01)
```

## Self-Check: PASSED

Files exist:
- public/engine/track-manager.js — FOUND
- public/ui/track-buttons.js — FOUND
- public/ui/encoder-row.js — FOUND
- public/styles.css — FOUND

Commits verified: ffaa5cc, 96f3b7e
