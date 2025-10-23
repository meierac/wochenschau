# Mobile Native Share Implementation

## Overview

The ExportSheet component has been updated to provide a seamless sharing experience on mobile devices using the native Web Share API, while maintaining the download and copy functionality on desktop.

## Changes Made

### 1. Native Share API Integration

Added a new `shareAgenda()` function that leverages the Web Share API (`navigator.share()`):

```typescript
async function shareAgenda() {
    isExporting = true;
    exportError = "";

    try {
        const blob = await generateJPGBlob();
        if (!blob) {
            throw new Error("Failed to generate image");
        }

        const file = new File(
            [blob],
            `Wochenschau_W${$currentWeek}_${$currentYear}.jpg`,
            { type: "image/jpeg" },
        );

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Wochenschau Week ${$currentWeek}`,
                    text: `My weekly agenda for week ${$currentWeek} ${$currentYear}`,
                    files: [file],
                });

                setTimeout(() => {
                    dispatch("close");
                }, 500);
            } catch (shareError: any) {
                if (shareError.name !== "AbortError") {
                    exportError = "Failed to share";
                    console.error("Share error:", shareError);
                }
            }
        } else {
            throw new Error("Web Share API not supported on this device");
        }
    } catch (error) {
        exportError =
            error instanceof Error ? error.message : "Share failed";
        console.error("Export error:", error);
    } finally {
        isExporting = false;
    }
}
```

### 2. Refactored Image Generation

Created a reusable `generateJPGBlob()` helper function to avoid code duplication:

```typescript
async function generateJPGBlob(): Promise<Blob | null> {
    try {
        const html2canvas = (await import("html2canvas")).default as any;

        const element = document.getElementById("export-preview");
        if (!element) {
            throw new Error("Export preview element not found");
        }

        const canvas = await html2canvas(element, {
            backgroundColor: "#ffffff",
            scale: 2,
            useCORS: true,
            allowTaint: true,
        });

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob: Blob | null) => {
                    resolve(blob);
                },
                "image/jpeg",
                0.95,
            );
        });
    } catch (error) {
        exportError =
            error instanceof Error ? error.message : "Export failed";
        console.error("Export error:", error);
        return null;
    }
}
```

### 3. Conditional UI Based on Device Type

The export options section now displays different controls based on the `isDesktop` prop:

**Desktop (isDesktop = true):**
- Download JPG button
- Copy Image button
- Helper text explaining download/copy functionality

**Mobile (isDesktop = false):**
- Share button (single, full-width)
- Helper text explaining native sharing options

### 4. iOS and Android Integration

The native share functionality automatically provides:

**On iOS:**
- AirDrop
- Messages
- Mail
- Notes
- Reminders
- Copy
- Save to Files
- And all installed apps that support sharing

**On Android:**
- Gmail
- Messages
- Google Drive
- OneDrive
- And all installed apps that support sharing

## User Experience Flow

### Mobile Users:
1. Open the Export modal
2. Review the preview (grid or list layout)
3. Tap the "Share" button
4. Native share sheet appears with available options
5. Select desired sharing method (email, messaging, cloud storage, etc.)
6. Share the agenda image

### Desktop Users:
1. Open the Export modal
2. Review the preview
3. Choose between:
   - **Download JPG**: File saves to Downloads folder
   - **Copy Image**: Image copied to clipboard for direct pasting

## Key Benefits

1. **Native Integration**: Mobile users get the familiar system share experience
2. **No Custom UI**: Reduces maintenance burden by using OS-provided UI
3. **More Options**: Users automatically get all installed apps for sharing
4. **Better UX**: Desktop and mobile experiences optimized for each platform
5. **Consistent**: Uses same image generation logic (html2canvas) for both platforms

## Browser Support

- **Web Share API**: Supported on iOS Safari 12.2+, Android Chrome 61+
- **Fallback**: Desktop browsers without share support continue to use download/copy
- **Error Handling**: Graceful error messages if sharing fails or is cancelled

## Technical Details

- Image format: JPEG at 95% quality
- Resolution: 2x scaling for crisp output
- Filename: `Wochenschau_W{week}_{year}.jpg`
- Background: White for professional appearance
- Blob type: `image/jpeg`

## Testing Checklist

- [x] Share button appears on mobile devices
- [x] Download/Copy buttons appear on desktop
- [x] Native share sheet opens when button is tapped
- [x] All sharing options work correctly
- [x] User cancellation (AbortError) is handled gracefully
- [x] Error messages display properly
- [x] Preview toggle works
- [x] Layout toggle works
- [x] Image quality is maintained

## Future Enhancements

1. Add fallback mechanism for browsers without Web Share API support
2. Allow customization of share title and text
3. Add option to export to PDF format
4. Implement email sharing with pre-filled recipients
5. Add sharing to social media platforms directly