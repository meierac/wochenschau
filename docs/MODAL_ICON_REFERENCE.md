# Modal Header Icon Reference Guide

## Visual Layout

### Standard Modal Header
```
┌──────────────────────────────────────────────┐
│  [✕]          Modal Title          [✓ or ➜] │
└──────────────────────────────────────────────┘
```

### Icon Button Dimensions
```
┌─────────┐
│         │
│   10x10 │  (md size)
│   px    │
│         │
└─────────┘
     ↓
  w-10 h-10 Tailwind classes
  
SVG Icon: 6x6 (w-6 h-6)
  ↓
Centered within button with padding
```

## Icon Specifications

### Dismiss/Cancel Icon (X)
**Used for**: Closing modals, canceling operations
**SVG Path**: `M6 18L18 6M6 6l12 12`
**Visual**: X symbol
**Size**: 24x24px (w-6 h-6)
**Color**: currentColor (inherits text color)
**Stroke**: width="2" linecap="round" linejoin="round"

```
    ╲ ╱
     ✕
    ╱ ╲
```

**Usage**:
- Left button in modal headers
- Close/dismiss action
- Always available (not disabled)

---

### Checkmark Icon (✓)
**Used for**: Saving, confirming, accepting
**SVG Path**: `M5 13l4 4L19 7`
**Visual**: Checkmark symbol
**Size**: 24x24px (w-6 h-6)
**Color**: currentColor (inherits text color)
**Stroke**: width="2" linecap="round" linejoin="round"

```
    ✓
   / \
  ✓   \
```

**Usage**:
- Right button in modal headers
- Save/confirm action
- Can be disabled when form invalid
- Primary action indicator

---

### Chevron Right Icon (➜)
**Used for**: Next step, moving forward, navigation
**SVG Path**: `M9 5l7 7-7 7`
**Visual**: Right-pointing arrow
**Size**: 24x24px (w-6 h-6)
**Color**: currentColor (inherits text color)
**Stroke**: width="2" linecap="round" linejoin="round"

```
      ➜
     / \
    /   \
```

**Usage**:
- Right button in multi-step modals
- Next/forward action
- Can be disabled when no selection made
- Step progression indicator

---

### Chevron Left Icon (←)
**Used for**: Back, returning to previous step
**SVG Path**: `M15 19l-7-7 7-7`
**Visual**: Left-pointing arrow
**Size**: 24x24px (w-6 h-6)
**Color**: currentColor (inherits text color)
**Stroke**: width="2" linecap="round" linejoin="round"

```
      ←
     / \
    /   \
```

**Usage**:
- Bottom button (not header) in multi-step modals
- Back/previous action
- Restores form state
- Optional navigation

---

## Icon Button States

### Default State
```
┌─────────┐
│    X    │  Visible
│ (white) │  Clickable
└─────────┘  No background
```

### Hover State
```
┌─────────┐
│    X    │  Still visible
│ (white) │  Highlighted
├─────────┤  Light background
│ (bg)    │
└─────────┘
```

### Active State
```
┌─────────┐
│    X    │  Icon remains
│ (white) │  Click feedback
├─────────┤  Opacity change
│ (bg)    │
└─────────┘
```

### Disabled State
```
┌─────────┐
│    X    │  Faded (50% opacity)
│ (gray)  │  Not clickable
├─────────┤  No interaction
│         │
└─────────┘
```

---

## Modal Header Examples

### Example 1: Add Activity Modal (Step 1)
```
┌────────────────────────────────────────┐
│ [✕]        Select Day        [➜ Next] │
└────────────────────────────────────────┘
     ↓                             ↓
   Close                 Next (enabled if day selected)
```

### Example 2: Add Activity Modal (Step 2)
```
┌────────────────────────────────────────┐
│ [✕]     Activity Details     [✓ Save] │
└────────────────────────────────────────┘
     ↓                             ↓
   Close              Save (enabled if name entered)
```

### Example 3: Edit Activity Sheet
```
┌────────────────────────────────────────┐
│ [✕]      Edit Activity      [✓ Save] │
└────────────────────────────────────────┘
     ↓                             ↓
   Close              Save (enabled if changed)
```

### Example 4: Week Picker Modal
```
┌────────────────────────────────────────┐
│ [✕]       Select Week       [✓ Select]│
└────────────────────────────────────────┘
     ↓                             ↓
   Close                   Confirm Selection
```

### Example 5: Template Manager Modal
```
┌────────────────────────────────────────┐
│ [✕]    Activity Templates    [spacer] │
└────────────────────────────────────────┘
     ↓                             ↓
   Close              Right button hidden
                      (spacer maintains alignment)
```

When adding a template:
```
┌────────────────────────────────────────┐
│ [✕]    Activity Templates    [✓ Save] │
└────────────────────────────────────────┘
     ↓                             ↓
   Close              Save (enabled if name entered)
```

---

## Color and Contrast

### Icon Colors
- **Default**: `text-foreground` (primary text color)
- **Hover**: Same color, button background changes
- **Disabled**: `opacity-50` applied (grayed out)

