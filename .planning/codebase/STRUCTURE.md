# Codebase Structure

**Analysis Date:** 2026-03-14

## Directory Layout

```
/Users/brad/Apps/BI/
├── server.js                 # Express.js entry point with security middleware
├── package.json              # Node.js project metadata
├── package-lock.json         # Dependency lock file
├── .htaccess                 # Apache fallback routing (for shared hosting)
├── .gitignore                # Git exclusions
├── node_modules/             # Dependencies (Express, Compression, Helmet)
├── public/                   # Static assets served by Express
│   ├── index.html            # Main portfolio hub
│   ├── apps.html             # Apps gallery page
│   ├── av.html               # Audio/Video section (stub)
│   ├── js/                   # (empty) Placeholder for custom JS
│   ├── css/                  # (empty) Placeholder for custom CSS
│   ├── apps/                 # Interactive web applications
│   │   ├── index.html        # Apps landing page
│   │   ├── sound-pad.html    # Interactive Sound Pad (Web Audio API)
│   │   └── webimager/        # Image processing app (React/Vite bundle)
│   │       ├── index.html    # WebImager entry point
│   │       └── assets/       # Bundled JS, CSS, WASM, Workers
│   │           ├── index-Bo2HiXgv.js
│   │           ├── index-BTo4vk3e.css
│   │           ├── backgroundRemoval.worker-xTjNbY9N.js
│   │           └── ort-wasm-simd-threaded.jsep-B0T3yYHD.wasm
│   └── portfolios/           # Data dashboards (15 HTML pages)
│       ├── dashboard-api.html
│       ├── dashboard-art-music.html
│       ├── dashboard-attention.html
│       ├── dashboard-bi.html
│       ├── dashboard-carbon.html
│       ├── dashboard-energy.html
│       ├── dashboard-environment.html
│       ├── dashboard-film.html
│       ├── dashboard-flights.html
│       ├── dashboard-genres.html
│       ├── dashboard-lifetime.html
│       ├── dashboard-maritime.html
│       ├── dashboard-music.html
│       ├── dashboard-stack.html
│       └── dashboard-submarine.html
├── .planning/                # Planning and analysis documents (generated)
│   └── codebase/            # Codebase analysis files
└── .git/                     # Git repository metadata
```

## Directory Purposes

**Root:**
- Purpose: Project configuration and server entry point
- Contains: Node.js server, package metadata, git tracking

**`/public`:**
- Purpose: All files served to clients via Express static middleware
- Contains: HTML pages, assets, dashboards, apps
- Committed: Yes
- Cache-Control: HTML (1 day), other assets (7 days)

**`/public/js`:**
- Purpose: Shared JavaScript utilities (currently empty)
- Contains: Would hold reusable JavaScript modules
- Committed: Yes
- Usage: Link from HTML via `<script src="/js/..."></script>`

**`/public/css`:**
- Purpose: Shared CSS files (currently empty)
- Contains: Would hold global stylesheets
- Committed: Yes
- Usage: Link from HTML via `<link rel="stylesheet" href="/css/...">`

**`/public/apps`:**
- Purpose: Interactive web applications and experiments
- Contains: Self-contained HTML + bundled app bundles
- Committed: Yes
- Access: Via `/apps.html` hub or direct URL `/apps/{name}/`

**`/public/apps/webimager`:**
- Purpose: Image processing and background removal app
- Contains: Vite-built React bundle with Web Worker and WASM module
- Key files:
  - `index.html` - React root element mount point
  - `assets/index-Bo2HiXgv.js` - Main React/Vite bundle
  - `assets/backgroundRemoval.worker-xTjNbY9N.js` - Web Worker for ML model inference
  - `assets/ort-wasm-simd-threaded.jsep-B0T3yYHD.wasm` - ONNX Runtime WASM binary
- Technology: React, Vite, ONNX Runtime, Web Workers
- External: Fetches models from HuggingFace (requires COEP/COOP headers set in `server.js`)

**`/public/apps/sound-pad.html`:**
- Purpose: Interactive drum pad with Web Audio API
- Contains: Single self-contained HTML file with embedded CSS and JavaScript
- Technology: Web Audio API, HTML5 audio scheduling
- Features: Playable pads, rhythm creation

**`/public/portfolios`:**
- Purpose: Data visualization dashboards showcasing BI and analytics work
- Contains: 15 standalone HTML files, each a complete dashboard
- Naming: `dashboard-{theme}.html` (e.g., `dashboard-carbon.html`)
- Technology: Chart.js 4.4.1 (CDN), SVG diagrams, interactive HTML controls
- Shared: All use same CSS variable system for theming

**`/public/index.html`:**
- Purpose: Primary entry point and portfolio gallery
- Contains: Navigation, hero section, portfolio cards grid
- Size: ~84KB (includes embedded styles and metadata)
- Key sections:
  - Navigation bar with links to apps, portfolios, about
  - Hero section with tagline
  - Portfolio grid showing dashboard cards
  - About section
  - Footer with links

**`/public/apps.html`:**
- Purpose: Hub for interactive applications
- Contains: Gallery of available apps (SoundPad, WebImager, etc.)
- Status: WebImager functional; SoundPad live; others planned

**`/public/av.html`:**
- Purpose: Audio/Visual content section (stub)
- Status: Under construction
- Planned: Video demonstrations, audio samples

## Key File Locations

