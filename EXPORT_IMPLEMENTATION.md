# Export Implementation Details

## Overview

The export functionality in Wochenschau has been completely rewritten to follow best practices and optimize for iOS/Safari PWA mode. This document explains the implementation details and design decisions.

## Library Choice: modern-screenshot

### Why modern-screenshot?

We replaced `html-to-image` (v1.11.13) with `modern-screenshot` (v4.6.6) for several key reasons:

1. **Better iOS/Safari Support**: modern-screenshot has improved handling of Safari-specific quirks, especially in PWA mode
2. **More Reliable Font Rendering**: Better support for @font-face fonts and complex text rendering
3. **Modern API**: Cleaner, promise-based API with better error handling
4. **Active Maintenance**: More recent updates and better community support
5. **Smaller Bundle Size**: More efficient code leads to smaller bundle size

### Key Differences

| Feature | html-to-image | modern-screenshot |
|---------|---------------|-------------------|
| iOS Safari Support | Fair | Excellent |
| Font Rendering | Good | Excellent |
| API Complexity | High | Low |
| Error Handling | Basic | Comprehensive |
| Last Updated | 2025-02 | 2025-08 |

## Implementation Details

### Export Flow

```
1. User clicks Export/Share/Copy
   ↓
2. Refresh background image from IndexedDB (if needed)
   ↓
3. Wait for all fonts to load (document.fonts.ready)
   ↓
4. Wait for background image to load (if using image mode)
   ↓
5. Wait for layout to stabilize (requestAnimationFrame)
   ↓
6. Detect device type (iOS Safari vs others)
   ↓
7. Generate blob with modern-screenshot
   ↓
8. Download/Copy/Share the image
```

### Font Handling

Fonts are defined in `src/fonts.css` using `@font-face` declarations that reference local `.ttf` files in `/public/fonts/`:

```css
@font-face {
    font-family: "Manrope";
    src: url("/fonts/Manrope-VariableFont_wght.ttf") format("truetype");
    font-weight: 200 800;
    font-style: normal;
    font-display: swap;
}
```

**Why not embed fonts as base64?**
- The combined size of all fonts is ~7MB, which would create a 10MB+ CSS file
- This exceeds Workbox's default 2MB file size limit
- External files can be cached efficiently by the service worker
- Better performance: fonts are downloaded in parallel and cached separately

**Font Loading Strategy**:
1. Fonts are loaded on app startup via CSS import
2. Before export, we wait for `document.fonts.ready` to ensure all fonts are loaded
3. modern-screenshot captures the rendered fonts correctly
4. Service worker caches all font files for offline use

### iOS/Safari Optimizations

1. **Device Detection**: We detect iOS Safari to apply specific optimizations
   ```typescript
   const isIOSSafari = 
     /iPad|iPhone|iPod/.test(ua) && 
     /Safari/.test(ua) && 
     !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
   ```

2. **Scale Factor**: Lower scale on iOS to avoid memory issues
   - iOS Safari: 3x scale
   - Other browsers: 4x scale

3. **Background Image Handling**: Special handling for data URL images
   - Wait for image to load completely
   - Timeout after 5 seconds to prevent hanging
   - Continue even if timeout occurs (better UX)

### Background Images

Background images are stored in IndexedDB to avoid localStorage size limits:

1. User uploads or selects a background image
2. Image is converted to base64 data URL
3. Stored in IndexedDB as a Blob (via `imageStorage.ts`)
4. Loaded on demand for export
5. Rendered as an `<img>` element in the export preview

**Why `<img>` instead of CSS background?**
- More reliable across browsers, especially Safari
- Better control over loading state
- Easier to wait for image to be fully loaded
- modern-screenshot handles `<img>` elements well

### Code Quality Improvements

1. **Type Safety**: All functions have proper TypeScript types and JSDoc comments
2. **Error Handling**: Comprehensive try-catch blocks with meaningful error messages
3. **Logging**: Detailed console logging for debugging export issues
4. **Clean Code**: Removed 70+ lines of complex preloading logic
5. **Single Responsibility**: Each function has one clear purpose

### Export Options Preserved

All existing export options remain unchanged:

- **Grid Layout**: 4-column grid view with compact activities
- **List Layout**: Vertical list view with full details
- **Compact Layout**: Timeline-style view with date on the left

### PWA Configuration

Updated `vite.config.ts` to properly cache fonts:

```typescript
workbox: {
  globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,ttf}"], // Added ttf
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // Increased to 5MB
  runtimeCaching: [
    // ... existing caching rules
    {
      urlPattern: /\/fonts\/.+\.ttf$/,
      handler: "CacheFirst",
      options: {
        cacheName: "local-fonts-cache",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
  ],
}
```

## Testing Checklist

When testing the export functionality:

- [ ] Test on iOS Safari in PWA mode
- [ ] Test on Android Chrome in PWA mode
- [ ] Test on desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test all three layout modes (Grid, List, Compact)
- [ ] Test with background color
- [ ] Test with background image
- [ ] Test with different font combinations
- [ ] Test with Bible verse enabled/disabled
- [ ] Test export to download
- [ ] Test copy to clipboard
- [ ] Test share via native share sheet
- [ ] Test with empty week (no activities)
- [ ] Test with full week (many activities)

## Performance Considerations

1. **Bundle Size**: modern-screenshot adds ~20KB to the bundle (dynamically imported)
2. **Font Loading**: Fonts are loaded once on app startup and cached
3. **Export Speed**: Typical export takes 1-2 seconds on modern devices
4. **Memory Usage**: 3x scale on iOS prevents out-of-memory errors
5. **Caching**: Service worker ensures offline functionality

## Future Improvements

Potential areas for future enhancement:

1. **Export Quality Settings**: Allow users to choose export quality/size
2. **Export Formats**: Support for PDF or other formats
3. **Batch Export**: Export multiple weeks at once
4. **Cloud Storage**: Optional cloud backup of exports
5. **Print Optimization**: Dedicated print stylesheet

## Troubleshooting

### Export fails on iOS Safari

- Check if fonts are loaded (`document.fonts.ready`)
- Verify background image is valid (check console logs)
- Try lower scale factor (2x instead of 3x)
- Clear service worker cache and reload

### Fonts don't appear in export

- Ensure fonts.css is imported in main.ts
- Check that font files are in /public/fonts/
- Verify service worker is caching fonts
- Wait for document.fonts.ready before export

### Export is slow

- Large background images can slow down export
- Many activities increase rendering time
- Lower the scale factor for faster exports

### Background image not showing

- Check if image is stored in IndexedDB
- Verify image data URL is valid
- Look for CORS issues in console
- Try refreshing the image before export

## Resources

- [modern-screenshot GitHub](https://github.com/qq15725/modern-screenshot)
- [MDN: document.fonts](https://developer.mozilla.org/en-US/docs/Web/API/Document/fonts)
- [PWA Best Practices](https://web.dev/pwa/)
- [iOS Safari PWA Support](https://developer.apple.com/design/human-interface-guidelines/web-apps)
