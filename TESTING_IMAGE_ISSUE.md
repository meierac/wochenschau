# Testing Guide: IndexedDB Image Loading Issue

## Problem
Selected background images are not appearing in the export preview after implementing IndexedDB storage.

## Expected Behavior
1. User selects a background image (default or custom upload)
2. Image is stored in IndexedDB
3. Image appears in export preview immediately
4. Image persists after page reload

## What to Test

### Test 1: Fresh Upload (Custom Image)
1. Open the app in browser
2. Open DevTools Console (F12)
3. Go to Settings → Export Settings → Background Options
4. Click "Upload Custom"
5. Select an image (up to 10MB)
6. **Watch console logs** - should see:
   ```
   [ImageStorage] setImageFromBase64 called
   [ImageStorage] Blob created
   [ImageStorage] Image stored successfully in IndexedDB
   Store updated with background image
   ```
7. **Check export preview** - background should appear
8. **Verify IndexedDB**:
   - DevTools → Application → IndexedDB → `wochenschau-images` → `backgrounds`
   - Should see entry with key: `current-background`
   - Click it - should show Blob data

### Test 2: Select Default Background
1. Open Settings → Export Settings → Background Options
2. Click any default background (e.g., a gradient)
3. **Watch console logs** - should see storage messages
4. **Check export preview** - background should appear
5. **Verify IndexedDB** - should have the new background stored

### Test 3: Page Reload (Persistence)
1. After setting a background (Test 1 or 2)
2. Reload the page (F5)
3. **Watch console logs** - should see:
   ```
   [ImageStorage] getImageMetadata called
   [ImageStorage] Metadata retrieved
   [ImageStorage] getImageAsBase64 called
   [ImageStorage] Retrieved from IndexedDB
   [ImageStorage] Converted to base64
   Background image loaded from IndexedDB
   ```
4. **Check export preview** - background should still be there

### Test 4: Clear Background
1. With a background set, click "Clear" button
2. **Watch console** - should see: `Image cleared from IndexedDB`
3. **Check export preview** - background should be gone
4. **Verify IndexedDB** - entry should be deleted

## Debug Checklist

### Console Logs Not Appearing
- [ ] Check if console is filtered (should show all logs)
- [ ] Verify you're on the right browser tab
- [ ] Check if errors are appearing instead

