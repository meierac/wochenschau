# Local Fonts Setup Guide

## Overview

This guide explains how to replace Google Fonts with locally hosted fonts in your Wochenschau project. Local fonts provide better performance, offline support, and no external dependencies.

---

## Benefits of Local Fonts

✅ **Better Performance**: No external requests to Google servers  
✅ **Offline Support**: Works without internet connection  
✅ **Privacy**: No tracking or data sharing with Google  
✅ **Reliability**: No dependency on external CDN  
✅ **Export Quality**: Fonts always available for image exports  
✅ **Bundle Control**: Choose exactly which weights/styles to include  

---

## Directory Structure

```
wochenschau/
├── public/
│   └── fonts/
│       ├── inter/
│       │   ├── Inter-Light.woff2
│       │   ├── Inter-Regular.woff2
│       │   ├── Inter-Medium.woff2
│       │   ├── Inter-SemiBold.woff2
│       │   └── Inter-Bold.woff2
│       ├── playfair-display/
│       │   ├── PlayfairDisplay-Regular.woff2
│       │   ├── PlayfairDisplay-Medium.woff2
│       │   ├── PlayfairDisplay-SemiBold.woff2
│       │   └── PlayfairDisplay-Bold.woff2
│       ├── roboto/
│       │   ├── Roboto-Light.woff2
│       │   ├── Roboto-Regular.woff2
│       │   ├── Roboto-Medium.woff2
│       │   └── Roboto-Bold.woff2
│       └── ... (other fonts)
└── src/
    ├── assets/
    │   └── fonts.css    (NEW: @font-face declarations)
    └── ...
```

---

## Step 1: Download Fonts

### Option A: Using Google Webfonts Helper (Recommended)

1. Visit: https://gwfh.mranftl.com/fonts
2. Search for your font (e.g., "Inter")
3. Select the weights you need:
   - 300 (Light)
   - 400 (Regular)
   - 500 (Medium)
   - 600 (Semi-Bold)
   - 700 (Bold)
4. Choose "Modern Browsers" (woff2 only)
5. Click "Download files"
6. Extract to `public/fonts/[font-name]/`

### Option B: Using Google Fonts Directly

1. Go to: https://fonts.google.com/
2. Select your font
3. Click "Download family"
4. Use a tool to convert TTF to WOFF2:
   - Online: https://cloudconvert.com/ttf-to-woff2
   - CLI: `woff2_compress font.ttf`

### Recommended Fonts to Download

Based on your current font list, prioritize these popular ones:

**Essential (most used):**
- Inter (Sans-Serif) - 300, 400, 500, 600, 700
- Playfair Display (Serif) - 400, 500, 600, 700
- Roboto (Sans-Serif) - 300, 400, 500, 700
- Montserrat (Sans-Serif) - 300, 400, 500, 600, 700
- Lora (Serif) - 400, 500, 600, 700

**Popular Script/Display:**
- Dancing Script - 400, 500, 600, 700
- Pacifico - 400
- Great Vibes - 400

**Monospace:**
- Fira Code - 300, 400, 500, 600, 700

---

## Step 2: Create Font CSS File

Create `src/assets/fonts.css`:

```css
/* Inter - Sans-Serif */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter/Inter-Light.woff2') format('woff2');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter/Inter-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter/Inter-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter/Inter-SemiBold.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter/Inter-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* Playfair Display - Serif */
@font-face {
  font-family: 'Playfair Display';
  src: url('/fonts/playfair-display/PlayfairDisplay-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Playfair Display';
  src: url('/fonts/playfair-display/PlayfairDisplay-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Playfair Display';
  src: url('/fonts/playfair-display/PlayfairDisplay-SemiBold.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Playfair Display';
  src: url('/fonts/playfair-display/PlayfairDisplay-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* Roboto - Sans-Serif */
@font-face {
  font-family: 'Roboto';
  src: url('/fonts/roboto/Roboto-Light.woff2') format('woff2');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Roboto';
  src: url('/fonts/roboto/Roboto-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Roboto';
  src: url('/fonts/roboto/Roboto-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Roboto';
  src: url('/fonts/roboto/Roboto-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* Add more fonts as needed... */
```

---

