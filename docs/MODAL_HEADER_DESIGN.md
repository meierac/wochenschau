# Modal Header Design Guide

## Overview
All modals and sheets in the Wochenschau application now use a unified, modern header design with centered titles and icon buttons for actions. This guide documents the new design pattern and implementation.

## Design Principles

### Layout
- **Left**: Cancel/Dismiss icon button
- **Center**: Title text (centered)
- **Right**: Primary action icon button (Save/Next)

### Icon Usage
- **Cancel/Dismiss**: X icon (dismiss icon)
- **Back**: Chevron left icon
- **Next**: Chevron right icon
- **Save**: Checkmark icon

### Benefits
✅ **Consistent UX**: Same header design across all modals  
✅ **Clean Interface**: No text labels, icon-only for compact design  
✅ **Better Visual Hierarchy**: Centered title with symmetrical actions  
✅ **Accessible**: Icon buttons with proper aria-labels  
✅ **Responsive**: Works well on mobile and desktop
✅ **Modern**: Minimalist, contemporary interface pattern

## Header Structure

```
┌─────────────────────────────────────────┐
│  [X]    Centered Title    [✓ or ➜]     │
└─────────────────────────────────────────┘
```

### CSS Classes
- Container: `border-b border-border px-4 py-4 flex items-center justify-between`
- Left Button: `IconButton` with `variant="ghost"` and `size="md"`
- Title: `text-lg font-semibold text-foreground flex-1 text-center`
- Right Button: `IconButton` with `variant="ghost"` and `size="md"`

## IconButton Component

### Location
`src/lib/components/IconButton.svelte`

### Props
```typescript
export let variant: 'default' | 'secondary' | 'ghost' = 'ghost';
export let size: 'sm' | 'md' | 'lg' = 'md';
export let disabled = false;
export let ariaLabel = '';
export let class = '';
```

### Usage
```svelte
<IconButton
    variant="ghost"
    size="md"
    ariaLabel="Close modal"
    on:click={handleClose}
>
    <svg class="w-6 h-6" ...>
        <!-- Icon SVG -->
    </svg>
</IconButton>
```

### Sizes
- **sm**: 8x8 (w-8 h-8)
- **md**: 10x10 (w-10 h-10)
- **lg**: 12x12 (w-12 h-12)

### Variants
- **default**: Primary styling (bg-primary)
- **secondary**: Secondary styling (bg-secondary)
- **ghost**: Transparent with hover effect (recommended for modals)

## Icons Used

### Dismiss/Cancel Icon
```
M6 18L18 6M6 6l12 12
```
Visual: X icon for closing/canceling

### Checkmark Icon
```
M5 13l4 4L19 7
```
Visual: Checkmark for saving/confirming

### Chevron Right Icon
```
M9 5l7 7-7 7
```
Visual: Right arrow for next/forward

### Chevron Left Icon
```
M15 19l-7-7 7-7
```
Visual: Left arrow for back/previous

## Implemented Modals

### 1. AddActivityModal
**Location**: `src/lib/components/AddActivityModal.svelte`

**Header Actions**:
- **Left**: Dismiss (X) - closes modal
- **Right**: Next (➜) on day selection, Save (✓) on activity details
- **Title**: "Select Day" or "Activity Details" (changes with step)

**Step-Based Behavior**:
- Step 1 (Select Day): Shows chevron right icon, disabled if no day selected
- Step 2 (Activity Details): Shows checkmark icon, disabled if name is empty
- Back button appears at bottom during step 2

### 2. ActivityEditSheet
**Location**: `src/lib/components/ActivityEditSheet.svelte`

**Header Actions**:
- **Left**: Dismiss (X) - closes without saving
- **Right**: Save (✓) - saves changes
- **Title**: "Edit Activity"

**Additional Elements**:
- Save button disabled if no changes made
- Delete Activity button moved to bottom

### 3. WeekPicker
**Location**: `src/lib/components/WeekPicker.svelte`

**Header Actions**:
- **Left**: Dismiss (X) - closes without selecting
- **Right**: Save (✓) - confirms selection
- **Title**: "Select Week"

### 4. TemplateManager
**Location**: `src/lib/components/TemplateManager.svelte`

**Header Actions**:
- **Left**: Dismiss (X) - closes manager
- **Right**: Save (✓) - saves new template (only shown when adding)
- **Title**: "Activity Templates"

**Behavior**:
- Right button only visible when adding a new template
- Empty spacer (w-10 h-10) shown otherwise to maintain layout

## Implementation Pattern

