# Default Backgrounds Setup Guide

## Overview
Default background images for the export feature are stored in `public/backgrounds/` and can be selected through the ExportSheet component.

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

## Adding Background Images

### Step 1: Prepare Your Images
- **Format**: JPG or PNG
- **Recommended Size**: 1920x1080px or larger
- **File Size**: Keep under 500KB for optimal performance
- **Quality**: High quality images as they'll be visible in exports

### Step 2: Place Images in Directory
Copy your background images to `public/backgrounds/` directory.

Images placed here will:
- Be automatically served at `/backgrounds/image-name.jpg`
- Be included in PWA precache (offline support)
- Work with any CSP policies
- Be available immediately without build process

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

**Parameters:**
- `id`: Unique identifier (use kebab-case)
- `name`: Display name in UI
- `url`: Path to image in public directory
- `description`: Helpful description for users
- `category`: "minimal" | "gradient" | "pattern" | "nature"

### Step 4: Integrate into ExportSheet
The default backgrounds can be displayed in the ExportSheet component. Here's how to add a selector:

```svelte
<script lang="ts">
  import { DEFAULT_BACKGROUNDS } from "../stores/defaultBackgrounds";
</script>

<!-- Add this section in ExportSheet export options -->
<div class="space-y-3">
  <label class="text-sm font-semibold text-foreground">
    Default Backgrounds
  </label>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
    {#each DEFAULT_BACKGROUNDS as background}
      <button
        on:click={async () => {
          const response = await fetch(background.url);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onload = (e) => {
            exportSettings.setBackgroundImage(
              e.target?.result as string
            );
          };
          reader.readAsDataURL(blob);
        }}
        class="relative h-24 rounded border-2 border-border hover:border-primary transition-colors overflow-hidden group"
        title={background.description}
      >
        <img
          src={background.url}
          alt={background.name}
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end p-1">
          <span class="text-xs text-white drop-shadow font-semibold line-clamp-2">
            {background.name}
          </span>
        </div>
      </button>
    {/each}
  </div>
</div>
```

## Image Categories

### Minimal
Clean, professional backgrounds for formal exports:
- White, gray, beige tones
- Best for business documents
- Keep text color dark for contrast

### Gradient
Soft color transitions for visual interest:
- Blue (calming)
- Sunset (warm)
- Forest (natural)
- Purple (creative)
- Rose (elegant)

### Pattern
Geometric and decorative patterns:
- Dots (subtle)
- Lines (geometric)
- Grid (professional)
- Waves (dynamic)

### Nature
Textured backgrounds from natural materials:
- Wood (warm)
- Marble (elegant)
- Stone (earthy)

## Performance Considerations

### Image Optimization
- Use JPG for photographs and gradients
- Use PNG for patterns and simple graphics
- Compress images before adding (use tools like TinyPNG)
- Consider WebP format for better compression

### Caching
- Images in `public/` are served with long cache headers
- PWA precaches all images automatically
- Users only download once, then cached locally

### File Size Impact
- Each image adds to PWA cache size
- Total current precache: ~280KB
- Recommended per image: 50-100KB
- Total backgrounds folder: Keep under 2MB

## Fetching Background as Base64

When a user selects a default background, convert it to base64:

```typescript
async function loadBackgroundAsBase64(url: string) {
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

// Usage
const base64 = await loadBackgroundAsBase64("/backgrounds/gradient-blue.jpg");
exportSettings.setBackgroundImage(base64);
```

## Testing Backgrounds

### Local Testing
1. Add image to `public/backgrounds/`
2. Start dev server: `pnpm dev`
3. Open ExportSheet and test background selection
4. Verify preview updates correctly

### Production Testing
1. Build: `pnpm run build`
2. Test with `pnpm preview`
3. Check image loads from `/backgrounds/` path
4. Verify PWA includes image in precache
5. Test offline functionality

## Offline Support

All backgrounds in `public/backgrounds/`:
- Are automatically precached by service worker
- Work offline after first visit
- Remain available even without internet connection
- Count toward PWA cache size limit

## Troubleshooting

### Image Not Loading
- Check file exists in `public/backgrounds/`
- Verify file path in defaultBackgrounds.ts matches exactly
- Clear browser cache (Ctrl+Shift+Delete)
- Check browser console for 404 errors

### Image Quality Poor in Export
- Ensure original image is high quality
- Use at least 1920x1080 resolution
- Reduce compression in image editor
- Test export with original image file

### Background Not Applied
- Ensure `exportSettings.setBackgroundImage()` was called
- Check `backgroundOpacity` setting (may hide image)
- Verify image URL is accessible
- Check browser DevTools Network tab

### PWA Cache Too Large
- Optimize image file sizes
- Remove unused backgrounds
- Consider removing very large images
- Monitor precache size in build output

## Future Enhancements

Potential improvements:
- [ ] User-uploaded backgrounds gallery
- [ ] Community background sharing
- [ ] Dynamic gradient generator
- [ ] Pattern customization (colors, density)
- [ ] WebP format support
- [ ] Responsive image sizes
- [ ] Background preview in settings
- [ ] Recent backgrounds history

## File Naming Convention

Use descriptive names with category prefix:
```
[category]-[description].jpg
minimal-white.jpg
gradient-blue.jpg
pattern-dots.jpg
nature-wood.jpg
```

## Last Updated
October 24, 2024

## Status
✅ Ready for production background images