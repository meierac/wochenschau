# ExportSheet Background Integration Guide

## Overview
This guide shows you how to integrate the default backgrounds selector into the ExportSheet component.

## What's Already Created

✅ `public/backgrounds/` - Directory for background images
✅ `src/lib/stores/defaultBackgrounds.ts` - Configuration with 15 default backgrounds
✅ `src/lib/components/DefaultBackgroundSelector.svelte` - Ready-to-use selector component

## Integration Method 1: Use Pre-built Component (Easiest)

### Step 1: Import the Component
In `src/lib/components/ExportSheet.svelte`, add to the script section:

```typescript
import DefaultBackgroundSelector from "./DefaultBackgroundSelector.svelte";
```

### Step 2: Add to Template
In the ExportSheet template, find the "Export Options" section and add:

```svelte
<!-- Add this after the preview section and before other export options -->
<div class="space-y-4">
  <DefaultBackgroundSelector />
  
  <!-- Your existing export options continue here -->
  <fieldset class="space-y-4">
    <legend class="block text-sm font-semibold text-foreground">
      Export Options
    </legend>
    <!-- ... rest of options -->
  </fieldset>
</div>
```

### That's It!
The component handles:
- Displaying backgrounds by category (tabs)
- Fetching images and converting to base64
- Setting them in exportSettings
- Loading states and error handling
- Responsive grid layout
- Hover effects and descriptions

## Integration Method 2: Manual Integration

If you want to integrate backgrounds differently, here's the code:

### Step 1: Import Required Items
```typescript
import { DEFAULT_BACKGROUNDS, getBackgroundsByCategory } from "../stores/defaultBackgrounds";
import { exportSettings } from "../stores/exportSettings";
```

### Step 2: Add Helper Function
```typescript
async function loadBackgroundAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to load background:", error);
    throw error;
  }
}

async function selectDefaultBackground(url: string) {
  try {
    const base64 = await loadBackgroundAsBase64(url);
    exportSettings.setBackgroundImage(base64);
  } catch (error) {
    console.error("Error selecting background:", error);
  }
}
```

### Step 3: Add to Template
```svelte
<div class="space-y-3">
  <label class="text-sm font-semibold text-foreground">
    Default Backgrounds
  </label>
  
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
    {#each DEFAULT_BACKGROUNDS as background (background.id)}
      <button
        on:click={() => selectDefaultBackground(background.url)}
        class="group relative h-24 rounded-lg border-2 border-border hover:border-primary transition-all overflow-hidden"
        title={background.description}
      >
        <img
          src={background.url}
          alt={background.name}
          class="w-full h-full object-cover group-hover:scale-105 transition-transform"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-2">
          <span class="text-xs text-white drop-shadow font-semibold line-clamp-2">
            {background.name}
          </span>
        </div>
      </button>
    {/each}
  </div>
</div>
```

## Integration Method 3: With Category Tabs

If you want category filtering:

### Add to Script
```typescript
let selectedCategory: "minimal" | "gradient" | "pattern" | "nature" = "gradient";

$: backgroundsInCategory = getBackgroundsByCategory(selectedCategory);
```

