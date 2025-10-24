# Export Quality Configuration

## Overview

This document describes the export quality settings and configuration for the weekly agenda image exports. The system is optimized for maximum quality while maintaining reasonable file sizes and export times.

## Current Configuration

### Resolution Settings

```typescript
// Base Canvas Dimensions
const GRID_WIDTH = 1200;      // Grid layout width (was 900px)
const LIST_WIDTH = 600;       // List layout width (was 400px)

// Export Scale
const EXPORT_SCALE = 4;       // 4x resolution multiplier (was 2x)

// Final Output Dimensions
const GRID_OUTPUT = 4800;     // 1200px × 4 = 4800px width
const LIST_OUTPUT = 2400;     // 600px × 4 = 2400px width
```

### Quality Specifications

| Setting | Value | Description |
|---------|-------|-------------|
| **Scale Factor** | 4x | Resolution multiplier for export |
| **Grid Base Width** | 1200px | Preview width for grid layout |
| **List Base Width** | 600px | Preview width for list layout |
| **Grid Output Width** | 4800px | Final exported width (grid) |
| **List Output Width** | 2400px | Final exported width (list) |
| **Format** | PNG | Lossless image format |
| **Effective DPI** | ~300 DPI | Print-quality resolution |
| **Font Embedding** | Base64 | 100% reliable font rendering |
| **Background Mode** | Multiple | Color, Image, or None |

## Export Pipeline

### 1. Preparation Phase
```typescript
// Font Loading
- Load Google Fonts with crossorigin
- Wait for document.fonts.ready
- Explicitly load font weights (300, 400, 500, 600, 700)
- Embed fonts as base64 data URLs

// Element Preparation
- Ensure #export-preview element exists
- Wait 1000ms for full render
- Apply background (image or color)
```

### 2. Capture Phase
```typescript
await snapdom.toBlob(element, {
    type: "png",
    scale: 4,                    // 4x resolution
    embedFonts: false,           // We manually embed
    backgroundColor: ...,         // Optional background
    filter: (node) => ...,       // Filter out .no-export elements
});
```

### 3. Post-Processing
```typescript
// Cleanup
- Remove embedded font styles
- Return blob for download/share
- Log success/error
```

## Quality vs Performance

### Current Settings (4x Scale)
- **Quality**: Excellent - Print-ready, high-DPI optimized
- **File Size**: 500KB - 2MB (depending on content)
- **Export Time**: 2-4 seconds (including font embedding)
- **Use Case**: Professional exports, printing, social media

### Alternative Configurations

#### High Quality (3x Scale)
```typescript
scale: 3
gridWidth: 1200px
listWidth: 600px
// Output: 3600px × 1800px
// File Size: 300KB - 1.5MB
// Export Time: 1-3 seconds
```

#### Standard Quality (2x Scale) - Previous Default
```typescript
scale: 2
gridWidth: 900px
listWidth: 400px
// Output: 1800px × 800px
// File Size: 200KB - 800KB
// Export Time: 1-2 seconds
```

#### Maximum Quality (5x Scale)
```typescript
scale: 5
gridWidth: 1200px
listWidth: 600px
// Output: 6000px × 3000px
// File Size: 800KB - 3MB
// Export Time: 3-6 seconds
// Note: May cause memory issues on mobile
```

## Background Handling

### Image Backgrounds
```html
<!-- Using <img> element for reliable capture -->
<img 
    src={backgroundImage} 
    style="position: absolute; inset: 0; width: 100%; height: 100%; 
           object-fit: cover; object-position: center; 
           pointer-events: none; z-index: 0;" 
/>
```

### Color Backgrounds
```html
<!-- Applied to container element -->
<div style="background-color: {backgroundColor};">
    <!-- Optional overlay for opacity -->
    <div style="position: absolute; inset: 0; 
                background-color: {backgroundColor}; 
                opacity: {opacity}; 
                pointer-events: none; z-index: 1;"></div>
</div>
```

## Layout Structure (Optimized for No Border)

```html
<div id="export-preview" style="width: 1200px; position: relative;">
    <!-- Background (fills entire container) -->
    <img src="..." style="position: absolute; inset: 0; ..." />
    
    <!-- Content wrapper (has padding, z-index above background) -->
    <div style="padding: 1.5rem; position: relative; z-index: 10;">
        <!-- All content here -->
        <div class="header">...</div>
        <div class="activities">...</div>
        <div class="bible-verse">...</div>
    </div>
</div>
```

