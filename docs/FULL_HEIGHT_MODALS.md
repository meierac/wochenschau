# Auto-Height Modal Design Guide

## Overview
All modals and sheets in the Wochenschau application now use an intelligent auto-height design that adjusts to content size while maintaining a maximum height constraint. This guide documents the responsive height behavior and layout architecture.

## Design Principles

### Height Strategy
- **Auto Height**: Modals grow/shrink based on content
- **Maximum Constraint**: Never exceed 60vh (60% viewport height)
- **Flexible**: Adjust naturally to any content size
- **Responsive**: Work seamlessly on mobile and desktop

### Layout Goals
✅ **Perfect Fit**: Modal height matches content without excess space  
✅ **No Wasted Space**: Removes unnecessary padding/scrolling  
✅ **Controlled Scrolling**: Only scroll when content exceeds max-height  
✅ **Mobile Friendly**: Works well on all screen sizes  
✅ **Desktop Friendly**: Centered and appropriately sized on larger screens

## CSS Structure

### Container Layout
```
fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4
```
- **fixed inset-0**: Full viewport overlay
- **flex items-end md:items-center**: Mobile bottom-sheet, desktop centered
- **z-50**: Modal layer
- **p-4**: Padding around modal

### Modal Container
```
bg-card rounded-2xl md:rounded-lg shadow-lg w-full transition-all flex flex-col md:max-w-md
```

**Breakdown**:
- **w-full**: Full width on mobile
- **flex flex-col**: Flexbox column layout
- **md:max-w-md**: Desktop max width (448px)
- **bg-card**: Card background color
- **rounded-2xl md:rounded-lg**: Rounded corners
- **shadow-lg**: Elevation shadow
- **transition-all**: Smooth animations

### Content Area
```
p-6 max-h-[60vh] overflow-y-auto
```

**Breakdown**:
- **p-6**: Padding inside content
- **max-h-[60vh]**: Maximum height 60% of viewport
- **overflow-y-auto**: Scroll only when needed

## Responsive Behavior

### Mobile (< 768px)
```
┌────────────────────────────┐
│       Modal Header         │  Fixed at top
├────────────────────────────┤
│                            │
│       Content Area         │  Auto height
│       (max-h-[60vh])       │  Scrolls if > 60vh
│                            │
├────────────────────────────┤
│       Bottom Buttons       │  Fixed at bottom (if any)
└────────────────────────────┘
```

**Characteristics**:
- Full viewport width (w-full)
- Auto height based on content
- Maximum 60vh height
- Bottom sheet presentation (items-end)
- Scrolls only when content exceeds max

### Desktop (≥ 768px)
```
┌─────────────────────────────┐
│    Black/50 Overlay         │
│  ┌─────────────────────┐    │
│  │  Modal Header       │    │ Auto height
│  ├─────────────────────┤    │ Max 448px width
│  │  Content Area       │    │ Max 60vh height
│  │  (max-h-[60vh])     │    │
│  ├─────────────────────┤    │
│  │  Bottom Buttons     │    │
│  └─────────────────────┘    │
│         (centered)          │
└─────────────────────────────┘
```

**Characteristics**:
- Auto width (max 28rem / 448px)
- Auto height based on content
- Maximum height: 60vh (60% of viewport)
- Centered on screen (md:items-center)
- Scrolls when content exceeds max-height

## Component Updates

### ActivityEditSheet
**File**: `src/lib/components/ActivityEditSheet.svelte`

**Height Configuration**:
```
Content: max-h-[60vh] overflow-y-auto
```

**Result**: Form fields display with auto height; scrolls only when form exceeds 60vh

---

### AddActivityModal
**File**: `src/lib/components/AddActivityModal.svelte`

**Height Configuration**:
```
Content: max-h-[60vh] overflow-y-auto
```

**Result**: Day selection and activity details adjust to content; scrolls when needed

---

### WeekPicker
**File**: `src/lib/components/WeekPicker.svelte`

**Height Configuration**:
```
Content: max-h-[60vh] overflow-y-auto
```

**Result**: Week selection grid sizes to content; scrolls only if 52 weeks exceed 60vh

---

