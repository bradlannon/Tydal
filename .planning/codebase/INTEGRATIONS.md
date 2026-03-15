# External Integrations

**Analysis Date:** 2026-03-14

## APIs & External Services

**Machine Learning Models:**
- HuggingFace - AI model repository and inference
  - Service: Background removal models
  - SDK/Client: ONNX Runtime (WebAssembly-based)
  - URLs whitelisted in CSP: `https://huggingface.co`, `https://cdn-lfs.hf.co`, `https://cdn-lfs-us-1.hf.co`, `https://cdn-lfs.huggingface.co`
  - Usage: WebImager app uses HuggingFace models for background removal feature

## CDN & Asset Delivery

**Google Fonts:**
- Purpose: Typography (Nunito Sans, Playfair Display fonts)
- URLs: `https://fonts.googleapis.com`, `https://fonts.gstatic.com`
- Implementation: Font preconnect in HTML, stylesheet link
- Used in: All pages (index.html, apps.html, av.html, all portfolio dashboards)

**Cloudflare CDN:**
- Service: Chart.js library distribution
- URL: `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js`
- Purpose: Data visualization for dashboard pages
- Used in: Dashboard HTML files (dashboard-carbon.html, and others)

## Data Storage

**Databases:**
- Not detected - Application is static/read-only

**File Storage:**
- Local filesystem only
- Static files served from `/public` directory
- No external file storage service (S3, Cloudinary, etc.)

**Caching:**
- Browser caching via HTTP headers (configured in `server.js`):
  - HTML files: 1 day cache
  - Assets (.css, .js): 7 days cache
- Gzip compression enabled via `compression` middleware

## Authentication & Identity

**Auth Provider:**
- Not detected - No authentication system

**Session Management:**
- Not applicable - Static/read-only portfolio and dashboards

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, LogRocket, etc.)

**Logs:**
- Basic Node.js console logging only
- Server startup message: `Server running on port {PORT}`
- No structured logging framework

**Metrics:**
- Not detected

## CI/CD & Deployment

**Hosting:**
- Flexible - Can run on any Node.js host (Vercel, Heroku, traditional VPS, shared hosting with Apache)
- Fallback: `.htaccess` file supports Apache/Hostinger shared hosting

**CI Pipeline:**
- Not detected - No GitHub Actions, Jenkins, or similar

**Deployment Method:**
- Manual deployment (copy files to server)
- Or: Git-based (clone repo, run `npm install`, `npm start`)

## Environment Configuration

**Required env vars:**
- `PORT` - Optional, defaults to 3000 if not set

**Secrets location:**
- No secrets required for operation
- All integrations are read-only (public models, public CDNs)

## Webhooks & Callbacks

**Incoming:**
- Not applicable - No webhook endpoints

**Outgoing:**
- Not applicable - Application does not make outbound API calls to external services
- Note: HuggingFace model downloads are handled by ONNX Runtime in WebAssembly, not via server-side API calls

## Third-Party Embed Integrations

**WebImager Features:**
- Uses ONNX Runtime for in-browser ML inference
- Downloads pre-trained models from HuggingFace on first load
- All processing happens client-side, no server involvement

**Dashboard Data:**
- All data is static/hardcoded in HTML
- No data fetching from external APIs

## Security & CORS

**Cross-Origin Policy:**
- WebImager (`/apps/webimager`) sets strict cross-origin headers:
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: credentialless`
- Purpose: Enable SharedArrayBuffer for Web Workers while maintaining security

**Content Security Policy:**
- Configured in `helmet` middleware in `server.js`
- Allows trusted CDNs only (Google Fonts, Cloudflare, HuggingFace)
- `unsafe-inline` enabled for scripts/styles (common for static sites)

---

*Integration audit: 2026-03-14*