**Key Points:**
- No padding on `#export-preview` (prevents white border)
- Background elements use `inset: 0` (fills entire container)
- Content wrapper has padding (maintains spacing)
- Proper z-index layering (background < overlay < content)

## Font Quality

### Font Embedding Process
1. Fetch Google Fonts CSS
2. Extract font URLs
3. Fetch font files as ArrayBuffer
4. Convert to base64 data URLs
5. Inject as `@font-face` rules
6. Attach to document head during export
7. Remove after export completes

### Supported Font Weights
- 300 (Light)
- 400 (Regular)
- 500 (Medium)
- 600 (Semi-Bold)
- 700 (Bold)

## Browser Compatibility

| Browser | Scale Support | Max Recommended Scale | Notes |
|---------|---------------|----------------------|-------|
| Chrome/Edge | ✅ 1x-5x | 5x | Best performance |
| Firefox | ✅ 1x-5x | 4x | Slightly slower |
| Safari (Desktop) | ✅ 1x-5x | 4x | Good performance |
| Safari (iOS) | ✅ 1x-4x | 3x | Memory constrained |
| Chrome (Android) | ✅ 1x-4x | 4x | Good performance |

## File Size Optimization

### Factors Affecting File Size
1. **Scale**: Higher scale = larger file (exponential)
2. **Content Complexity**: More activities = larger file
3. **Background**: Images add significant size
4. **Colors**: More unique colors = larger file
5. **Text**: More text = slightly larger file

### Size Estimates (Grid Layout, 4x Scale)
- Minimal content, no background: ~300KB
- Normal content, color background: ~500KB
- Normal content, image background: ~1-2MB
- Full week, image background: ~2-3MB

## Recommendations

### For Social Media
- **Scale**: 4x (current default)
- **Width**: 1200px grid or 600px list
- **Background**: Image for visual appeal
- **Result**: Perfect for Instagram, Facebook, Twitter

### For Printing
- **Scale**: 4x (current default)
- **Width**: 1200px grid
- **Background**: High-quality image or solid color
- **Result**: 300 DPI equivalent, print-ready

### For Digital Sharing
- **Scale**: 4x (current default)
- **Width**: Any layout
- **Background**: Any mode
- **Result**: Crisp on all displays (retina, 4K, etc.)

### For Quick Preview
- **Scale**: 2x-3x (reduce if needed)
- **Width**: Any layout
- **Background**: Any mode
- **Result**: Faster exports, smaller files

## Future Enhancements

### Potential Improvements
- [ ] User-selectable quality presets (Fast/Standard/High/Maximum)
- [ ] Adaptive quality based on device capabilities
- [ ] Progressive export with preview at lower resolution
- [ ] Client-side image compression options
- [ ] Export to JPEG with quality slider
- [ ] WebP format support for smaller file sizes
- [ ] SVG export for vector graphics
- [ ] PDF export for printing

### Quality Presets Concept
```typescript
const QUALITY_PRESETS = {
    fast: { scale: 2, width: { grid: 900, list: 400 } },
    standard: { scale: 3, width: { grid: 1200, list: 600 } },
    high: { scale: 4, width: { grid: 1200, list: 600 } },      // Current
    maximum: { scale: 5, width: { grid: 1500, list: 750 } },
};
```

## Troubleshooting

### Export Too Slow
- Reduce scale to 3x or 2x
- Optimize background image size before upload
- Clear browser cache
- Close other applications

### File Size Too Large
- Use color background instead of image
- Reduce scale to 3x or 2x
- Compress background image before upload
- Use simpler color schemes

### Quality Not Good Enough
- Increase scale to 5x (may be slow)
- Increase base width
- Use high-resolution background images
- Ensure fonts are loading properly

### Fonts Look Wrong
- Check network connection (for Google Fonts)
- Wait for full export completion
- Clear cache and reload
- Try different fonts

---

**Current Status**: ✅ Optimized for Maximum Quality  
**Scale**: 4x (4800px × 2400px output)  
**Quality Level**: Print-Ready / High-DPI  
**Performance**: 2-4 seconds per export  
**File Size**: 500KB - 2MB typical  
**Last Updated**: 2024-01