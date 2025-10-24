# Mobile Export Changes - Before/After Comparison

## Overview

This document shows the exact code changes made to fix mobile export issues with fonts and background images.

---

## File: `src/lib/components/ExportSheet.svelte`

### Change 1: Added Helper Function for DOM Image Loading

**Location:** After `getWeekContainerBackgroundStyle()` function (line 128)

**ADDED:**
```typescript
// Helper function to wait for all images in an element to be loaded
async function waitForImagesToLoad(element: HTMLElement): Promise<void> {
    const images = element.querySelectorAll("img");
    const imagePromises = Array.from(images).map((img) => {
        if (img.complete) {
            return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Resolve even on error to not block
        });
    });

    // Also check for background images in the element itself
    const style = window.getComputedStyle(element);
    const backgroundImage = style.backgroundImage;

    if (backgroundImage && backgroundImage !== "none") {
        const urlMatch = backgroundImage.match(/url\(["']?([^"']*)["']?\)/);
        if (urlMatch && urlMatch[1]) {
            const bgImg = new Image();
            const bgPromise = new Promise<void>((resolve) => {
                const timeout = setTimeout(() => resolve(), 5000); // 5s timeout
                bgImg.onload = () => {
                    clearTimeout(timeout);
                    bgImg
                        .decode()
                        .then(() => resolve())
                        .catch(() => resolve());
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
    console.log("[ExportSheet] All images in DOM loaded");
}
```

---

### Change 2: Enhanced Font Loading

**Location:** Inside `generateJPGBlob()` function, font loading section

**BEFORE:**
```typescript
// Wait for fonts to load
console.log("[ExportSheet] Waiting for fonts to load...");
try {
    await document.fonts.ready;
    console.log("[ExportSheet] All fonts loaded successfully");
} catch (error) {
    console.warn("[ExportSheet] Font loading failed:", error);
}
```

**AFTER:**
```typescript
// Wait for fonts to load - use more robust checking
console.log("[ExportSheet] Waiting for fonts to load...");
try {
    await document.fonts.ready;

    // Additional font check: verify specific fonts are loaded
    const fontsToCheck = [
        $exportSettings.headerFontFamily,
        $exportSettings.bodyFontFamily,
    ];

    for (const fontFamily of fontsToCheck) {
        // Extract font name from family string (e.g., "'Playfair Display', serif" -> "Playfair Display")
        const fontMatch = fontFamily.match(/'([^']+)'/);
        if (fontMatch) {
            const fontName = fontMatch[1];

            // Load multiple font weights to ensure all variants are available
            const weights = ["300", "400", "500", "600", "700"];
            const loadPromises = weights.map(async (weight) => {
                try {
                    const fontSpec = `${weight} 16px "${fontName}"`;
                    const isLoaded = document.fonts.check(fontSpec);

                    if (!isLoaded) {
                        await document.fonts.load(fontSpec);
                        console.log(
                            `[ExportSheet] Loaded font: ${fontName} weight ${weight}`,
                        );
                    }
                } catch (e) {
                    // Silently continue if a weight doesn't exist
                    console.log(
                        `[ExportSheet] Font ${fontName} weight ${weight} not available`,
                    );
                }
            });

            await Promise.all(loadPromises);
            console.log(
                `[ExportSheet] Font ${fontName} all weights loaded`,
            );
        }
    }

    console.log("[ExportSheet] All fonts loaded successfully");

    // Force font rendering by measuring text
    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");
    if (ctx) {
        fontsToCheck.forEach((fontFamily) => {
            ctx.font = `16px ${fontFamily}`;
            ctx.measureText("Test"); // Forces browser to load and render font
        });
    }
} catch (error) {
    console.warn("[ExportSheet] Font loading failed:", error);
}
```

---

### Change 3: Enhanced Background Image Loading

**Location:** Inside `generateJPGBlob()` function, background image loading section

**BEFORE:**
```typescript
// Wait for background image to load if it exists and is active
if (
    $exportSettings.backgroundMode === "image" &&
    $exportSettings.backgroundImage
) {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
            reject(new Error("Failed to load background image"));
        img.src = $exportSettings.backgroundImage!;
    });
    console.log(
        "[ExportSheet] Background image loaded successfully",
    );
}
```

