# IndexedDB Image Storage Implementation

## Overview

The background image storage has been upgraded from localStorage to IndexedDB to properly handle large images (up to 10MB).

## Why IndexedDB?

### Previous Limitation (localStorage)
- **Storage limit**: 5-10 MB total per domain
- **Base64 overhead**: 33% size increase (10MB → 13.3MB)
- **No error handling**: Silent failures on quota exceeded
- **Synchronous**: Could block UI with large images

### New Solution (IndexedDB)
- **Storage limit**: 50 MB - 1 GB+ (browser dependent)
- **Direct Blob storage**: No base64 conversion overhead
- **Asynchronous**: Non-blocking operations
- **Better error handling**: Explicit error catching
- **More scalable**: Can handle 10MB+ images easily

## Implementation Details

### Files Modified

1. **`src/lib/stores/imageStorage.ts`** (NEW)
   - IndexedDB wrapper for image storage
   - Handles Blob ↔ Base64 conversions
   - Migration from localStorage
   - Error handling and storage estimates

2. **`src/lib/stores/exportSettings.ts`** (UPDATED)
   - Uses IndexedDB for `backgroundImage` storage
   - Other settings remain in localStorage (they're small)
   - Automatic migration from old localStorage format
   - Async `setBackgroundImage()` method

3. **`src/lib/components/DefaultBackgroundSelector.svelte`** (UPDATED)
   - Updated to handle async storage operations
   - Improved error handling for file uploads
   - Support for 10MB image uploads

## How It Works

### Storage Strategy

```
┌─────────────────────────────────────────┐
│          User Settings                   │
├─────────────────────────────────────────┤
│ localStorage (5-10MB total)             │
│  ├─ Typography settings                 │
│  ├─ Colors & styling                    │
│  ├─ Background metadata (URL, type)     │
│  └─ Other preferences                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│       Background Images                  │
├─────────────────────────────────────────┤
│ IndexedDB (50MB - 1GB+)                 │
│  └─ Current background (as Blob)        │
│      ├─ Image data (up to 10MB)         │
│      ├─ Metadata (URL, type)            │
│      └─ Timestamp                       │
└─────────────────────────────────────────┘
```

### Data Flow

#### Uploading Custom Image
```
1. User selects file (up to 10MB)
2. FileReader converts to base64
3. imageStorage.setImageFromBase64() converts to Blob
4. Blob stored in IndexedDB
5. Base64 loaded into store for display
6. Metadata saved to localStorage
```

#### Loading Background on App Start
```
1. Load settings from localStorage (no image)
2. Check IndexedDB for background image
3. Convert Blob → base64 for display
4. Update store with image + metadata
```

#### Migration from Old Format
```
1. Detect old backgroundImage in localStorage
2. Migrate to IndexedDB
3. Remove large base64 from localStorage
4. Keep metadata in localStorage
```

## API Reference

### `imageStorage` (singleton)

```typescript
// Store image from base64
await imageStorage.setImageFromBase64(base64, url, type);

// Store image from File object
await imageStorage.setImageFromFile(file, url, type);

// Get image as base64
const base64 = await imageStorage.getImageAsBase64();

// Get metadata only
const metadata = await imageStorage.getImageMetadata();

// Check if image exists
const hasImage = await imageStorage.hasImage();

// Delete image
await imageStorage.deleteImage();

// Get storage usage
const estimate = await imageStorage.getStorageEstimate();
```

### `exportSettings.setBackgroundImage()` (now async)

```typescript
// Set background
await exportSettings.setBackgroundImage(base64, "custom", "custom");

// Clear background
await exportSettings.setBackgroundImage(null, null, null);
```

## Migration Process

### Automatic Migration

On first load after upgrade:
1. App checks localStorage for old `backgroundImage` field
2. If found, migrates to IndexedDB automatically
3. Removes large base64 string from localStorage
4. Keeps metadata in localStorage for compatibility

### Manual Migration (if needed)

If users experience issues, they can:
1. Open browser DevTools
2. Go to Application → Storage
3. Clear "wochenschau-images" IndexedDB
4. Reload app (will re-migrate from localStorage if present)

## Browser Compatibility

IndexedDB is supported in all modern browsers:
- ✅ Chrome/Edge 24+
- ✅ Firefox 16+
- ✅ Safari 10+
- ✅ iOS Safari 10+
- ✅ Android Browser 4.4+

## Error Handling

### Upload Errors

```typescript
try {
    await exportSettings.setBackgroundImage(base64, "custom", "custom");
} catch (error) {
    // Handle quota exceeded, permission denied, etc.
    console.error("Failed to save image:", error);
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `QuotaExceededError` | Storage limit reached | Clear old data or reduce image size |
| `Failed to open IndexedDB` | Browser restrictions | Check private browsing mode |
| `Failed to read file` | File read error | Try different image format |

## Performance Benefits

| Metric | localStorage | IndexedDB |
|--------|--------------|-----------|
| 10MB image storage | ❌ Fails | ✅ Success |
| Storage overhead | +33% (base64) | None (Blob) |
| UI blocking | Possible | No (async) |
| Total capacity | 5-10 MB | 50 MB - 1 GB+ |
| Error handling | Silent failure | Explicit errors |

## Testing

### Verify IndexedDB Storage

1. Open DevTools → Application → IndexedDB
2. Find `wochenschau-images` database
3. Check `backgrounds` object store
4. Verify `current-background` entry exists

### Check Storage Usage

```javascript
// In browser console
const estimate = await navigator.storage.estimate();
console.log(`Using ${estimate.usage} of ${estimate.quota} bytes`);
```

### Test Large Image Upload

1. Go to Settings → Export Settings
2. Upload a 8-10MB image
3. Verify it loads in export preview
4. Check IndexedDB for the stored Blob

## Rollback Plan

If issues occur, can revert by:
1. Restore old `exportSettings.ts` from git
2. Remove `imageStorage.ts`
3. Users will lose stored backgrounds (but settings preserved)

## Future Enhancements

- [ ] Image compression before storage
- [ ] Multiple background storage (image library)
- [ ] Background sync across devices
- [ ] Cleanup old/unused images automatically
- [ ] Progress indicator for large uploads
- [ ] Image format conversion (e.g., HEIC → JPG)

## Support

For issues related to image storage:
1. Check browser console for errors
2. Verify IndexedDB is enabled (not disabled in browser settings)
3. Check private browsing mode (may restrict IndexedDB)
4. Clear IndexedDB and reload to re-migrate