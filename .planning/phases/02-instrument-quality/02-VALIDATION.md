---
phase: 2
slug: instrument-quality
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser verification (no test framework — static app) |
| **Config file** | none |
| **Quick run command** | `npx serve .` then open browser |
| **Full suite command** | Full manual checklist (18 requirements) |
| **Estimated runtime** | ~120 seconds (manual) |

---

## Sampling Rate

- **After every task commit:** Load page, trigger 3-4 notes, verify audio (30 seconds)
- **After every plan wave:** Full manual checklist covering all requirements in that wave
- **Before `/gsd:verify-work`:** All 18 requirements manually verified
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | SYNTH-01 | manual-audio | — | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | SYNTH-02 | manual-audio | — | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | SYNTH-03 | manual-audio | — | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | SYNTH-04 | manual-audio | — | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | SYNTH-05 | manual-audio | — | ❌ W0 | ⬜ pending |
| 02-01-06 | 01 | 1 | SYNTH-06 | manual-audio | — | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | FX-01 | manual-audio | — | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | FX-02 | manual-audio | — | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | FX-03 | manual-audio | — | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 1 | FX-04 | manual-audio | — | ❌ W0 | ⬜ pending |
| 02-02-05 | 02 | 1 | FX-05 | manual-audio | — | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | PERF-01 | manual-device | — | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | PERF-02 | manual-midi | — | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 2 | PERF-03 | manual-midi | — | ❌ W0 | ⬜ pending |
| 02-03-04 | 03 | 2 | PERF-04 | visual | — | ❌ W0 | ⬜ pending |
| 02-03-05 | 03 | 2 | PERF-05 | manual-audio | — | ❌ W0 | ⬜ pending |
| 02-03-06 | 03 | 2 | PERF-06 | manual-audio | — | ❌ W0 | ⬜ pending |
| 02-03-07 | 03 | 2 | PERF-07 | manual-device | — | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Ensure local HTTP server available (`npx serve .` or `python3 -m http.server`)
- [ ] No test files needed — all verification is manual browser/device interaction

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Waveform selector changes timbre | SYNTH-01 | Requires human ear | Switch waveform → hear different timbre |
| ADSR controls change envelope | SYNTH-02 | Requires human ear | Adjust attack/release → hear difference |
| Filter cutoff responds in real time | SYNTH-03 | Requires human ear | Sweep cutoff knob while playing |
| LFO modulation audible | SYNTH-04 | Requires human ear | Enable vibrato/tremolo → hear modulation |
| FM preset sounds distinct | SYNTH-05 | Requires human ear | Select FM preset → sounds like piano/organ |
| Presets have distinct character | SYNTH-06 | Requires human ear | Cycle through presets → each sounds different |
| Reverb wet slider adds room | FX-01 | Requires human ear | Increase reverb wet → hear room |
| Delay feedback audible | FX-02 | Requires human ear | Play note → hear echoes |
| Distortion adds grit | FX-03 | Requires human ear | Increase distortion → hear grit |
| Filter knobs respond | FX-04 | Requires human ear | Sweep filter → hear change |
| Per-channel volume/pan | FX-05 | Requires human ear | Adjust channel controls → hear difference |
| Touch velocity sensitivity | PERF-01 | Requires touch device | Hard vs soft tap → different volumes |
| MIDI velocity mapping | PERF-02 | Requires MIDI hardware | Play MIDI keys soft/hard → hear difference |
| MIDI note mapping | PERF-03 | Requires MIDI hardware | Play MIDI key → correct note sounds |
| Chromatic pad labels | PERF-04 | Visual inspection | Pads show semitone labels (C3, C#3, D3...) |
| Octave shift | PERF-05 | Requires human ear | Press octave up → pads shift range |
| Scale lock | PERF-06 | Requires human ear | Enable scale lock → only scale notes available |
| Multitouch 8 simultaneous | PERF-07 | Requires touch device | 8 fingers on pads → 8 notes, no zoom/scroll |

---

## Validation Sign-Off

- [ ] All tasks have manual verify instructions
- [ ] Sampling continuity: manual check after each task commit
- [ ] Wave 0 covers server availability
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
