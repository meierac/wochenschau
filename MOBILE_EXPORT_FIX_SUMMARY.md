# Mobile Export Fix - Executive Summary

## Problem Statement

Two critical issues were occurring on mobile devices during image export:

1. **Background images visible in preview but missing in exported JPG**
2. **Custom fonts visible in preview but reverting to system fonts in exported JPG**

Both issues only occurred on mobile devices (iOS/Android), while desktop exports worked correctly.

## Root Causes

### Background Image Issue
- Mobile browsers don't always fully decode base64 images before screenshot capture
- CSS `background-image` property may not be rendered when `modern-screenshot` captures the DOM
- Timing issues on slower mobile connections

### Font Issue
- `document.fonts.ready` promise resolves before fonts are fully rendered on mobile
- Mobile browsers aggressively defer font loading for performance
- Google Fonts may not be embedded properly in the screenshot

## Solution Implemented

### 1. Enhanced Font Loading (Lines 189-243)
```typescript
// Multi-weight font preloading
const weights = ["300", "400", "500", "600", "700"];
await Promise.all(weights.map(weight => 
    document.fonts.load(`${weight} 16px "${fontName}"`)
));

// Force rendering with canvas measurement
const ctx = canvas.getContext("2d");
ctx.font = `16px ${fontFamily}`;
ctx.measureText("Test"); // Triggers actual rendering
```

**What it does:**
- Explicitly loads all font weights (light, normal, medium, semibold, bold)
- Forces browser to actually render fonts using canvas measurement
- Waits for confirmation before proceeding to screenshot

### 2. Enhanced Image Loading (Lines 258-291)
```typescript
// Load and decode image
const img = new Image();
img.src = backgroundImage;
await img.decode(); // Wait for full decode

// Also check all DOM images
await waitForImagesToLoad(element);
```

**What it does:**
- Creates test image to verify base64 data validity
- Uses `img.decode()` to ensure image is fully decoded
- Checks all images in the export preview DOM
- Includes 10-second timeout to prevent infinite waiting

### 3. Mobile-Specific Delays (Lines 293-306)
```typescript
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const delay = isMobile ? 500 : 200;
await new Promise(resolve => setTimeout(resolve, delay));

// Force reflow
element.getBoundingClientRect();
```

**What it does:**
- Detects mobile devices via user agent
- Adds 500ms delay on mobile (vs 200ms on desktop)
- Forces browser reflow to ensure layout is complete

### 4. DOM Image Helper Function (Lines 128-169)
```typescript
async function waitForImagesToLoad(element: HTMLElement) {
    // Wait for <img> tags
    const images = element.querySelectorAll("img");
    await Promise.all(images.map(img => waitForLoad(img)));
    
    // Also check CSS background-image
    const bgImage = getComputedStyle(element).backgroundImage;
    if (bgImage) {
        await loadAndDecodeBackgroundImage(bgImage);
    }
}
```

**What it does:**
- Waits for all `<img>` elements to load
- Extracts and waits for CSS background images
- Gracefully handles errors to not block export

## Testing Instructions

### On Mobile Device:
1. Open app on iPhone/iPad/Android
2. Go to Export Settings
3. Select custom font (e.g., "Playfair Display", "Dancing Script")
4. Select or upload a background image
5. Create your weekly agenda
6. Tap Export → Share Image
7. **Verify exported image has:**
   - ✅ Custom font (not Arial/Helvetica)
   - ✅ Background image visible
   - ✅ All text readable

### Check Console Logs:
Use Safari/Chrome remote debugging to see:
```
[ExportSheet] Waiting for fonts to load...
[ExportSheet] Font Playfair Display all weights loaded
[ExportSheet] All fonts loaded successfully
[ExportSheet] Background image decoded successfully
[ExportSheet] All images in DOM loaded
[ExportSheet] Waiting 500ms for render (mobile: true)...
[ExportSheet] Starting screenshot capture...
```

## Performance Impact

- **Desktop:** +200-400ms export time
- **Mobile:** +500-800ms export time
- **Trade-off:** Acceptable for ensuring correct output

## Files Modified

- `src/lib/components/ExportSheet.svelte` - All export logic improvements
- `MOBILE_EXPORT_FIX.md` - Detailed technical documentation

## Next Steps

1. **Test on various devices:**
   - iPhone (Safari)
   - iPad (Safari)
   - Android (Chrome)
   
2. **Monitor console logs** for any errors

3. **If issues persist:**
   - Increase mobile delay from 500ms to 1000ms
   - Check Google Fonts are loading correctly
   - Verify IndexedDB contains background images
   - Test with smaller images first

## Fallback Options

If problems continue:
- Try system fonts (should always work)
- Use smaller background images (<2MB)
- Increase delay to 1000ms or higher
- Consider manual font preloading at app startup

## Success Criteria

✅ Custom fonts export correctly on iOS Safari  
✅ Custom fonts export correctly on Android Chrome  
✅ Background images export correctly on iOS Safari  
✅ Background images export correctly on Android Chrome  
✅ No significant performance degradation  
✅ No new errors in console  

## Technical Details

- **Library:** modern-screenshot v4.6.6 (domToJpeg)
- **Fonts:** Google Fonts (loaded in index.html)
- **Images:** Base64 in IndexedDB
- **Screenshot:** 2x scale, 95% quality JPG