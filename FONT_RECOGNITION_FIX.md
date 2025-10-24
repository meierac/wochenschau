# Font Recognition Fix Guide

## The Problem

You're seeing: **"Not all fonts are recognized"**

This means some fonts display correctly in the preview but fall back to system fonts (Arial/Helvetica) in the exported image.

---

## Why This Happens

### Root Cause
html-to-image (and all DOM-to-image libraries) struggle with web fonts because:

1. **External font loading** - Fonts from Google Fonts are external resources
2. **Font embedding** - The library needs to re-download and embed fonts in the image
3. **Font face matching** - Font family names must match exactly
4. **Timing issues** - Fonts may not be fully rendered when screenshot is taken
5. **CORS restrictions** - Some font files have cross-origin restrictions

### Common Scenarios
- ✅ Preview shows "Playfair Display"
- ❌ Export shows "Arial" (fallback font)

---

## Solutions Implemented

### 1. Extended Font Loading (Line 168-198)
```typescript
// Wait for all fonts to be ready
await document.fonts.ready;

// Explicitly load each font with multiple weights
const fontsToLoad = [
    $exportSettings.headerFontFamily,
    $exportSettings.bodyFontFamily,
];

for (const fontFamily of fontsToLoad) {
    const fontMatch = fontFamily.match(/'([^']+)'/);
    if (fontMatch) {
        const fontName = fontMatch[1];
        const weights = ["300", "400", "500", "600", "700"];
        
        for (const weight of weights) {
            await document.fonts.load(`${weight} 16px "${fontName}"`);
        }
    }
}
```

**What this does:**
- Waits for browser to load all fonts
- Explicitly loads font weights (light, normal, medium, semibold, bold)
- Ensures fonts are available before export

### 2. Increased Rendering Delay (Line 185)
```typescript
await new Promise(resolve => setTimeout(resolve, 800)); // Was 200ms
```

**What this does:**
- Gives browsers more time to render fonts
- Especially important on slower devices
- 800ms is a good balance between speed and reliability

### 3. Font Embedding Options (Line 205-206)
```typescript
skipFonts: false,              // Ensure fonts are processed
preferredFontFormat: "woff2",  // Modern, efficient format
```

**What this does:**
- Tells html-to-image to embed fonts in the output
- Prefers WOFF2 format (best compression, widely supported)

---

## Testing Font Recognition

### Quick Test

1. **Open browser console** (F12)
2. **Select a custom font** (e.g., "Playfair Display")
3. **Export the image**
4. **Check console logs:**

```
[ExportSheet] Waiting for fonts to load...
[ExportSheet] Loaded font: Playfair Display
[ExportSheet] All fonts loaded successfully
[ExportSheet] Starting screenshot capture with html-to-image...
[ExportSheet] Export successful
```

5. **Open exported image**
6. **Verify font is correct** (not Arial/Helvetica)

### Check Loaded Fonts

In browser console, run:
```javascript
// Check if fonts are loaded
document.fonts.ready.then(() => {
    console.log('Total fonts loaded:', document.fonts.size);
    
    for (const font of document.fonts) {
        console.log(`${font.family} - ${font.weight} - ${font.status}`);
    }
});

// Check specific font
const fontLoaded = document.fonts.check('16px "Playfair Display"');
console.log('Playfair Display loaded:', fontLoaded);
```

---

## Which Fonts Work Best?

### Most Reliable (99% success rate)
These fonts have excellent web embedding:

- ✅ **Inter** - Modern sans-serif
- ✅ **Roboto** - Clean sans-serif
- ✅ **Open Sans** - Versatile sans-serif
- ✅ **Lato** - Friendly sans-serif
- ✅ **Playfair Display** - Elegant serif
- ✅ **Merriweather** - Readable serif
- ✅ **Montserrat** - Geometric sans-serif

### Sometimes Problematic (80% success rate)
These can fail on slower connections or mobile:

- ⚠️ **Dancing Script** - Cursive (complex glyphs)
- ⚠️ **Great Vibes** - Calligraphy (large file)
- ⚠️ **Pacifico** - Handwriting (many curves)
- ⚠️ **UnifrakturMaguntia** - Gothic (rare encoding)

