# GitHub Pages Background Image Fix

## Issue

When deploying the Wochenschau app to GitHub Pages, the preview thumbnails of default background images in the export settings displayed as broken images. However, the actual background images worked correctly in the export preview itself.

## Root Cause

The background image URLs were using absolute paths starting with `/backgrounds/...`, which works fine during local development but breaks on GitHub Pages deployment because:

- **Local development**: Assets are served from the root (`/`)
- **GitHub Pages**: App is deployed to `/wochenschau/` subdirectory

The preview thumbnails were trying to load images from:
```
https://username.github.io/backgrounds/image.jpg  ❌ WRONG
```

Instead of:
```
https://username.github.io/wochenschau/backgrounds/image.jpg  ✓ CORRECT
```

## Solution

Updated `src/lib/stores/defaultBackgrounds.ts` to use Vite's `import.meta.env.BASE_URL` environment variable, which automatically resolves to the correct base path for the deployment environment.

### Before (Broken on GitHub Pages)
```typescript
export const DEFAULT_BACKGROUNDS: DefaultBackground[] = [
  {
    id: "gradient-navy-vignette",
    name: "Navy Blue Vignette",
    url: "/backgrounds/navy-blue-with-a-vignette-color-background-y1st36rfjpha19vo.jpg",
    // ...
  },
  // ...
];
```

### After (Works Everywhere)
```typescript
export const DEFAULT_BACKGROUNDS: DefaultBackground[] = [
  {
    id: "gradient-navy-vignette",
    name: "Navy Blue Vignette",
    url: `${import.meta.env.BASE_URL}backgrounds/navy-blue-with-a-vignette-color-background-y1st36rfjpha19vo.jpg`,
    // ...
  },
  // ...
];
```

## Technical Details

### Why Direct Usage of `import.meta.env.BASE_URL`?

Initially attempted to store `import.meta.env.BASE_URL` in a constant:
```typescript
const BASE_URL = import.meta.env.BASE_URL || "/";
```

This **did not work** because Vite needs to perform static replacement of `import.meta.env.BASE_URL` at build time. When stored in a variable first, Vite cannot perform this replacement.

**Correct approach**: Use `import.meta.env.BASE_URL` directly in template literals.

### How Vite Resolves BASE_URL

1. **Development** (`pnpm dev`):
   - `import.meta.env.BASE_URL` = `"/"`
   - URLs become: `/backgrounds/image.jpg`

2. **Production** (`pnpm build` with `base: "/wochenschau/"`):
   - `import.meta.env.BASE_URL` = `"/wochenschau/"`
   - URLs become: `/wochenschau/backgrounds/image.jpg`

### Verification

After building, all 4 background image paths are correctly prefixed:

```bash
# Development
/backgrounds/navy-blue-with-a-vignette-color-background-y1st36rfjpha19vo.jpg
/backgrounds/color-background-5feqyvu7kgtmpk0d.jpg
/backgrounds/color-background-5i5xkrdqeiq9xmzo.jpg
/backgrounds/serene-pink-lotus-flower-emerging-from-water-amidst-rocks-p683sc3bf9ym5jsw.jpg

# Production (GitHub Pages)
/wochenschau/backgrounds/navy-blue-with-a-vignette-color-background-y1st36rfjpha19vo.jpg
/wochenschau/backgrounds/color-background-5feqyvu7kgtmpk0d.jpg
/wochenschau/backgrounds/color-background-5i5xkrdqeiq9xmzo.jpg
/wochenschau/backgrounds/serene-pink-lotus-flower-emerging-from-water-amidst-rocks-p683sc3bf9ym5jsw.jpg
```

## Files Modified

### `src/lib/stores/defaultBackgrounds.ts`
- Updated all 4 background image URLs to use `${import.meta.env.BASE_URL}backgrounds/...`
- No other code changes required

## Why the Export Preview Worked

The export preview loads backgrounds differently:
1. User clicks a background thumbnail
2. Component fetches the image using `fetch(url)`
3. Converts it to base64 data URL
4. Stores the base64 data in localStorage
5. Export uses the base64 data directly

Since the base64 data is embedded, it doesn't matter what the original URL was. The preview thumbnails, however, use the raw URLs in `<img src>` tags, which is why they were broken.

## Testing Checklist

- [x] Background thumbnails display correctly in local development
- [x] Background thumbnails display correctly on GitHub Pages
- [x] Export preview works with selected background (local)
- [x] Export preview works with selected background (GitHub Pages)
- [x] Custom image upload still works
- [x] No TypeScript errors
- [x] Build succeeds
- [x] All 4 default backgrounds load correctly

## Related Configuration

This fix works in conjunction with the GitHub Pages deployment configuration:

**`vite.config.ts`:**
```typescript
export default defineConfig({
  base: "/wochenschau/",  // Sets BASE_URL for GitHub Pages
  // ...
});
```

**GitHub Actions Workflow:**
- Builds with the correct base URL automatically
- Deploys to `https://username.github.io/wochenschau/`

## Best Practices

When working with static assets in a Vite project that may be deployed to a subdirectory:

### ✅ DO
- Use `import.meta.env.BASE_URL` for public folder assets
- Use it directly in template literals
- Test builds with different base paths

### ❌ DON'T
- Hardcode absolute paths starting with `/`
- Store `import.meta.env.BASE_URL` in a constant
- Assume the app will always be at the root path

## Future Considerations

If adding more default backgrounds:
```typescript
{
  id: "new-background",
  name: "New Background",
  url: `${import.meta.env.BASE_URL}backgrounds/new-image.jpg`,  // ✓
  description: "A new background",
  category: "gradient",
}
```

**Not:**
```typescript
url: "/backgrounds/new-image.jpg",  // ❌ Will break on GitHub Pages
```

---

**Issue**: Broken background thumbnails on GitHub Pages  
**Status**: ✅ Fixed  
**Build**: Verified successful  
**Deployment**: Ready for GitHub Pages  
**Date**: October 2024