### Basic Structure
```svelte
<!-- Header -->
<div class="border-b border-border px-4 py-4 flex items-center justify-between">
    <!-- Cancel Button (left) -->
    <IconButton
        variant="ghost"
        size="md"
        ariaLabel="Close"
        on:click={handleClose}
    >
        <svg class="w-6 h-6" ...>
            <!-- X icon -->
        </svg>
    </IconButton>

    <!-- Title (center) -->
    <h3 class="text-lg font-semibold text-foreground flex-1 text-center">
        Modal Title
    </h3>

    <!-- Primary Action (right) -->
    <IconButton
        variant="ghost"
        size="md"
        ariaLabel="Save"
        disabled={!isValid}
        on:click={handleSave}
    >
        <svg class="w-6 h-6" ...>
            <!-- Checkmark icon -->
        </svg>
    </IconButton>
</div>
```

## Accessibility

### Icon Buttons
- **aria-label**: Describes the button's purpose
- **disabled**: Properly disables button when action not available
- **keyboard**: Full keyboard navigation support
- **focus**: Visible focus indicators

### Screen Readers
- Icon buttons announce their purpose via aria-label
- Disabled state is announced
- Modal titles identify the modal's purpose

### Keyboard Support
- Tab: Navigate between buttons
- Enter: Activate focused button
- Escape: Can close modal (handled by parent)

## Responsive Behavior

### Mobile
- Header remains same height (py-4)
- Padding adjusted (px-4 instead of px-6)
- Touch-friendly button size (md = 10x10 px)

### Desktop
- Same header layout
- No changes to spacing or sizing
- Consistent across breakpoints

## CSS Icon Sizing

All icons use `w-6 h-6` for consistent 24x24 pixel SVG size, which looks good within the 10x10 (md) button size with padding.

### Stroke Properties
- `stroke="currentColor"`: Inherits text color
- `stroke-width="2"`: Medium stroke weight
- `stroke-linecap="round"`: Rounded line ends
- `stroke-linejoin="round"`: Rounded line joins
- `fill="none"`: Outline style only

## Testing Checklist

- [ ] Icon buttons are clickable and functional
- [ ] aria-labels are present and accurate
- [ ] Disabled state works correctly
- [ ] Title text is centered
- [ ] Left and right buttons are symmetrical
- [ ] Icons are visible and clear
- [ ] Hover states work on desktop
- [ ] Touch targets are adequate on mobile (min 44x44 px)
- [ ] Modal closes on dismiss button click
- [ ] Primary action works on right button click
- [ ] Back button appears/disappears appropriately
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Focus indicators are visible
- [ ] Colors have sufficient contrast

## Migration Guide

### Before (Old Pattern)
```svelte
<div class="border-b border-border px-6 py-4 flex items-center justify-between">
    <h3 class="text-lg font-semibold text-foreground">Title</h3>
    <button on:click={handleClose} class="...">✕</button>
</div>

<div class="border-t border-border px-6 py-4 flex gap-2">
    <Button variant="secondary" on:click={handleCancel}>Cancel</Button>
    <Button variant="default" on:click={handleSave}>Save</Button>
</div>
```

### After (New Pattern)
```svelte
<div class="border-b border-border px-4 py-4 flex items-center justify-between">
    <IconButton variant="ghost" size="md" ariaLabel="Close" on:click={handleClose}>
        <!-- X icon -->
    </IconButton>
    <h3 class="text-lg font-semibold text-foreground flex-1 text-center">Title</h3>
    <IconButton variant="ghost" size="md" ariaLabel="Save" on:click={handleSave}>
        <!-- Checkmark icon -->
    </IconButton>
</div>
```

## Benefits of New Design

### User Experience
- Cleaner, more modern appearance
- Reduced visual clutter
- Faster action recognition through icons
- Better use of screen space

### Developer Experience
- Consistent pattern across all modals
- Easier to implement new modals
- Reusable IconButton component
- Less code duplication

### Accessibility
- Semantic HTML (button elements)
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly

### Responsive Design
- Same design works on all screen sizes
- Touch-friendly on mobile
- No layout shift between breakpoints
- Consistent visual hierarchy

## Future Enhancements

- [ ] Add tooltip hints for icons
- [ ] Support custom icon colors
- [ ] Add animation on button press
- [ ] Support icon loading states
- [ ] Add ripple effect on click
- [ ] Theme customization for icon colors
- [ ] Support more icon variants
- [ ] Add badge support for icon buttons

## Related Components

- **IconButton.svelte**: Icon button component
- **Button.svelte**: Text button (for other contexts)
- **AddActivityModal.svelte**: Modal using new header
- **ActivityEditSheet.svelte**: Sheet using new header
- **WeekPicker.svelte**: Modal using new header
- **TemplateManager.svelte**: Modal using new header

## Support & Feedback

For questions or suggestions about the modal header design:
1. Review this guide
2. Check component implementations
3. Test in different contexts
4. Provide feedback for improvements

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Implemented and Active