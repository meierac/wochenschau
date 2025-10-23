# Activity Card Visual Guide

## Swipe Gesture Animation Sequence

### State 1: Initial (Neutral)
```
┌──────────────────────────────────────────────┐
│                                              │
│ Meeting                           [✎] [✕]   │
│ 09:00 - 10:00                               │
│ 1h 0m                                        │
│                                              │
└──────────────────────────────────────────────┘
```

### State 2: Left Swipe at 20px (Partial Reveal)
```
┌──────────────────────────────────────────────┐
│                                              │
│ Meeting                    [✎]               │
│ 09:00 - 10:00         ┌──────┐              │
│ 1h 0m                 │ Edit │              │
│                       └──────┘              │
│                                              │
└──────────────────────────────────────────────┘
(Blue action button starting to reveal on right)
```

### State 3: Left Swipe at 60px (Full Reveal)
```
┌──────────────────────────────────────────────┐
│                                              │
│ Meeting          ┌──────────────────────┐   │
│ 09:00 - 10:00    │      Edit            │   │
│ 1h 0m            └──────────────────────┘   │
│                                              │
└──────────────────────────────────────────────┘
(Full blue Edit button visible)
```

### State 4: Right Swipe at 20px (Partial Reveal)
```
┌──────────────────────────────────────────────┐
│                                              │
│               ┌──────┐                       │
│               │Delete│ Meeting        [✎]   │
│               └──────┘ 09:00 - 10:00        │
│                       1h 0m                  │
│                                              │
└──────────────────────────────────────────────┘
(Red action button starting to reveal on left)
```

### State 5: Right Swipe at 60px (Full Reveal)
```
┌──────────────────────────────────────────────┐
│                                              │
│ ┌──────────────────────┐                    │
│ │     Delete           │ Meeting            │
│ └──────────────────────┘ 09:00 - 10:00      │
│                        1h 0m                 │
│                                              │
└──────────────────────────────────────────────┘
(Full red Delete button visible)
```

## Action Button Colors

### Edit Button (Left Swipe)
- **Color**: Primary Blue (`#0ea5e9`)
- **Opacity**: 90% (`rgb(14, 165, 233, 0.9)`)
- **Text**: White, Semibold
- **Width**: 96px (w-24)
- **Height**: Full card height
- **Position**: Right side (hidden until swipe)

### Delete Button (Right Swipe)
- **Color**: Destructive Red (`#ef4444`)
- **Opacity**: 90% (`rgb(239, 68, 68, 0.9)`)
- **Text**: White, Semibold
- **Width**: 96px (w-24)
- **Height**: Full card height
- **Position**: Left side (hidden until swipe)

## Layer Structure

### Behind Layers (Action Buttons)
```
Layer 1 (Bottom): DELETE Button (Red)
                  Position: absolute left-0
                  Always visible behind card

Layer 2 (Bottom): EDIT Button (Blue)
                  Position: absolute right-0
                  Always visible behind card
```

### Front Layer (Main Card)
```
Layer 3 (Top): Main Activity Card
               - Title, Time, Duration
               - Edit/Delete tap buttons
               - Semi-transparent background
               - Slides on top of action buttons
               - Can be dragged left/right
```

### How It Works
1. **No swipe**: Main card covers all action buttons
2. **Left swipe**: Card moves left, reveals blue Edit button
3. **Right swipe**: Card moves right, reveals red Delete button
4. **Release**: Card snaps back to center

## Interaction Zones

### Horizontal Swipe Zones
```
←─ LEFT SWIPE ─┤ CENTER ├─ RIGHT SWIPE ─→

40px-100px     |neutral|     40px-100px
Left edge ←    |neutral|    → Right edge
(Triggers Edit)(No action)(Triggers Delete)
```

### Threshold Behavior
- **0-39px swipe**: Card returns to neutral, no action
- **40px+ left swipe**: Edit sheet opens
- **40px+ right swipe**: Delete confirmation shown
- **100px max offset**: Maximum reveal (action button fully visible)

## Animation Timing

### During Drag
```
Finger movement:  ─────────────→
Card position:    ─────────────→ (exact match)
Latency:          0ms (real-time)
Easing:           None (linear follow)
```

### After Release
```
Starting position: Current swipe position
Ending position:   Center (0px offset)
Duration:          300ms
Easing:            ease (slow start/end)
Function:          cubic-bezier(0.4, 0, 0.2, 1)
```

## Touch Detection Logic

### Swipe vs Scroll Detection
```
Movement detected:
├─ If |ΔX| > |ΔY| AND |ΔX| > 5px
│  └─ Recognize as HORIZONTAL SWIPE
│     └─ Apply swipe offset
│     └─ Prevent vertical scroll
│
└─ If |ΔY| > |ΔX|
   └─ Recognize as VERTICAL SCROLL
      └─ Reset swipe
      └─ Allow normal scrolling
```

### Gesture Recognition
```
Drag Right (positive ΔX):
├─ Track movement
├─ Update card position: min(ΔX, 100px)
├─ On release ≥40px: DELETE
└─ On release <40px: SNAP BACK

Drag Left (negative ΔX):
├─ Track movement
├─ Update card position: max(ΔX, -100px)
├─ On release ≤-40px: EDIT
└─ On release >-40px: SNAP BACK
```

