# Mobile Export Fix Documentation

## Summary

This document describes fixes implemented to resolve issues where background images and custom fonts don't always appear in exported JPG files on mobile devices, even though they display correctly in the preview.

**Key Changes**:
- Enhanced font loading with explicit weight preloading (300, 400, 500, 600, 700)
- Added background image decoding with timeout protection
- Implemented DOM image loading helper that checks CSS background images
- Increased render delay on mobile devices (500ms vs 200ms desktop)
- Added forced font rendering using canvas measurement
- Included reflow forcing before screenshot capture

**Status**: ✅ Implemented - Ready for testing

---

## Quick Testing Guide

### How to Test the Fix

1. **Open app on mobile device** (iPhone, iPad, or Android)
2. **Configure custom settings**:
   - Tap Settings → Export Settings
   - Change "Header Font" to something distinctive (e.g., "Dancing Script", "Playfair Display")
   - Change "Body Font" if desired
   - Select a background image or upload a custom one
3. **Create/view your week agenda** with some activities
4. **Export**:
   - Tap the Export button
   - Choose "Share Image" or "Copy to Clipboard"
5. **Verify the exported image**:
   - ✅ Custom fonts should be visible (not system default)
   - ✅ Background image should be visible
   - ✅ All text should be readable with correct colors

### Expected Console Output

When exporting, check the browser console (use Safari/Chrome remote debugging):

```
[ExportSheet] Generating JPG. Background mode: image
[ExportSheet] Background image exists: true
[ExportSheet] Waiting for fonts to load...
[ExportSheet] Loaded font: Playfair Display weight 300
[ExportSheet] Loaded font: Playfair Display weight 400
[ExportSheet] Font Playfair Display all weights loaded
[ExportSheet] All fonts loaded successfully
[ExportSheet] Loading background image...
[ExportSheet] Background image decoded successfully
[ExportSheet] Background image loaded successfully
[ExportSheet] All images in DOM loaded
[ExportSheet] Waiting 500ms for render (mobile: true)...
[ExportSheet] Starting screenshot capture...
```

---

## Issues Identified

### 1. Background Image Not Always Exported on Mobile
**Problem**: Background images appear in preview but sometimes don't render in the exported JPG on mobile devices.

**Root Causes**:
- Mobile browsers may not fully decode base64 images before screenshot capture
- Timing issues with image loading on slower mobile connections
- Background images applied via inline `background-image` CSS may not be fully rendered

### 2. Fonts Not Always Exported on Mobile
**Problem**: Custom fonts from Google Fonts appear in preview but revert to system fonts in exported images.

**Root Causes**:
- `document.fonts.ready` promise may resolve before fonts are fully rendered
- Mobile browsers may aggressively defer font loading
- Font rendering may not be complete when screenshot is captured

## Fixes Implemented

### Enhanced Font Loading (ExportSheet.svelte, lines 145-188)

```typescript
// Wait for fonts to load - use more robust checking
await document.fonts.ready;

// Additional font check: verify specific fonts are loaded
const fontsToCheck = [
    $exportSettings.headerFontFamily,
    $exportSettings.bodyFontFamily,
];

for (const fontFamily of fontsToCheck) {
    const fontMatch = fontFamily.match(/'([^']+)'/);
    if (fontMatch) {
        const fontName = fontMatch[1];
        const fontLoaded = document.fonts.check(`16px "${fontName}"`);
        
        // If not loaded, try to load it explicitly
        if (!fontLoaded) {
            await document.fonts.load(`16px "${fontName}"`);
        }
    }
}
```

**What this does**:
- Waits for all fonts to be ready
- Explicitly checks if the selected fonts are loaded
- Forces loading of fonts if they're not ready
- Provides detailed logging for debugging

### Enhanced Background Image Loading (ExportSheet.svelte, lines 237-272)

```typescript
const img = new Image();
await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
        reject(new Error("Background image loading timeout"));
    }, 10000); // 10 second timeout

    img.onload = () => {
        clearTimeout(timeout);
        // Ensure the image is decoded
        img.decode()
            .then(() => resolve())
            .catch(() => resolve());
    };
    img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to load background image"));
    };
    img.src = $exportSettings.backgroundImage!;
});
```

