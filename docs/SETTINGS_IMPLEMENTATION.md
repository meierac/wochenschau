# Settings Implementation Guide

## Overview

The Settings feature consolidates Template and iCal management into a unified settings interface, removing them from the top-level UI and hiding them behind a global settings icon/button.

## What Changed

### 1. New Component: `SettingsSheet.svelte`

A new modal/sheet component that combines both Template and iCal settings into a single interface with tab navigation.

**Features:**
- **Tab Navigation**: Two tabs - "Templates" and "iCal"
- **Templates Tab**:
  - View all saved activity templates
  - Create new templates with name and time
  - Delete existing templates
  - Real-time template management
  
- **iCal Tab**:
  - Manage calendar subscriptions
  - Add new iCal URLs
  - Enable/disable subscriptions
  - Refresh individual or all subscriptions
  - View last fetched time and event count
  - Delete subscriptions (removes associated events)

**Design:**
- Unified header with centered title and close button
- Tab navigation at the top
- Scrollable content area with max height constraint (90vh on mobile, 80vh on desktop)
- Follows the same modal header pattern as other sheets in the app

### 2. Updated App.svelte

- Replaced separate `showTemplates` and `showICal` state variables with a single `showSettings` variable
- Replaced the "Templates" and "iCal" buttons with a single "Settings" button in the desktop header
- Settings button uses a gear/cog SVG icon with the label "Settings"
- Simplified modal/sheet rendering to show only the SettingsSheet

### 3. Updated FloatingNav.svelte

- Removed individual "Templates" (⭐) and "iCal" (🔗) buttons
- Added single "Settings" (⚙️) button with emoji icon
- Emits `openSettings` event instead of separate template/iCal events
- Maintains the same button layout and styling

## User Experience

### Desktop
- Settings button appears in the top-right header area next to the "Add Activity" button
- Click opens a modal with tab navigation
- Users can switch between Templates and iCal settings

### Mobile
- Settings button (⚙️) appears in the floating navigation bar at the bottom
- Replaces the previous "Templates" and "iCal" buttons
- Opens a full-height sheet from the bottom

## Implementation Details

### State Management
- Templates are managed via the existing `templates` store
- iCal subscriptions are managed via the existing `subscriptions` store
- Activities associated with subscriptions are in the `activities` store

### Key Functions

**Templates:**
- `handleAddTemplate()`: Creates and saves new template
- `handleDeleteTemplate()`: Removes template with confirmation

**iCal:**
- `handleAddSubscription()`: Adds new calendar subscription
- `handleRefresh()`: Refreshes a single subscription
- `handleRefreshAll()`: Refreshes all enabled subscriptions
- `handleToggleSubscription()`: Enables/disables a subscription
- `handleDeleteSubscription()`: Removes subscription and associated activities
- `itemCount()`: Counts iCal events from the activities store

### Error Handling
- Network errors during fetch are caught and displayed
- Error messages appear in a red banner at the top of the content
- Loading states prevent duplicate operations

## Files Modified

1. **src/App.svelte**
   - Simplified state management
   - Replaced multiple buttons with settings button
   - Added settings icon SVG

2. **src/lib/components/FloatingNav.svelte**
   - Replaced Templates and iCal buttons with Settings button
   - Updated event dispatcher to emit `openSettings`

3. **src/lib/components/SettingsSheet.svelte** (NEW)
   - Complete settings interface with tab navigation
   - Combines template and iCal management

## Files NOT Modified

- `TemplateManager.svelte` - Still exists but no longer used in main UI
- `ICalManager.svelte` - Still exists but no longer used in main UI
- These can be kept for potential future use or removed if no longer needed

## Styling

The SettingsSheet uses existing Tailwind classes:
- `bg-card`, `bg-muted`, `bg-background`: Background colors
- `text-foreground`, `text-muted-foreground`: Text colors
- `border-border`, `border-destructive`: Border colors
- Responsive spacing and sizing
- Smooth transitions and active states

## Accessibility

- Icon buttons have `ariaLabel` attributes
- Tab buttons use semantic HTML
- Proper focus management with keyboard navigation
- Checkboxes for subscription enable/disable
- Confirmation dialogs for destructive actions

## Future Enhancements

1. Add confirmation modals for significant operations
2. Add toast notifications for successful operations
3. Add search/filter for templates and subscriptions
4. Add sort options for templates and subscriptions
5. Add drag-and-drop to reorder items
6. Add bulk operations (delete multiple at once)
7. Add import/export functionality
8. Add color coding for subscriptions