### TemplateManager
**File**: `src/lib/components/TemplateManager.svelte`

**Height Configuration**:
```
Content: max-h-[60vh] overflow-y-auto
```

**Result**: Template list adjusts to show available templates; scrolls when needed

---

### ICalManager
**File**: `src/lib/components/ICalManager.svelte`

**Height Configuration**:
```
Content: max-h-[60vh] overflow-y-auto
```

**Result**: Subscription list sizes to content; scrolls when subscriptions exceed space

## Benefits

### User Experience
- **Perfect Sizing**: Modal size matches content, no wasted space
- **Natural Appearance**: No arbitrary padding or oversizing
- **Efficient Space Use**: Maximizes visibility of modal content
- **Smooth Scrolling**: Only appears when truly needed
- **Predictable**: Consistent behavior across all modals

### Developer Experience
- **Simple Implementation**: Single CSS pattern for all modals
- **Easy to Apply**: Just add `max-h-[60vh] overflow-y-auto` to content
- **Maintainable**: Clear structure and predictable behavior
- **Extensible**: Works with any content size

## Implementation Pattern

### Step 1: Container Setup
```svelte
<div class="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
    <div class="bg-card rounded-2xl md:rounded-lg shadow-lg w-full transition-all flex flex-col md:max-w-md">
        <!-- Header, Content, Footer -->
    </div>
</div>
```

### Step 2: Content Area
```svelte
<!-- Content -->
<div class="p-6 max-h-[60vh] overflow-y-auto">
    <!-- Content adjusts to fit -->
    <!-- Scrolls only when height exceeds 60vh -->
</div>
```

### Step 3: Fixed Sections
```svelte
<!-- Header (fixed at top) -->
<div class="border-b border-border ...">
    <!-- Header content -->
</div>

<!-- Content (auto-sized) -->
<div class="p-6 max-h-[60vh] overflow-y-auto">
    <!-- Adjustable content -->
</div>

<!-- Footer (fixed at bottom, if needed) -->
<div class="border-t border-border ...">
    <!-- Footer content -->
</div>
```

## CSS Tailwind Classes Reference

| Class | Purpose |
|-------|---------|
| `max-h-[60vh]` | Maximum height 60% viewport |
| `overflow-y-auto` | Scroll vertically when needed |
| `flex flex-col` | Flexbox column layout |
| `w-full` | Full width (mobile) |
| `md:max-w-md` | Max width 28rem (desktop) |
| `p-6` | Padding inside content |
| `items-end` | Align bottom (mobile) |
| `md:items-center` | Center align (desktop) |

## Scrolling Behavior

### When Does Content Scroll?

**Content scrolls when**:
- Content height > 60vh (viewport height)
- Specifically in `max-h-[60vh] overflow-y-auto` elements
- User scrolls with mouse wheel, touch, or keyboard

**Content doesn't scroll when**:
- Content height < 60vh
- Headers and footers (fixed sections)
- Using `overflow-hidden` alternative

### Scroll Performance
- **Native scrolling**: Uses browser's optimized scroll
- **Hardware accelerated**: Smooth 60fps scrolling
- **Touch optimized**: Works well on mobile
- **Keyboard support**: Arrow keys, Page Up/Down

## Max-Height Ratios

The **60vh** maximum height is chosen because:
- Leaves ~25-30% viewport for top/bottom UI elements
- Maintains vertical centering on desktop
- Fits well on mobile phones (leaves room for system UI)
- Balances content visibility with screen real estate

### Alternative Heights
- **50vh**: More conservative, leaves more surrounding space
- **70vh**: Maximizes content, less surrounding space
- **80vh**: Very large modals, less safe margin
- **full/100vh**: Takes entire screen (not recommended)

## Testing Checklist

- [ ] **Small Screens**: Modal fits and looks good
- [ ] **Mobile Portrait**: Content sizes appropriately
- [ ] **Mobile Landscape**: Respects smaller height
- [ ] **Tablet**: Intermediate sizing works
- [ ] **Desktop**: Centered and sized well
- [ ] **Large Desktop**: Still looks balanced
- [ ] **Content Fits**: No scroll when content < 60vh
- [ ] **Content Overflows**: Scrolls when content > 60vh
- [ ] **Header/Footer**: Remain fixed during scroll
- [ ] **Touch Scrolling**: Works smoothly on touch
- [ ] **Keyboard**: Content navigable with keyboard
- [ ] **Focus**: Focus visible during scroll
- [ ] **Empty State**: Shows when no content
- [ ] **Max Content**: Scrolls smoothly with lots of items

