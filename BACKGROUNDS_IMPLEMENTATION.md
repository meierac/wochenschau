# Default Backgrounds Implementation Guide

## Quick Start

Default background images for the export feature are stored in `public/backgrounds/` directory and can be accessed through the ExportSheet component.

## Directory Structure

```
wochenschau/
└── public/
    └── backgrounds/
        ├── minimal-white.jpg
        ├── minimal-light-gray.jpg
        ├── minimal-beige.jpg
        ├── gradient-blue.jpg
        ├── gradient-sunset.jpg
        ├── gradient-forest.jpg
        ├── gradient-purple.jpg
        ├── gradient-rose.jpg
        ├── pattern-dots.jpg
        ├── pattern-lines.jpg
        ├── pattern-grid.jpg
        ├── pattern-waves.jpg
        ├── nature-wood.jpg
        ├── nature-marble.jpg
        └── nature-stone.jpg
```

## Why public/ Directory?

The `public/` directory is the best location for default backgrounds because:

✅ **Static Serving**: Images are served directly at `/backgrounds/image-name.jpg`
✅ **No Build Required**: Add images and they're immediately available
✅ **PWA Support**: Automatically included in service worker precache for offline access
✅ **Performance**: Cached with long expiration headers
✅ **Simplicity**: No import statements or build configuration needed
✅ **User Control**: Users can still upload custom backgrounds

## Adding Background Images

### Step 1: Prepare Images

- **Format**: JPG (recommended for photos/gradients) or PNG (for patterns)
- **Recommended Size**: 1920x1080px or larger
- **File Size**: Keep under 500KB per image (compress if needed)
- **Quality**: Use high-quality images as they'll be visible in exports

### Step 2: Place in Directory

Copy your background images to `public/backgrounds/`

Example:
```bash
cp my-gradient.jpg wochenschau/public/backgrounds/gradient-blue.jpg
```

### Step 3: Update Configuration

Edit `src/lib/stores/defaultBackgrounds.ts` and add your image to the `DEFAULT_BACKGROUNDS` array:

```typescript
{
  id: "gradient-blue",
  name: "Ocean Blue",
  url: "/backgrounds/gradient-blue.jpg",
  description: "Soft blue gradient for a calming effect",
  category: "gradient",
}
```

**Required Fields:**
- `id`: Unique identifier (kebab-case, no spaces)
- `name`: Display name shown in UI
- `url`: Full path starting with `/backgrounds/`
- `description`: Helpful tooltip text
- `category`: One of: `"minimal"`, `"gradient"`, `"pattern"`, `"nature"`

### Step 4: Use in ExportSheet

Import and use the `DefaultBackgroundSelector` component in ExportSheet:

```svelte
<script lang="ts">
  import DefaultBackgroundSelector from "./DefaultBackgroundSelector.svelte";
</script>

<!-- Add in export options section -->
<DefaultBackgroundSelector />
```

Or manually integrate backgrounds:

```svelte
<script lang="ts">
  import { DEFAULT_BACKGROUNDS } from "../stores/defaultBackgrounds";
  import { exportSettings } from "../stores/exportSettings";

  async function loadBackgroundAsBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(blob);
    });
  }

  async function selectBackground(url: string) {
    const base64 = await loadBackgroundAsBase64(url);
    exportSettings.setBackgroundImage(base64);
  }
</script>

<div class="grid grid-cols-4 gap-2">
  {#each DEFAULT_BACKGROUNDS as bg}
    <button
      on:click={() => selectBackground(bg.url)}
      class="h-24 rounded border hover:border-primary transition-colors"
      title={bg.description}
    >
      <img src={bg.url} alt={bg.name} class="w-full h-full object-cover rounded" />
    </button>
  {/each}
</div>
```

## Image Categories Guide

### Minimal (Professional)
Clean backgrounds for formal exports:
- White, light gray, beige
- Best for business documents
- Use with dark text for contrast
- Recommended opacity: 100%

### Gradient (Visual Interest)
Soft color transitions:
- Blue: Calming, corporate
- Sunset: Warm, creative
- Forest: Natural, organic
- Purple: Artistic, modern
- Rose: Elegant, sophisticated

### Pattern (Geometric)
Subtle decorative patterns:
- Dots: Minimalist, professional
- Lines: Geometric, technical
- Grid: Professional, orderly
- Waves: Dynamic, flowing

### Nature (Textured)
Natural material textures:
- Wood: Warm, organic
- Marble: Elegant, luxury
- Stone: Earthy, stable

## Performance Optimization

### Image Compression
Before adding to project, compress images:

```bash
# Using ImageMagick
convert input.jpg -quality 85 -resize 1920x1080 output.jpg

# Or use online tools like TinyPNG
```

### File Size Recommendations
- Per image: 50-100KB (after compression)
- Total backgrounds folder: Keep under 2MB
- Current PWA precache: ~280KB
- Adding 15 backgrounds (~1MB) keeps total under 1.3MB

### Caching Strategy
- Browser cache: Long expiration (1 year)
- Service worker: Precached on first visit
- Subsequent visits: Loaded from cache
- Users only download once

## Converting to Base64

When user selects a default background, it's converted to base64:

