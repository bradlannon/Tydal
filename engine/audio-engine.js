/**
 * engine/audio-engine.js
 *
 * AudioContext singleton with iOS lifecycle recovery.
 *
 * CRITICAL: This is the ONLY module that calls Tone.start().
 * No other module creates or starts an AudioContext.
 */

import * as Tone from 'tone';

let _started = false;

/**
 * Ensure AudioContext is in 'running' state.
 * Safe to call multiple times — no-ops if already running.
 * Handles iOS interrupted state by resetting _started flag.
 */
export async function ensureAudioStarted() {
  if (_started && Tone.getContext().rawContext.state === 'running') {
    return;
  }
  try {
    await Tone.start();
    _started = true;
  } catch (err) {
    console.error('[Tydal] Failed to start AudioContext:', err);
  }
}

// iOS interrupted state recovery:
// If the browser suspends the AudioContext (e.g. phone call, screen lock),
// reset our flag and notify the overlay so it can reappear.
Tone.getContext().rawContext.addEventListener('statechange', () => {
  if (Tone.getContext().rawContext.state !== 'running') {
    _started = false;
    document.dispatchEvent(new CustomEvent('audio-interrupted'));
  }
});
