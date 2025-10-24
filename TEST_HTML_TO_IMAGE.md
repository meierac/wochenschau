# Quick Testing Guide - html-to-image

## ✅ READY TO TEST

html-to-image is now implemented. Here's how to test it:

---

## Quick Test (2 minutes)

### 1. Start the app
```bash
pnpm dev
```

### 2. Create a test agenda
- Add some activities to your week
- Go to Export Settings
- Choose a custom font (e.g., "Playfair Display")
- Add a background image

### 3. Export and verify
- Click Export button
- Download the PNG
- Open it and check:
  - ✅ Custom font appears (not system default)
  - ✅ Background image is visible
  - ✅ Spacing matches preview
  - ✅ Text is sharp and clear

---

## What to Look For

### ✅ Good Signs
- Export completes without errors
- Fonts match the preview
- Background images appear correctly
- Spacing is accurate
- Text is crisp (PNG quality)
- File size: 600KB - 1.5MB

### ❌ Bad Signs
- Console errors during export
- System fonts instead of custom fonts
- Missing background images
- Different spacing than preview
- Blurry or pixelated text
- Export takes >3 seconds

---

## Test on Multiple Devices

### Priority 1 (Most Important)
- [ ] iPhone Safari - This was the biggest problem before
- [ ] Android Chrome - Second biggest problem

### Priority 2
- [ ] Desktop Chrome - Should work fine
- [ ] Desktop Safari - Usually reliable
- [ ] iPad Safari - Important for tablet users

### Priority 3
- [ ] Desktop Firefox - Nice to have
- [ ] Desktop Edge - Nice to have

---

## Specific Test Cases

### Test 1: Custom Fonts
1. Set header font to "Dancing Script"
2. Set body font to "Playfair Display"
3. Export
4. Verify both fonts appear in export

**Expected:** Custom fonts render correctly
**If fails:** Fonts fall back to Arial/Helvetica

### Test 2: Background Images
1. Select a default background image
2. Export
3. Verify background appears

**Expected:** Background image is visible
**If fails:** Solid color or white background

### Test 3: Custom Background
1. Upload your own background image
2. Export
3. Verify custom image appears

**Expected:** Your uploaded image is used
**If fails:** Image is missing or wrong image

### Test 4: Spacing Accuracy
1. Take a screenshot of the preview
2. Export the image
3. Compare them side-by-side
4. Measure padding around elements

**Expected:** Exact match
**If fails:** Different padding/margins

### Test 5: Grid Layout
1. Switch to Grid layout
2. Export
3. Verify 4-column layout

**Expected:** Perfect grid with correct spacing
**If fails:** Misaligned or wrong spacing

### Test 6: List Layout
1. Switch to List layout
2. Export
3. Verify vertical list

**Expected:** Clean vertical list, correct spacing
**If fails:** Spacing issues or layout problems

---

## Console Logs to Check

Open browser console (F12) and look for:

```
[ExportSheet] Generating PNG. Background mode: image
[ExportSheet] Background image exists: true
[ExportSheet] Waiting for fonts to load...
[ExportSheet] All fonts loaded successfully
[ExportSheet] Starting screenshot capture with html-to-image...
[ExportSheet] Export successful
```

### Good Logs ✅
- No errors
- All fonts loaded
- Export successful
- No warnings about missing resources

### Bad Logs ❌
- Any red error messages
- "Failed to generate image"
- "Font loading failed"
- Network errors for fonts/images

---

## Comparison: Before vs After

### Before (html2canvas)
- ❌ Fonts often failed on mobile
- ❌ Background images inconsistent
- ❌ Spacing issues with Tailwind
- ⚠️ Slower exports

### After (html-to-image)
- ✅ Better font handling
- ✅ More reliable images
- ✅ Works with pure CSS
- ✅ Faster exports

---

## If It Still Doesn't Work

### Quick Fixes to Try

1. **Clear browser cache**
   ```
   Ctrl+Shift+Delete (Windows)
   Cmd+Shift+Delete (Mac)
   ```

2. **Hard reload**
   ```
   Ctrl+Shift+R (Windows)
   Cmd+Shift+R (Mac)
   ```

3. **Increase delay** (in ExportSheet.svelte line 156)
   ```typescript
   await new Promise(resolve => setTimeout(resolve, 500)); // Was 200
   ```

4. **Try without background**
   - Use solid color background
   - Export
   - If works → image loading issue
   - If fails → font loading issue

5. **Try with system font**
   - Use "System Default" font
   - Export
   - If works → custom font issue
   - If fails → deeper problem

---

## Report Issues

If html-to-image still doesn't work, collect:

1. **Device info**
   - Browser: (Chrome/Safari/Firefox)
   - Version: (check in browser settings)
   - OS: (Windows/Mac/iOS/Android)
   - Device: (iPhone 13, Samsung S21, etc.)

2. **Console logs**
   - Copy all messages from console
   - Include any red errors

3. **Screenshots**
   - Preview screenshot
   - Exported image
   - Show the difference

4. **Settings used**
   - Font selected
   - Background type
   - Layout mode (grid/list)

---

## Success Criteria

### Minimum Acceptable
- ✅ Exports complete on all devices
- ✅ Fonts render correctly 90% of the time
- ✅ Background images appear 90% of the time
- ✅ No crashes or errors

### Ideal Result
- ✅ Exports complete 100% of the time
- ✅ Fonts render correctly 100% of the time
- ✅ Background images appear 100% of the time
- ✅ Spacing matches preview exactly
- ✅ Fast performance (<1 second)

---

## Next Steps Based on Results

### If html-to-image works great ✅
- ✅ Done! Ship it!
- ✅ Remove html2canvas from dependencies
- ✅ Update documentation

### If html-to-image works mostly ⚠️
- Monitor edge cases
- Consider fallback options
- Add retry mechanism

### If html-to-image still fails ❌
- Implement server-side rendering (Puppeteer)
- Or manual canvas rendering
- See: BETTER_EXPORT_ALTERNATIVES.md

---

## Performance Benchmarks

Track these metrics:

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Export time (mobile) | <800ms | <1200ms | >1500ms |
| Export time (desktop) | <500ms | <700ms | >1000ms |
| Success rate | 100% | >95% | <90% |
| Font accuracy | 100% | >95% | <90% |
| Image accuracy | 100% | >95% | <90% |

---

## Final Check

Before marking as complete:

- [ ] Tested on iPhone
- [ ] Tested on Android
- [ ] Tested on desktop
- [ ] Custom fonts work
- [ ] Background images work
- [ ] Spacing is accurate
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] File sizes are reasonable
- [ ] Users are happy with quality

---

## Quick Reference

**Library:** html-to-image v1.11.13
**Format:** PNG (lossless)
**Resolution:** 1800px wide (grid), 800px wide (list)
**Quality:** 2x pixel ratio
**File size:** 600KB - 1.5MB typical

**Good luck with testing! 🚀**