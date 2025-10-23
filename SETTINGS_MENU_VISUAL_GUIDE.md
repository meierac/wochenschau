# Settings Menu-Based Design - Visual Guide

## Overview

The Settings interface uses a menu-based navigation pattern that adapts to different screen sizes:
- **Mobile**: List navigation with layer-based details
- **Desktop**: Fixed header on top with two-column layout below (menu left, details right)

## Mobile View

### Settings Menu List (Home View)

```
┌─────────────────────────────┐
│        Settings         [✕]  │
├─────────────────────────────┤
│                             │
│ ┌──────────────────────┐    │
│ │ ⭐ Activity         │    │
│ │    Templates        │ →  │
│ │ 3 templates        │    │
│ └──────────────────────┘    │
│                             │
│ ┌──────────────────────┐    │
│ │ 🔗 Calendar         │    │
│ │    Subscriptions     │ →  │
│ │ 2 subscriptions    │    │
│ └──────────────────────┘    │
│                             │
└─────────────────────────────┘
```

**Features:**
- Settings title in header
- Close button (✕) in top right
- List of all available settings
- Each item shows icon, label, and count
- Arrow indicator (→) showing it's clickable

### Mobile: Activity Templates Details

```
┌─────────────────────────────┐
│ ← Back          Settings    │
├─────────────────────────────┤
│                             │
│ ⭐ Morning Meeting          │
│ 09:00 - 10:00      [Delete] │
│                             │
│ ⭐ Lunch Break              │
│ 12:00 - 13:00      [Delete] │
│                             │
│ ⭐ Team Standup             │
│ 15:00 - 15:30      [Delete] │
│                             │
│ [+ New Template]            │
│                             │
└─────────────────────────────┘
```

**Navigation:**
- "Back" button returns to menu
- Title remains "Settings" for consistency
- Manage templates directly in this view

### Mobile: Calendar Subscriptions Details

```
┌─────────────────────────────┐
│ ← Back          Settings    │
├─────────────────────────────┤
│                             │
│ 🔗 Company Calendar  [☑]   │
│ https://company.com/cal.ics │
│ Last fetched: Dec 15, 10am  │
│ 24 events                   │
│ [Refresh]  [Delete]        │
│                             │
│ 🔗 Public Holidays   [☑]   │
│ https://holidays.ical       │
│ Last fetched: Dec 15, 9am   │
│ 12 events                   │
│ [Refresh]  [Delete]        │
│                             │
│ [+ Add Subscription]        │
│ [Refresh All]              │
│                             │
└─────────────────────────────┘
```

**Features:**
- Same back navigation
- Toggle checkboxes for enable/disable
- Refresh and delete buttons
- Add and refresh all buttons

## Desktop View

### Desktop Layout Structure

```
┌──────────────────────────────────────────────────────────┐
│  Settings                                             [✕] │
├──────────────────────────────────────────────────────────┤
│                 │                                         │
│  ⭐ Templates   │  Activity Templates                     │
│  3 templates   │                                         │
│                 │  ⭐ Morning Meeting                    │
│  🔗 Calendar    │  09:00 - 10:00            [Delete]     │
│  Subscriptions  │                                         │
│  2 subscriptions│  ⭐ Lunch Break                        │
│                 │  12:00 - 13:00            [Delete]     │
│                 │                                         │
│                 │  ⭐ Team Standup                       │
│                 │  15:00 - 15:30            [Delete]     │
│                 │                                         │
│                 │  [+ New Template]                      │
│                 │                                         │
└──────────────────────────────────────────────────────────┘
```

### Desktop Layout Components

```
HEADER (Full Width, Always on Top)
┌──────────────────────────────────────────┐
│  Settings                             [✕] │
└──────────────────────────────────────────┘

CONTENT AREA (Two Columns)
┌──────────────┬────────────────────────────┐
│              │                            │
│  LEFT MENU   │     RIGHT DETAILS          │
│              │                            │
│  (192px)     │     (Flexible)             │
│              │                            │
│  - Fixed     │     - Scrollable           │
│  - Scrollable│     - Padding              │
│  - Primary   │     - Content varies       │
│    highlight │       per selection       │
│  - bg-muted  │                            │
│              │                            │
└──────────────┴────────────────────────────┘
```

### Desktop: Menu Item States

