# Testing Patterns

**Analysis Date:** 2026-03-14

## Test Framework

**Runner:**
- `vitest` v3.0.0
- Config: `vitest.config.ts`

**Assertion Library:**
- Built-in Vitest assertions via `expect`
- No separate assertion library needed

**Run Commands:**
```bash
npm run test              # Run all tests
npm run test -- --watch  # Watch mode (not in package.json but vitest supports it)
npm run test -- --coverage  # Coverage (not configured yet)
```

**TypeScript:**
- Tests written in TypeScript (`.test.ts` files)
- Type checking enabled via `tsconfig.app.json`

## Test File Organization

**Location:**
- Co-located in `src/__tests__/` directory
- Separate from source files for clarity

**Naming:**
- Test files: `{feature}.test.ts`
- Examples: `crop.test.ts`, `download.test.ts`, `editorStore.test.ts`

**Structure:**
```
src/
  __tests__/
    crop.test.ts
    download.test.ts
    editorStore.test.ts
    panZoom.test.ts
    resize.test.ts
  components/
  utils/
  hooks/
  store/
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, test, expect, beforeEach, vi } from 'vitest'
import { functionUnderTest } from '../path/to/function'

describe('functionUnderTest', () => {
  describe('specific behavior', () => {
    test('should do X when Y', () => {
      // Arrange
      const input = { /* ... */ }

      // Act
      const result = functionUnderTest(input)

      // Assert
      expect(result).toEqual(expectedValue)
    })
  })
})
```

**Patterns:**
- Nested `describe` blocks for related tests
- Flat test names: `test('converts percentage crop to pixel coordinates', () => {...})`
- Clear assertions: `expect(result).toEqual({ sx: 250, ... })`
- Test isolation: no shared mutable state between tests

## Mocking

**Framework:** Vitest `vi` module

**Patterns:**
```typescript
// Mock global objects
vi.stubGlobal('document', {
  createElement: vi.fn((tag: string) => {
    if (tag === 'canvas') return mockCanvas
    if (tag === 'a') return mockLink
    return {}
  }),
})

// Mock URL methods
vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
})

// Mock dependencies
vi.resetModules()
mockRenderToCanvas = vi.fn()
vi.doMock('../utils/canvas', () => ({
  renderToCanvas: mockRenderToCanvas,
}))
const { downloadImage } = await import('../utils/download')
```

**What to Mock:**
- Browser APIs: `document.createElement`, `URL.createObjectURL`
- Async operations: mocked with callbacks
- External dependencies: mocked to test in isolation

**What NOT to Mock:**
- Zustand store (use real store with `setState` in tests)
- Utility functions from the same module (test their actual behavior)
- Type definitions

## Fixtures and Factories

**Test Data:**
```typescript
// Inline objects
const crop = { x: 25, y: 25, width: 50, height: 50 }
const transforms: Transforms = { rotation: 0, flipH: false, flipV: false }

// From type defaults
import { defaultAdjustments, defaultCrop } from '../types/editor'
```

**Zustand Store Reset:**
```typescript
beforeEach(() => {
  useEditorStore.setState({
    sourceImage: null,
    transforms: { rotation: 0, flipH: false, flipV: false },
    adjustments: { ...defaultAdjustments },
    // ... reset all state
  })
})
```

**ImageBitmap Mock:**
```typescript
const source = { width: 800, height: 600 } as ImageBitmap
```

**Location:**
- Fixtures defined inline in test file
- Reusable objects imported from `src/types/editor`
- No separate fixtures directory

## Coverage

**Requirements:** Not enforced

**View Coverage:**
- Not configured yet; would use `npm run test -- --coverage` once configured

**Current Test Files:**
- `src/__tests__/crop.test.ts` - 48 tests covering crop utilities
- `src/__tests__/download.test.ts` - 8 tests for download functionality
- `src/__tests__/editorStore.test.ts` - Tests for state management
- `src/__tests__/panZoom.test.ts` - Pan/zoom interaction tests
- `src/__tests__/resize.test.ts` - Image resize functionality

## Test Types

**Unit Tests:**
- Scope: Individual utility functions
- Approach: Pure function testing with known inputs/outputs
- Example: `crop.test.ts` tests crop coordinate transformations
- Files: `src/__tests__/crop.test.ts`, `src/__tests__/panZoom.test.ts`

