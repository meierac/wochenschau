# GitHub Pages Deployment Configuration

This document describes the configuration for deploying Wochenschau to GitHub Pages at `/wochenschau/`.

## Configuration Summary

### 1. Vite Configuration (`vite.config.ts`)

The base URL is set to `/wochenschau/` for GitHub Pages deployment:

```typescript
export default defineConfig({
  base: "/wochenschau/",
  // ...
});
```

This ensures all asset paths (JS, CSS, images) are correctly prefixed with `/wochenschau/`.

### 2. PWA Manifest Configuration

The PWA manifest is configured with the correct scope and start URL:

```typescript
manifest: {
  scope: "/wochenschau/",
  start_url: "/wochenschau/",
  // ...
}
```

This ensures the Progressive Web App works correctly when installed from the GitHub Pages URL.

### 3. SPA Routing Support (`public/404.html`)

A `404.html` file is included in the `public/` directory to handle client-side routing on GitHub Pages. This file:

- Redirects any 404 errors back to the main app
- Preserves the original URL path as a query parameter
- Ensures deep links work correctly

### 4. GitHub Actions Deployment (`.github/workflows/deploy.yml`)

The deployment workflow:

1. Builds the app with `pnpm run build`
2. Creates a `.nojekyll` file in the `dist/` folder to bypass Jekyll processing
3. Uploads the `dist/` folder as a GitHub Pages artifact
4. Deploys to GitHub Pages

## Deployment URL

The app will be available at:
```
https://[username].github.io/wochenschau/
```

Replace `[username]` with your GitHub username or organization name.

## Build Process

### Development
```bash
pnpm dev
```
Runs locally at `http://localhost:5173` (without the `/wochenschau/` prefix)

### Production Build
```bash
pnpm run build
```
Creates production files in `dist/` with `/wochenschau/` prefix

### Preview Production Build
```bash
pnpm preview
```
Preview the production build locally (accessible at `http://localhost:4173/wochenschau/`)

## Verification Checklist

After building, verify the following in `dist/`:

- ✅ `index.html` - All asset paths start with `/wochenschau/`
- ✅ `manifest.webmanifest` - `scope` and `start_url` are `/wochenschau/`
- ✅ `404.html` - Present for SPA routing support
- ✅ `.nojekyll` - Created by GitHub Actions workflow
- ✅ All assets in `assets/` folder are referenced with `/wochenschau/assets/` prefix

## Asset Path Examples

After building with `base: "/wochenschau/"`, paths will look like:

```html
<link rel="icon" href="/wochenschau/vite.svg" />
<link rel="apple-touch-icon" href="/wochenschau/apple-touch-icon.png" />
<script src="/wochenschau/assets/index-[hash].js"></script>
<link href="/wochenschau/assets/index-[hash].css">
```

## Important Notes

1. **Local Development**: The `/wochenschau/` prefix is NOT used during local development (`pnpm dev`)
2. **Production Build**: The prefix is ONLY applied when building for production
3. **Manual Deployment**: If deploying manually (not via GitHub Actions), ensure you:
   - Run `pnpm run build`
   - Copy the entire `dist/` folder contents to your GitHub Pages repository
   - Ensure the `.nojekyll` file exists in the root

## Troubleshooting

### Assets not loading (404 errors)
- Verify that `base: "/wochenschau/"` is set in `vite.config.ts`
- Rebuild the project: `pnpm run build`
- Check that asset paths in `dist/index.html` include `/wochenschau/`

### PWA not installing correctly
- Check that `manifest.webmanifest` has correct `scope` and `start_url`
- Verify the manifest is being served with correct MIME type (`application/manifest+json`)

### Deep links/routes not working
- Ensure `404.html` exists in the deployed site
- Verify GitHub Pages is properly configured to serve from the `gh-pages` branch or `main` branch

## Repository Settings

In your GitHub repository settings:

1. Go to **Settings** → **Pages**
2. Set **Source** to "GitHub Actions" (recommended) or the appropriate branch
3. The site will be published at `https://[username].github.io/wochenschau/`

## Automatic Deployment

The `.github/workflows/deploy.yml` workflow automatically deploys to GitHub Pages when you push to the `main` branch. No manual intervention required!

---

**Last Updated**: October 2024
**App Version**: 1.0.0