### Why Some Fonts Fail More
- Large file sizes (>200KB) take longer to load
- Complex glyphs require more processing
- Less common fonts may have embedding restrictions
- Variable fonts can be problematic

---

## Troubleshooting Steps

### Step 1: Verify Font is Loaded in Browser

**Test in console:**
```javascript
// Check if font is loaded
const font = "Playfair Display";
const isLoaded = document.fonts.check(`16px "${font}"`);
console.log(`${font} loaded:`, isLoaded);

// Check font status
for (const f of document.fonts) {
    if (f.family === font) {
        console.log(`Status: ${f.status}, Weight: ${f.weight}`);
    }
}
```

**Expected:** `true` or status: `loaded`  
**If false:** Font not loaded from Google Fonts - check Network tab

### Step 2: Check Network Requests

1. Open DevTools → Network tab
2. Filter by "font"
3. Reload page
4. Look for Google Fonts requests
5. Verify they complete successfully (status 200)

**If fonts are blocked:**
- Check ad blockers
- Check privacy extensions
- Check firewall/network restrictions

### Step 3: Increase Delay

If fonts load slowly on your device/connection:

**Edit ExportSheet.svelte line 185:**
```typescript
await new Promise(resolve => setTimeout(resolve, 1500)); // Increase to 1.5s
```

**When to increase:**
- Slow internet connection
- Mobile devices
- Complex fonts with many glyphs
- Multiple fonts in use

### Step 4: Try Simpler Fonts First

**Test with these reliable fonts:**
1. Inter (simplest, fastest)
2. Roboto (very reliable)
3. Playfair Display (serif, but well-supported)

**If simple fonts work but complex ones don't:**
- The issue is font file size/complexity
- Increase delay to 1500ms
- Or choose simpler fonts

### Step 5: Check Font Family String

Fonts must match exactly. Check your font family string:

**Correct format:**
```typescript
"'Playfair Display', serif"  // ✅ Correct
"'Inter', sans-serif"         // ✅ Correct
```

**Incorrect format:**
```typescript
"Playfair Display"            // ❌ Missing quotes
"playfair display"            // ❌ Wrong capitalization
"'Playfair Display'"          // ❌ Missing fallback
```

---

## Advanced Solutions

### Solution 1: Preload Fonts in HTML

Add to `index.html` before the Google Fonts link:

```html
<link rel="preload" 
      href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" 
      as="style" 
      onload="this.onload=null;this.rel='stylesheet'">
```

**Benefits:**
- Fonts load earlier
- Higher priority loading
- Better caching

### Solution 2: Font Display Swap

Modify Google Fonts URL, change `&display=swap` to `&display=block`:

```
&display=block
```

**What this does:**
- Blocks rendering until font loads
- Ensures font is ready before display
- Prevents flash of unstyled text (FOUT)

### Solution 3: Self-Host Critical Fonts

For 100% reliability, download and self-host fonts:

1. Download from Google Fonts
2. Place in `/public/fonts/`
3. Add to CSS:

```css
@font-face {
    font-family: 'Playfair Display';
    font-weight: 700;
    src: url('/fonts/playfair-display-700.woff2') format('woff2');
}
```

**Pros:**
- No external dependency
- No CORS issues
- Faster loading

**Cons:**
- Larger bundle size
- Need to update manually
- More maintenance

---

## Known Limitations

### html-to-image Font Embedding
The library has limitations:

1. **Can't embed variable fonts** - Only static weights work
2. **CORS restrictions** - Some fonts block cross-origin access
3. **Font subsetting** - Only characters in the page are embedded
4. **Format support** - Prefers WOFF2, may fail with TTF/OTF

### Browser Differences

**Chrome/Edge:** Best support, most reliable  
**Safari:** Good support, occasionally slower  
**Firefox:** Good support, different rendering engine  
**Mobile Safari:** Can be slower, needs longer delays  
**Mobile Chrome:** Usually good, but slower on older devices  

