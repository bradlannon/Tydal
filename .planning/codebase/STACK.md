# Technology Stack

**Analysis Date:** 2026-03-14

## Languages

**Primary:**
- JavaScript (Node.js runtime) - Server-side and client-side code
- HTML5 - Page markup and structure
- CSS3 - Styling and responsive layouts

**Secondary:**
- WebAssembly (WASM) - Machine learning models for WebImager (background removal)

## Runtime

**Environment:**
- Node.js 18.0.0 or higher (see `engines` in `package.json`)

**Package Manager:**
- npm (v10+ implied from lock file)
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Express.js 4.21.0 - Web server framework for routing and static file serving

**Build/Dev:**
- No build tool detected (pre-built assets shipped in `/public`)
- No TypeScript compilation needed

## Key Dependencies

**Critical:**
- `express` 4.21.0 - HTTP server and routing
- `compression` 1.7.4 - Gzip compression middleware
- `helmet` 8.0.0 - Security headers middleware

**Client-side (Embedded):**
- Chart.js 4.4.1 - Data visualization (loaded via CDN from `cdnjs.cloudflare.com`)
- ONNX Runtime (embedded in WebImager workers) - Machine learning inference
- Google Fonts (Nunito Sans, Playfair Display) - Typography

## Configuration

**Environment:**
- PORT environment variable controls server port (defaults to 3000)
- No `.env` file required - minimal configuration
- `process.env.PORT || 3000` in `server.js`

**Build:**
- No build configuration needed
- Static assets pre-compiled and committed to `/public`
- WebImager assets bundled with minified JavaScript and CSS

**Security Headers:**
- Content Security Policy (CSP) configured in `server.js`:
  - Allows scripts from CDN: `cdn.jsdelivr.net`, `cdnjs.cloudflare.com`
  - Allows stylesheets from: `fonts.googleapis.com`
  - Allows fonts from: `fonts.gstatic.com`
  - Allows cross-origin connections to: `huggingface.co`, `cdn-lfs.hf.co`, `cdn-lfs-us-1.hf.co`, `cdn-lfs.huggingface.co`

## Platform Requirements

**Development:**
- Node.js >= 18.0.0
- npm (any recent version)
- Optional: bash or zsh for running `server.js` directly

**Production:**
- Node.js runtime environment
- PORT binding capability
- Deployment targets: Any Node.js hosting (Vercel, Heroku, traditional VPS, etc.)
- Alternative fallback: Apache with mod_rewrite (see `.htaccess` for Hostinger compatibility)

## Notable Architectural Decisions

**Static-first approach:**
- All frontend assets are pre-built and committed to `public/`
- No frontend build tool (Webpack, Vite, etc.) in production
- Express serves static files with aggressive caching (7 days for assets, 1 day for HTML)

**Worker Threads:**
- WebImager uses Web Workers (`backgroundRemoval.worker-xTjNbY9N.js`) for CPU-intensive ML inference
- ONNX Runtime compiled to WebAssembly for in-browser model execution

**Cross-origin Isolation:**
- WebImager protected with `Cross-Origin-Opener-Policy: same-origin` header
- `Cross-Origin-Embedder-Policy: credentialless` for SharedArrayBuffer support (needed for Web Workers)

---

*Stack analysis: 2026-03-14*