### Image Not in Export Preview
- [ ] Check if `$exportSettings.backgroundImage` has value
  - Run in console: `window.localStorage.getItem('exportSettings')`
  - Look for `backgroundImageUrl` and `backgroundImageType` (should NOT have `backgroundImage` - that's in IndexedDB)
- [ ] Check DevTools → Application → IndexedDB
  - Does `wochenschau-images` database exist?
  - Does `backgrounds` object store exist?
  - Is there a `current-background` entry?
  - Does it have a Blob with size > 0?
- [ ] Check for errors in console
- [ ] Try opening export sheet and checking if image loads there

### Image Lost After Reload
- [ ] Check if IndexedDB entry persists after reload
- [ ] Check console logs for initialization errors
- [ ] Verify async initialization completes
- [ ] Check if migration ran (if upgrading from old version)

## Common Issues & Solutions

### Issue: Console shows "Failed to store image"
**Cause**: IndexedDB quota exceeded or permissions denied
**Solution**: 
- Check storage quota: Run in console: 
  ```javascript
  navigator.storage.estimate().then(est => 
    console.log(`${(est.usage/1024/1024).toFixed(2)}MB / ${(est.quota/1024/1024).toFixed(2)}MB`)
  )
  ```
- Clear IndexedDB: DevTools → Application → IndexedDB → Right-click `wochenschau-images` → Delete

### Issue: Image appears in IndexedDB but not in export
**Cause**: Store not updating or reactivity issue
**Solution**:
1. Check if store subscription is working:
   ```javascript
   // In browser console
   import { exportSettings } from './src/lib/stores/exportSettings';
   exportSettings.subscribe(val => console.log('Store updated:', val.backgroundImage?.length));
   ```
2. Manually trigger refresh:
   ```javascript
   exportSettings.refreshImage();
   ```

### Issue: Migration not working (upgrading from old localStorage version)
**Cause**: Old `backgroundImage` in localStorage not detected
**Solution**:
1. Check localStorage for old image:
   ```javascript
   const old = JSON.parse(localStorage.getItem('exportSettings'));
   console.log('Has old image:', !!old.backgroundImage);
   console.log('Image length:', old.backgroundImage?.length);
   ```
2. If old image exists but didn't migrate, manually trigger:
   ```javascript
   // Clear IndexedDB first
   indexedDB.deleteDatabase('wochenschau-images');
   // Reload page
   location.reload();
   ```

### Issue: Private browsing mode
**Cause**: Some browsers restrict IndexedDB in private mode
**Solution**: Use normal browsing mode

## Manual Testing Commands

### Check IndexedDB Storage
```javascript
// Open database and inspect
const request = indexedDB.open('wochenschau-images', 1);
request.onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction(['backgrounds'], 'readonly');
  const store = tx.objectStore('backgrounds');
  const req = store.get('current-background');
  req.onsuccess = () => {
    console.log('Stored image data:', req.result);
  };
};
```

### Check Store Value
```javascript
// Get current export settings from store
// (This only works if you can access the store - might need to be in component context)
console.log('Current settings:', $exportSettings);
```

### Force Image Reload
```javascript
// If you added the refreshImage method
exportSettings.refreshImage().then(() => {
  console.log('Image refreshed');
});
```

### Check Storage Quota
```javascript
navigator.storage.estimate().then(estimate => {
  console.log('Storage used:', (estimate.usage / 1024 / 1024).toFixed(2), 'MB');
  console.log('Storage quota:', (estimate.quota / 1024 / 1024).toFixed(2), 'MB');
  console.log('Percentage:', ((estimate.usage / estimate.quota) * 100).toFixed(2), '%');
});
```

## Expected Console Output (Happy Path)

### On First Upload
```
[ImageStorage] setImageFromBase64 called {url: "custom", type: "custom", base64Length: 1234567}
[ImageStorage] Blob created {size: 123456, type: "image/jpeg"}
[ImageStorage] Image stored successfully in IndexedDB
Image stored in IndexedDB: {url: "custom", type: "custom"}
Store updated with background image: {hasImage: true, url: "custom", type: "custom"}
```

### On Page Reload
```
[ImageStorage] getImageMetadata called
[ImageStorage] Metadata retrieved {hasResult: true, url: "custom", type: "custom"}
[ImageStorage] getImageAsBase64 called
[ImageStorage] Retrieved from IndexedDB {hasResult: true, hasBlob: true, url: "custom", type: "custom"}
[ImageStorage] Converted to base64 {length: 1234567}
Background image loaded from IndexedDB: {url: "custom", type: "custom", hasImage: true}
```

## What to Report

If the issue persists after testing, please provide:

1. **Browser & Version**: Chrome 120, Firefox 121, etc.
2. **Console Logs**: Copy full console output
3. **IndexedDB State**: Screenshot of DevTools → Application → IndexedDB
4. **Test Results**: Which tests passed/failed from above
5. **localStorage Content**: 
   ```javascript
   console.log(localStorage.getItem('exportSettings'));
   ```
6. **Storage Quota**:
   ```javascript
   navigator.storage.estimate().then(console.log);
   ```
7. **Any Error Messages**: Full error stack traces

## Possible Root Causes

Based on the implementation, the most likely issues are:

1. **Timing Issue**: Async initialization completes after component renders
   - Fix: Ensure store subscription triggers re-render when image loads
   
2. **Reactivity Issue**: Store update doesn't trigger Svelte reactivity
   - Fix: Use `set()` instead of just `update()`, or ensure immutability
   
3. **IndexedDB Not Initializing**: Database fails to open
   - Fix: Check browser compatibility and permissions
   
4. **Blob Conversion Error**: Blob ↔ Base64 conversion fails
   - Fix: Add error handling and validation

5. **Store Not Subscribing**: Component not reactive to store changes
   - Fix: Ensure using `$exportSettings` in template

## Next Steps

1. Run all tests above
2. Collect console output and IndexedDB state
3. Identify which specific step fails
4. Check corresponding section in code:
   - `imageStorage.ts` - IndexedDB operations
   - `exportSettings.ts` - Store management
   - `DefaultBackgroundSelector.svelte` - Upload UI
   - `ExportSheet.svelte` - Display/preview