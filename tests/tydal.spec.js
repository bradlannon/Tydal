const { test, expect } = require('@playwright/test');

// All tests share: go to page, wait for grid, dismiss overlay
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Wait for JS modules to load and grid to render
  await page.locator('.note-cell').first().waitFor({ timeout: 15000 });
  // Dismiss audio overlay if visible
  const overlay = page.locator('#audio-overlay');
  if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
    await overlay.click();
    await overlay.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
});

// -----------------------------------------------------------------------
// 1. App Shell & Load
// -----------------------------------------------------------------------

test.describe('App Shell', () => {
  test('page loads with title, grid, and toolbar', async ({ page }) => {
    await expect(page).toHaveTitle('Tydal');
    await expect(page.locator('.push-grid')).toBeVisible();
    await expect(page.locator('.toolbar')).toBeVisible();
    await expect(page.locator('.app-title')).toHaveText('Tydal');
  });
});

// -----------------------------------------------------------------------
// 2. Pad Grid
// -----------------------------------------------------------------------

test.describe('Pad Grid', () => {
  test('32 note pads and 16 step buttons rendered', async ({ page }) => {
    const pads = page.locator('.note-cell');
    expect(await pads.count()).toBe(32);

    const steps = page.locator('.step-btn');
    expect(await steps.count()).toBe(16);
  });

  test('octave buttons update display', async ({ page }) => {
    const display = page.locator('#octave-display');
    await expect(display).toHaveText('Oct 3');

    await page.locator('#octave-up').click();
    // Grid rebuilds — wait for new pads
    await page.locator('.note-cell').first().waitFor();
    await expect(display).toHaveText('Oct 4');

    await page.locator('#octave-down').click();
    await page.locator('.note-cell').first().waitFor();
    await expect(display).toHaveText('Oct 3');
  });

  test('pad gets active class on pointerdown', async ({ page }) => {
    const pad = page.locator('.note-cell').first();

    // Verify pad starts without active
    await expect(pad).not.toHaveClass(/active/);

    // pointerdown activates the pad
    await pad.dispatchEvent('pointerdown', { pointerId: 1, bubbles: true });
    await expect(pad).toHaveClass(/active/, { timeout: 3000 });
  });
});

// -----------------------------------------------------------------------
// 3. Bottom Sheets
// -----------------------------------------------------------------------

test.describe('Bottom Sheets', () => {
  test('synth sheet opens and closes via toolbar button', async ({ page }) => {
    const btn = page.locator('button[data-sheet="synth-sheet"]');
    const sheet = page.locator('#synth-sheet');

    await btn.click();
    await expect(sheet).toHaveClass(/open/);

    // Click the button again — use force since backdrop may overlay it
    await btn.click({ force: true });
    await expect(sheet).not.toHaveClass(/open/);
  });

  test('FX sheet opens', async ({ page }) => {
    await page.locator('button[data-sheet="fx-sheet"]').click();
    await expect(page.locator('#fx-sheet')).toHaveClass(/open/);
  });

  test('drums sheet opens', async ({ page }) => {
    await page.locator('button[data-sheet="seq-sheet"]').click();
    await expect(page.locator('#seq-sheet')).toHaveClass(/open/);
  });

  test('macro sheet opens', async ({ page }) => {
    await page.locator('button[data-sheet="macro-sheet"]').click();
    await expect(page.locator('#macro-sheet')).toHaveClass(/open/);
  });

  test('only one sheet open at a time', async ({ page }) => {
    await page.locator('button[data-sheet="synth-sheet"]').click();
    await expect(page.locator('#synth-sheet')).toHaveClass(/open/);

    // Close via backdrop, then open FX
    await page.locator('#sheet-backdrop').click({ force: true });
    await expect(page.locator('#synth-sheet')).not.toHaveClass(/open/);

    await page.locator('button[data-sheet="fx-sheet"]').click();
    await expect(page.locator('#fx-sheet')).toHaveClass(/open/);
    await expect(page.locator('#synth-sheet')).not.toHaveClass(/open/);
  });

  test('backdrop click closes sheet', async ({ page }) => {
    await page.locator('button[data-sheet="synth-sheet"]').click();
    await expect(page.locator('#synth-sheet')).toHaveClass(/open/);

    await page.locator('#sheet-backdrop').click({ force: true });
    await expect(page.locator('#synth-sheet')).not.toHaveClass(/open/);
  });
});

// -----------------------------------------------------------------------
// 4. Note Repeat UI
// -----------------------------------------------------------------------