```typescript
async function loadBackgroundAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = () => reject(new Error("Failed to read"));
    reader.readAsDataURL(blob);
  });
}

// Store in exportSettings
const base64 = await loadBackgroundAsBase64("/backgrounds/gradient-blue.jpg");
exportSettings.setBackgroundImage(base64);
```

## Offline Support

All backgrounds in `public/backgrounds/`:
- Are automatically included in service worker precache
- Work completely offline after first visit
- Remain available without internet connection
- Count toward PWA cache size (~5-10MB typical)

Users can:
1. Visit app online
2. Service worker precaches all images
3. App works fully offline
4. Backgrounds available even without connection

## Testing

### Local Development
1. Add image to `public/backgrounds/`
2. Update `src/lib/stores/defaultBackgrounds.ts`
3. Start dev server: `pnpm dev`
4. Navigate to ExportSheet
5. Verify background loads and applies correctly

### Production Build
```bash
# Build with images
pnpm run build

# Preview production build
pnpm preview

# Check image loads from /backgrounds/
# Verify PWA precache includes image
# Test offline functionality
```

### Verification Checklist
- [ ] Image file exists in `public/backgrounds/`
- [ ] Entry added to `DEFAULT_BACKGROUNDS` array
- [ ] URL path matches file path exactly
- [ ] Category is valid
- [ ] Image displays in UI
- [ ] Image applies to export preview
- [ ] Works offline in PWA
- [ ] File size is reasonable

## Troubleshooting

### Image Not Loading
**Solution:**
- Verify file exists: `ls public/backgrounds/`
- Check URL path matches exactly in defaultBackgrounds.ts
- Clear browser cache: Ctrl+Shift+Delete
- Check console for 404 errors

### Poor Image Quality in Export
**Solution:**
- Use higher resolution source (minimum 1920x1080)
- Reduce JPEG compression
- Verify original image quality before compressing
- Test with original uncompressed image

### Background Not Applied to Export
**Solution:**
- Check `backgroundOpacity` setting (may be hiding image)
- Verify fetch succeeded (check Network tab)
- Ensure `exportSettings.setBackgroundImage()` was called
- Check browser console for errors

### PWA Cache Too Large
**Solution:**
- Remove unused backgrounds
- Optimize image file sizes further
- Split backgrounds into essential/optional
- Consider removing very large images

### Changes Not Reflecting
**Solution:**
- Hard refresh browser: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- Clear service worker: DevTools → Application → Clear Storage
- Delete browser cache completely
- Restart development server

## File Naming Convention

Use descriptive names with category prefix:

```
[category]-[description].jpg

Examples:
minimal-white.jpg
minimal-light-gray.jpg
gradient-blue.jpg
gradient-sunset.jpg
pattern-dots.jpg
pattern-lines.jpg
nature-wood.jpg
nature-marble.jpg
```

## Updating Existing Backgrounds

To replace an image:

1. Replace the file in `public/backgrounds/`
2. Clear browser cache (Ctrl+F5)
3. Service worker will update on next visit

No code changes needed!

## Adding More Categories

To add a new category:

1. Update `defaultBackgrounds.ts` type:
```typescript
category: "minimal" | "gradient" | "pattern" | "nature" | "new-category";
```

2. Add backgrounds with new category

3. Update selector tabs if using DefaultBackgroundSelector component

## Future Enhancements

Possible improvements:
- Community background sharing
- Dynamic gradient generator
- Pattern customization (colors, density)
- WebP format support for better compression
- Responsive image sizes
- Background preview gallery
- Recently used backgrounds
- Favorite backgrounds
- User-uploaded backgrounds storage

## File Organization Best Practices

Keep backgrounds organized:

```
public/backgrounds/
├── README.md           # Documentation
├── minimal/
│   ├── white.jpg
│   ├── gray.jpg
│   └── beige.jpg
├── gradients/
│   ├── blue.jpg
│   ├── sunset.jpg
│   └── forest.jpg
├── patterns/
│   ├── dots.jpg
│   ├── lines.jpg
│   └── grid.jpg
└── nature/
    ├── wood.jpg
    ├── marble.jpg
    └── stone.jpg
```

Then update paths:
```typescript
url: "/backgrounds/gradients/blue.jpg"
```

## Storage Information

**Current PWA Precache:**
- Total: ~280KB
- Build output shows: "20 entries precached (279.85 KiB)"

**Recommended Budget:**
- Total cache: Keep under 5MB
- Backgrounds folder: 1-2MB maximum
- Per image: 50-150KB

**How to Check Precache Size:**
```bash
pnpm run build

# Output shows:
# PWA v1.1.0
# precache  20 entries (279.85 KiB)
```

## Last Updated
October 24, 2024

## Status
✅ Ready for implementation

## Next Steps
1. Create `public/backgrounds/` directory (✓ Done)
2. Create `src/lib/stores/defaultBackgrounds.ts` (✓ Done)
3. Create `src/lib/components/DefaultBackgroundSelector.svelte` (✓ Done)
4. Add background images to `public/backgrounds/`
5. Import DefaultBackgroundSelector in ExportSheet
6. Test with `pnpm dev`
7. Build and test with `pnpm run build && pnpm preview`
