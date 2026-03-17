/**
 * ui/encoder.js
 *
 * Rotary encoder web component factory.
 * Creates a circular drag-to-rotate knob that dispatches encoder-start,
 * encoder-end, and calls onChange(value) during interaction.
 *
 * The indicator dot rotates from 7 o'clock (min) to 5 o'clock (max)
 * spanning a 300-degree arc — matching real hardware encoder feel.
 */

/**
 * Map a value in [min, max] to a rotation angle in degrees.
 * 7 o'clock = -150 degrees, 5 o'clock = +150 degrees (300-degree arc).
 */
function valueToAngle(value, min, max) {
  const ratio = (value - min) / (max - min);
  return -150 + ratio * 300;
}

/**
 * createEncoder(config) — factory function.
 *
 * @param {Object} config
 * @param {string} config.name         - Parameter name
 * @param {number} config.min          - Minimum value
 * @param {number} config.max          - Maximum value
 * @param {number} config.value        - Initial value
 * @param {number} config.step         - Step size (used for display precision)
 * @param {Function} config.onChange   - Called with new value during drag
 * @returns {HTMLElement} Encoder DOM element with getValue() / setValue() methods
 */
export function createEncoder({ name, min, max, value, step = 0.01, onChange }) {
  const el = document.createElement('div');
  el.className = 'encoder';
  el.dataset.name = name;
  el.dataset.value = value;

  // Dot arm: a full-size transparent overlay that rotates around the encoder
  // center, with the visible dot at the top. This approach works at any size.
  const dotArm = document.createElement('div');
  dotArm.className = 'encoder-dot-arm';
  dotArm.style.cssText = [
    'position:absolute',
    'inset:0',
    'border-radius:50%',
    'pointer-events:none',
  ].join(';');

  const dot = document.createElement('div');
  dot.className = 'encoder-dot';
  // Dot positioned at the top of the arm, horizontally centered
  dot.style.cssText = [
    'position:absolute',
    'width:4px',
    'height:4px',
    'border-radius:50%',
    'background:#555',
    'top:4px',
    'left:50%',
    'transform:translateX(-50%)',
  ].join(';');

  dotArm.appendChild(dot);
  el.appendChild(dotArm);

  // Tiny label below (will be sibling in encoder-row, but keep reference)
  let currentValue = value;

  function updateVisual(val) {
    const angle = valueToAngle(val, min, max);
    // Rotate the arm around the encoder center (transform-origin defaults to 50% 50%)
    dotArm.style.transform = `rotate(${angle}deg)`;
  }

  function setDotActive(active) {
    dot.style.background = active ? '#fff' : '#555';
  }

  // Pointer drag state
  let dragging = false;
  let startY = 0;
  let startValue = 0;

  function clamp(v) {
    return Math.min(max, Math.max(min, v));
  }

  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    dragging = true;
    startY = e.clientY;
    startValue = currentValue;
    el.classList.add('active');
    setDotActive(true);
    el.dispatchEvent(new CustomEvent('encoder-start', { bubbles: true, detail: { name, value: currentValue } }));
  });

  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    // Upward drag = increase value; downward = decrease
    // 200px = full range
    const dy = startY - e.clientY;
    const delta = (dy / 200) * (max - min);
    const newValue = clamp(startValue + delta);
    currentValue = newValue;
    el.dataset.value = newValue;
    updateVisual(newValue);
    if (onChange) onChange(newValue);
  });

  const onPointerEnd = (_e) => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('active');
    setDotActive(false);
    el.dispatchEvent(new CustomEvent('encoder-end', { bubbles: true, detail: { name, value: currentValue } }));
  };

  el.addEventListener('pointerup', onPointerEnd);
  el.addEventListener('pointercancel', onPointerEnd);

  // Public API
  el.getValue = () => currentValue;

  el.setValue = (v) => {
    currentValue = clamp(v);
    el.dataset.value = currentValue;
    updateVisual(currentValue);
  };

  // Initial visual
  updateVisual(currentValue);

  return el;
}
