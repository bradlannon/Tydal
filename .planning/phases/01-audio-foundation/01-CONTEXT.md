# Phase 1: Audio Foundation - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

A correct audio engine — notes start, hold, and release cleanly on both desktop and iOS, with sample-accurate timing. Standalone app (not embedded in portfolio). Phase 1 delivers a playable 4×4 pad instrument with a single warm synth voice, proper Tone.js integration, and the dark-themed standalone shell.

**IMPORTANT: Scope change from original roadmap.** The app is now called **Tydal** (not SoundForge), lives in its own repo/folder at `Apps/Tydal/`, and is hosted at `tydal.bradlannon.ca`. It is NOT embedded in the portfolio — the portfolio apps page links to it. This changes INTG-01 and INTG-02 requirements.

</domain>

<decisions>
## Implementation Decisions

### App Identity
- App name is **Tydal** (replaces "SoundForge" from original roadmap)
- Standalone app in `Apps/Tydal/`, hosted at `tydal.bradlannon.ca`
- Portfolio apps page gets a simple link card pointing to Tydal
- Portfolio site stays as-is — no music app embedded in it

### Pad Grid & Interaction
- 4×4 grid (16 pads), notes only — no drums until Phase 3
- Ableton Push / Akai MPC layout: bottom-left = lowest note, top-right = highest note. Notes ascend left-to-right, then bottom-to-top
- Each pad shows both keyboard shortcut letter AND note name
- Note range: Claude's Discretion (pick what sounds best for a warm pad synth and makes Phase 2 chromatic expansion natural)
- Hold-to-sustain: press = note plays, release = note stops with anti-click fade (AUDIO-03)
- Basic multitouch support on mobile — allow pressing 2-3 pads simultaneously (full PERF-07 optimization comes Phase 2)

### Default Sound Character
- Warm analog pad: sawtooth with slight detuning and gentle low-pass filter
- Single voice only — no voice/instrument switching in Phase 1 (Phase 2 adds synth engine)
- Long sustain (organ-like): note plays full and steady while held, smooth release fade on keyup
- Visible master volume slider on screen (AUDIO-07)

### Visual Feedback
- Pad active state: vibrant color fill + soft glow/shadow (not just border highlight)
- Uniform accent color for all pads (no pitch-based color variation)
- Tap-to-start overlay on iOS: full-screen overlay saying "Tap anywhere to enable audio", disappears after first touch
- No visualizer in Phase 1 — full expressive visualizer comes in Phase 4

### Theme & Layout
- Full dark theme throughout (immersive instrument aesthetic, like Ableton/Native Instruments)
- NOT a dark container inside a light page — the entire app is dark
- Viewport-filling: instrument container stretches to fill most of viewport height minus nav
- Title only in header: "Tydal" — no subtitle/description
- Minimal help tooltip: small "?" icon that expands to show keyboard shortcuts

### Integration (revised from original requirements)
- INTG-01 CHANGED: Tydal has its own nav/design, NOT the portfolio nav/footer
- INTG-02 CHANGED: Full dark theme standalone page, NOT dark-container-in-light-portfolio
- INTG-03 UNCHANGED: Responsive design, mobile-first
- INTG-04 UNCHANGED: ES modules via import map, Tone.js from CDN
- Old prototype (`public/apps/sound-pad.html`) should be removed — clean break

### Claude's Discretion
- Exact note range for the 16 pads (pick what sounds musical)
- Keyboard key mapping to the 4×4 grid
- Anti-click envelope parameters (gain ramp timing)
- Tone.js AudioContext lifecycle implementation details
- Dark theme color palette and surface hierarchy
- Nav/header design for standalone app
- File/module organization within the Tydal project
- Volume slider placement and styling

</decisions>

<specifics>
## Specific Ideas

- Pad layout should feel like Ableton Push or Akai MPC Professional — bottom-left lowest, top-right highest
- "Holy shit, this is in a browser?" reaction is the north star (from PROJECT.md core value)
- Warm analog pad sound should be immediately impressive — not a placeholder sine wave

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `public/apps/sound-pad.html`: Existing prototype with working drum synthesis, note system, and pad grid. Being replaced but useful as reference for keyboard mapping and CSS patterns
- `public/apps/index.html`: Apps landing page — needs a link card added for Tydal
- Portfolio CSS variables (--accent: #2A9D8F, fonts, etc.) can inform Tydal's design consistency if desired

### Established Patterns
- Portfolio uses inline styles in HTML files, no build step
- Server.js uses Express with Helmet CSP — cdn.jsdelivr.net already whitelisted for scripts
- No shared component system — each app is self-contained

### Integration Points
- `public/apps/index.html` or `public/apps.html`: Add link card to tydal.bradlannon.ca
- Tydal is a separate project at `Apps/Tydal/` — no shared code with portfolio

</code_context>

<deferred>
## Deferred Ideas

- Update ROADMAP.md and REQUIREMENTS.md to reflect name change (SoundForge → Tydal) and revised INTG-01/INTG-02 requirements
- Update PROJECT.md core value statement with new app name
- Determine Tydal's own deployment/hosting setup for tydal.bradlannon.ca

</deferred>

---

*Phase: 01-audio-foundation*
*Context gathered: 2026-03-15*