**What this does**:
- Creates a test image to verify the base64 data is valid
- Uses `img.decode()` to ensure the image is fully decoded before capturing
- Includes a 10-second timeout to prevent infinite waiting
- Handles both successful decode and browsers that don't support decode()

### DOM Image Loading Helper (ExportSheet.svelte, lines 128-169)

```typescript
async function waitForImagesToLoad(element: HTMLElement): Promise<void> {
    // Wait for all <img> tags
    const images = element.querySelectorAll("img");
    const imagePromises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Don't block on error
        });
    });

    // Check for CSS background images
    const style = window.getComputedStyle(element);
    const backgroundImage = style.backgroundImage;
    
    if (backgroundImage && backgroundImage !== "none") {
        const urlMatch = backgroundImage.match(/url\(["']?([^"']*)["']?\)/);
        if (urlMatch && urlMatch[1]) {
            const bgImg = new Image();
            const bgPromise = new Promise<void>((resolve) => {
                const timeout = setTimeout(() => resolve(), 5000);
                bgImg.onload = () => {
                    clearTimeout(timeout);
                    bgImg.decode().then(() => resolve()).catch(() => resolve());
                };
                bgImg.onerror = () => {
                    clearTimeout(timeout);
                    resolve();
                };
                bgImg.src = urlMatch[1];
            });
            imagePromises.push(bgPromise);
        }
    }

    await Promise.all(imagePromises);
}
```

**What this does**:
- Waits for all `<img>` elements in the export preview to load
- Extracts and waits for CSS background images to load and decode
- Includes timeouts to prevent blocking forever
- Gracefully handles errors to not block the export process

### Mobile-Specific Delays (ExportSheet.svelte, lines 277-291)

```typescript
// Detect if we're on mobile and add extra delay
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const delay = isMobile ? 500 : 200; // Longer delay on mobile

console.log(`[ExportSheet] Waiting ${delay}ms for render (mobile: ${isMobile})...`);
await new Promise((resolve) => setTimeout(resolve, delay));

// Force a reflow to ensure everything is rendered
element.getBoundingClientRect();
```

**What this does**:
- Detects mobile devices via user agent
- Adds 500ms delay on mobile (vs 200ms on desktop) for rendering
- Forces a reflow by reading `getBoundingClientRect()` to ensure layout is complete

## Testing on Mobile

### To test if the fixes work:

1. **Open the app on a mobile device**
2. **Configure export settings**:
   - Go to Export Settings
   - Choose a custom font (e.g., "Playfair Display" or "Dancing Script")
   - Select a background image (either default or custom upload)
3. **Open Export Sheet**:
   - Verify the preview shows the correct font and background
4. **Export the image**:
   - Tap "Share Image" or "Copy to Clipboard"
   - Check the exported image has:
     - ✓ The correct custom font (not system font)
     - ✓ The background image visible

### Debug Console Logs

When exporting, you should see these console logs in order:

```
[ExportSheet] Generating JPG. Background mode: image
[ExportSheet] Background image exists: true
[ExportSheet] Waiting for fonts to load...
[ExportSheet] Font Playfair Display loaded: true
[ExportSheet] All fonts loaded successfully
[ExportSheet] Loading background image...
[ExportSheet] Background image decoded successfully
[ExportSheet] Background image loaded successfully
[ExportSheet] All images in DOM loaded
[ExportSheet] Waiting 500ms for render (mobile: true)...
[ExportSheet] Starting screenshot capture...
```

### If Issues Persist

If fonts or images are still missing after these fixes:

1. **Check Browser Console** for any error messages
2. **Verify Google Fonts are loading**:
   - Open DevTools Network tab
   - Filter by "fonts.googleapis.com"
   - Ensure font files are loading successfully
3. **Test with different fonts**:
   - Try system fonts first (should always work)
   - Then try simple Google Fonts like "Roboto"
   - Finally try decorative fonts
