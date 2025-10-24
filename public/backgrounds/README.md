# Background Images Directory

This directory contains default background images for the Wochenschau export feature.

## Adding Images

1. **Save images here** with descriptive names:
   ```
   gradient-blue.jpg
   pattern-dots.jpg
   nature-wood.jpg
   ```

2. **Update configuration** in `src/lib/stores/defaultBackgrounds.ts`:
   ```typescript
   {
     id: "gradient-blue",
     name: "Ocean Blue",
     url: "/backgrounds/gradient-blue.jpg",
     description: "Soft blue gradient",
     category: "gradient"
   }
   ```

3. **Done!** Image appears in ExportSheet automatically

## Image Guidelines

- **Format**: JPG or PNG
- **Size**: 1920x1080px minimum
- **File Size**: 50-150KB (after compression)
- **Quality**: High quality for visible exports

## Categories

- `minimal` - Clean, professional backgrounds
- `gradient` - Color gradients
- `pattern` - Geometric patterns
- `nature` - Textures (wood, marble, stone)

## Current Images

Images in this folder are automatically served at `/backgrounds/image-name.jpg`

They're also included in the PWA precache for offline support.

## Offline Access

All images here work offline after first visit:
1. Service worker automatically caches them
2. Available on subsequent visits without internet
3. Count toward PWA cache size (~1-2MB recommended)

## Quick Start

1. Copy your background image to this folder
2. Add entry to `src/lib/stores/defaultBackgrounds.ts`
3. Image appears in ExportSheet selector immediately!

## File Naming Convention

Use descriptive names with category prefix:
```
[category]-[description].jpg

Examples:
minimal-white.jpg
gradient-blue.jpg
pattern-dots.jpg
nature-wood.jpg
```

## Performance Tips

- Compress images before adding (target 50-150KB)
- Use JPG for photos/gradients, PNG for patterns
- Keep total folder under 2MB
- Test with `pnpm dev` after adding

---

See `BACKGROUNDS_SUMMARY.md` in project root for complete setup guide.