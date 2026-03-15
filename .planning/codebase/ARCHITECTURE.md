# Architecture

**Analysis Date:** 2026-03-14

## Pattern Overview

**Overall:** Static Single-Page Application (SPA) with specialized dashboard galleries, served by a lightweight Express.js proxy with security headers and cross-origin isolation.

**Key Characteristics:**
- Server-side static file serving with security middleware
- Client-side routing via HTML pages (not JavaScript routing)
- Shared design system across all pages (CSS variables, common components)
- Specialized visualizations per domain (data dashboards, web apps, portfolio pieces)
- Progressive enhancement: works without JavaScript for navigation
- Modular theme system: each dashboard can override CSS variables for domain-specific theming

## Layers

**Server Layer:**
- Purpose: Provide secure static asset delivery, cross-origin isolation for specialized apps, security headers
- Location: `/server.js`
- Contains: Express.js application with middleware stack
- Depends on: `express`, `compression`, `helmet`
- Used by: All requests from clients

**Presentation Layer:**
- Purpose: Render UI and handle client-side interactivity
- Location: `/public/**/*.html`
- Contains: Self-contained HTML files with embedded inline CSS and JavaScript
- Depends on: Chart.js (CDN), Google Fonts (CDN), Web Audio API, CORS-enabled external APIs
- Used by: Browser clients

**Dashboard Components:**
- Purpose: Domain-specific data visualizations and exploratory interfaces
- Location: `/public/portfolios/dashboard-*.html` (15 dashboards)
- Contains: Embedded Charts (Chart.js), SVG diagrams, interactive sliders, data tables
- Depends on: Chart.js 4.4.1 (CDN), user interaction state
- Used by: Portfolio section of main site

**Interactive Apps:**
- Purpose: Specialized applications showcasing web platform capabilities
- Location: `/public/apps/*/index.html`
- Contains: Bundled React/Vite apps, Web Workers, WASM modules
- Depends on: Built artifact bundles (JS/CSS), external ML models, Web APIs
- Used by: Apps section of portfolio

**Portfolio Hub:**
- Purpose: Gallery and navigation hub for all content
- Location: `/public/index.html`, `/public/apps.html`, `/public/av.html`
- Contains: Navigation structure, portfolio cards, section headers
- Depends on: Shared CSS variables, links to dashboards and apps
- Used by: Entry points to the site

## Data Flow

**User Navigation:**

1. User requests route (e.g., `/portfolios/dashboard-carbon.html`)
2. Express server receives request, applies security headers
3. For `/apps/webimager`: Cross-Origin-Embedder-Policy set to `credentialless`
4. Static file middleware serves `.html` file from `public/`
5. Browser parses HTML, loads embedded CSS and scripts
6. Client-side JavaScript initializes (Chart.js charts, Web Audio, interactive controls)
7. User interacts with page (slider adjustments, button clicks, form submission)
8. Client-side code updates DOM/canvas without server round-trip

**External API Flow (Dashboards):**

1. HTML page loads Chart.js from CDN (`https://cdnjs.cloudflare.com`)
2. Google Fonts loaded from `https://fonts.googleapis.com`
3. For WebImager app: Client requests ONNX models from HuggingFace
4. SharedArrayBuffer enabled via cross-origin isolation headers
5. Web Worker processes heavy computation (background removal)

**State Management:**

- **Ephemeral**: URL fragment/query parameters for deep linking (not persisted)
- **Transient UI State**: DOM attributes, CSS classes, component variables
- **No Backend Persistence**: Each page is stateless; refresh resets state
- **Cache**: Static assets cached for 7 days; HTML cached for 1 day (server-configured)

## Key Abstractions

**Dashboard Template:**
- Purpose: Reusable structure for data visualization pages
- Examples: `dashboard-carbon.html`, `dashboard-api.html`, `dashboard-music.html`
- Pattern:
  - Fixed navigation bar (sticky, 64px height)
  - Gradient hero section with wave transition
  - KPI cards row
  - Section titles with accent underline
  - Mixed content: charts, tables, interactive controls, SVG diagrams
  - Footer with navigation back to portfolio
  - All styling via CSS variables from `:root`

