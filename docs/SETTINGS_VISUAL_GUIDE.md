# Settings UI Visual Guide

## Overview

The Settings interface provides a unified hub for managing Templates and iCal subscriptions. It replaces the previous scattered "Templates" and "iCal" buttons with a single gear icon.

## Desktop View

```
┌─────────────────────────────────────────────────────────────┐
│  📅 Wochenschau          [+ Add Activity]  [⚙️ Settings]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [MON]      [TUE]      [WED]      [THU]                     │
│  ────       ────       ────       ────                      │
│  Activity   Activity   Activity   Activity                  │
│  ...        ...        ...        ...                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Settings Button (Desktop Header):
┌───────────────────────────────┐
│ ⚙️ Settings                    │
└───────────────────────────────┘
```

### Desktop Settings Modal

```
┌─────────────────────────────────────┐
│  ✕        Settings              □   │
├─────────────────────────────────────┤
│  Templates        iCal              │  ← Tab Navigation
├─────────────────────────────────────┤
│                                     │
│  [⭐ Template Name]                │
│  09:00 - 10:00              Delete  │
│                                     │
│  [⭐ Another Template]             │
│  14:00 - 15:00              Delete  │
│                                     │
│  [+ New Template]                  │
│                                     │
└─────────────────────────────────────┘
```

## Mobile View

### Mobile Header & Navigation

```
┌─────────────────────────────────┐
│  📅 Wochenschau                 │
├─────────────────────────────────┤
│                                 │
│  [MON]  [TUE]  [WED]  [THU]    │
│  ─────  ─────  ─────  ─────    │
│  Act.   Act.   Act.   Act.      │
│  ...    ...    ...    ...       │
│                                 │
│                                 │
├─────────────────────────────────┤
│  📅    +         ⚙️              │  ← Settings Button
│  W12  Activity  Settings         │
└─────────────────────────────────┘
```

### Mobile Settings Sheet (Bottom Sheet)

```
┌─────────────────────────────────┐
│  ✕        Settings              │
├─────────────────────────────────┤
│  Templates        iCal          │  ← Tab Navigation
├─────────────────────────────────┤
│                                 │
│  No templates yet               │
│  Create one by adding an        │
│  activity with "Save as         │
│  template"                      │
│                                 │
│  [+ New Template]               │
│                                 │
└─────────────────────────────────┘
```

## Templates Tab

### Empty State

```
┌─────────────────────────────────┐
│  ✕        Settings              │
├─────────────────────────────────┤
│  Templates        iCal          │
├─────────────────────────────────┤
│                                 │
│      No templates yet           │
│                                 │
│  Create one by adding an        │
│  activity with "Save as         │
│  template"                      │
│                                 │
│     [+ New Template]            │
│                                 │
└─────────────────────────────────┘
```

### With Templates

```
┌─────────────────────────────────┐
│  ✕        Settings              │
├─────────────────────────────────┤
│  Templates        iCal          │
├─────────────────────────────────┤
│                                 │
│  ┌──────────────────────────┐   │
│  │ ⭐ Morning Meeting      │   │
│  │ 09:00 - 10:00  Delete   │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ ⭐ Lunch Break          │   │
│  │ 12:00 - 13:00  Delete   │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ ⭐ Afternoon Review     │   │
│  │ 14:00 - 15:30  Delete   │   │
│  └──────────────────────────┘   │
│                                 │
│  [+ New Template]               │
│                                 │
└─────────────────────────────────┘
```

### Adding a New Template