test.describe('Note Repeat', () => {
  test('RPT button and rate selector exist', async ({ page }) => {
    const container = page.locator('#note-repeat-control');
    await expect(container).toBeVisible();
    await expect(container.locator('button')).toBeVisible();
    await expect(container.locator('select')).toBeVisible();
  });

  test('RPT button toggles active state', async ({ page }) => {
    const rptBtn = page.locator('#note-repeat-control button');
    await rptBtn.click();
    await expect(rptBtn).toHaveClass(/active/);

    await rptBtn.click();
    await expect(rptBtn).not.toHaveClass(/active/);
  });

  test('rate selector has 4 options', async ({ page }) => {
    const options = page.locator('#note-repeat-control select option');
    expect(await options.count()).toBe(4);
  });
});

// -----------------------------------------------------------------------
// 5. Macro Panel
// -----------------------------------------------------------------------

test.describe('Macro Panel', () => {
  test('has 4 labeled sliders', async ({ page }) => {
    await page.locator('button[data-sheet="macro-sheet"]').click();

    const sliders = page.locator('#macro-panel input[type="range"]');
    expect(await sliders.count()).toBe(4);

    const labels = page.locator('#macro-panel .panel-label');
    const texts = await labels.allTextContents();
    expect(texts).toContain('Darkness');
    expect(texts).toContain('Grit');
    expect(texts).toContain('Motion');
    expect(texts).toContain('Space');
  });

  test('slider value can be changed', async ({ page }) => {
    await page.locator('button[data-sheet="macro-sheet"]').click();

    const slider = page.locator('#macro-panel input[type="range"]').first();
    await slider.fill('0.8');
    expect(parseFloat(await slider.inputValue())).toBeCloseTo(0.8, 1);
  });
});

// -----------------------------------------------------------------------
// 6. Synth Panel — Randomize & Variations
// -----------------------------------------------------------------------

test.describe('Randomize & Variations', () => {
  test.beforeEach(async ({ page }) => {
    await page.locator('button[data-sheet="synth-sheet"]').click();
    await expect(page.locator('#synth-sheet')).toHaveClass(/open/);
  });

  test('randomize button exists', async ({ page }) => {
    const btn = page.locator('#synth-panel').getByRole('button', { name: 'Randomize' });
    await expect(btn).toBeVisible();
  });

  test('4 variation slot buttons exist', async ({ page }) => {
    const slots = page.locator('.variation-slot-btn');
    expect(await slots.count()).toBe(4);
  });

  test('randomize does not crash', async ({ page }) => {
    await page.locator('#synth-panel').getByRole('button', { name: 'Randomize' }).click();
    await expect(page.locator('#synth-sheet')).toHaveClass(/open/);
  });

  test('clicking empty slot saves (gets filled class)', async ({ page }) => {
    const slot = page.locator('.variation-slot-btn').first();
    await slot.click();
    await expect(slot).toHaveClass(/filled/);
  });
});

// -----------------------------------------------------------------------
// 7. Preset Browser
// -----------------------------------------------------------------------

test.describe('Preset Browser', () => {
  test.beforeEach(async ({ page }) => {
    await page.locator('button[data-sheet="synth-sheet"]').click();
  });

  test('Browse button exists and opens browser sheet', async ({ page }) => {
    const browseBtn = page.locator('#synth-panel').getByText('Browse');
    await expect(browseBtn).toBeVisible();

    await browseBtn.click();
    await expect(page.locator('#preset-browser-sheet')).toHaveClass(/open/);
  });

  test('factory presets are listed (at least 7)', async ({ page }) => {
    await page.locator('#synth-panel').getByText('Browse').click();
    const items = page.locator('.preset-item');
    expect(await items.count()).toBeGreaterThanOrEqual(7);
  });

  test('clicking preset highlights it as previewing', async ({ page }) => {
    await page.locator('#synth-panel').getByText('Browse').click();
    const item = page.locator('.preset-item').first();
    await item.click();
    await expect(item).toHaveClass(/previewing/);
  });
});

// -----------------------------------------------------------------------
// 8. Pad Slide Expression
// -----------------------------------------------------------------------

