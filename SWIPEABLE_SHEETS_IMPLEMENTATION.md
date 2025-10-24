# Swipeable Sheets Implementation

## Summary
All sheet/modal components in the app now support swipe-to-dismiss gestures on mobile devices with smooth, native-feeling animations. This includes:
- ✅ ActivityEditSheet - Full desktop/mobile support with proper prop chain
- ✅ AddActivityModal - Swipeable with template support
- ✅ WeekPicker - Swipeable week/year selector
- ✅ ExportSheet - Swipeable with larger desktop layout
- ✅ SettingsSheet - Swipeable with complex two-pane layout

## Overview
Implemented native-feeling swipeable sheets for mobile devices with smooth animations and touch gesture support. All sheet/modal components can now be closed by swiping down from the header.

## Changes Made

### 1. New Component: `SwipeableSheet.svelte`
Created a reusable wrapper component that provides:
- **Touch gesture detection**: Tracks touch start, move, and end events
- **Swipe-to-dismiss**: Swiping down closes the sheet when threshold is met
- **Velocity detection**: Quick swipes trigger dismissal even with small distances
- **Smooth animations**: Uses Svelte transitions (`fly` and `fade`) for native feel
- **Visual feedback**: Swipe indicator bar at the top shows it's draggable
- **Body scroll lock**: Prevents background scrolling when sheet is open on mobile
- **Desktop compatibility**: Gestures only active on mobile, desktop unchanged

#### Key Features:
- `SWIPE_THRESHOLD`: 100px distance to trigger close
- `VELOCITY_THRESHOLD`: 0.5px/ms for quick swipe detection
- Smooth cubic-bezier transitions when snapping back
- Only allows downward dragging (prevents upward swipes)
- Visual indicator changes opacity when dragging
- Configurable desktop max-width via `desktopMaxWidth` prop (default: `md:max-w-md`)

### 2. Updated Components

#### `ActivityEditSheet.svelte`
- Wrapped content with `SwipeableSheet`
- Removed duplicate backdrop/dialog code
- Maintains all existing functionality
- Added `sheet-content` class for proper scrolling
- Uses default desktop max-width (`md:max-w-md`)
- Receives `isDesktop` prop from `DayColumn` component

#### `AddActivityModal.svelte`
- Wrapped content with `SwipeableSheet`
- Set `maxHeight="95vh"` for taller content
- Removed backdrop click handler (now in SwipeableSheet)
- Added `sheet-content` class for proper scrolling
- Uses default desktop max-width (`md:max-w-md`)

#### `WeekPicker.svelte`
- Wrapped content with `SwipeableSheet`
- Added `isDesktop` prop support
- Set `maxHeight="95vh"` for week grid
- Removed backdrop click handler
- Added `sheet-content` class for proper scrolling
- Uses default desktop max-width (`md:max-w-md`)

#### `ExportSheet.svelte`
- Wrapped content with `SwipeableSheet`
- Set `maxHeight="95vh"` for preview content
- Set `desktopMaxWidth="md:max-w-4xl"` for wider preview area
- Removed backdrop click handler
- Added `sheet-content` class for proper scrolling

#### `SettingsSheet.svelte`
- Wrapped content with `SwipeableSheet`
- Set `desktopMaxWidth="md:max-w-5xl"` for widest layout
- Maintains complex two-pane layout (mobile/desktop)
- Removed backdrop click handler
- Added `sheet-content` class for proper scrolling

### 3. Updated Component Props Chain

#### `isDesktop` Prop Flow
To ensure proper desktop/mobile detection, the `isDesktop` prop flows through the component hierarchy:

**For ActivityEditSheet:**
- `App.svelte` → `WeekView.svelte` → `DayColumn.svelte` → `ActivityEditSheet.svelte`
- Each component declares `export let isDesktop` and passes it down
- This ensures edit sheets respect desktop layout on larger screens

**For WeekPicker:**
- `App.svelte`: Passes `isDesktop` from parent state
- `FloatingNav.svelte`: Passes `isDesktop={false}` (mobile-only component)
- `WeekView.svelte`: Passes `isDesktop={false}` (mobile-only component)

**For Other Sheets (direct usage in App.svelte):**
- `AddActivityModal`, `SettingsSheet`, `ExportSheet` all receive `isDesktop` directly from `App.svelte`

### 4. Updated Exports
Added `SwipeableSheet` to `src/lib/components/index.ts` for easy importing.

## Technical Details

### Touch Event Handling
```typescript
- touchstart: Records initial Y position and timestamp
- touchmove: Calculates delta and velocity, applies transform
- touchend: Checks if threshold met, either closes or snaps back
```