```
┌─────────────────────────────────┐
│  ✕        Settings              │
├─────────────────────────────────┤
│  Templates        iCal          │
├─────────────────────────────────┤
│                                 │
│  ┌──────────────────────────┐   │
│  │ Template name            │   │
│  │ [________________]       │   │
│  │                          │   │
│  │ [Start]   [End]          │   │
│  │ [09:00]   [10:00]        │   │
│  │                          │   │
│  │ [Save]     [Cancel]      │   │
│  └──────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

## iCal Tab

### Empty State

```
┌─────────────────────────────────┐
│  ✕        Settings              │
├─────────────────────────────────┤
│  Templates        iCal          │
├─────────────────────────────────┤
│                                 │
│   No iCal subscriptions yet      │
│                                 │
│  Add a calendar feed by         │
│  entering an iCal URL           │
│                                 │
│ [+ Add Subscription]            │
│                                 │
└─────────────────────────────────┘
```

### With Subscriptions

```
┌─────────────────────────────────┐
│  ✕        Settings              │
├─────────────────────────────────┤
│  Templates        iCal          │
├─────────────────────────────────┤
│                                 │
│  ┌──────────────────────────┐   │
│  │ 🔗 Company Calendar  [✓] │   │
│  │ https://calendar...      │   │
│  │                          │   │
│  │ Last: Dec 15, 10:30 AM   │   │
│  │ 24 events                │   │
│  │                          │   │
│  │ [Refresh]  [Delete]      │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ 🔗 Public Holidays   [✓] │   │
│  │ https://calendar...      │   │
│  │                          │   │
│  │ Last: Dec 15, 09:15 AM   │   │
│  │ 12 events                │   │
│  │                          │   │
│  │ [Refresh]  [Delete]      │   │
│  └──────────────────────────┘   │
│                                 │
│  [+ Add Subscription]           │
│  [Refresh All]                  │
│                                 │
└─────────────────────────────────┘
```

### Adding a Subscription

```
┌─────────────────────────────────┐
│  ✕        Settings              │
├─────────────────────────────────┤
│  Templates        iCal          │
├─────────────────────────────────┤
│                                 │
│  ┌──────────────────────────┐   │
│  │ iCal URL                 │   │
│  │ [______________________] │   │
│  │                          │   │
│  │ Calendar name (opt.)     │   │
│  │ [______________________] │   │
│  │                          │   │
│  │ [Add]       [Cancel]     │   │
│  └──────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

## Interaction Flow

### Opening Settings

**Desktop:**
```
1. Click "⚙️ Settings" button in header
2. Modal appears with centered title
3. Currently viewing Templates tab by default
```

**Mobile:**
```
1. Tap "⚙️ Settings" button in bottom nav
2. Sheet slides up from bottom
3. Currently viewing Templates tab by default
```

### Managing Templates

```
1. View all templates in list
2. Click "+ New Template" to add
3. Fill in template details (name, start/end time)
4. Click "Save" to create
5. Click "Delete" on any template to remove
```

### Managing iCal Subscriptions

```
1. View all subscriptions with status
2. Toggle checkbox to enable/disable
3. Click "Refresh" to update a single subscription
4. Click "Refresh All" to update all enabled subscriptions
5. Click "+ Add Subscription" to add a new feed
6. Enter iCal URL and optional name
7. Click "Delete" to remove subscription (removes events)
```

## Visual States

### Loading State

```
[Refresh] button shows "Refreshing..." while loading
Disabled state prevents duplicate operations
```

### Error State

```
┌──────────────────────────────────┐
│ ⚠️ Failed to fetch iCal: 404 Not │
│    Found                         │
└──────────────────────────────────┘
```

### Success States

- Template created: Button returns to "+ New Template"
- Subscription added: Form clears and shows in list
- Subscription refreshed: "Last fetched" timestamp updates
- Item deleted: Removed from list with confirmation

## Color Scheme

- **Primary Actions**: Blue (Save, Add, Refresh)
- **Destructive Actions**: Red (Delete)
- **Secondary Actions**: Gray (Cancel, Close)
- **Disabled State**: Reduced opacity (50%)
- **Error Messages**: Red text on light red background

## Keyboard Navigation

- **Tab**: Move between interactive elements
- **Enter**: Activate buttons and confirm forms
- **Escape**: Close settings sheet
- **Spacebar**: Toggle checkboxes

## Touch Gestures (Mobile)

- **Swipe Down**: Close settings sheet
- **Tap**: Select tabs, activate buttons
- **Long Press**: (Optional) Show tooltips

## Responsive Breakpoints

- **Mobile**: Full width, sheet from bottom
- **Tablet**: Max width 600px, centered sheet
- **Desktop**: Max width 448px (md:max-w-md), centered modal