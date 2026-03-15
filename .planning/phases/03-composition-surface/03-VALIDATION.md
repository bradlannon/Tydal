---
phase: 3
slug: composition-surface
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser verification (no test framework) |
| **Config file** | none |
| **Quick run command** | `npx serve .` then open browser |
| **Full suite command** | Full manual checklist (10 requirements) |
| **Estimated runtime** | ~120 seconds (manual) |

---

## Sampling Rate

- **After every task commit:** Load page, verify implemented feature at 120 BPM (30 seconds)
- **After every plan wave:** All requirements in that wave manually verified
- **Before `/gsd:verify-work`:** All 10 requirements pass
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | DRUM-01 | manual-audio | — | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | DRUM-02 | manual-audio | — | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | DRUM-03 | manual-audio | — | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | DRUM-04 | manual-audio | — | ❌ W0 | ⬜ pending |
| 03-01-05 | 01 | 1 | DRUM-05 | manual-perf | — | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | COMP-01 | manual-visual | — | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | COMP-02 | manual-audio | — | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 2 | COMP-03 | manual-interaction | — | ❌ W0 | ⬜ pending |
| 03-02-04 | 02 | 2 | COMP-04 | manual-audio | — | ❌ W0 | ⬜ pending |
| 03-02-05 | 02 | 2 | COMP-05 | manual-interaction | — | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Ensure local HTTP server available (`npx serve .`)
- [ ] No test files needed — all verification is manual browser interaction

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Kick has sub-bass pitch sweep | DRUM-01 | Requires human ear | Trigger kick pad → hear distinct sub-bass thump |
| Snare has noise + tonal body | DRUM-02 | Requires human ear | Trigger snare → hear rattle + crack |
| Hi-hat chokes on closed | DRUM-03 | Requires human ear | Play open then closed → open cuts off |
| Clap has multi-burst texture | DRUM-04 | Requires human ear | Trigger clap → hear burst with reverb tail |
| No glitches at 240 BPM | DRUM-05 | Requires extended playback | Set 240 BPM, play 2 min → no dropouts |
| Step cursor tracks playback | COMP-01 | Visual inspection | Start sequencer → cursor advances with audio |
| BPM change syncs sequencer | COMP-02 | Requires human ear | Change BPM → hear speed change + cursor syncs |
| Tap tempo sets BPM | COMP-03 | Requires interaction | Tap rhythm → BPM updates immediately |
| Quantized recording | COMP-04 | Requires human ear | Record over loop → notes snap to grid |
| Overdub + undo | COMP-05 | Requires interaction | Overdub notes → undo removes last layer only |

---

## Validation Sign-Off

- [ ] All tasks have manual verify instructions
- [ ] Sampling continuity: manual check after each task commit
- [ ] Wave 0 covers server availability
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
