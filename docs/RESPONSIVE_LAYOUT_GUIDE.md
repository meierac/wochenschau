# Responsive Day Columns Layout Guide

## Overview
This document describes the responsive grid layout implementation for the Wochenschau calendar application, ensuring optimal viewing across all device sizes.

## Responsive Breakpoints

The calendar uses Tailwind CSS responsive breakpoints to adapt the day columns layout:

### Mobile (< 768px)
- **Grid Columns**: 1 column
- **Layout**: Days stack vertically
- **Use Case**: Small phones, displays full day width
- **Class**: `grid-cols-1`

### Tablet (768px - 1023px)
- **Grid Columns**: 3 columns
- **Layout**: Three days per row
- **Use Case**: Tablets and medium devices
- **Class**: `md:grid-cols-3`

### Desktop (≥ 1024px)
- **Grid Columns**: 4 columns (maximum)
- **Layout**: Four days per row, with optional wrapping for 7-day week view
- **Use Case**: Desktops, laptops, and large displays
- **Class**: `lg:grid-cols-4`

## Implementation Details

### Grid Configuration
```
<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 flex-1 overflow-y-auto pb-20 md:pb-6">
  {#each days as day, dayIndex}
    <div class="h-full flex flex-col">
      <DayColumn ... />
    </div>
  {/each}
</div>
```

### Key CSS Classes

| Class | Purpose |
|-------|---------|
| `grid` | Enables CSS Grid layout |
| `grid-cols-1` | Mobile: 1 column |
| `md:grid-cols-3` | Tablet: 3 columns at 768px+ |
| `lg:grid-cols-4` | Desktop: 4 columns at 1024px+ |
| `gap-2` | Small gap between columns on mobile |
| `md:gap-3` | Larger gap on tablet and desktop |
| `flex-1` | Takes up remaining vertical space |
| `overflow-y-auto` | Scrolling only on grid container, not individual columns |
| `pb-20 md:pb-6` | Bottom padding for floating navigation |
| `h-full flex flex-col` | Day columns always stretch to full height |

## Desktop Layout Behavior

### 4 Days Per Row
When viewing a 7-day week on desktop:
- **Row 1**: Days 0-3 (Monday-Thursday)
- **Row 2**: Days 4-6 (Friday-Sunday)

This ensures:
- Balanced grid layout with maximum 4 columns
- Better readability compared to 7 narrow columns
- More efficient use of screen space
- Easier to scan and compare activities

### Scrolling Behavior
- **Internal Scrolling**: Disabled on day columns
- **External Scrolling**: Only on the grid container (overflow-y-auto)
- **Benefit**: Allows comparing multiple days while scrolling activities

## Mobile vs Desktop Experience

### Mobile Experience
- Full-width single day view
- Swipe gestures optimized for single column
- Vertical scrolling through days and activities
- Touch-friendly spacing

### Desktop Experience
- Multiple days visible simultaneously
- Up to 4 days per row provides optimal comparison view
- Horizontal grid layout with vertical overflow
- Mouse and keyboard navigation supported

## Responsive Testing Checklist

- [ ] Mobile (320px - 767px): 1 day per row, activities scroll vertically
- [ ] Tablet (768px - 1023px): 3 days per row, proper spacing
- [ ] Desktop (1024px+): 4 days per row, balanced layout
- [ ] Landscape Mobile: Still displays 1-2 columns appropriately
- [ ] Large Desktop (1920px+): 4 columns remain optimal
- [ ] Day columns maintain full height on all breakpoints
- [ ] No horizontal scrolling except for activity overflow

## Implementation Location

**File**: `src/lib/components/WeekView.svelte`

**Grid Definition** (lines 110-115):
```svelte
<div
    class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 flex-1 overflow-y-auto pb-20 md:pb-6"
>
    {#each days as day, dayIndex}
        <div class="h-full flex flex-col">
            <DayColumn {day} {dayIndex} dayActivities={...} />
        </div>
    {/each}
</div>
```

## Related Components

- **WeekView.svelte**: Main layout container with responsive grid
- **DayColumn.svelte**: Individual day column, always full height
- **ActivityCard.svelte**: Activity item with swipe gestures
- **Tailwind CSS**: Provides responsive breakpoints and utilities

## Notes

- The `lg:` prefix targets screens 1024px and wider (Tailwind default)
- Gap spacing increases on larger screens for better visual hierarchy
- Bottom padding adjusts to accommodate the floating navigation bar
- All breakpoint transitions are smooth with no layout shift