## Edge Cases

### Very Small Screens (< 320px)
- Modal still takes reasonable width
- Content area still respects max-h-[60vh]
- Header/footer remain visible
- Scrolling works properly

### Very Large Screens (> 2560px)
- Modal respects max-w-md (448px)
- Content max-height is 60vh (not fixed px)
- Centered vertically and horizontally
- Never stretches beyond constraints

### Long Content Lists
- Content area scrolls smoothly
- Header/footer remain fixed and visible
- User can see all items via scrolling
- Scroll bar appears when needed

### Short Content
- Modal shrinks to fit content
- No unnecessary vertical space
- Header and footer stack naturally
- Clean, compact appearance

### Mixed Content
- Some modals with short content (no scroll)
- Some modals with long content (scrolls)
- Consistent experience across both
- Predictable behavior

## Browser Support

- ✓ Chrome/Chromium (latest)
- ✓ Firefox (latest)
- ✓ Safari (latest)
- ✓ Edge (latest)
- ✓ Mobile browsers (iOS Safari, Chrome Mobile)
- ✓ Older browsers (graceful degradation)

## Performance Notes

- **No Performance Impact**: Uses native CSS
- **Optimized Scrolling**: Hardware accelerated
- **Minimal Repaints**: Efficient layout calculations
- **Touch Optimized**: Works well on all devices
- **Memory Efficient**: No JavaScript overhead

## Customization Guide

### Adjust Max Height
```
// Shorter max height (more conservative)
max-h-[50vh]   // 50% viewport

// Taller max height (more content visible)
max-h-[70vh]   // 70% viewport
max-h-screen   // Full viewport
```

### Adjust Max Width
```
// Narrower modal
md:max-w-sm    // 24rem

// Wider modal
md:max-w-lg    // 32rem
md:max-w-xl    // 36rem
```

### Adjust Padding
```
// More compact
p-4            // Smaller padding

// More spacious
p-8            // Larger padding
```

## Migration from Old Pattern

### Before (Fixed Max Heights)
```svelte
<div class="max-h-96 overflow-y-auto">
    <!-- Content -->
</div>

<!-- or -->

<div class="max-h-80 overflow-y-auto">
    <!-- Content -->
</div>
```

### After (Viewport-Based Max Height)
```svelte
<div class="max-h-[60vh] overflow-y-auto">
    <!-- Content adjusts intelligently -->
</div>
```

## Accessibility

### Keyboard Navigation
- Tab through focusable elements
- Scroll content with arrow keys, Page Up/Down
- Escape closes modal (parent responsibility)
- Full keyboard support

### Screen Readers
- Modal announced as dialog
- Scroll regions properly marked
- Header/footer not repeated during scroll
- All content accessible via keyboard

### Touch
- Scrolling works intuitively
- Adequate touch target sizes (≥ 44×44 px)
- No "scroll trapping" or unexpected behavior
- Smooth momentum scrolling on iOS

### Focus Management
- Focus ring visible on keyboard navigation
- Focus trap within modal (optional)
- Focus restored when modal closes
- Proper focus order maintained

## Related Documentation

- `MODAL_HEADER_DESIGN.md` - Header layout and icons
- `MODAL_ICON_REFERENCE.md` - Icon specifications
- `MODAL_REDESIGN_SUMMARY.md` - Implementation overview

## Summary

The auto-height modal design provides:

✨ **Perfect Sizing**: Modals adjust to content without wasted space  
✨ **Smart Scrolling**: Only appears when content exceeds 60vh  
✨ **Responsive**: Works great on mobile, tablet, and desktop  
✨ **Simple**: Single CSS pattern for all modals  
✨ **Maintainable**: Easy to implement and customize  

All modals now automatically optimize their height for the content they contain, providing a polished, professional user experience across all devices.

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Implemented and Active