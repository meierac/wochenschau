# Export Layout - Quick Reference

## What Changed?

The export preview layout now has:
- **Fixed width: 800px** (centered on all screen sizes)
- **Responsive height** (adjusts to content, max 60vh with scroll)

## Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| Width | Varies with screen | Fixed 800px |
| Height | Fixed 384px (max-h-96) | Dynamic, max 60vh |
| Centering | No | Yes, always centered |
| Screen dependency | High | None |
| Export consistency | Variable | Consistent |

## How It Works

1. **Preview Container** wraps the content with `overflow-auto` and `max-h-[60vh]`
2. **Export Preview** (#export-preview) is set to `width: 800px; margin: 0 auto;`
3. Content expands vertically based on number of activities
4. If content exceeds 60% of viewport height, it becomes scrollable
5. Export (JPG) captures the full 800px × variable height

## Grid View Layout

```
┌────────────────────────────┐
│      800px wide            │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐      │
│  │Mo│ │Tu│ │We│ │Th│      │
│  ├──┤ ├──┤ ├──┤ ├──┤      │
│  │  │ │  │ │  │ │  │      │
│  │  │ │  │ │  │ │  │      │
│  ├──┤ ├──┤ ├──┤ ├──┤      │
│  │Fr│ │Sa│ │Su│ │  │      │
│  └──┘ └──┘ └──┘ └──┘      │
└────────────────────────────┘
- 4 columns fit perfectly
- Height expands with activities
```

## List View Layout

```
┌────────────────────────────┐
│      800px wide            │
│ ▌ Monday · 17. Oct        │
│   ├─ Activity 1           │
│   ├─ Activity 2           │
│                           │
│ ▌ Tuesday · 18. Oct       │
│   ├─ Activity 1           │
│   └─ Activity 2           │
│                           │
│ ... more days ...         │
└────────────────────────────┘
- Full width for activity text
- Sequential layout
- Height expands with activities
```

## Key Properties

**Export Preview Container:**
```
style="width: 800px; margin: 0 auto;"
```

**Preview Wrapper:**
```
class="overflow-auto max-h-[60vh]"
```

## Benefits

✅ **Consistent** - Looks the same on all screen sizes
✅ **Professional** - Export quality is predictable
✅ **Readable** - 800px is optimal for reading
✅ **Flexible** - Height adjusts to content
✅ **Scrollable** - Can scroll for very long agendas
✅ **Centered** - Always centered on screen

## File Modified

- `src/lib/components/ExportSheet.svelte`

**Changes:**
- Line 307: Added fixed width and centering via inline style
- Line 306: Changed max-height from `max-h-96` to `max-h-[60vh]`

## Export Quality

When exporting to JPG:
- Image width: 800px × 2 (scale: 2) = 1600px at 2x resolution
- Image height: Automatic based on content
- Quality: JPEG at 0.95
- Result: Sharp, professional image

## Scrolling Behavior

- **Small content**: Fits in preview, no scroll needed
- **Medium content**: Shows all without scroll (typical case)
- **Large content**: Scrollable within the preview container
- **Export**: Full content captured regardless of scroll position

## Implementation Details

| Component | Value | Purpose |
|-----------|-------|---------|
| Preview width | 800px | Fixed, optimal for reading |
| Preview margin | 0 auto | Horizontal centering |
| Container max-height | 60vh | Respects viewport |
| Container overflow | auto | Scroll when needed |
| Export scale | 2x | Higher resolution output |
| Export quality | 0.95 | JPEG quality setting |

## Testing Checklist

- [ ] Preview displays at 800px width on all screen sizes
- [ ] Preview is centered on screen
- [ ] Grid view shows 4 columns without wrapping
- [ ] List view displays full activity text
- [ ] Height adjusts based on number of activities
- [ ] Scrolls gracefully for many activities
- [ ] Export JPG looks professional
- [ ] Works on mobile, tablet, and desktop

## No User Facing Changes

This is an internal improvement:
- Export functionality works the same way
- Users see better previews
- Exports are more consistent
- No new options or settings added