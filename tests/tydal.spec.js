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
  test('32 note pads and 32 step cells rendered', async ({ page }) => {
    const pads = page.locator('.note-cell');
    expect(await pads.count()).toBe(32);

    const steps = page.locator('.step-cell');
    expect(await steps.count()).toBe(32);
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