## Visual Feedback Elements

### Swipe Feedback
- ✓ Card follows finger in real-time
- ✓ Action button gradually reveals
- ✓ Text "Edit" or "Delete" becomes visible
- ✓ Color intensity increases with reveal

### No-Action Swipe (< 40px)
```
Before release: Card at 30px left
                ┌──────────────────────┐
                │ Meeting              │
                └──────────────────────┘
                (Partial Edit button visible)

After release:  Card snaps back to center
                ┌──────────────────────┐
                │ Meeting   [✎] [✕]    │
                └──────────────────────┘
                (Smooth animation: 300ms)
```

### Action Swipe (≥ 40px)
```
Before release: Card at 60px left
                ┌──────────────────────┐
                │ Meeting              │
                └──────────────────────┘
                (Full Edit button visible)

After release:  Action triggers immediately
                Edit sheet opens
                (No snap-back animation)
```

## Button Styling Comparison

### Old Design
```
Buttons: [✎] [✕]
Size: px-1 py-0.5 (very small)
Gap: gap-1 (close together)
Visibility: Only on hover/tap
Response: Immediate action
```

### New Design
```
Left Swipe ────────────────────→
           ┌──────────────────────┐
Reveal:    │  Card slides left   │
           │  [●●●●●●●●●●●●●●●●]│ ← Blue Edit button
           │     Edit            │
           │  [●●●●●●●●●●●●●●●●]│
           └──────────────────────┘

Right Swipe ←──────────────────
           ┌──────────────────────┐
Reveal:    │  Card slides right  │
           │[●●●●●●●●●●●●●●●●]  │ ← Red Delete button
           │     Delete          │
           │[●●●●●●●●●●●●●●●●]  │
           └──────────────────────┘
```

## Hidden Description Implementation

### Card Display (No Description)
```
┌──────────────────────────────────────┐
│ Meeting                    [✎] [✕]   │
│ 09:00 - 10:00                        │
│ 1h 0m                                │
└──────────────────────────────────────┘

Description removed from card view
Cleaner, more compact appearance
```

### Description Access
- Open edit sheet to view/edit description
- Description shown in modal form
- Can be added or modified there
- Not displayed in compact card view

## Accessibility States

### Normal State
```
┌──────────────────────────────────────┐
│ Meeting                    [✎] [✕]   │
│ 09:00 - 10:00                        │
│ 1h 0m                                │
└──────────────────────────────────────┘
Focus indicators: Visible on buttons
Tooltip: "Edit activity" / "Delete activity"
```

### Hover State (Desktop)
```
┌──────────────────────────────────────┐
│ Meeting                   [✎*] [✕*]  │
│ 09:00 - 10:00   (* = light background)
│ 1h 0m                                │
└──────────────────────────────────────┘
```

### Active State (Click/Tap)
```
┌──────────────────────────────────────┐
│ Meeting                   [✎**] [✕**]│
│ 09:00 - 10:00  (** = darker background)
│ 1h 0m                                │
└──────────────────────────────────────┘
```

## Responsive Sizing

### Mobile (< 768px)
```
Card Width: Full width
Icon Size: text-base (16px)
Padding: p-3 (12px)
Gap: gap-2 (8px)
Action Button Width: 96px (w-24)
```

### Tablet (768px+)
```
Card Width: Column width (3 columns)
Icon Size: text-lg (18px on buttons)
Padding: p-3 (12px)
Gap: gap-2 (8px)
Action Button Width: 96px (w-24)
```

### Desktop (≥1024px)
```
Card Width: Column width (7 columns)
Icon Size: text-lg (18px on buttons)
Padding: p-3 (12px)
Gap: gap-2 (8px)
Action Button Width: 96px (w-24)
Interaction: Click preferred, swipe disabled
```

## Browser Rendering

### GPU Acceleration
```
CSS Transform: translateX() ← GPU accelerated
               (Smooth 60fps animation)

NOT using: left, right, position changes
           (Would cause layout recalculation)
```

## Before/After Comparison

### Before Implementation
- Small buttons (hard to tap)
- Inline editing
- Description always visible
- No gesture support
- Desktop-centric design

### After Implementation
- Large, easy-to-tap buttons
- Modal-based editing
- Description hidden (cleaner cards)
- iOS-style swipe gestures
- Mobile-optimized design
- Smooth, polished animations
- Professional appearance

## Summary Table

| Aspect | Mobile | Tablet | Desktop |
|--------|--------|--------|---------|
| Swipe Support | ✓ Full | ✓ Full | ✗ No |
| Button Size | Large | Large | Large |
| Tap Buttons | ✓ Yes | ✓ Yes | ✓ Yes |
| Action Reveal | Left/Right | Left/Right | Hover |
| Description | Hidden | Hidden | Hidden |
| Animation | Smooth | Smooth | Instant |
| Touch Target | 44px+ | 44px+ | Cursor |
| Text: "Edit" | In reveal | In reveal | On hover |
| Text: "Delete" | In reveal | In reveal | On hover |