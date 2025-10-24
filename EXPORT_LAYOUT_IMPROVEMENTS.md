# Export Layout Improvements

## Overview

The export feature has been updated to create more compact and visually cohesive exported images, with different optimizations for grid and list views.

## Changes Made

### Grid View (4-column layout)
**Kept separate containers per day** for visual clarity, but optimized the header:
- Day name and date now display in a **single row** (e.g., "Montag · 21.10.2024")
- More compact header reduces vertical space
- Maintains individual day containers with separate backgrounds
- Each day keeps its own border radius and shadow

**Before:**
```
Montag
21.10.2024
```

**After:**
```
Montag · 21.10.2024
```

### List View (vertical layout)
**Significantly more compact** with connected day containers:
- **Reduced gap between days** from `space-y-4` to `space-y-1` (from 1rem to 0.25rem)
- **Rounded corners only on first and last days**:
  - Monday: Top corners rounded (24px / 3xl)
  - Tuesday-Saturday: No rounded corners (0px)
  - Sunday: Bottom corners rounded (24px / 3xl)
- Creates a visually unified week block while maintaining separate containers
- Bible verse has **no background** in list view (appears transparent)

## Implementation Details

### Grid Layout Header
```svelte
<div class="font-semibold text-xs">
    {WEEKDAYS_DE[dayIndex]} · 
    <span style="opacity: 0.7; font-weight: normal;">
        {formatDate(day)}
    </span>
</div>
```

**Benefits:**
- Single line saves vertical space
- Separator (·) provides visual distinction
- Date appears lighter (70% opacity) for hierarchy
- Font weight normal on date, bold on day name

### List Layout Border Radius Logic
```svelte
<div
    style="border-radius: {dayIndex === 0
        ? '24px 24px 0 0'           // Monday: top corners rounded
        : dayIndex === 6
          ? '0 0 24px 24px'         // Sunday: bottom corners rounded
          : '0'};"                  // Tuesday-Saturday: no rounding
>
```

**Benefits:**
- Days visually connected like a single card
- First and last days provide smooth entry/exit
- 24px (3xl) radius creates modern, friendly appearance
- Middle days flow seamlessly together

### List Layout Spacing
```svelte
<div class="space-y-1 relative z-10">
    <!-- Days with minimal gap -->
</div>
```

**Benefits:**
- `space-y-1` (0.25rem / 4px) creates tight grouping
- Days appear as unified week block
- Reduces overall export height significantly
- Better for mobile sharing and printing

### Bible Verse in List View
```svelte
{#if $bibleVerse.enabled}
    <div class="p-3 text-center" style="margin-top: 0.5rem;">
        <!-- No background, shadow, or border-radius -->
    </div>
{/if}
```

**Benefits:**
- Verse appears on the background itself
- No visual competition with day containers
- Cleaner, more elegant appearance
- Maintains readability

## Visual Comparison

### Grid View
- **Unchanged:** Individual day containers preserved
- **Improved:** Compact single-line headers save ~20px per day
- **Total space saved:** ~80px for 4 days

### List View
- **Before:** 7 separate containers + gaps (~1rem each)
- **After:** Connected containers with minimal gaps (0.25rem)
- **Space saved:** ~42px (6 gaps × 0.75rem difference)
- **Visual impact:** Unified card-like appearance

## Export Settings Compatibility

All existing export customization options continue to work:
- ✅ Background color (applies to day containers)
- ✅ Background image with opacity (behind all content)
- ✅ Text color (day names, dates, activities)
- ✅ Accent color (borders, separators)
- ✅ Border radius (24px fixed for list view first/last days, configurable for grid)
- ✅ Font families (header and body)
- ✅ Border visibility toggle
- ✅ Layout mode switch (grid vs list)

## Files Modified

### `src/lib/components/ExportSheet.svelte`

**Lines 430-445 (Grid View Header):**
- Combined day name and date into single row
- Added separator dot (·)
- Applied opacity to date portion

**Lines 515-606 (List View Layout):**
- Changed container gap from `space-y-4` to `space-y-1`
- Added conditional border-radius logic (24px on Monday top, Sunday bottom)
- Removed background/shadow from Bible verse container
- Maintained separate containers per day for flexibility

## User Benefits

### Grid View
- **More content visible** in same vertical space
- **Cleaner headers** with single-line format
- **Professional appearance** maintained

### List View
- **Significantly more compact** exports
- **Unified card appearance** looks modern
- **Better for sharing** on social media (Instagram, WhatsApp)
- **Reduced file size** from simpler rendering
- **Print-friendly** format uses less paper

## Design Rationale

### Why separate containers in list view?
- Allows individual styling per day if needed in future
- Maintains flexibility for customization
- Shadow/background per day creates depth
- Can highlight specific days (e.g., today)

### Why 24px (3xl) border radius?
- Large enough to be visually distinct
- Creates friendly, modern appearance
- Matches iOS/Material Design patterns
- Works well with tight spacing

### Why no background on Bible verse?
- Prevents visual competition with day containers
- Makes verse feel like part of overall design
- Cleaner, more elegant appearance
- Better contrast against main background

## Testing Checklist

- [x] Grid view: Day name and date in single row
- [x] Grid view: Date appears lighter than day name
- [x] List view: Minimal gap between days (space-y-1)
- [x] List view: Monday has rounded top corners (24px)
- [x] List view: Sunday has rounded bottom corners (24px)
- [x] List view: Tuesday-Saturday have no rounded corners
- [x] List view: Bible verse has no background
- [x] Export to JPG works correctly
- [x] Copy to clipboard works correctly
- [x] Share functionality works correctly
- [x] No TypeScript errors
- [x] Build succeeds

## Future Enhancements

Potential improvements to consider:
- Option to toggle between connected vs separated day containers
- Adjustable gap spacing in settings
- Custom corner radius per layout mode
- Animation when switching between grid and list
- Preview of both layouts side-by-side

---

**Version**: 1.0.1  
**Date**: October 2024  
**Status**: ✅ Implemented and Tested