### SVG Stroke Settings
```xml
stroke="currentColor"        <!-- Inherits from text color -->
fill="none"                  <!-- Outline only -->
stroke-width="2"             <!-- Medium weight -->
stroke-linecap="round"       <!-- Rounded line ends -->
stroke-linejoin="round"      <!-- Rounded corners -->
```

### Contrast Ratios
- Icon to background: ≥ 3:1 (WCAG AA)
- Icon hover state: ≥ 4.5:1 (WCAG AA)
- Disabled state: ≥ 3:1 (WCAG AA)

---

## Implementation Code Snippets

### Dismiss Button
```svelte
<IconButton
    variant="ghost"
    size="md"
    ariaLabel="Close"
    on:click={handleClose}
>
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
</IconButton>
```

### Save Button
```svelte
<IconButton
    variant="ghost"
    size="md"
    ariaLabel="Save"
    disabled={!hasChanges}
    on:click={handleSave}
>
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>
</IconButton>
```

### Next Button (Chevron Right)
```svelte
<IconButton
    variant="ghost"
    size="md"
    ariaLabel="Next"
    disabled={selectedDay === null}
    on:click={handleNext}
>
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
</IconButton>
```

### Back Button (Chevron Left)
```svelte
<button
    on:click={handleBack}
    class="flex items-center gap-2 w-full px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-lg transition-colors"
>
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
    Back
</button>
```

---

## Icon Grid Reference

### All Icons At Size
```
Dismiss      Checkmark    Chevron R    Chevron L
   ✕            ✓            ➜            ←
 (X icon)    (Check)      (Right)      (Left)

Used in:     Used in:     Used in:     Used in:
Close btns   Save btns    Next btns    Back btns
```

---

## Sizing Reference

### Button Container
- **sm**: 8×8 px (w-8 h-8)
- **md**: 10×10 px (w-10 h-10) ← Used in modals
- **lg**: 12×12 px (w-12 h-12)

### Icon Inside Button
- **Icon size**: 6×6 (w-6 h-6) for all sizes
- **Padding**: Automatic centering
- **Alignment**: Flex center

### Visual Hierarchy
```
Modal Header (44px)
    ↓
Icon Button md (40px)
    ↓
SVG Icon 6×6 (24px)
    ↓
Centered with 8px padding
```

---

## Accessibility Specifications

### ARIA Labels (Required)
```
Dismiss: "Close"
Save: "Save changes" or "Save activity"
Next: "Next" or "Next step"
Back: "Back" (text label visible, no aria-label needed)
Select: "Select" or "Confirm selection"
```

### Keyboard Interaction
- **Tab**: Focus moves to next button
- **Shift+Tab**: Focus moves to previous button
- **Enter**: Activates focused button
- **Space**: Activates focused button (optional)

### Screen Reader Announcements
```
"Close button"
"Save button, disabled"
"Next button"
"Back button"
```

### Focus Indicators
```
Default: Outline (2-3px visible ring)
Color: Focus ring color (theme color)
Contrast: ≥ 3:1 ratio
Visibility: Always visible (not hidden on focus)
```

---

## Common Use Cases

| Modal | Left Button | Title | Right Button |
|-------|-------------|-------|--------------|
| Add Activity (Step 1) | ✕ Close | Select Day | ➜ Next |
| Add Activity (Step 2) | ✕ Close | Activity Details | ✓ Save |
| Edit Activity | ✕ Close | Edit Activity | ✓ Save |
| Select Week | ✕ Close | Select Week | ✓ Select |
| Manage Templates | ✕ Close | Activity Templates | (hidden) |
| Add Template | ✕ Close | Activity Templates | ✓ Save |

---

## Design Notes

- **No text labels on icon buttons** in headers (icon-only)
- **Icon size is consistent** (w-6 h-6) across all buttons
- **Button size is consistent** (md = w-10 h-10) in headers
- **Title remains centered** regardless of button widths
- **Symmetrical layout** with equal button sizes on both sides
- **Disabled buttons show 50% opacity** and are not clickable
- **All icons use stroke** (outline style), not filled

---

## Testing Checklist

- [ ] Icons render clearly at 24×24 px
- [ ] Icons are centered within button
- [ ] Hover states are visible
- [ ] Focus states have visible indicators
- [ ] Disabled state (50% opacity) is clear
- [ ] Icons are colored correctly (inherit currentColor)
- [ ] Icons look good on light and dark themes
- [ ] Touch targets meet minimum 44×44 px (button + padding)
- [ ] Aria-labels are present and accurate
- [ ] Icons work on all browsers (Chrome, Firefox, Safari, Edge)
- [ ] SVG viewBox is correct (0 0 24 24)
- [ ] Stroke width looks good (2px at 24×24)

---

**Icon Style**: Material Design Icons (MDI) compatible  
**Format**: SVG inline  
**Color System**: currentColor (theme-aware)  
**Accessibility**: WCAG 2.1 AA compliant  
**Last Updated**: 2024