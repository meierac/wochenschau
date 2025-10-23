# Layout Structure Documentation

## Overview

The Wochenschau calendar uses a responsive, flexible layout that adapts to different screen sizes while maintaining full-height day columns without internal scrolling.

## Layout Hierarchy

```
<main> (min-h-screen)
  ├── Desktop Layout (h-screen, flex column)
  │   ├── Header (flex-shrink-0)
  │   └── WeekView Container (flex-1, overflow-hidden)
  │       └── WeekView (flex column, h-full)
  │           ├── Desktop Header (flex-shrink-0)
  │           ├── Grid Container (flex-1, overflow-y-auto)
  │           │   └── Day Columns (h-full, flex column)
  │           │       ├── Day Header (shrink-0)
  │           │       ├── Activities List (flex-1, overflow-hidden)
  │           │       ├── Add Button (shrink-0)
  │           │       └── Add Form (shrink-0, if visible)
  │           └── Week Picker (modal overlay)
  └── Mobile Layout (h-screen, flex column, pb-20)
      ├── Header (flex-shrink-0)
      ├── WeekView Container (flex-1, overflow-hidden)
      └── Floating Navigation (fixed bottom)
```

## Responsive Breakpoints

- **Mobile** (< 768px): 
  - Single column layout (1 day per row)
  - Compact header
  - Stack vertically with full scroll on grid container
  - Floating navigation bar at bottom

- **Tablet** (768px - 1024px):
  - 3 columns layout (3 days per row)
  - Medium header
  - Scrolls vertically if needed

- **Desktop** (≥ 1024px):
  - 7 columns layout (full week grid)
  - Full header
  - Scrolls vertically if needed

## Key Design Principles

### 1. Full Height, No Internal Scroll

- Day columns always fill 100% of their container height
- `class="h-full"` ensures each day column stretches to fill grid cell
- Activities list uses `overflow-hidden` (no internal scroll)
- Only the grid container itself scrolls with `overflow-y-auto`

### 2. Flex-Based Layout

- All containers use flexbox for predictable sizing
- `flex-shrink-0` / `shrink-0` prevents headers and buttons from shrinking
- `flex-1` on main content areas makes them grow to fill space

### 3. Container Stacking

```
WeekView (flex column, h-full)
  ├── Header (shrink-0) - doesn't shrink
  ├── Grid (flex-1, overflow-y-auto) - grows to fill, scrolls if needed
  └── Modal (overlay)
```

### 4. Day Column Structure

```
DayColumn (flex column, h-full)
  ├── Header (shrink-0) - fixed size
  ├── Activities (flex-1, overflow-hidden) - grows to fill
  ├── Add Button (shrink-0) - fixed size
  └── Add Form (shrink-0, if visible) - fixed size
```

## Scroll Behavior

- **Grid container**: Scrolls vertically when day columns exceed viewport height
- **Day columns**: No internal scrolling
- **Activities list**: Always visible (no truncation)
- **Modals**: Fixed position overlays, no scroll behavior

## CSS Classes Used

| Class | Purpose |
|-------|---------|
| `h-full` | 100% height |
| `h-screen` | 100% viewport height |
| `w-full` | 100% width |
| `flex` | Flexbox container |
| `flex-col` | Flex column direction |
| `flex-1` | Grow to fill space (flex: 1 1 0%) |
| `flex-shrink-0` / `shrink-0` | Don't shrink |
| `overflow-hidden` | Hide overflow, no scroll |
| `overflow-y-auto` | Scroll vertically when needed |
| `overflow-auto` | Scroll both directions when needed |
| `gap-*` | Gap between flex items |
| `pb-*` | Padding bottom |
| `mb-*` | Margin bottom |

## Responsive Classes

| Class | Breakpoint |
|-------|-----------|
| `hidden md:flex` | Hidden on mobile, show on tablet+ |
| `md:hidden` | Show on mobile, hide on tablet+ |
| `grid-cols-1` | 1 column (mobile) |
| `md:grid-cols-3` | 3 columns (tablet) |
| `lg:grid-cols-7` | 7 columns (desktop) |

## Padding & Spacing

- **Mobile**: `pb-20` (bottom padding for floating nav)
- **Desktop**: `md:pb-6` (smaller bottom padding)
- **Gap between days**: `gap-2` (mobile), `md:gap-3` (tablet+)
- **Padding in day columns**: `p-2` (mobile), `md:p-3` (tablet+)

## Common Issues & Solutions

### Issue: Day columns too short / showing empty space
**Solution**: Ensure grid container has `flex-1` and parent has `h-full`

### Issue: Content overflowing day columns
**Solution**: Use `overflow-hidden` on activities list, not `overflow-y-auto`

### Issue: Header moving when scrolling
**Solution**: Apply `shrink-0` to header, `flex-1` to content area

### Issue: Mobile nav hidden behind content
**Solution**: Use `pb-20` on grid container to add bottom padding for fixed nav

## Browser Compatibility

All flexbox and CSS Grid features used are supported in:
- Chrome 89+
- Firefox 88+
- Safari 14+
- Edge 89+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)