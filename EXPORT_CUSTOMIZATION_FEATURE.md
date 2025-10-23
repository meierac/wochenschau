# Export Customization Feature

## Overview
The Wochenschau app now includes comprehensive export customization settings, allowing users to personalize the appearance of their exported weekly agendas with custom fonts, colors, and background images.

## Features

### 1. Typography Settings
- **Header Font Family** - Customize the font for "Wochenschau" title
- **Body Font Family** - Customize the font for activities and dates
- **Text Color** - Set custom text color with color picker or hex input

**Available Fonts:**
- System Default (system-ui, -apple-system, sans-serif)
- Georgia (serif)
- Times New Roman (serif)
- Arial (sans-serif)
- Helvetica (sans-serif)
- Courier (monospace)
- Verdana (sans-serif)
- Trebuchet (sans-serif)

### 2. Background Settings
- **Background Image** - Upload custom background image (JPG, PNG, etc.)
- **Background Color** - Set solid background color
- **Background Opacity** - Control overlay opacity (0-100%) when using background image

**Background Image Features:**
- Upload any image format supported by browsers
- Preview before export
- Easy change/remove functionality
- Image stored in browser localStorage (persists across sessions)

### 3. Styling Settings
- **Accent Color** - Customize border colors for activities and day separators
- **Border Radius** - Adjust corner roundness (0-20px)
- **Show Borders** - Toggle borders around activity cards on/off

## How to Use

### Accessing Export Settings
1. Click the **Settings** icon in the navigation
2. Select **"Export Settings"** from the menu (🎨 icon)
3. Adjust your preferences

### Customizing Typography
1. Choose header font from dropdown
2. Choose body font from dropdown
3. Select text color using:
   - Color picker (click color square)
   - Or enter hex code directly (e.g., #000000)

### Adding Background Image
1. Click **"+ Upload Image"** button
2. Select image file from your device
3. Image appears in preview
4. Adjust **Background Opacity** slider to control overlay
5. Use **Background Color** to tint the overlay

**To Remove Background Image:**
- Click **"Remove"** button

**To Change Background Image:**
- Click **"Change Image"** button

### Adjusting Styling
1. **Accent Color**: Choose color for day borders and activity left borders
2. **Border Radius**: Drag slider to adjust corner roundness
3. **Show Borders**: Check/uncheck to toggle activity card borders

### Resetting to Defaults
Click **"Reset to Defaults"** button to restore all settings to original values.

## Default Settings

```javascript
{
  // Typography
  headerFontFamily: "Georgia, serif",
  bodyFontFamily: "system-ui, -apple-system, sans-serif",
  textColor: "#000000",

  // Background
  backgroundImage: null,
  backgroundColor: "#ffffff",
  backgroundOpacity: 100,

  // Styling
  accentColor: "#9333ea",
  borderRadius: 8,
  showBorders: true
}
```

## Export Preview

All customization changes are **immediately reflected** in the export preview when you open the Export Sheet:
1. Click **Export** icon in navigation
2. View preview with your custom settings applied
3. Toggle between Grid and List view
4. Export as JPG with all customizations

## Technical Implementation

### Storage
- Settings stored in browser **localStorage**
- Persists across sessions
- Background images stored as base64 data URLs
- No server storage required

### Files Modified/Created
- `src/lib/stores/exportSettings.ts` - Settings store (NEW)
- `src/lib/components/SettingsSheet.svelte` - Settings UI (UPDATED)
- `src/lib/components/ExportSheet.svelte` - Export preview (UPDATED)

### Data Structure
```typescript
interface ExportSettings {
  // Typography
  headerFontFamily: string;
  bodyFontFamily: string;
  textColor: string;

  // Background
  backgroundImage: string | null; // base64 or URL
  backgroundColor: string;
  backgroundOpacity: number; // 0-100

  // Styling
  accentColor: string;
  borderRadius: number; // 0-20
  showBorders: boolean;
}
```

## Browser Compatibility
✅ Chrome/Chromium
✅ Firefox
✅ Safari
✅ Edge
✅ Mobile browsers

## Design Principles

### Simplicity
- Clean, organized settings interface
- Grouped by category (Typography, Background, Styling)
- Clear labels and helpful placeholders

### Real-time Preview
- Changes visible immediately in export preview
- No "apply" button needed
- What you see is what you export

### Flexibility
- Wide range of customization options
- Support for custom images
- Fine-grained control over colors and spacing

### User-Friendly
- Color picker for easy color selection
- Sliders for opacity and border radius
- Image preview before export
- One-click reset to defaults

## Use Cases

### Personal Branding
- Add company logo as background
- Use brand colors for accents
- Custom fonts matching brand identity

### Themed Exports
- Seasonal backgrounds (holidays, seasons)
- Event-specific styling
- Team/department colors

### Accessibility
- High contrast color schemes
- Larger, more readable fonts
- Custom text colors for better visibility

### Aesthetic Preferences
- Minimalist (no borders, subtle colors)
- Bold (vibrant colors, thick borders)
- Elegant (serif fonts, soft backgrounds)

## Tips & Best Practices

### Background Images
- Use high-resolution images for best quality
- Adjust opacity to ensure text remains readable
- Light, subtle images work best
- Consider background color overlay for better text contrast

### Color Selection
- Ensure sufficient contrast between text and background
- Use accent colors that complement your background
- Test exports in different lighting conditions

### Typography
- Serif fonts (Georgia, Times) for formal/elegant look
- Sans-serif fonts (Arial, Helvetica) for modern/clean look
- Monospace fonts (Courier) for technical/structured look

### Border Radius
- 0px for sharp, modern look
- 8-12px for friendly, rounded look
- 20px for very soft, pill-shaped cards

## Troubleshooting

### Background Image Not Showing
- Check file size (very large images may cause issues)
- Ensure image format is supported (JPG, PNG, GIF, WebP)
- Try clearing browser cache and re-uploading

### Text Not Readable
- Increase background opacity
- Adjust background color for better contrast
- Use lighter/darker text color
- Choose a different background image

### Settings Not Persisting
- Check browser localStorage is enabled
- Ensure not in private/incognito mode
- Try different browser

### Export Image Quality
- Background images are embedded in export
- Higher resolution backgrounds = larger file size
- Quality set to JPEG 0.95 (95% quality)

## Future Enhancements

Potential additions for future versions:
- Pre-made themes/templates
- Logo upload (separate from background)
- Custom header text
- Footer with date/name
- Multiple export templates
- Share custom themes with others
- Font size customization
- Line spacing control

## Accessibility

Settings follow accessibility best practices:
- Labels associated with controls
- Color inputs include text fallback
- Keyboard navigation supported
- Focus indicators visible
- Color contrast maintained

## Performance

- Settings stored locally (no network requests)
- Background images cached in localStorage
- Minimal impact on export speed
- Optimized rendering for preview

## Privacy & Data

- All settings stored **locally** in browser
- No data sent to servers
- Background images stored as base64 in localStorage
- Settings can be cleared by resetting or clearing browser data

## Summary

The Export Customization feature provides users with powerful, flexible tools to create personalized, professional-looking weekly agenda exports that match their style, brand, or aesthetic preferences—all while maintaining simplicity and ease of use.