# Coding Conventions

**Analysis Date:** 2026-03-14

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `Canvas.tsx`, `DropZone.tsx`)
- Utilities: camelCase with `.ts` extension (e.g., `canvas.ts`, `crop.ts`)
- Hooks: camelCase with `use` prefix (e.g., `useImageLoader.ts`, `useRenderPipeline.ts`)
- Types: camelCase with `.ts` extension (e.g., `editor.ts`)
- Tests: same name as source with `.test.ts` suffix in `__tests__/` directory (e.g., `src/__tests__/crop.test.ts`)

**Functions:**
- Hooks start with `use` prefix: `useEditorStore`, `useImageLoader`
- Utility functions use camelCase: `renderToCanvas`, `buildFilterString`, `cropToPixels`
- React components are PascalCase: `Canvas`, `DropZone`, `Editor`
- Event handlers prefixed with `handle`: `handleFile`, `handleWheel`, `handlePointerDown`

**Variables:**
- Local state and constants: camelCase (e.g., `sourceImage`, `canvasRef`, `dragOver`)
- References and DOM elements: `*Ref` suffix (e.g., `canvasRef`, `containerRef`, `inputRef`)
- Component props destructured inline
- State variables from Zustand: accessed via selector functions (e.g., `const sourceImage = useEditorStore((s) => s.sourceImage)`)

**Types:**
- Interfaces: PascalCase with optional `I` prefix convention not used (e.g., `Transforms`, `Adjustments`, `CropRegion`)
- Type aliases: PascalCase (e.g., `Transforms`)
- Generic type parameters: single uppercase letters (e.g., `<T>`)

## Code Style

**Formatting:**
- Installed but no `.prettierrc` or explicit prettier config found
- Manual code follows consistent patterns: 2-space indentation, semicolons present
- Line length: practical limit around 100-120 characters based on existing code

**Linting:**
- Tool: ESLint with TypeScript support
- Config: `eslint.config.js` (flat config format)
- Key rules active:
  - `@eslint/js:recommended` - Core ESLint rules
  - `typescript-eslint:recommended` - TypeScript strict checks
  - `eslint-plugin-react-hooks:recommended` - React Hooks rules
  - `eslint-plugin-react-refresh:vite` - Vite HMR compatibility

**TypeScript Strictness:**
- `strict: true` - Full strict mode enabled
- `noUnusedLocals: true` - Errors on unused variables
- `noUnusedParameters: true` - Errors on unused function parameters
- `noFallthroughCasesInSwitch: true` - Requires breaks in switch cases
- Target: `ES2023` with `moduleResolution: bundler`

## Import Organization

**Order:**
1. React/third-party frameworks (e.g., `import { useState, useRef } from 'react'`)
2. Type imports (e.g., `import type { Transforms } from '../types/editor'`)
3. Custom hooks (e.g., `import { useEditorStore } from '../store/editorStore'`)
4. Utility functions (e.g., `import { renderToCanvas } from '../utils/canvas'`)
5. Components (e.g., `import { DropZone } from './DropZone'`)
6. CSS files (e.g., `import './index.css'`)

**Path Aliases:**
- Not used (standard relative paths throughout)
- Relative imports: `../` used to traverse directories

**Type-only imports:**
- Always use `import type` for type-only imports to satisfy `verbatimModuleSyntax: true`
- Example: `import type { Transforms, CropRegion } from '../types/editor'`

## Error Handling

**Patterns:**
- Try-catch for async operations: `try { ... } catch (err) { } finally { }`
- Error checking before operations: `if (!file) return;`
- Default error messages: `err instanceof Error ? err.message : 'Failed to load image'`
- Store error state in component: `const [error, setError] = useState<string | null>(null)`
- User-facing errors displayed conditionally: `{error && <p>{error}</p>}`

**Canvas/Graphics Errors:**
- Defensive checks before context operations: `if (!canvas || !container) return;`
- Null-coalescing for DOM access: `const ctx = context || offscreenCtx.getContext('2d')!`
- Resource cleanup: `if (old) old.close()` for ImageBitmap cleanup

## Logging

**Framework:** `console` (no logging library)

**Patterns:**
- Minimal logging in production code
- Error logging only for user-facing errors
- No debug logging statements in component render
- Comments preferred over console.log for explanatory notes

## Comments

**When to Comment:**
- Complex math or transformations: See `src/utils/canvas.ts` canvas transformation comments
- Non-obvious algorithm steps: Example "Step 1: Render source with rotation/flip onto offscreen canvas"
- Workaround explanations: Example about EXIF orientation auto-correction
- State management gotchas: Example about zoom/pan state reads from store

**JSDoc/TSDoc:**
- Not used systematically
- Function signatures are self-documenting via TypeScript
- Complex functions have inline comments explaining logic

## Function Design

**Size:**
- Hooks: 15-60 lines typical (e.g., `useImageLoader` is 25 lines)
- Utility functions: 5-40 lines typical
- Components: 50-150 lines for complex components; simple wrappers 10-30 lines
- Event handlers: 2-15 lines typically

**Parameters:**
- Event handlers destructure parameters: `(e: React.DragEvent) => { e.preventDefault(); }`
- Callback dependencies tracked carefully in `useCallback` deps array
- Props destructured in function signature or body
- Store selectors use inline arrow functions: `useEditorStore((s) => s.sourceImage)`

**Return Values:**
- Hooks return objects with related properties: `{ bitmap, wasDownscaled }`
- Utility functions return single values or typed objects
- React components return JSX (implied return type)
- Void operations explicit: `useCallback(() => { ... }, [])`

## Module Design

**Exports:**
- Named exports for utilities and hooks: `export function loadImage(...)`
- Named exports for components: `export function Canvas() { }`
- Default export used only for main App component: `export default App;`
- Type exports use `export type`: `export type Transforms = {...}`

**Barrel Files:**
- Not used (files imported directly)
- Each component/utility in own file

## React-Specific Patterns

**Hooks:**
- `useState` for local UI state
- `useRef` for DOM references and non-state values
- `useCallback` for event handlers and memoized functions
- `useEffect` for side effects (resize observers, event listeners)
- Custom hooks extract reusable logic: `useImageLoader`, `useRenderPipeline`
- Zustand store accessed via custom hook: `const sourceImage = useEditorStore((s) => s.sourceImage)`

**State Management:**
- Zustand (`zustand` package) for global editor state
- Store defined in `src/store/editorStore.ts`
- Actions are synchronous and immutable: uses spread operator for updates
- Selectors used to extract needed state

**Component Structure:**
- Functional components only
- Props destructured inline: `export function DropZone() {`
- Event handler definitions at component level before return
- Conditional rendering with ternary: `sourceImage ? <Editor /> : <DropZone />`
- No prop drilling; use store for shared state

**Styling:**
- Tailwind CSS utility classes inline
- Classes built conditionally: `${dragOver ? 'border-dashed' : 'border-solid'}`
- Template literals for complex conditions
- Color tokens use hex values from theme

---

*Convention analysis: 2026-03-14*