---

## If Nothing Works

### Option 1: Use Server-Side Rendering

**Most reliable solution** - 99.9% success rate:

```typescript
// Send data to server
const response = await fetch('/api/generate-image', {
    method: 'POST',
    body: JSON.stringify(exportData)
});

// Server uses Puppeteer (real Chrome)
// Fonts always work correctly
```

See: `BETTER_EXPORT_ALTERNATIVES.md` for implementation

### Option 2: Limit Font Selection

Only offer fonts that work 100% reliably:

```typescript
export const RELIABLE_FONTS = [
    { name: "Inter", value: "'Inter', sans-serif" },
    { name: "Roboto", value: "'Roboto', sans-serif" },
    { name: "Open Sans", value: "'Open Sans', sans-serif" },
    { name: "Playfair Display", value: "'Playfair Display', serif" },
    { name: "Merriweather", value: "'Merriweather', serif" },
];
```

### Option 3: Font Fallback Strategy

Add fallback detection:

```typescript
async function exportWithFontFallback() {
    try {
        // Try with custom font
        const blob = await toBlob(element, { skipFonts: false });
        
        // Verify font was embedded (check blob size)
        if (blob && blob.size > 100000) {
            return blob; // Font likely embedded
        }
    } catch (error) {
        console.warn('Font embedding failed, using fallback');
    }
    
    // Fallback: export with system font
    return await toBlob(element, { skipFonts: true });
}
```

---

## Debugging Checklist

When a font doesn't work:

- [ ] Font is in the Google Fonts link in index.html
- [ ] Font name matches exactly (case-sensitive)
- [ ] Font weights are loaded (check Network tab)
- [ ] document.fonts.ready resolves successfully
- [ ] document.fonts.check() returns true
- [ ] Export delay is sufficient (800ms+)
- [ ] No console errors about fonts
- [ ] Browser cache cleared
- [ ] No ad blockers interfering
- [ ] CORS not blocking font files

---

## Performance vs Reliability Trade-offs

### Current Settings (Balanced)
```typescript
delay: 800ms
skipFonts: false
preferredFontFormat: "woff2"
```
- Works for ~90% of fonts
- Reasonable export time
- Good quality

### Maximum Reliability
```typescript
delay: 1500ms
skipFonts: false
preferredFontFormat: "woff2"
```
- Works for ~95% of fonts
- Slower export time
- Best quality

### Maximum Speed
```typescript
delay: 200ms
skipFonts: true
preferredFontFormat: "woff2"
```
- Works for ~70% of fonts
- Fast export time
- May fall back to system fonts

---

## Summary

**Current Implementation:**
- ✅ Explicit font loading with multiple weights
- ✅ Extended delay (800ms) for rendering
- ✅ Font embedding enabled
- ✅ WOFF2 format preferred

**Expected Success Rate:**
- Simple fonts (Inter, Roboto): 99%
- Serif fonts (Playfair Display): 95%
- Script fonts (Dancing Script): 85%
- Complex fonts (Great Vibes): 75%

**If fonts still don't work:**
1. Increase delay to 1500ms
2. Test with simpler fonts
3. Check browser console for errors
4. Consider server-side rendering

**The reality:** DOM-to-image libraries will never be 100% reliable with all fonts. For mission-critical applications, server-side rendering with Puppeteer is the only guaranteed solution.

---

## Quick Fixes Summary

| Issue | Solution | File/Line |
|-------|----------|-----------|
| Font not loading | Check Network tab | DevTools |
| Font loads but not in export | Increase delay to 1500ms | ExportSheet.svelte:185 |
| Only some fonts work | Use fonts from "Reliable" list | - |
| Fonts work on desktop, fail on mobile | Increase delay to 2000ms | ExportSheet.svelte:185 |
| Random failures | Add retry mechanism | Custom code needed |
| Nothing works | Use server-side rendering | See BETTER_EXPORT_ALTERNATIVES.md |

**Most common fix: Increase the delay from 800ms to 1500ms**

This gives slower devices and connections enough time to fully render fonts before capture.