**AFTER:**
```typescript
// Wait for background image to load if it exists and is active
if (
    $exportSettings.backgroundMode === "image" &&
    $exportSettings.backgroundImage
) {
    console.log("[ExportSheet] Loading background image...");
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Background image loading timeout"));
        }, 10000); // 10 second timeout

        img.onload = () => {
            clearTimeout(timeout);
            // Ensure the image is decoded
            img.decode()
                .then(() => {
                    console.log(
                        "[ExportSheet] Background image decoded successfully",
                    );
                    resolve();
                })
                .catch(() => {
                    console.log(
                        "[ExportSheet] Background image loaded (decode not supported)",
                    );
                    resolve();
                });
        };
        img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error("Failed to load background image"));
        };
        img.src = $exportSettings.backgroundImage!;
    });
    console.log(
        "[ExportSheet] Background image loaded successfully",
    );
}

// Wait for all images in the DOM to be loaded
await waitForImagesToLoad(element);
```

---

### Change 4: Mobile Detection and Enhanced Delays

**Location:** Inside `generateJPGBlob()` function, before screenshot capture

**BEFORE:**
```typescript
// Add a small delay to ensure everything is rendered
await new Promise((resolve) => setTimeout(resolve, 100));
console.log("[ExportSheet] Starting screenshot capture...");

const dataUrl = await domToJpeg(element, {
    scale: 2,
    quality: 0.95,
});
```

**AFTER:**
```typescript
// Detect if we're on mobile and add extra delay
const isMobile = /iPhone|iPad|iPod|Android/i.test(
    navigator.userAgent,
);
const delay = isMobile ? 500 : 200; // Longer delay on mobile

console.log(
    `[ExportSheet] Waiting ${delay}ms for render (mobile: ${isMobile})...`,
);
await new Promise((resolve) => setTimeout(resolve, delay));

// Force a reflow to ensure everything is rendered
element.getBoundingClientRect();

console.log("[ExportSheet] Starting screenshot capture...");

const dataUrl = await domToJpeg(element, {
    scale: 2,
    quality: 0.95,
    // Use high quality settings to ensure fonts and images are properly captured
    debug: false,
});
```

---

## Summary of Changes

### Additions:
1. **New helper function** `waitForImagesToLoad()` - Waits for all images including CSS backgrounds
2. **Font weight preloading** - Loads 5 font weights (300, 400, 500, 600, 700) for each font
3. **Canvas-based font forcing** - Uses canvas `measureText()` to force font rendering
4. **Image decode support** - Uses `img.decode()` API for better image loading
5. **Mobile detection** - Identifies mobile devices and uses longer delays
6. **Reflow forcing** - Calls `getBoundingClientRect()` to force layout completion
7. **Timeout protection** - 10-second timeout for background image loading

### Improvements:
- **100ms → 500ms** delay on mobile devices
- **100ms → 200ms** delay on desktop
- Better error handling and logging
- More robust font and image verification

### Result:
- ✅ Fonts should now export correctly on mobile
- ✅ Background images should now export correctly on mobile
- ✅ Better debugging with detailed console logs
- ⚠️ Slightly longer export time (~500ms more on mobile)

---

## Testing Checklist

- [ ] Test on iOS Safari (iPhone)
- [ ] Test on iOS Safari (iPad)
- [ ] Test on Android Chrome
- [ ] Test with custom fonts (e.g., Playfair Display, Dancing Script)
- [ ] Test with default background images
- [ ] Test with custom uploaded background images
- [ ] Verify console logs show all fonts loaded
- [ ] Verify console logs show image decoded
- [ ] Check exported JPG has correct font
- [ ] Check exported JPG has background image

---

## Rollback Instructions

If issues occur, revert `src/lib/components/ExportSheet.svelte` by:

1. Remove `waitForImagesToLoad()` function (lines 128-169)
2. Simplify font loading back to just `await document.fonts.ready`
3. Remove font weight preloading loop
4. Remove canvas font forcing
5. Remove `img.decode()` call
6. Change delay back to `100ms` for all devices
7. Remove `getBoundingClientRect()` call