**Integration Tests:**
- Scope: Store actions, hooks with multiple dependencies
- Approach: Test store state changes from user actions
- Example: `editorStore.test.ts` tests rotate/flip operations
- Files: `src/__tests__/editorStore.test.ts`

**E2E Tests:**
- Not present in codebase
- Browser-based testing would require separate setup (Playwright/Cypress)

## Common Patterns

**Async Testing:**
```typescript
test('async operation', async () => {
  // Use async/await in test function
  const result = await someAsyncFunction()
  expect(result).toBeDefined()
})

// Or callback-based:
test('toBlob callback', async () => {
  vi.resetModules()
  const { downloadImage } = await import('../utils/download')

  downloadImage(source, transforms, adjustments, format, quality)

  // Simulate callback
  const blob = new Blob(['fake'], { type: 'image/jpeg' })
  blobCallback!(blob)

  expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
})
```

**Parametric Testing (Implicit):**
```typescript
// Multiple similar tests instead of parametric
test('converts percentage crop to pixel coordinates', () => {
  const result = cropToPixels({ x: 25, y: 25, width: 50, height: 50 }, 1000, 800)
  expect(result).toEqual({ sx: 250, sy: 200, sw: 500, sh: 400 })
})

test('full image crop returns full dimensions', () => {
  const result = cropToPixels({ x: 0, y: 0, width: 100, height: 100 }, 1000, 800)
  expect(result).toEqual({ sx: 0, sy: 0, sw: 1000, sh: 800 })
})
```

**Numerical Assertions:**
```typescript
// For floating point comparisons
expect(result.height).toBeCloseTo(28.125, 1)  // 1 decimal place

// For ranges
expect(result.width).toBeGreaterThanOrEqual(1)
expect(result.x + result.width).toBeLessThanOrEqual(100)
```

**Mock Verification:**
```typescript
expect(document.createElement).toHaveBeenCalledWith('canvas')
expect(mockCanvas.getContext).toHaveBeenCalledWith('2d')
expect(mockCanvas.toBlob).toHaveBeenCalledWith(
  expect.any(Function),
  'image/jpeg',
  0.75
)
expect(mockLink.click).toHaveBeenCalled()
```

**Conditional Assertions:**
```typescript
test('only one canvas created for PNG + mask', () => {
  downloadImage(source, transforms, adjustments, 'image/png', 1, file, undefined, fakeMask)
  expect(canvasCreateCount).toBe(1)
  expect(mockCanvas.toBlob).toHaveBeenCalled()
})

test('two canvases for JPEG + mask', () => {
  downloadImage(source, transforms, adjustments, 'image/jpeg', 0.85, file, undefined, fakeMask)
  expect(canvasCreateCount).toBe(2)
  expect(mockWhiteCanvas.toBlob).toHaveBeenCalled()
  expect(mockCanvas.toBlob).not.toHaveBeenCalled()
})
```

**Error Testing:**
```typescript
test('rejects unsupported file type', async () => {
  const file = new File(['data'], 'test.bmp', { type: 'image/bmp' })

  try {
    await loadImage(file)
    expect.fail('should have thrown')
  } catch (err) {
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).toInclude('Unsupported file type')
  }
})
```

## Environment Configuration

**Setup:**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,           // describe/test/expect available without import
    environment: 'jsdom',    // DOM API simulation
    setupFiles: [],          // No global setup needed yet
  },
})
```

**Global Variables:**
- `describe`, `test`, `expect`, `vi`, `beforeEach`, `afterEach` available globally
- No manual imports needed in test files

## Best Practices Observed

1. **Test isolation**: Each test can run independently; no shared state leakage
2. **Clear naming**: Test names describe expected behavior, not implementation
3. **AAA pattern**: Arrange, Act, Assert structure visible in test flow
4. **Mocking discipline**: Only mock what's necessary; prefer testing real implementations
5. **Type safety**: Tests are written in TypeScript with full type checking
6. **Focused assertions**: Each test validates one behavior primarily
7. **Resource cleanup**: `beforeEach` resets store state; DOM cleanup implicit with jsdom

---

*Testing analysis: 2026-03-14*