**Unselected Item:**
```
┌────────────────────────┐
│ ⭐ Activity Templates  │
│ 3 templates           │
└────────────────────────┘
Color: text-foreground
Background: hover:bg-muted
Transition: smooth
```

**Selected Item (Highlighted):**
```
┌────────────────────────┐
│ ⭐ Activity Templates  │ ← Primary color highlight
│ 3 templates           │   bg-primary
└────────────────────────┘   text-primary-foreground
```

### Desktop: Full Templates View

```
HEADER
┌──────────────────────────────────────────────────┐
│  Settings                                    [✕]  │
├──────────────────────────────────────────────────┤

LEFT MENU              │  RIGHT DETAILS
                       │
⭐ Activity Templates  │  Activity Templates
(highlighted)          │
3 templates           │  ⭐ Morning Meeting
                       │  09:00 - 10:00    [Delete]
🔗 Calendar Subs      │
2 subscriptions       │  ⭐ Lunch Break
                       │  12:00 - 13:00    [Delete]
                       │
                       │  ⭐ Team Standup
                       │  15:00 - 15:30    [Delete]
                       │
                       │  [+ New Template]
```

### Desktop: Full iCal View

```
HEADER
┌──────────────────────────────────────────────────┐
│  Settings                                    [✕]  │
├──────────────────────────────────────────────────┤

LEFT MENU              │  RIGHT DETAILS
                       │
⭐ Activity Templates  │  Calendar Subscriptions
3 templates           │
                       │  🔗 Company Calendar  [☑]
🔗 Calendar Subs      │  https://company.com/cal.ics
(highlighted)          │  Last: Dec 15, 10:30 AM
2 subscriptions       │  24 events
                       │  [Refresh]  [Delete]
                       │
                       │  🔗 Public Holidays  [☑]
                       │  https://holidays.ical
                       │  Last: Dec 15, 09:15 AM
                       │  12 events
                       │  [Refresh]  [Delete]
                       │
                       │  [+ Add Subscription]
                       │  [Refresh All]
```

## Navigation Flows

### Mobile Navigation Flow

```
START (Menu List)
    ↓ [Tap Item]
DETAILS VIEW
    ↓ [Back Button]
BACK TO MENU LIST
    ↓ [Close Button]
EXIT SETTINGS
```

### Desktop Navigation Flow

```
START (Templates Details Shown)
    ↓ [Click iCal in Menu]
SHOW iCal DETAILS
    ↓ [Click Templates in Menu]
BACK TO TEMPLATES DETAILS
    ↓ [Close Button]
EXIT SETTINGS
```

## Interaction States

### Button Interactions

**Primary Actions (Add, Save):**
```
Default: bg-primary text-primary-foreground
Hover:   bg-primary/90 (slightly darker)
Active:  opacity-80 (pressed feedback)
Disabled: opacity-50 pointer-events-none
```

**Secondary Actions (Cancel, Back):**
```
Default: text-foreground hover:bg-muted
Hover:   bg-muted (background highlight)
Active:  opacity-80 (pressed feedback)
```

**Destructive Actions (Delete):**
```
Default: text-destructive
Hover:   bg-destructive/10 (light background)
Active:  opacity-80
```

**Toggle/Checkbox:**
```
Unchecked: Empty checkbox
Checked:   ☑ (filled checkbox)
Hover:     Subtle background highlight
```

### Loading States

**During Network Operations:**
```
Button Text Changes:
"Add" → "Adding..."
"Refresh" → "Refreshing..."

Button State:
disabled={isLoading}
opacity-50
pointer-events-none
```

### Error States

**Error Banner:**
```
┌─────────────────────────────────┐
│ ⚠️  Failed to fetch iCal: 404   │
│     Not Found                   │
└─────────────────────────────────┘
Color: bg-destructive/10
       border-destructive/30
       text-destructive
```

## Content Sections

### Templates Section

**Empty State:**
```
┌──────────────────────┐
│   No templates yet   │
│                      │
│ Create one by adding │
│ an activity with     │
│ "Save as template"   │
│                      │
│ [+ New Template]     │
└──────────────────────┘
```

**With Items:**
```
Item Format:
┌──────────────────────┐
│ ⭐ Template Name    │
│ HH:MM - HH:MM [Del] │
└──────────────────────┘

Spacing: space-y-2 (8px gap)
```