## Step 3: Import Fonts in Your App

### Option A: Import in main.ts (Recommended)

```typescript
// src/main.ts
import './assets/fonts.css';
import './app.css';
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')!,
});

export default app;
```

### Option B: Import in app.css

```css
/* src/app.css */
@import './assets/fonts.css';

/* rest of your styles */
```

---

## Step 4: Update index.html

Remove the Google Fonts links:

```html
<!-- REMOVE THESE LINES -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet" crossorigin="anonymous" />
```

---

## Step 5: Update Export Font Embedding

Update `src/lib/components/ExportSheet.svelte`:

### Current Implementation (Google Fonts)
```typescript
// Fetch the Google Fonts CSS to get font URLs
const googleFontsLink = document.querySelector(
    'link[href*="fonts.googleapis.com"]',
) as HTMLLinkElement;
```

### New Implementation (Local Fonts)
```typescript
async function embedFontsAsBase64() {
    const style = document.createElement("style");
    style.id = "export-embedded-fonts";
    
    const fontFamilies = [
        $exportSettings.headerFontFamily,
        $exportSettings.bodyFontFamily,
    ];
    
    let cssRules = "";
    
    for (const family of fontFamilies) {
        // Extract font name
        const fontMatch = family.match(/'([^']+)'/);
        if (!fontMatch) continue;
        
        const fontName = fontMatch[1];
        const weights = [300, 400, 500, 600, 700];
        
        for (const weight of weights) {
            try {
                // Fetch local font file
                const fontPath = `/fonts/${fontName.toLowerCase().replace(/\s+/g, '-')}/${fontName.replace(/\s+/g, '')}-${getWeightName(weight)}.woff2`;
                const response = await fetch(fontPath);
                
                if (response.ok) {
                    const buffer = await response.arrayBuffer();
                    const base64 = arrayBufferToBase64(buffer);
                    
                    cssRules += `
                        @font-face {
                            font-family: '${fontName}';
                            src: url(data:font/woff2;charset=utf-8;base64,${base64}) format('woff2');
                            font-weight: ${weight};
                            font-style: normal;
                            font-display: block;
                        }
                    `;
                }
            } catch (e) {
                console.warn(`Failed to load font: ${fontName} weight ${weight}`);
            }
        }
    }
    
    style.textContent = cssRules;
    document.head.appendChild(style);
    return style;
}

function getWeightName(weight: number): string {
    const names: Record<number, string> = {
        300: 'Light',
        400: 'Regular',
        500: 'Medium',
        600: 'SemiBold',
        700: 'Bold',
    };
    return names[weight] || 'Regular';
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
```

---

## Step 6: Update Font Options (Optional)

If you only bundle specific fonts, update `src/lib/stores/exportSettings.ts`:

```typescript
// Only include fonts you've downloaded
export const FONT_FAMILIES = [
  // Sans-Serif (Local)
  { name: "Inter (Sans-Serif)", value: "'Inter', sans-serif" },
  { name: "Roboto (Sans-Serif)", value: "'Roboto', sans-serif" },
  { name: "Montserrat (Sans-Serif)", value: "'Montserrat', sans-serif" },
  
  // Serif (Local)
  { name: "Playfair Display (Serif)", value: "'Playfair Display', serif" },
  { name: "Lora (Serif)", value: "'Lora', serif" },
  
  // Script (Local)
  { name: "Dancing Script (Script)", value: "'Dancing Script', cursive" },
  { name: "Pacifico (Handwriting)", value: "'Pacifico', cursive" },
  
  // Monospace (Local)
  { name: "Fira Code (Mono)", value: "'Fira Code', monospace" },
  
  // System Fallback
  { name: "System Default", value: "system-ui, -apple-system, sans-serif" },
];
```

---

## Step 7: Testing

### Test Checklist
- [ ] Fonts load correctly in the app
- [ ] Preview shows correct fonts
- [ ] Export includes correct fonts
- [ ] Works offline (disable network in DevTools)
- [ ] No console errors about missing fonts
- [ ] Font weights display correctly (300, 400, 500, 600, 700)
- [ ] Export quality is maintained

---

## Performance Optimization

### Preload Critical Fonts