**Chart Component:**
- Purpose: Render Chart.js visualizations
- Pattern: `<canvas>` element + JavaScript initialization
- Data: Hardcoded or calculated in `<script>` block
- Customization: Color palette controlled by CSS variables (`--accent`, `--fossil`, etc.)

**Interactive Control:**
- Purpose: Allow user manipulation of visualization (sliders, buttons, toggles)
- Pattern: `<input type="range">` or `<button>` + JavaScript event listener
- State: Stored in memory; not persisted
- Example: Temperature slider in carbon dashboard updates chart and visual indicators

**SVG Diagram with Hotspots:**
- Purpose: Illustrate systems with interactive overlays
- Pattern: `<svg>` with embedded `<circle>` or rect hotspots, JavaScript event handlers
- State: Mouseover shows tooltip; click may update info panel below diagram
- Example: Carbon cycle cross-section diagram with layer labels and flux indicators

**Navigation Hub:**
- Purpose: Card-based gallery of portfolio items
- Pattern: Grid of `.portfolio-card` divs, each linking to a dashboard or app
- Customization: Each card can have category, description, featured image link

## Entry Points

**Server Entry Point:**
- Location: `/server.js`
- Triggers: `npm start` or deployment platform
- Responsibilities: Start Express.js server, apply security headers, serve static files, listen on `process.env.PORT || 3000`

**Primary Web Entry Point:**
- Location: `/public/index.html`
- Triggers: Request to `/` or `/index.html`
- Responsibilities: Render hero section, navigation, portfolio gallery, direct to other pages

**Apps Hub Entry Point:**
- Location: `/public/apps.html`
- Triggers: Request to `/apps.html` or via navigation
- Responsibilities: List available apps and interactive experiences

**Dashboard Entry Points:**
- Location: `/public/portfolios/dashboard-{name}.html` (15 variants)
- Triggers: Direct request or click from portfolio gallery
- Responsibilities: Render domain-specific visualization with title, KPIs, charts, interactive controls

**WebImager App Entry Point:**
- Location: `/public/apps/webimager/index.html`
- Triggers: Request to `/apps/webimager/`
- Responsibilities: Initialize React/Vite app, load WASM modules, establish Web Worker communication

**Sound Pad App Entry Point:**
- Location: `/public/apps/sound-pad.html`
- Triggers: Request to `/apps/sound-pad.html`
- Responsibilities: Initialize Web Audio API, render instrument UI, handle MIDI input (if supported)

## Error Handling

**Strategy:** Graceful degradation and SPA fallback

**Patterns:**
- **Route Not Found**: `.htaccess` and `server.js` both configured to serve `index.html` for unmatched routes (SPA fallback)
- **Missing External Resource**: Chart.js fails silently if CDN unavailable; page displays without charts
- **Chart Data Missing**: Chart.js handles empty/invalid data gracefully
- **Web Audio Unavailable**: Sound Pad page loads but audio functionality disabled
- **CORS Failure**: Fetch to HuggingFace models fails; WebImager shows error state with guidance
- **Computation Timeout**: Heavy Web Worker tasks may hang; no explicit timeout handling (relies on browser)

## Cross-Cutting Concerns

**Logging:**
- Server-side: Console output to stdout (platform captures)
- Client-side: Browser console (errors via `window.onerror`)
- No structured logging; errors not sent to external service

**Validation:**
- Form inputs: HTML5 `type` and `required` attributes provide basic validation
- Chart data: Assumed valid; no runtime validation
- URL routes: Express static middleware implicitly validates file existence

**Authentication:**
- Not applicable; public portfolio site
- External APIs (HuggingFace) use no authentication (public model downloads)

**Security:**
- **CSP Headers** (`server.js` lines 10-23): Restrict script/style sources, allow CDN resources
- **Cross-Origin Isolation** (`server.js` lines 25-31): Set COEP/COOP headers for WebImager (enables SharedArrayBuffer)
- **Compression**: gzip enabled for all responses
- **Cache Control**: Static assets cached by browser and CDN; HTML refreshed daily

---

*Architecture analysis: 2026-03-14*