4. **Test with smaller background images**:
   - Very large images may timeout or fail to decode
   - Try a default background image first
5. **Check base64 image validity**:
   - Open console and log `$exportSettings.backgroundImage`
   - Verify it starts with `data:image/jpeg;base64,` or `data:image/png;base64,`
   - Try pasting the base64 string in a new browser tab to verify it renders

## Additional Improvements to Consider

### If issues continue, you could try:

1. **Pre-load fonts in the background**:
   - Load fonts when the app initializes, not just before export
   - Use `new FontFace()` API to load fonts programmatically

2. **Increase mobile delay even more**:
   - Change line 280 from 500ms to 1000ms or higher
   - Add user preference for export delay

3. **Use canvas-based rendering instead**:
   - Manually draw the content to a canvas element
   - More control over when fonts/images are ready
   - More complex to implement

4. **Add retry mechanism**:
   - If export fails, automatically retry 1-2 times
   - Increase delays on retry attempts

5. **Add "Force Reload" option**:
   - Button to explicitly reload fonts and images before export
   - Clear and re-load all resources

## Technical Details

### Libraries Used
- **modern-screenshot v4.6.6**: Converts DOM elements to images
- Uses `domToJpeg()` method with scale=2 and quality=0.95

### Font Storage
- Fonts loaded from Google Fonts CDN
- Font families defined in `index.html` (massive Google Fonts link)
- Font selection stored in `exportSettings` store (localStorage)

### Image Storage
- Background images stored in IndexedDB (via `imageStorage` store)
- Images converted to base64 for inline embedding
- Maximum size limited by browser IndexedDB limits

### Screenshot Process Flow
1. Wait for fonts (with explicit loading)
2. Wait for background image (with decode)
3. Wait for DOM images
4. Add rendering delay (500ms mobile, 200ms desktop)
5. Force reflow
6. Capture screenshot with modern-screenshot
7. Convert to blob and download/share

## Files Modified

- `src/lib/components/ExportSheet.svelte`: Main export logic improvements
  - Added `waitForImagesToLoad()` helper function (lines 128-169)
  - Enhanced font loading with explicit weight checks (lines 189-232)
  - Added canvas-based font rendering force (lines 235-243)
  - Enhanced background image loading with decode (lines 258-288)
  - Added DOM image loading check (lines 291)
  - Added mobile detection and longer delays (lines 293-304)
  - Added reflow forcing before screenshot (lines 306)

## Performance Impact

- **Desktop**: ~200-400ms additional delay before export
- **Mobile**: ~500-800ms additional delay before export
- Trade-off is acceptable for ensuring fonts and images are properly captured
- Delays only occur during export, not during normal app usage

## Troubleshooting

### If fonts still don't export correctly:

1. **Check if fonts are loaded in the app**:
   - Open Settings → Export Settings
   - Change the font and see if the preview updates
   - If preview doesn't change, fonts aren't loading from Google Fonts

2. **Verify Google Fonts link**:
   - Check `index.html` has the long Google Fonts `<link>` tag
   - Ensure your selected font is included in that URL

3. **Try increasing the mobile delay**:
   - Edit `ExportSheet.svelte` line 297
   - Change `const delay = isMobile ? 500 : 200;` to `const delay = isMobile ? 1000 : 200;`

### If background images still don't export correctly:

1. **Check image format**:
   - Ensure the image is JPEG or PNG
   - Very large images (>5MB) may fail to decode on mobile

2. **Verify IndexedDB storage**:
   - Open browser DevTools → Application → IndexedDB
   - Check if `wochenschau-images` database exists
   - Verify `images` store contains your background image

3. **Check console for decode errors**:
   - Look for "Background image decoded successfully" message
   - If you see "decode not supported", the browser may not support `img.decode()`

4. **Try a different image**:
   - Use one of the default background images first
   - If defaults work but custom uploads don't, the issue is with image encoding

### If both still fail:

Consider filing an issue with:
- Device model and OS version
- Browser name and version
- Console logs from the export process
- Screenshot of what the preview looks like vs what exports