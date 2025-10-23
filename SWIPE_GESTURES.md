# Swipe Gestures Documentation

## Overview

Activity cards now support intuitive swipe gestures on touch devices (mobile and tablet). This provides a more natural and efficient way to interact with calendar items.

## Gestures

### Left Swipe
- **Trigger**: Swipe left on an activity card
- **Action**: Opens the activity edit sheet
- **Minimum distance**: 50px
- **Visual feedback**: Card translates smoothly following finger movement

### Right Swipe
- **Trigger**: Swipe right on an activity card
- **Action**: Deletes the activity (with confirmation dialog)
- **Minimum distance**: 50px
- **Visual feedback**: Card translates smoothly following finger movement

## Implementation Details

### Touch Events
The component listens to three touch events:

#### `touchstart`
- Records initial touch position (X and Y coordinates)
- Resets swipe offset to 0
- Captures screen coordinates from first touch point

#### `touchmove`
- Tracks finger movement across screen
- Calculates delta (difference) between start and current position
- Only tracks horizontal movement (ignores vertical scroll gestures)
- Updates visual card position in real-time
- Prevents triggering on vertical swipes (by comparing deltaX and deltaY)

#### `touchend`
- Calculates total swipe distance
- Checks if swipe exceeds minimum threshold (50px)
- Determines swipe direction:
  - **Positive deltaX** (moving right) → Delete action
  - **Negative deltaX** (moving left) → Edit action
- Resets visual offset
- No action if swipe distance is less than threshold

### Swipe Distance Threshold
- **Value**: 50px
- **Purpose**: Prevents accidental triggers from small movements or clicks
- **Rationale**: Allows users to tap buttons without accidentally swiping
- **User experience**: Users need a deliberate swipe motion to trigger actions

## Technical Implementation

### State Variables
```typescript
let touchStartX = 0;      // Initial touch X position
let touchStartY = 0;      // Initial touch Y position
let touchEndX = 0;        // Current touch X position
let swipeOffset = 0;      // Current visual offset (translateX)
```

### Swipe Detection Logic
1. Compare absolute change in X vs Y coordinates
2. Only track horizontal movement if |deltaX| > |deltaY|
3. Calculate total horizontal distance traveled
4. Compare against minimum threshold (50px)
5. Dispatch appropriate action based on direction

### Visual Feedback
- Card smoothly follows finger during swipe
- `transform: translateX()` creates drag animation
- Smooth transition back to original position on release
- `transition-all` class provides smooth animation

## User Experience

### Desktop
- Edit button (✎) and Delete button (✕) are clearly visible
- Buttons have increased size: `px-3 py-2` (from `px-1 py-0.5`)
- Font size: `md:text-lg` on larger screens
- Hover states provide visual feedback
- Tooltips explain both button and swipe actions

### Mobile
- Swipe gestures provide primary interaction method
- Buttons still visible for users who prefer clicking
- Buttons have increased touchable area: 44px minimum (standard for mobile)
- Consistent with iOS and Android gesture patterns
- Smooth animation while swiping

## Accessibility

### Keyboard Navigation
- Edit and Delete buttons are keyboard accessible
- Tab key navigates between buttons
- Enter/Space activates buttons

### Screen Readers
- Proper `aria-label` attributes on buttons
- `title` attributes explain both click and swipe actions
- Semantic HTML structure

### Visual Design
- High contrast colors (primary and destructive)
- Large touch targets (minimum 44x44px on mobile)
- Clear visual feedback on interaction

## Visual Enhancements

### Button Styling
- **Size increase**: `px-3 py-2` (was `px-1 py-0.5`)
- **Font weight**: `font-semibold` for better visibility
- **Desktop sizing**: `md:text-lg` for larger screens
- **Gap between buttons**: `gap-2` (was `gap-1`)
- **Padding**: `p-3` (was `p-2`) for more breathing room
- **Border**: `border-l-4` (was `border-l-2`) for stronger visual accent
- **Text size**: `text-sm md:text-base` for content (was `text-xs md:text-sm`)

### Interactive States
- **Normal**: Primary/Destructive color with subtle background
- **Hover**: `hover:bg-primary/20` or `hover:bg-destructive/20`
- **Active**: Immediate response to touch/click
- **Swipe**: Smooth follow-along animation

## Browser Support

### Desktop Browsers
- Touch events supported on Windows with touch screen
- Swipe works with trackpad on macOS (with specific gestures)
- Mouse clicks still work normally
- Touch emulation in DevTools works for testing