**Server Configuration:**
- `server.js` - Express.js app, security headers, static file serving

**Dependency Management:**
- `package.json` - NPM project metadata, scripts, versions
- `package-lock.json` - Locked dependency versions

**Entry Points:**
- `public/index.html` - Main portfolio site
- `public/apps.html` - Applications gallery
- `public/apps/webimager/index.html` - WebImager app
- `public/apps/sound-pad.html` - Sound Pad app
- `public/portfolios/dashboard-*.html` - Data dashboards (15 variants)

**Apache Fallback (Shared Hosting):**
- `.htaccess` - SPA routing for non-Node.js environments

**Development Configuration:**
- `.gitignore` - Git exclusions

## Naming Conventions

**Files:**
- **HTML Pages**: Lowercase with hyphens
  - Portfolio: `dashboard-{domain}.html` (e.g., `dashboard-carbon.html`)
  - Hub pages: `index.html`, `apps.html`, `av.html`
  - App launchers: `{app-name}.html` (e.g., `sound-pad.html`)

- **Bundled Assets**: Vite naming pattern
  - `index-{HASH}.js` - Main JavaScript bundle
  - `index-{HASH}.css` - Main stylesheet bundle
  - `{module}-{HASH}.js` - Worker or lazy-loaded module
  - `{module}-{HASH}.wasm` - WASM binary
  - Example: `backgroundRemoval.worker-xTjNbY9N.js`

- **Directories**: Lowercase with hyphens
  - Feature grouping: `apps/`, `portfolios/`, `css/`, `js/`
  - App subdirectory: `webimager/` (matches app name)
  - Assets subdirectory: `assets/` (Vite convention)

**Identifiers in HTML/CSS:**
- **CSS Classes**: kebab-case
  - `.nav-logo`, `.section-title`, `.kpi-card`, `.chart-grid`
- **CSS Variables**: kebab-case with `--` prefix
  - `--accent`, `--text-dark`, `--white`, `--border`
  - Domain-specific: `--forest`, `--ocean`, `--soil` (carbon dashboard)
  - App-specific: `--pad-bg`, `--pad-surface` (sound pad)
- **HTML IDs**: camelCase or kebab-case
  - `#root` (React mounts here)
  - `#tempSlider`, `#timeSlider`, `#tempYearDisplay` (interactive controls)
  - `id="canvas-{name}"` (Chart.js canvases)
- **Data Attributes**: kebab-case
  - `data-category="api"`, `data-type="sink"`

## Where to Add New Code

**New Dashboard:**
1. Create file: `/public/portfolios/dashboard-{theme}.html`
2. Structure: Copy structure from `dashboard-carbon.html` or `dashboard-api.html`
3. CSS: Define color variables in `:root` for theme
4. Charts: Add `<canvas>` elements and Chart.js initialization script
5. Data: Hardcode data in JavaScript or fetch from CDN
6. Register: Add card to portfolio grid in `/public/index.html`

**New Interactive App:**
1. **Simple HTML App** (like Sound Pad):
   - Create: `/public/apps/{app-name}.html`
   - Embed: CSS in `<style>` block, JavaScript in `<script>` block
   - Test: Accessible at `/{app-name}.html`
   - Register: Add link in `/public/apps.html`

2. **Complex App** (like WebImager):
   - Build repo separately with build tool (Vite/Webpack)
   - Output to: `/public/apps/{app-name}/`
   - Entry: `index.html` with script tags pointing to `assets/`
   - Register: Add link in `/public/apps.html`

**New Shared Utility:**
- JavaScript: `/public/js/{utility-name}.js`
  - Import in dashboards via `<script src="/js/{utility-name}.js"></script>`
- CSS: `/public/css/{theme-name}.css`
  - Import in dashboards via `<link rel="stylesheet" href="/css/{theme-name}.css">`

**Server Middleware:**
- Edit `/server.js` to add new middleware or routes
- Example: Set CORS headers, add compression config, customize routing

## Special Directories

**`/node_modules`:**
- Purpose: Installed dependencies
- Generated: Yes (by `npm install`)
- Committed: No
- Contents: Express, Compression, Helmet packages

**`/.git`:**
- Purpose: Version control metadata
- Generated: Yes (by `git init`)
- Committed: N/A
- Contains: Commit history, refs, hooks

**`/.planning`:**
- Purpose: GSD planning and analysis documents
- Generated: Yes (by GSD tools)
- Committed: Yes
- Contents: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md, STACK.md, INTEGRATIONS.md

**`/public/apps/webimager/assets`:**
- Purpose: Vite-built bundle artifacts
- Generated: Yes (during build, copied to public/)
- Committed: Yes
- Hashes: Change on each rebuild; regenerate before deployment

## Subdirectory Navigation

**Adding a dashboard under `/public/portfolios`:**
```
/public/portfolios/dashboard-{theme}.html  (new file)
↓ linked from
/public/index.html  (add portfolio card)
```

**Adding an app under `/public/apps`:**
```
/public/apps/{app-name}.html  (or /apps/{app-name}/index.html)
↓ linked from
/public/apps.html  (add app card)
```

**Multi-page app structure:**
```
/public/apps/{app-name}/
├── index.html  (entry point)
└── assets/
    ├── index-{HASH}.js
    ├── index-{HASH}.css
    └── {module}-{HASH}.js|wasm
```

---

*Structure analysis: 2026-03-14*
