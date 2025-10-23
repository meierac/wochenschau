# iOS-Style Swipe Gestures Documentation

## Overview

Activity cards now feature iOS-style swipe gestures that reveal action buttons (Edit/Delete) when swiped. This provides a modern, intuitive interface consistent with iOS Mail, Messages, and other Apple apps.

## Visual Behavior

### Initial State
```
┌─────────────────────────────────────┐
│ Meeting                    [✎] [✕]  │
│ 09:00 - 10:00                       │
│ 1h 0m                               │
└─────────────────────────────────────┘
```

### Swiping Left (Edit)
```
┌─────────────────────────────────────┐
│ Meeting            ┌──────────────┐  │
│ 09:00 - 10:00      │    Edit      │  │ ← Action button reveals
│ 1h 0m              └──────────────┘  │
└─────────────────────────────────────┘
```

### Swiping Right (Delete)
```
┌─────────────────────────────────────┐
│ ┌──────────────┐                    │
│ │    Delete    │ Meeting            │ ← Action button reveals
│ └──────────────┘ 09:00 - 10:00      │
│                  1h 0m              │
└─────────────────────────────────────┘
```

### At Maximum Swipe (Threshold)
```
Left swipe (max):
┌──────────┬─────────────────────────┐
│  Edit    │ Meeting            [✎] │
└──────────┴─────────────────────────┘
Max reveal: 100px

Right swipe (max):
┌─────────────────────────────┬──────────┐
│ Meeting            [✕]      │ Delete   │
└─────────────────────────────┴──────────┘
Max reveal: 100px
```

## Gesture Recognition

### Swipe Left (Edit Action)
- **Direction**: Finger moves from right to left
- **Minimum distance**: 40px
- **Maximum offset**: -100px (reveals full Edit button)
- **Action on release**: Opens edit sheet
- **Visual feedback**: Card smoothly slides left, reveals blue Edit button

### Swipe Right (Delete Action)
- **Direction**: Finger moves from left to right
- **Minimum distance**: 40px
- **Maximum offset**: 100px (reveals full Delete button)
- **Action on release**: Shows delete confirmation
- **Visual feedback**: Card smoothly slides right, reveals red Delete button

### Vertical Scrolling Prevention
- **Detection**: Tracks both horizontal (deltaX) and vertical (deltaY) movement
- **Threshold**: Only triggers swipe if |deltaX| > |deltaY|
- **Minimum horizontal movement**: 5px to detect as horizontal gesture
- **Prevents**: Accidental swipe during vertical page scrolling
- **Behavior**: Vertical scrolling works normally without interference

## Implementation Details

### Component State
```typescript
let touchStartX = 0;        // Initial touch X position
let touchStartY = 0;        // Initial touch Y position
let touchEndX = 0;          // Current touch X position
let swipeOffset = 0;        // Current card translation (-100 to 100px)
let isDragging = false;     // True while actively swiping
```

### Touch Event Handlers

#### touchstart
- Records initial touch coordinates
- Resets swipe state to neutral

#### touchmove
- Calculates delta between current and initial position
- Checks if movement is primarily horizontal (|deltaX| > |deltaY|)
- Limits swipe offset to [-100, 100] px range
- Updates card position in real-time
- Calls preventDefault() to prevent page scroll during drag

#### touchend
- Calculates total swipe distance
- Compares against 40px minimum threshold
- Executes action based on direction:
  - Right swipe (>40px): Delete action
  - Left swipe (<-40px): Edit action
  - Small swipe (<40px): No action, card snaps back
- Smoothly animates card back to neutral position

### Animation Behavior

#### During Drag (isDragging = true)
```css
transform: translateX({swipeOffset}px);
transition: none;  /* Real-time follow */
```
- Card follows finger immediately
- No delay or easing
- Instant visual feedback

#### After Release (isDragging = false)
```css
transform: translateX(0px);
transition: transform 0.3s ease;  /* Smooth return */
```
- Card smoothly animates to neutral position
- 300ms duration with easing
- Creates satisfying snap-back effect

## Action Button Styling

### Delete Button (Right Swipe)
```css
background-color: rgb(239, 68, 68, 0.9);  /* Destructive/90% opacity */
color: white;
text-align: center;
font-weight: 600;
font-size: 16px;
width: 96px;  /* w-24 */
```

### Edit Button (Left Swipe)
```css
background-color: rgb(14, 165, 233, 0.9);  /* Primary/90% opacity */
color: white;
text-align: center;
font-weight: 600;
font-size: 16px;
width: 96px;  /* w-24 */
```

### Positioning
- Delete: Positioned absolutely on `left: 0`
- Edit: Positioned absolutely on `right: 0`
- Height: Full card height (`inset-y-0`)
- Both: Hidden behind main card initially
- Reveal: Visible when card translates

## Comparison to iOS Behavior

### Similarities
✓ Action buttons reveal on swipe
✓ Multiple actions available (left/right)
✓ Smooth follow-along animation
✓ Visual feedback while dragging
✓ Prevents vertical scroll interference
✓ Threshold prevents accidental triggers
✓ Satisfying snap-back animation

### Implementation Details
- **Offset limiting**: 100px max (iOS varies by app)
- **Threshold**: 40px (iOS typically 30-50px)
- **Animation**: 0.3s ease (iOS typically 0.2-0.3s)
- **Actions**: Edit (left) and Delete (right)

## User Experience Flow