### Add to Template
```svelte
<div class="space-y-4">
  <h3 class="text-sm font-semibold text-foreground">
    Default Backgrounds
  </h3>
  
  <!-- Category Tabs -->
  <div class="flex gap-2 border-b border-border">
    {#each ["minimal", "gradient", "pattern", "nature"] as category}
      <button
        on:click={() => (selectedCategory = category)}
        class={`px-3 py-2 text-xs font-semibold transition-colors capitalize ${
          selectedCategory === category
            ? "text-primary border-b-2 border-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {category}
      </button>
    {/each}
  </div>
  
  <!-- Background Grid -->
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
    {#each backgroundsInCategory as background (background.id)}
      <button
        on:click={() => selectDefaultBackground(background.url)}
        class="group relative h-24 rounded-lg border-2 border-border hover:border-primary transition-all overflow-hidden"
        title={background.description}
      >
        <img
          src={background.url}
          alt={background.name}
          class="w-full h-full object-cover group-hover:scale-105 transition-transform"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-2">
          <span class="text-xs text-white drop-shadow font-semibold line-clamp-2">
            {background.name}
          </span>
        </div>
      </button>
    {/each}
  </div>
</div>
```

## Adding Your Own Background Images

### Step 1: Prepare Image
- Format: JPG or PNG
- Size: 1920x1080px or larger
- File size: Keep under 500KB
- Quality: High quality

### Step 2: Copy to Directory
Place image in `public/backgrounds/`

Example filename: `gradient-blue.jpg`

### Step 3: Add to Configuration
Edit `src/lib/stores/defaultBackgrounds.ts` and add to `DEFAULT_BACKGROUNDS` array:

```typescript
{
  id: "gradient-blue",
  name: "Ocean Blue",
  url: "/backgrounds/gradient-blue.jpg",
  description: "Soft blue gradient for a calming effect",
  category: "gradient",
}
```

### Step 4: Done!
Image will appear immediately in ExportSheet selector.

## Available Default Backgrounds (15 total)

### Minimal (3)
- Clean White - `minimal-white.jpg`
- Light Gray - `minimal-light-gray.jpg`
- Warm Beige - `minimal-beige.jpg`

### Gradient (5)
- Ocean Blue - `gradient-blue.jpg`
- Sunset - `gradient-sunset.jpg`
- Forest Green - `gradient-forest.jpg`
- Lavender - `gradient-purple.jpg`
- Rose Gold - `gradient-rose.jpg`

### Pattern (4)
- Subtle Dots - `pattern-dots.jpg`
- Geometric Lines - `pattern-lines.jpg`
- Graph Paper - `pattern-grid.jpg`
- Waves - `pattern-waves.jpg`

### Nature (3)
- Wood Texture - `nature-wood.jpg`
- Marble - `nature-marble.jpg`
- Stone - `nature-stone.jpg`

## Usage Flow

1. User opens ExportSheet
2. User sees backgrounds grid or tabs
3. User clicks on a background image
4. Background fetches and converts to base64
5. Background applies to export preview
6. Background saved in exportSettings
7. Export includes the selected background

## Combining with Existing Features

The default backgrounds work alongside:
- ✅ Custom upload (file input)
- ✅ Background color adjustment
- ✅ Opacity control
- ✅ All font and styling options
- ✅ Both grid and list export layouts

Users can:
1. Select a default background
2. Adjust opacity to their liking
3. Or upload their own custom background
4. Or use just colors without images

## Performance Considerations

### File Sizes
- Each background: 50-150KB
- Total backgrounds: ~1MB
- Included in PWA precache
- Cached locally after first visit

### Offline Support
All backgrounds work offline after first visit:
1. User visits app online
2. Service worker precaches backgrounds
3. Subsequent visits work offline
4. All backgrounds available without internet

## Testing

### Development
```bash
pnpm dev
# Navigate to ExportSheet
# Click backgrounds to test
# Verify preview updates
```

### Production Build
```bash
pnpm run build
pnpm preview
# Test background selection
# Verify export includes background
# Test offline functionality
```

## Troubleshooting

### Background not showing
- Check file exists in `public/backgrounds/`
- Verify path in defaultBackgrounds.ts matches filename exactly
- Clear browser cache (Ctrl+Shift+Delete)
- Check console for errors

### Background not applying to export
- Verify `backgroundOpacity` isn't 0%
- Check `backgroundColor` isn't opaque
- Test with default settings first

### Image quality poor
- Use higher resolution source (min 1920x1080)
- Reduce JPEG compression
- Test with uncompressed image

### Component not showing
- Verify import statement is correct
- Check component file exists at path
- Check for TypeScript errors in console

## Component API

### DefaultBackgroundSelector Props
Currently no props (uses exportSettings store directly).

Future versions could support:
```typescript
export interface DefaultBackgroundSelectorProps {
  onSelect?: (background: DefaultBackground) => void;
  categories?: DefaultBackground["category"][];
  maxColumns?: number;
}
```

### Default Background Interface
```typescript
interface DefaultBackground {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  url: string;                   // Full path (/backgrounds/...)
  description: string;           // Tooltip text
  category: "minimal" | "gradient" | "pattern" | "nature";
}
```

## Files Reference

- **Component**: `src/lib/components/DefaultBackgroundSelector.svelte`
- **Configuration**: `src/lib/stores/defaultBackgrounds.ts`
- **Images**: `public/backgrounds/`
- **ExportSheet**: `src/lib/components/ExportSheet.svelte` (where to integrate)

## Next Steps

1. Choose integration method (Method 1 recommended for easiest setup)
2. Add images to `public/backgrounds/`
3. Update `defaultBackgrounds.ts` with your images
4. Integrate into ExportSheet
5. Test with `pnpm dev`
6. Build and verify with `pnpm run build`

## Support

For issues or questions:
1. Check BACKGROUNDS_SETUP.md for setup details
2. Check BACKGROUNDS_IMPLEMENTATION.md for technical details
3. See console for error messages
4. Test with sample backgrounds first

---

**Last Updated**: October 24, 2024
**Status**: ✅ Ready for integration