/**
 * ui/gyro-panel.js
 *
 * Gyroscope enable toggle and iOS permission button for the controls bar.
 *
 * Renders a single toggle button:
 *   - "Gyro: Off" / "Gyro: On" (teal text when active, matching octave-btn style)
 *   - "Gyro: N/A" (disabled) when DeviceOrientationEvent is not available
 *
 * On first enable (iOS): triggers DeviceOrientationEvent.requestPermission().
 * If denied, shows a brief inline message.
 */

import { requestPermission, initGyroscope, setGyroActive, isGyroActive } from '../input/gyroscope.js';

/**
 * Initialize the gyro panel in the given container element.
 *
 * @param {HTMLElement} containerEl — typically <div id="gyro-panel">
 */
export function initGyroPanel(containerEl) {
  if (!containerEl) return;

  // Check if gyroscope is available at all
  const gyroAvailable = typeof DeviceOrientationEvent !== 'undefined';

  // Create toggle button
  const btn = document.createElement('button');
  btn.className = 'gyro-btn octave-btn';
  btn.setAttribute('aria-label', 'Toggle gyroscope control');

  if (!gyroAvailable) {
    btn.textContent = 'Gyro: N/A';
    btn.disabled = true;
    btn.classList.add('gyro-btn--unavailable');
    containerEl.appendChild(btn);
    return;
  }

  // Permission has not been requested yet on first use
  let permissionRequested = false;

  function updateLabel() {
    btn.textContent = isGyroActive() ? 'Gyro: On' : 'Gyro: Off';
    btn.classList.toggle('gyro-btn--active', isGyroActive());
  }

  updateLabel();

  btn.addEventListener('click', async () => {
    if (isGyroActive()) {
      // Disable gyro
      setGyroActive(false);
      updateLabel();
      return;
    }

    // Enable gyro — request permission on first use
    if (!permissionRequested) {
      permissionRequested = true;
      const granted = await requestPermission();

      if (!granted) {
        // Show inline denial message
        showDeniedMessage(containerEl);
        permissionRequested = false; // Allow retry
        return;
      }

      initGyroscope();
    }

    setGyroActive(true);
    updateLabel();
  });

  containerEl.appendChild(btn);
}

/**
 * Show a brief inline message when iOS motion permission is denied.
 * Auto-dismisses after 4 seconds.
 *
 * @param {HTMLElement} containerEl
 */
function showDeniedMessage(containerEl) {
  // Remove any existing message
  const existing = containerEl.querySelector('.gyro-denied-msg');
  if (existing) existing.remove();

  const msg = document.createElement('span');
  msg.className = 'gyro-denied-msg';
  msg.textContent = 'Motion access denied — check Settings > Safari';
  containerEl.appendChild(msg);

  setTimeout(() => msg.remove(), 4000);
}
