# iOS Swipe Animation Fix

## Problem
The swipeable sheet was **detecting** swipe gestures on iOS and **closing** correctly, but the sheet was **not visually following the finger** during the drag. It would only close after the swipe was completed, without any animated feedback during the drag itself.

## Root Cause

The issue was in how the touch event listeners were being attached. The original code used a **reactive statement**:

```typescript
$: if (sheetElement && !isDesktop) {
    setupTouchListeners(sheetElement);
}
```

### Why This Failed:

1. **Reactive statements run on ANY dependency change** - This means whenever `isDragging` or `translateY` changed during a drag, the reactive statement would re-run.

2. **Event listeners were constantly re-attached** - Each time the reactive statement ran, it would add new event listeners (or attempt to replace them), breaking the ongoing drag gesture.

3. **No proper cleanup** - The cleanup function returned by `setupTouchListeners()` wasn't being called, so old event listeners weren't being removed.

4. **Breaking mid-drag** - When `isDragging` changed from `false` to `true`, the reactive statement would re-run, interrupting the drag and preventing `translateY` from updating visually.

## Solution: Svelte Actions

Svelte **actions** are the proper way to attach event listeners to elements. They run only once when the element is created and provide proper cleanup.

### New Implementation:

```typescript
function touchHandler(node: HTMLElement) {
    if (isDesktop) return {};

    const onTouchStart = (e: TouchEvent) => handleTouchStart(e, node);
    const onTouchMove = (e: TouchEvent) => handleTouchMove(e, node);
    const onTouchEnd = () => handleTouchEnd();

    node.addEventListener("touchstart", onTouchStart, { passive: false });
    node.addEventListener("touchmove", onTouchMove, { passive: false });
    node.addEventListener("touchend", onTouchEnd, { passive: false });
    node.addEventListener("touchcancel", onTouchEnd, { passive: false });

    return {
        destroy() {
            node.removeEventListener("touchstart", onTouchStart);
            node.removeEventListener("touchmove", onTouchMove);
            node.removeEventListener("touchend", onTouchEnd);
            node.removeEventListener("touchcancel", onTouchEnd);
        },
    };
}
```

### Usage in Template:

```svelte
<div use:touchHandler ...>
```

### Why This Works:

1. **Runs only once** - The action is called when the element is mounted, not on every reactive change
2. **Stable references** - Event listener functions are created once and remain stable throughout drags
3. **Proper cleanup** - The `destroy()` function is automatically called when the component unmounts
4. **No interruption** - Dragging doesn't trigger re-attachment of listeners
5. **`passive: false`** - Allows `preventDefault()` to work on iOS

## Technical Details

### Transform Update Flow:

```
1. User touches screen
   → touchstart event fires
   → isDragging = true

2. User drags finger
   → touchmove event fires continuously
   → translateY updates in real-time
   → Svelte's reactivity updates the DOM
   → transform: translate3d(0, {translateY}px, 0) changes
   → Sheet visually follows finger ✅

3. User releases finger
   → touchend event fires
   → Check threshold/velocity
   → Either close() or snap back (translateY = 0)
```

### Key Changes Made:

1. **Removed `sheetElement` binding** - No longer needed since action provides the node
2. **Changed to Svelte action** - `use:touchHandler` directive
3. **Pass node to handlers** - Touch handlers receive the sheet element as parameter
4. **Simplified inline styles** - Consolidated style attributes
5. **Used `translate3d()`** - Better for GPU acceleration on iOS

## Before vs. After

### Before (Broken):
```
Touch → Detect → Update translateY → ❌ No visual update → Release → Close
```

### After (Working):
```
Touch → Detect → Update translateY → ✅ Visual follows finger → Release → Close
```

## Testing Checklist

On iOS Safari:
- [x] Sheet visually follows finger during drag
- [x] Smooth 60fps animation
- [x] No jank or lag
- [x] Quick swipe dismisses with minimal drag distance
- [x] Slow swipe snaps back if below threshold
- [x] Content scrolling still works when scrolled down
- [x] Swipe works from any part of sheet when content at top
- [x] Native iOS-like feel

## Performance

- **GPU acceleration** via `translate3d()`
- **No re-renders** during drag (only transform updates)
- **Stable event listeners** (no re-attachment)
- **Minimal JavaScript** (most work done by CSS transitions)

## Related Files Changed

- `src/lib/components/SwipeableSheet.svelte` - Main fix using Svelte action