**New Template Form:**
```
┌───────────────────────────┐
│ Create New Template       │
├───────────────────────────┤
│ Template name             │
│ [__________________]      │
│                           │
│ [Start Time] [End Time]   │
│ [HH:MM]      [HH:MM]      │
│                           │
│ [Save]       [Cancel]     │
└───────────────────────────┘
```

### iCal Section

**Empty State:**
```
┌────────────────────────┐
│ No iCal subscriptions  │
│ yet                    │
│                        │
│ Add a calendar feed by │
│ entering an iCal URL   │
│                        │
│ [+ Add Subscription]   │
└────────────────────────┘
```

**With Items:**
```
Item Format:
┌──────────────────────────────┐
│ 🔗 Calendar Name      [☑]   │
│ https://calendar.ical        │
│ Last fetched: Date/Time      │
│ 24 events                    │
│ [Refresh]      [Delete]      │
└──────────────────────────────┘

Spacing: space-y-2 (8px gap)
```

**New Subscription Form:**
```
┌───────────────────────────┐
│ Add New Subscription      │
├───────────────────────────┤
│ iCal URL                  │
│ [________________________] │
│                           │
│ Calendar name (optional)  │
│ [________________________] │
│                           │
│ [Add]         [Cancel]    │
└───────────────────────────┘
```

## Responsive Behavior

### Mobile (Below 768px)
- Full-width sheet
- Single column
- Layer-based navigation
- Menu expands to full content area
- Back button when viewing details
- Scrollable content

### Tablet (768px - 1024px)
- Behaves like desktop
- Two column layout
- Left menu (192px)
- Right details (flexible)

### Desktop (1024px+)
- Two column layout
- Left menu always visible
- Right details fill remaining space
- Hover effects on menu items
- Smooth transitions

## Color Scheme

**Theme Colors:**
- Primary: Action buttons, selected items
- Secondary: Secondary actions, borders
- Destructive: Delete/remove actions
- Foreground: Primary text
- Muted-foreground: Secondary text
- Background: Input backgrounds
- Card: Modal background
- Muted: Item backgrounds, hover states
- Border: Dividing lines

**Specific Usage:**
- Selected menu item: bg-primary, text-primary-foreground
- Unselected menu: text-foreground, hover:bg-muted
- Menu background: bg-muted/30
- Item cards: bg-muted border-border
- Error banner: bg-destructive/10 border-destructive/30

## Accessibility Features

### Keyboard Navigation
- Tab: Move between elements
- Enter: Activate buttons/select items
- Space: Toggle checkboxes
- Escape: Close modal (optional)

### Screen Readers
- Semantic HTML elements
- ARIA labels on icon buttons
- Proper heading hierarchy
- Form field labels
- Status announcements for loading/errors

### Touch/Mobile
- Adequate button sizes (44px minimum)
- Clear touch targets
- Visual feedback on interaction
- Readable text sizes

## Animation & Transitions

**Smooth Transitions:**
```
Button hover: transition-colors (150ms)
Menu selection: smooth selection highlight
Form display: fade in/out
Tab change: immediate (no animation)
```

**No Heavy Animations:**
- Keeps performance high
- Mobile-friendly
- Respects prefers-reduced-motion
- Subtle and professional

## Use Cases & Flows

### Adding a New Setting

The system is designed to be extensible. To add a new setting:

1. **Add to Menu:**
```typescript
const settingItems: SettingItem[] = [
  // ... existing items
  {
    id: "newSetting",
    label: "New Setting Name",
    icon: "🆕",
    description: "count or status",
  },
];
```

2. **Add Details View:**
```svelte
{:else if selectedSetting === "newSetting"}
  <!-- Your custom content here -->
{/if}
```

3. **Add Type:**
```typescript
type SettingType = "templates" | "ical" | "newSetting";
```

### Multi-Step Forms

The design supports multi-step forms by toggling visibility:
```svelte
{#if showNewTemplate}
  <!-- Form visible -->
{:else}
  <!-- Button visible -->
{/if}
```

## Summary

- ✅ Mobile-optimized with layer navigation
- ✅ Desktop-efficient with split-view layout
- ✅ Consistent header placement
- ✅ Extensible menu system
- ✅ Clear visual hierarchy
- ✅ Accessible design
- ✅ Smooth interactions
- ✅ Responsive at all breakpoints