# Quick Integration Guide - Default Backgrounds

## What's New

Your uploaded background images are now available as defaults in the export feature:

- 🎨 **Navy Blue Vignette** - Deep navy with elegant vignette effect
- 🌸 **Serene Lotus** - Pink lotus flower in water
- 🎨 **Soft Color Gradient** - Soft pastel gradient
- 🌅 **Warm Gradient** - Warm color gradient

Users can still upload custom images anytime.

## How to Integrate (3 Simple Steps)

### Step 1: Open ExportSheet Component
File: `src/lib/components/ExportSheet.svelte`

### Step 2: Find the Export Options Section
Look for the section that handles background settings (around line 600-700).

### Step 3: Add the Component
Import at the top:
```typescript
import DefaultBackgroundSelector from "./DefaultBackgroundSelector.svelte";
```

Add in the template where you want it to appear (in the export options section):
```svelte
<DefaultBackgroundSelector />
```

That's it! The component includes:
- ✅ Display of all default backgrounds
- ✅ Category tabs (Gradient, Solid, Nature)
- ✅ Custom upload button
- ✅ Automatic image conversion to base64
- ✅ Loading states and error handling

## Testing

1. Start dev server:
   ```bash
   pnpm dev
   ```

2. Navigate to ExportSheet

3. Look for "Background Options" section

4. Click any default background to apply it

5. Or click "Upload Custom" to upload your own image

## How It Works

### Default Backgrounds
Located in: `public/backgrounds/`

Configuration: `src/lib/stores/defaultBackgrounds.ts`

When users click a default background:
1. Image fetches from `/backgrounds/`
2. Converts to base64
3. Stores in exportSettings
4. Applies to preview immediately
5. Included in final export

### Custom Upload
Users can click the "Upload Custom" button to:
1. Select image from their device
2. Image converts to base64
3. Replaces current background
4. Works exactly like uploaded backgrounds

## Adding More Default Backgrounds

To add more backgrounds:

1. Save image to `public/backgrounds/`

2. Edit `src/lib/stores/defaultBackgrounds.ts`

3. Add entry to `DEFAULT_BACKGROUNDS` array:
   ```typescript
   {
     id: "unique-id",
     name: "Display Name",
     url: "/backgrounds/filename.jpg",
     description: "Description for tooltip",
     category: "gradient" // or "solid" or "nature"
   }
   ```

4. Done! Image appears immediately in selector

## Component Features

The `DefaultBackgroundSelector` component includes:

- **Category Tabs** - Filter by gradient, solid, or nature
- **Image Grid** - Responsive 2-4 columns
- **Hover Preview** - Image name shows on hover
- **Lazy Loading** - Images load on demand
- **Custom Upload** - Dedicated button for user images
- **Loading States** - Visual feedback while processing
- **Error Handling** - Graceful error messages

## Offline Support

All backgrounds in `public/backgrounds/`:
- ✅ Automatically cached by service worker
- ✅ Work completely offline after first visit
- ✅ Available without internet connection

## File Structure

```
wochenschau/
├── public/
│   └── backgrounds/
│       ├── navy-blue-with-a-vignette-color-background-y1st36rfjpha19vo.jpg
│       ├── serene-pink-lotus-flower-emerging-from-water-amidst-rocks-p683sc3bf9ym5jsw.jpg
│       ├── color-background-5feqyvu7kgtmpk0d.jpg
│       ├── color-background-5i5xkrdqeiq9xmzo.jpg
│       └── README.md
├── src/lib/
│   ├── components/
│   │   ├── DefaultBackgroundSelector.svelte (✅ Ready to use)
│   │   └── ExportSheet.svelte (← Add component here)
│   └── stores/
│       └── defaultBackgrounds.ts (✅ Updated with your images)
└── ...
```

## Troubleshooting

### Component not showing
- Verify import statement is correct
- Check component file exists
- Look for TypeScript errors in console

### Background not applying
- Check image loads in Network tab
- Verify file exists in `public/backgrounds/`
- Try custom upload to test

### Images not loading
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Check console for 404 errors
- Verify filename matches exactly

## Performance Notes

- Each background: ~20-50KB
- Total precache: ~280KB
- Users download once, cached forever offline
- No performance impact after first visit

## Customization Options

### Change Categories
Edit `src/lib/stores/defaultBackgrounds.ts`:
```typescript
category: "gradient" // or "solid" or "nature"
```

### Rename Categories
Update the tabs in `DefaultBackgroundSelector.svelte` and update the type definition.

### Change Grid Columns
In `DefaultBackgroundSelector.svelte`, find:
```svelte
class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
```

Change numbers (2, 3, 4) to desired columns.

## Next Steps

1. ✅ Open `ExportSheet.svelte`
2. ✅ Add import statement
3. ✅ Add `<DefaultBackgroundSelector />` component
4. ✅ Test with `pnpm dev`
5. ✅ Build and deploy

## Documentation Files

For more details, see:
- `BACKGROUNDS_SUMMARY.md` - Complete overview
- `BACKGROUNDS_IMPLEMENTATION.md` - Technical details
- `EXPORT_BACKGROUNDS_INTEGRATION.md` - Full integration guide
- `public/backgrounds/README.md` - Directory guide

---

**Status**: ✅ Ready to integrate
**Last Updated**: October 24, 2024