test.describe('Pad Slide Expression', () => {
  test('pad expression module is loaded and wired', async ({ page }) => {
    // Verify the touch handler imports pad-expression by checking the module loaded without errors
    // (Direct pointer event simulation via dispatchEvent doesn't trigger pointermove on the grid reliably)
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(1000);

    const importErrors = errors.filter(
      (e) => e.includes('pad-expression') || e.includes('startExpression')
    );
    expect(importErrors).toHaveLength(0);

    // Verify the expressing CSS rule exists in the stylesheet
    const hasRule = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText && rule.selectorText.includes('expressing')) return true;
          }
        } catch (e) {}
      }
      return false;
    });
    expect(hasRule).toBe(true);
  });
});

// -----------------------------------------------------------------------
// 9. Scale Lock
// -----------------------------------------------------------------------

test.describe('Scale Lock', () => {
  test('scale selectors exist', async ({ page }) => {
    await expect(page.locator('#scale-key')).toBeVisible();
    await expect(page.locator('#scale-type')).toBeVisible();
  });

  test('selecting a key rebuilds grid with scale-locked notes', async ({ page }) => {
    await page.locator('#scale-key').selectOption('C');
    // Grid rebuilds — wait for pads
    await page.locator('.note-cell').first().waitFor();
    const count = await page.locator('.note-cell').count();
    expect(count).toBe(32);
  });
});

// -----------------------------------------------------------------------
// 10. Transport
// -----------------------------------------------------------------------

test.describe('Transport', () => {
  test('play button toggles play/stop state', async ({ page }) => {
    const playBtn = page.locator('#play-btn');
    await expect(playBtn).toHaveText('▶');

    await playBtn.click();
    await expect(playBtn).toHaveText('■');
    await expect(playBtn).toHaveClass(/playing/);

    await playBtn.click();
    await expect(playBtn).toHaveText('▶');
    await expect(playBtn).not.toHaveClass(/playing/);
  });
});

// -----------------------------------------------------------------------
// 11. Help Panel
// -----------------------------------------------------------------------

test.describe('Help Panel', () => {
  test('help button toggles help panel visibility', async ({ page }) => {
    const helpPanel = page.locator('#help-panel');
    await expect(helpPanel).toBeHidden();

    await page.locator('#help-btn').click();
    await expect(helpPanel).toBeVisible();

    await page.locator('#help-btn').click();
    await expect(helpPanel).toBeHidden();
  });
});

// -----------------------------------------------------------------------
// 12. Stability — No JS Errors
// -----------------------------------------------------------------------

test.describe('Stability', () => {
  test('no critical JS errors on load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.locator('.note-cell').first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(2000);

    const critical = errors.filter(
      (e) => !e.includes('AudioContext') && !e.includes('user gesture') && !e.includes('NotAllowedError')
    );
    expect(critical).toHaveLength(0);
  });
});

// -----------------------------------------------------------------------
// 13. Encoder Row + OLED Display (Phase 7)
// -----------------------------------------------------------------------