### Mobile Browsers
- iOS Safari 13+
- Chrome Mobile 89+
- Firefox Mobile 88+
- Samsung Internet 14+
- All modern mobile browsers with touch support

## Edge Cases Handled

### Vertical Scrolling
- Checks `|deltaY|` to ensure horizontal swipe
- Won't trigger swipe if user is scrolling vertically
- Allows natural page scrolling without interference

### Accidental Taps
- 50px minimum prevents accidental triggers from taps
- Users can click buttons without triggering swipes
- Provides user intent clarity

### Rapid Swipes
- Works with fast swipe gestures
- Also works with slow deliberate swipes
- No speed-based logic, only distance-based

### Multiple Touches
- Only uses first touch point (`changedTouches[0]`)
- Ignores multi-touch gestures
- Prevents confusion with pinch-zoom

## Testing Checklist

### Functionality
- [ ] Left swipe (≥50px) opens edit sheet
- [ ] Right swipe (≥50px) shows delete confirmation
- [ ] Swipes <50px don't trigger actions
- [ ] Vertical scrolling doesn't trigger swipes
- [ ] Card position follows finger during swipe
- [ ] Card returns to normal position after swipe

### Mobile
- [ ] Touch events work on iPhone/iPad
- [ ] Touch events work on Android devices
- [ ] Gesture smooth and responsive
- [ ] No lag during swipe animation
- [ ] Works with swipe-back browser gesture (doesn't conflict)

### Desktop
- [ ] Edit and Delete buttons are easily clickable
- [ ] Buttons have adequate size (44x44px minimum)
- [ ] Hover states work correctly
- [ ] Touch events work on touch screens

### Edge Cases
- [ ] Scrolling doesn't accidentally trigger swipes
- [ ] Can click buttons without swiping
- [ ] Works with slow swipes
- [ ] Works with fast swipes
- [ ] Multi-touch ignored properly
- [ ] Rapid repeated swipes work

### Accessibility
- [ ] Buttons accessible with Tab key
- [ ] Buttons activatable with Enter/Space
- [ ] Screen readers announce button labels
- [ ] High contrast maintained
- [ ] Focus indicators visible

## Performance Considerations

### Touch Event Handling
- Touch move events fire frequently (may fire 60+ times per second)
- Transform uses GPU acceleration (`transform: translateX`)
- No expensive calculations in event handlers
- Efficient state updates

### Optimization Tips
- Use `transform` instead of `left`/`right` for better performance
- Avoid DOM changes during swipe
- Use CSS transitions for animations
- Throttle if additional logic needed in future

## Future Enhancements

### Potential Features
- **Undo swipe**: Allow action reversal after swipe
- **Swipe animations**: More sophisticated reveal animations
- **Multi-action swipes**: Swipe distance triggers different actions
- **Haptic feedback**: Vibration on swipe completion (mobile)
- **Sound feedback**: Audio cue on action completion
- **Animation customization**: User preference for animation speed
- **Gesture options**: Allow users to customize or disable swipes
- **Swipe direction inversion**: Option to swap edit/delete sides

### Accessibility Enhancements
- **Reduced motion**: Respect `prefers-reduced-motion` media query
- **Voice control**: Compatible with voice commands
- **Switch control**: Support for switch-based navigation

## Troubleshooting

### Swipe Not Triggering
- Check minimum swipe distance (should be ≥50px)
- Ensure touch events are not being prevented
- Verify browser supports touch events
- Check if event handlers are properly bound

### Animation Lag
- Verify GPU acceleration is enabled
- Check for expensive operations in event handlers
- Ensure smooth 60fps animations in DevTools
- Profile in browser DevTools Performance tab

### Conflict with Other Gestures
- iOS swipe-back gesture operates on screen edge
- Activity card swipe triggers from center
- Should not conflict in practice
- Test edge case if needed

## Code References

### Component File
- `src/lib/components/ActivityCard.svelte`
- Lines with swipe implementation:
  - Touch handlers: `handleTouchStart`, `handleTouchMove`, `handleTouchEnd`
  - Visual feedback: `transform: translateX()`
  - Event bindings: `on:touchstart`, `on:touchmove`, `on:touchend`

### Related Components
- `src/lib/components/ActivityEditSheet.svelte` - Edit sheet UI
- `src/lib/components/DayColumn.svelte` - Card container

### Dependencies
- Svelte event binding system
- CSS transforms and transitions
- Tailwind CSS utility classes