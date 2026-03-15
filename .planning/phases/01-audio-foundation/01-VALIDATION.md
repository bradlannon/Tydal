---
phase: 1
slug: audio-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual smoke testing + grep-based automated checks |
| **Config file** | none — new project, no test framework in Phase 1 |
| **Quick run command** | Open `index.html` in browser, tap a pad |
| **Full suite command** | Full manual checklist (11 requirements) + `grep -r "setTimeout" engine/ input/` |
| **Estimated runtime** | ~60 seconds (manual) |

---

## Sampling Rate

- **After every task commit:** Open `index.html` in browser — trigger a note, confirm sound
- **After every plan wave:** Full manual checklist (all 11 requirements)
- **Before `/gsd:verify-work`:** Full checklist green on iOS Safari + Chrome desktop
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | INTG-04 | automated grep | `grep "importmap" index.html` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | INTG-01 | visual | Browser inspection | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | INTG-02 | visual | Browser inspection | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | INTG-03 | visual | Browser resize / real device | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | AUDIO-01 | manual-only | — (requires iOS hardware) | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | AUDIO-02 | smoke | `grep -r "setTimeout" engine/` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | AUDIO-03 | manual-only | — (requires human ear) | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 1 | AUDIO-04 | manual-only | — (requires manual chord testing) | ❌ W0 | ⬜ pending |
| 01-02-05 | 02 | 1 | AUDIO-05 | automated grep | `grep -r "setTimeout" ./engine/ ./input/` | ❌ W0 | ⬜ pending |
| 01-02-06 | 02 | 1 | AUDIO-06 | manual-only | — (requires human ear) | ❌ W0 | ⬜ pending |
| 01-02-07 | 02 | 1 | AUDIO-07 | manual-only | — (requires human ear) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `index.html` — entry point (does not exist yet)
- [ ] `engine/audio-engine.js` — audio context and routing
- [ ] `engine/instruments.js` — PolySynth configuration
- [ ] `input/keyboard.js` — keyboard event handling
- [ ] `input/touch.js` — touch/pointer event handling
- [ ] `ui/pad-grid.js` — 4x4 pad grid rendering
- [ ] `ui/overlay.js` — iOS tap-to-start overlay
- [ ] `styles.css` — dark theme styles
- [ ] `app.js` — app initialization

*(This is a new project. All files are Wave 0 creations.)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| iOS Safari first-tap produces sound | AUDIO-01 | Requires iOS hardware with AudioContext unlock | Open on iOS Safari → tap overlay → tap pad → sound plays |
| Note sustains on hold, releases cleanly | AUDIO-03 | Requires human ear for audible click detection | Hold pad/key → note sustains; release → fades without click |
| 8-voice polyphony, 9th steals | AUDIO-04 | Requires manual chord testing | Hold 8 keys → play 9th → oldest voice stolen, no crash |
| No audible click on release | AUDIO-06 | Requires human ear | Release held note → no pop/click artifact |
| Volume slider works | AUDIO-07 | Requires human ear | Move slider → output level changes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
