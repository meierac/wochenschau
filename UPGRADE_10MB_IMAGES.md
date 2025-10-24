# Upgrade: 10MB Image Support with IndexedDB

## Summary

The export settings now support uploading background images up to **10MB** (previously 5MB). This upgrade includes a migration from localStorage to IndexedDB for reliable storage of large images.

## What Changed

### 1. Increased Upload Limit
- **Before**: 5MB maximum
- **After**: 10MB maximum
- **Location**: `DefaultBackgroundSelector.svelte`

### 2. Storage Architecture Upgrade
- **Before**: localStorage (5-10MB total limit)
- **After**: IndexedDB (50MB - 1GB+ limit)
- **Impact**: Properly handles large images without quota errors

### 3. Files Modified

#### New Files
- `src/lib/stores/imageStorage.ts` - IndexedDB wrapper for image storage

#### Updated Files
- `src/lib/stores/exportSettings.ts` - Uses IndexedDB for background images
- `src/lib/components/DefaultBackgroundSelector.svelte` - Async storage operations

## Technical Details

### Why IndexedDB?

| Feature | localStorage | IndexedDB |
|---------|--------------|-----------|
| **Max Storage** | 5-10 MB | 50 MB - 1 GB+ |
| **10MB Image** | ❌ Fails (13.3MB with base64) | ✅ Works |
| **Performance** | Synchronous (blocks UI) | Asynchronous |
| **Data Format** | Strings only | Blobs, Files, Objects |
| **Error Handling** | Silent failures | Explicit errors |

### Storage Strategy

```
Settings (localStorage)          Images (IndexedDB)
├─ Typography                    └─ current-background
├─ Colors                            ├─ Blob (raw image)
├─ Background metadata               ├─ URL/ID
└─ Other preferences                 ├─ Type (default/custom)
                                     └─ Timestamp
```

### Data Flow

**Upload Custom Image (10MB):**
```
User selects file
    ↓
Size check (≤ 10MB)
    ↓
FileReader → base64
    ↓
IndexedDB stores as Blob
    ↓
Store updates with base64 for display
    ↓
Metadata saved to localStorage
```

**Load on App Start:**
```
Load settings from localStorage
    ↓
Check IndexedDB for image
    ↓
Convert Blob → base64
    ↓
Display in UI
```

## Migration

### Automatic Migration

Existing users with background images stored in localStorage will be automatically migrated:

1. App detects old `backgroundImage` in localStorage
2. Migrates image to IndexedDB
3. Removes large base64 string from localStorage
4. Keeps metadata in localStorage

**This happens automatically on first load after upgrade.**

### What Users Will Notice

- ✅ Existing backgrounds are preserved
- ✅ No action required
- ✅ Settings remain intact
- ✅ Can now upload larger images

## Browser Compatibility

IndexedDB is supported in all modern browsers:
- ✅ Chrome/Edge 24+
- ✅ Firefox 16+
- ✅ Safari 10+
- ✅ iOS Safari 10+
- ✅ Android 4.4+

## API Changes

### `exportSettings.setBackgroundImage()` is now async

**Before:**
```typescript
exportSettings.setBackgroundImage(base64, "custom", "custom");
```

**After:**
```typescript
await exportSettings.setBackgroundImage(base64, "custom", "custom");
```

### Error Handling

```typescript
try {
    await exportSettings.setBackgroundImage(base64, "custom", "custom");
} catch (error) {
    console.error("Failed to save image:", error);
    // Handle: quota exceeded, permission denied, etc.
}
```

## Benefits

### For Users
- 📸 Upload larger, higher quality background images (up to 10MB)
- 🚀 Faster app performance (async operations)
- 💾 More reliable storage (no silent quota failures)
- ✅ Automatic migration (no manual steps)

### For Developers
- 🛡️ Better error handling and debugging
- 📊 Storage usage monitoring via API
- 🔄 Scalable for future image features
- 🧹 Cleaner separation (images vs settings)

## Testing

### Verify Migration
1. Open DevTools → Application → IndexedDB
2. Find `wochenschau-images` database
3. Check `backgrounds` object store
4. Verify image is stored as Blob (not base64 string)

### Test Large Upload
1. Find a high-quality image (8-10MB)
2. Go to Settings → Export Settings → Background Options
3. Click "Upload Custom"
4. Select the large image
5. Verify it loads in export preview
6. Export and verify background appears in final image

### Check Storage Usage
Open browser console:
```javascript
const estimate = await navigator.storage.estimate();
console.log(`Using: ${(estimate.usage / 1024 / 1024).toFixed(2)} MB`);
console.log(`Available: ${(estimate.quota / 1024 / 1024).toFixed(2)} MB`);
```

## Troubleshooting

### Upload Fails
- **Check**: File size ≤ 10MB
- **Check**: File is image format (JPG, PNG, GIF, WebP)
- **Check**: Browser console for errors
- **Solution**: Try smaller image or different format

### Background Not Showing
- **Check**: DevTools → IndexedDB → `wochenschau-images`
- **Solution**: Clear IndexedDB and re-upload
- **Console**: Run `await imageStorage.getImageAsBase64()`

### QuotaExceededError
- **Cause**: Browser storage limit reached
- **Check**: Storage usage in DevTools → Application
- **Solution**: Clear old data or use smaller images

### Private Browsing Issues
- **Note**: Some browsers restrict IndexedDB in private mode
- **Solution**: Use normal browsing mode for image uploads

## Performance Impact

### Before (localStorage)
- 5MB image as base64 = ~6.7MB in localStorage
- Synchronous operations could block UI
- Risk of quota exceeded errors

### After (IndexedDB)
- 10MB image as Blob = ~10MB in IndexedDB
- Async operations, no UI blocking
- Much larger quota available

## Future Enhancements

Potential improvements now possible:
- [ ] Automatic image compression/optimization
- [ ] Multiple background library storage
- [ ] Background image history/undo
- [ ] Cloud sync for backgrounds
- [ ] Bulk upload management

## Rollback

If issues occur, can revert by:
1. `git checkout HEAD~1 src/lib/stores/exportSettings.ts`
2. `git checkout HEAD~1 src/lib/components/DefaultBackgroundSelector.svelte`
3. `rm src/lib/stores/imageStorage.ts`

**Note**: Users will need to re-upload backgrounds after rollback.

## Resources

- [IndexedDB API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Storage Quotas](https://web.dev/storage-for-the-web/)
- [Browser Compatibility](https://caniuse.com/indexeddb)

## Questions?

For issues or questions about this upgrade:
1. Check `INDEXEDDB_IMAGE_STORAGE.md` for technical details
2. Review browser console for error messages
3. Verify IndexedDB is enabled in browser settings