### Animation Strategy
- **Opening**: Fly in from bottom (mobile) with 300ms duration
- **Dragging**: Immediate transform with no transition
- **Snap back**: 300ms cubic-bezier transition
- **Closing**: Fly out to bottom (mobile) with 250ms duration
- **Backdrop**: 200ms fade in/out

### Performance Optimizations
- `touch-action: pan-y` allows vertical scrolling only
- Prevents default scroll only when drag detected (>5px)
- Uses CSS transforms (GPU accelerated)
- Conditional transitions (none during drag, smooth otherwise)

### Mobile-First Design
- Swipe indicator only shows on mobile
- Body scroll lock only on mobile
- Desktop: Standard modal behavior (Escape key, backdrop click)
- Mobile: Native app-like gesture support

## User Experience

### Mobile
1. Sheet slides up from bottom with smooth animation
2. Swipe indicator at top signals draggability
3. Swipe down from anywhere to dismiss
4. Visual feedback during drag (sheet follows finger)
5. Release above threshold: snaps back
6. Release below threshold or fast swipe: dismisses

### Desktop
1. Fades in at center (no slide animation)
2. No swipe indicator
3. Standard close methods (X button, Escape, backdrop click)
4. Unchanged from previous behavior

## Browser Compatibility
- Modern browsers with touch events support
- Fallback: Standard click/keyboard interactions
- iOS Safari: Smooth native-like experience
- Android Chrome: Smooth native-like experience

## Important Implementation Notes

### Prop Passing
When a sheet component is deeply nested (like `ActivityEditSheet` inside `DayColumn`), you must pass the `isDesktop` prop through the entire component chain. Missing the prop at any level will result in the sheet always showing mobile mode.

**Example Prop Chain:**
```svelte
<!-- App.svelte -->
<WeekView {isDesktop} />

<!-- WeekView.svelte -->
export let isDesktop = false;
<DayColumn {isDesktop} ... />

<!-- DayColumn.svelte -->
export let isDesktop = false;
<ActivityEditSheet {isDesktop} ... />
```

## CSS Classes
- `.sheet-content`: Applied to scrollable content areas
  - `-webkit-overflow-scrolling: touch` for iOS momentum
  - `overscroll-behavior: contain` prevents pull-to-refresh conflicts

## Component Desktop Sizing
Different sheets use different desktop max-widths based on content needs:
- **Small** (`md:max-w-md`): ActivityEditSheet, AddActivityModal, WeekPicker - Simple forms
- **Large** (`md:max-w-4xl`): ExportSheet - Needs space for preview
- **Extra Large** (`md:max-w-5xl`): SettingsSheet - Two-pane layout with lots of options

## Testing Checklist

### Mobile (Touch Devices)
- [ ] ActivityEditSheet: Swipe down from header to dismiss
- [ ] ActivityEditSheet: Swipe indicator visible at top
- [ ] ActivityEditSheet: Sheet follows finger during drag
- [ ] ActivityEditSheet: Quick swipe down dismisses even with small distance
- [ ] ActivityEditSheet: Slow swipe below threshold snaps back
- [ ] AddActivityModal: All swipe gestures work on both steps (day selection & details)
- [ ] WeekPicker: Swipe to dismiss without selecting week
- [ ] ExportSheet: Swipe to dismiss with large preview visible
- [ ] SettingsSheet: Swipe to dismiss from main list and detail views
- [ ] All sheets: Smooth slide-up animation on open
- [ ] All sheets: Smooth slide-down animation on close
- [ ] All sheets: Background fades in/out correctly
- [ ] All sheets: Body scroll locked when sheet open
- [ ] All sheets: Backdrop click still closes sheet

### Desktop (Mouse/Keyboard)
- [ ] ActivityEditSheet: Opens centered modal (not from bottom)
- [ ] ActivityEditSheet: Proper desktop width (md:max-w-md)
- [ ] ActivityEditSheet: No swipe indicator visible
- [ ] AddActivityModal: Centered modal with proper width
- [ ] WeekPicker: Centered modal with proper width
- [ ] ExportSheet: Wide modal (md:max-w-4xl) for preview
- [ ] SettingsSheet: Extra wide modal (md:max-w-5xl) for two-pane layout
- [ ] All sheets: Escape key closes
- [ ] All sheets: Backdrop click closes
- [ ] All sheets: Fade in/out (no slide animation)

### Cross-Browser
- [ ] Chrome/Edge: All gestures smooth
- [ ] Firefox: All gestures smooth
- [ ] Safari iOS: Native-feeling swipes
- [ ] Chrome Android: Native-feeling swipes

## Future Enhancements
- [ ] Haptic feedback on swipe threshold (if API available)
- [ ] Adjustable sensitivity settings
- [ ] Partial swipe resistance (rubber-band effect)
- [ ] Multi-level sheet heights (half, full)
- [ ] Swipe velocity based animation speed