In `index.html`, add preload hints for your default fonts:

```html
<head>
  <!-- Preload critical fonts -->
  <link rel="preload" href="/fonts/inter/Inter-Regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/playfair-display/PlayfairDisplay-Bold.woff2" as="font" type="font/woff2" crossorigin>
</head>
```

### Use font-display: swap

Already included in the @font-face declarations above. This ensures text is visible while fonts load.

### Subset Fonts (Advanced)

For even smaller file sizes, create font subsets with only the characters you need:

```bash
# Install pyftsubset
pip install fonttools brotli

# Create subset (Latin characters only)
pyftsubset font.ttf \
  --output-file=font-subset.woff2 \
  --flavor=woff2 \
  --layout-features=* \
  --unicodes=U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD
```

---

## File Size Comparison

### Before (Google Fonts - External)
- 0 KB bundled (loaded from Google CDN)
- But requires internet connection

### After (Local Fonts - WOFF2)
Typical sizes per font weight:
- Inter: ~15-20 KB per weight
- Playfair Display: ~20-25 KB per weight
- Roboto: ~12-18 KB per weight

**Example bundle (5 fonts × 5 weights):**
- Total: ~400-500 KB
- Compressed with gzip: ~250-300 KB

---

## Migration Checklist

- [ ] Create `/public/fonts/` directory
- [ ] Download essential fonts as WOFF2
- [ ] Create `src/assets/fonts.css` with @font-face rules
- [ ] Import fonts.css in main.ts or app.css
- [ ] Remove Google Fonts links from index.html
- [ ] Update ExportSheet.svelte font embedding logic
- [ ] Update FONT_FAMILIES array (optional)
- [ ] Add preload hints for critical fonts
- [ ] Test all font features in app
- [ ] Test exports with different fonts
- [ ] Test offline functionality
- [ ] Check bundle size
- [ ] Update PWA cache configuration

---

## Troubleshooting

### Fonts not loading
1. Check file paths in fonts.css
2. Ensure files are in `/public/fonts/`
3. Check browser console for 404 errors
4. Verify CORS headers (should not be an issue with local files)

### Export shows wrong fonts
1. Verify font embedding code is updated
2. Check that font files exist
3. Ensure base64 conversion is working
4. Check console for errors during export

### Large bundle size
1. Only include weights you actually use (300, 400, 500, 700)
2. Skip italics if not needed
3. Use font subsetting
4. Consider variable fonts (single file for all weights)

---

## Variable Fonts Alternative

For even better optimization, consider using variable fonts:

### Benefits
- Single file contains all weights
- Smaller total file size
- Smooth weight transitions

### Example (Inter Variable)
```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter/Inter-Variable.woff2') format('woff2-variations');
  font-weight: 100 900; /* Supports all weights */
  font-style: normal;
  font-display: swap;
}
```

Download from: https://rsms.me/inter/

---

## Recommended Font Sets

### Minimal Set (Best Performance)
- Inter (Sans-Serif) - Weights: 400, 600, 700
- Playfair Display (Serif) - Weights: 400, 700
- System Default (Fallback)

Bundle size: ~150 KB

### Standard Set (Good Balance)
- Inter (Sans-Serif) - Weights: 300, 400, 500, 600, 700
- Playfair Display (Serif) - Weights: 400, 500, 600, 700
- Roboto (Sans-Serif) - Weights: 300, 400, 500, 700
- Dancing Script (Script) - Weight: 400
- Fira Code (Mono) - Weights: 400, 600

Bundle size: ~350 KB

### Full Set (Maximum Choice)
- All fonts from FONT_FAMILIES array
- Multiple weights for each

Bundle size: ~1-2 MB

---

## Next Steps

1. **Start with minimal set**: Download Inter and Playfair Display
2. **Test thoroughly**: Ensure app and exports work correctly
3. **Add more fonts**: Based on actual usage analytics
4. **Monitor performance**: Check bundle size and load times
5. **Consider CDN**: For production, serve fonts from CDN

---

**Status**: Ready to implement  
**Difficulty**: Medium  
**Time required**: 1-2 hours  
**Performance gain**: Faster load times, offline support  
**Bundle size increase**: 150 KB - 2 MB (depending on font selection)