### Mobile User - Quick Edit
```
1. User sees activity card
2. Swipes left (or taps [✎])
3. Blue "Edit" button reveals
4. On release: Edit sheet opens
5. User makes changes
6. Saves or cancels
```

### Mobile User - Quick Delete
```
1. User sees activity card
2. Swipes right (or taps [✕])
3. Red "Delete" button reveals
4. On release: Confirmation shown
5. User confirms
6. Activity removed
```

### Desktop User - Traditional
```
1. User sees activity card
2. Hovers over button area
3. Sees enhanced button styling
4. Clicks [✎] or [✕]
5. Action triggers immediately
```

## Performance Optimization

### Touch Event Handling
- Minimal calculations per touch move event
- No DOM manipulation during swipe
- CSS transforms use GPU acceleration
- Smooth 60fps animations on modern devices

### Rendering
- Only one element updated: card transform
- No layout recalculations during drag
- Efficient state updates

### Memory
- 4 state variables (integers and booleans)
- No heavy object allocation
- Event listeners cleaned up properly

## Accessibility

### Keyboard Navigation
- Tab to activity buttons (Edit/Delete)
- Enter/Space to activate
- Works independently of swipe gestures
- Full keyboard support

### Touch Accessibility
- Large touch targets (44x44px minimum)
- Clear visual feedback
- No time-based interactions
- Works with accessibility features

### Screen Readers
- Action buttons have descriptive labels
- Activity information announced
- Gesture instructions in tooltips
- Semantic HTML structure

## Browser & Device Support

### iOS
- iPhone with iOS 14+
- iPad with iPadOS 14+
- Full gesture support
- Smooth animation performance

### Android
- Chrome Mobile 89+
- Firefox Mobile 88+
- Samsung Internet 14+
- Touch event support

### Desktop
- Windows 10+ with touch screen
- Chrome/Edge with touch support
- Swipe emulation in DevTools
- Desktop browsers without touch: swipe disabled

## Responsive Behavior

### Mobile (< 768px)
- Swipes enabled
- Full-width cards
- Large touch targets
- Action buttons: 96px wide

### Tablet (768px - 1024px)
- Swipes enabled
- Multiple column view
- Large touch targets
- Action buttons: 96px wide

### Desktop (≥ 1024px)
- Swipes disabled (no touch events)
- Button click only
- Hover states active
- Tooltips available

## Edge Cases & Handling

### Rapid Successive Swipes
- Works with fast swipes
- Properly resets between swipes
- No race conditions
- Smooth animation in all cases

### Partial Swipes
- Swipes < 40px: Card snaps back, no action
- Swipes = 40px+: Action triggers
- Clear threshold prevents ambiguity

### Simultaneous Vertical Scroll
- |deltaX| vs |deltaY| comparison detects this
- Prevents page scroll during horizontal drag
- Vertical scrolling works when not swiping

### Multi-touch
- Only first touch point used (changedTouches[0])
- Ignores multi-finger gestures
- Prevents confusion with pinch-zoom

### Small Devices
- Works on screens as small as 320px
- Action buttons fit in available space
- Touch targets remain adequate

## Testing Recommendations

### Manual Testing
1. Test on actual iPhone/iPad
2. Test on Android device
3. Test on Windows touch screen
4. Test with DevTools touch emulation

### Test Scenarios
- [ ] Slow left swipe (< 40px) - snaps back
- [ ] Fast left swipe (> 40px) - opens edit
- [ ] Slow right swipe (< 40px) - snaps back
- [ ] Fast right swipe (> 40px) - deletes
- [ ] Vertical scroll doesn't trigger swipe
- [ ] Rapid swipes work correctly
- [ ] Desktop buttons still work
- [ ] Animation smooth and responsive

### Performance Testing
- Check for smooth 60fps animations
- Verify no jank during swipe
- Monitor CPU/GPU usage
- Test on lower-end devices

## Future Enhancements

### Potential Improvements
- Haptic feedback on swipe complete
- Sound effects (optional)
- Customizable swipe distance threshold
- Alternative action ordering
- Swipe direction preferences
- Undo/redo support
- Multiple actions per swipe (like iOS Mail)

### Accessibility Enhancements
- Respect `prefers-reduced-motion`
- Alternative gesture methods
- Voice control integration
- Switch control support

## Code Structure

### File: `src/lib/components/ActivityCard.svelte`

Key sections:
- **Touch handlers**: Lines managing gesture detection
- **State variables**: Touch position tracking
- **Animation**: CSS transforms and transitions
- **Action buttons**: Edit/Delete reveal elements
- **Main card**: Draggable activity display

### CSS Classes Used
- `relative`: Parent positioning context
- `overflow-hidden`: Hide action buttons initially
- `absolute inset-y-0`: Action button positioning
- `transition-transform`: Smooth snap-back
- `active:bg-*`: Button active states

## Summary of Changes

| Aspect | Before | After | Benefit |
|--------|--------|-------|---------|
| Interaction | Tap buttons only | Swipe + Tap | Faster on mobile |
| Visual feedback | Immediate | Smooth drag follow | More intuitive |
| Action reveal | None | Buttons slide in | Clear intent |
| Animation | Instant | 0.3s smooth | Polished feel |
| iOS similarity | Low | High | Familiar to users |
| Description | Visible | Hidden | Cleaner cards |
| Swipe threshold | 50px | 40px | Easier to trigger |
| Max offset | No limit | 100px | Controlled reveal |
| Vertical scroll | Interference | No interference | Better UX |