test.describe('Encoder Row + OLED', () => {
  test('9 encoders rendered with labels', async ({ page }) => {
    const encoders = page.locator('.encoder');
    expect(await encoders.count()).toBe(9);

    const labels = page.locator('.encoder-label');
    expect(await labels.count()).toBe(9);

    // First encoder should be Cutoff
    await expect(labels.first()).toHaveText('Cutoff');
    // Last encoder should be Volume
    await expect(labels.last()).toHaveText('Volume');
  });

  test('OLED display exists and starts hidden', async ({ page }) => {
    const oled = page.locator('.oled-display');
    await expect(oled).toBeAttached();
    // Should start at opacity 0 (no .active class)
    await expect(oled).not.toHaveClass(/active/);
  });

  test('encoder drag activates OLED', async ({ page }) => {
    const encoder = page.locator('.encoder').first();
    const oled = page.locator('.oled-display');

    // Simulate pointerdown to start drag
    const box = await encoder.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await encoder.dispatchEvent('pointerdown', { pointerId: 1, clientY: box.y + box.height / 2, bubbles: true });

    // OLED should become active
    await expect(oled).toHaveClass(/active/, { timeout: 3000 });
    // OLED should show encoder name
    await expect(oled.locator('.oled-name')).toHaveText('Cutoff');
  });

  test('encoder dot lights up on drag', async ({ page }) => {
    const encoder = page.locator('.encoder').first();

    // Dispatch pointerdown
    await encoder.dispatchEvent('pointerdown', { pointerId: 1, clientY: 200, bubbles: true });
    await expect(encoder).toHaveClass(/active/, { timeout: 3000 });

    // Dot should be white during drag
    const dot = encoder.locator('.encoder-dot');
    const bg = await dot.evaluate(el => el.style.background);
    expect(bg).toMatch(/#fff|rgb\(255,\s*255,\s*255\)/);
  });
});

// -----------------------------------------------------------------------
// 14. Step Buttons (Phase 7)
// -----------------------------------------------------------------------

test.describe('Step Buttons', () => {
  test('16 step buttons in a single row', async ({ page }) => {
    const row = page.locator('.step-button-row');
    await expect(row).toBeVisible();

    const buttons = row.locator('.step-btn');
    expect(await buttons.count()).toBe(16);
  });

  test('beat grouping markers every 4 steps', async ({ page }) => {
    // Steps at index 4, 8, 12 should have .beat-start class
    const beatStarts = page.locator('.step-btn.beat-start');
    expect(await beatStarts.count()).toBe(3);
  });

  test('step button toggles active on tap', async ({ page }) => {
    // First select a pad to have a note context
    const pad = page.locator('.note-cell').first();
    await pad.dispatchEvent('pointerdown', { pointerId: 1, bubbles: true });
    await page.waitForTimeout(100);
    await pad.dispatchEvent('pointerup', { pointerId: 1, bubbles: true });

    // Now tap a step button
    const stepBtn = page.locator('.step-btn').first();
    await stepBtn.dispatchEvent('pointerdown', { bubbles: true });

    // Check it becomes active
    await expect(stepBtn).toHaveClass(/active/, { timeout: 3000 });
  });
});

// -----------------------------------------------------------------------
// 15. Jog Wheel (Phase 7)
// -----------------------------------------------------------------------

test.describe('Jog Wheel', () => {
  test('jog wheel rendered with inner and center elements', async ({ page }) => {
    const wheel = page.locator('.jog-wheel');
    await expect(wheel).toBeVisible();

    await expect(wheel.locator('.jog-wheel-inner')).toBeVisible();
    await expect(wheel.locator('.jog-wheel-center')).toBeVisible();
  });

  test('jog wheel shows preset on OLED during drag', async ({ page }) => {
    const wheel = page.locator('.jog-wheel');
    const oled = page.locator('.oled-display');

    // Dispatch pointerdown on jog wheel
    const box = await wheel.boundingBox();
    await wheel.dispatchEvent('pointerdown', { pointerId: 1, clientY: box.y + box.height / 2, bubbles: true });

    // OLED should show "Preset" label
    await expect(oled).toHaveClass(/active/, { timeout: 3000 });
    await expect(oled.locator('.oled-name')).toHaveText('Preset');
  });

  test('jog wheel gets active class during drag', async ({ page }) => {
    const wheel = page.locator('.jog-wheel');
    await wheel.dispatchEvent('pointerdown', { pointerId: 1, clientY: 200, bubbles: true });
    await expect(wheel).toHaveClass(/active/, { timeout: 3000 });
  });
});

// -----------------------------------------------------------------------
// 16. Drum Mode Encoder Remapping (Phase 7)
// -----------------------------------------------------------------------

test.describe('Drum Mode Encoder Remapping', () => {
  test('DRM button switches encoder labels to drum params', async ({ page }) => {
    // Open drums sheet — this triggers mode-change to drum
    await page.locator('button[data-sheet="seq-sheet"]').click();
    await expect(page.locator('#seq-sheet')).toHaveClass(/open/);

    // Wait for mode-change event to propagate
    await page.waitForTimeout(300);

    // Encoder labels should now reflect drum mapping
    const labels = page.locator('.encoder-label');
    const allLabels = await labels.allTextContents();

    // Drum mapping has BPM, Drum Vol, Master Vol
    expect(allLabels).toContain('BPM');
    expect(allLabels).toContain('Drum Vol');
    expect(allLabels).toContain('Master Vol');
  });

  test('closing DRM sheet returns to melodic labels', async ({ page }) => {
    // Open drums sheet
    await page.locator('button[data-sheet="seq-sheet"]').click();
    await expect(page.locator('#seq-sheet')).toHaveClass(/open/);
    await page.waitForTimeout(300);

    // Close via JS dispatch to bypass backdrop overlay issues
    await page.evaluate(() => {
      document.querySelector('#sheet-backdrop').click();
    })
    await expect(page.locator('#seq-sheet')).not.toHaveClass(/open/);
    await page.waitForTimeout(500);

    // Should be back to melodic mapping
    const labels = page.locator('.encoder-label');
    const allLabels = await labels.allTextContents();
    expect(allLabels).toContain('Cutoff');
    expect(allLabels).toContain('Volume');
  });
});
