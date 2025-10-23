# Settings Feature - Quick Reference

## What Changed

### Before
- "Templates" button in top-level UI (desktop header + mobile nav)
- "iCal" button in top-level UI (desktop header + mobile nav)
- Two separate modal components

### After
- Single "⚙️ Settings" button in both desktop and mobile
- Unified Settings modal with tab navigation
- One SettingsSheet component handles both Templates and iCal

## Quick Start

### For Users

**Desktop:**
1. Click "⚙️ Settings" button in the top-right header
2. Choose "Templates" or "iCal" tab
3. Manage your items

**Mobile:**
1. Tap "⚙️ Settings" button in the bottom navigation bar
2. Choose "Templates" or "iCal" tab
3. Manage your items

### For Developers

**Key Files:**
- `src/App.svelte` - Main app state and modal rendering
- `src/lib/components/SettingsSheet.svelte` - New unified settings component
- `src/lib/components/FloatingNav.svelte` - Updated bottom navigation
- Old files (still exist but unused):
  - `src/lib/components/TemplateManager.svelte`
  - `src/lib/components/ICalManager.svelte`

**Key Functions in SettingsSheet:**

Templates Tab:
```typescript
handleAddTemplate()       // Create new template
handleDeleteTemplate(id)  // Delete template
handleCancelNewTemplate() // Cancel editing
```

iCal Tab:
```typescript
handleAddSubscription()        // Add new subscription
handleRefresh(subscriptionId)  // Refresh one subscription
handleRefreshAll()             // Refresh all subscriptions
handleToggleSubscription(id, enabled)  // Enable/disable
handleDeleteSubscription(id)   // Delete subscription
itemCount(subscriptionId)      // Count events
```

## Component Structure

```
App.svelte
├── showSettings (boolean state)
├── handleOpenSettings() (open function)
└── <SettingsSheet />
    ├── activeTab (templates | ical)
    ├── Templates Tab
    │   ├── Template list
    │   ├── New template form
    │   └── Delete buttons
    └── iCal Tab
        ├── Subscription list
        ├── New subscription form
        ├── Refresh/Delete buttons
        └── Toggle switches
```

## Stores Used

| Store | Used For | Methods |
|-------|----------|---------|
| `templates` | Template management | `addTemplate()`, `removeTemplate()`, `$templates` |
| `subscriptions` | Subscription management | `addSubscription()`, `updateSubscription()`, `removeSubscription()`, `$subscriptions` |
| `activities` | Event counting, cleanup | `removeActivity()`, `$activities` |

## State Management

```typescript
// Tab state
let activeTab: "templates" | "ical" = "templates"

// Template form
let showNewTemplate = false
let newTemplate = { name: "", startTime: "09:00", endTime: "10:00" }

// iCal form
let showNewSubscription = false
let newSubscription = { url: "", name: "" }

// UI state
let isLoading = false
let error = ""
```

## Common Tasks

### Add a New Template

```typescript
const template: ActivityTemplate = {
  id: `template-${Date.now()}`,
  name: "Meeting",
  startTime: "09:00",
  endTime: "10:00",
  createdAt: Date.now(),
};
templates.addTemplate(template);
```

### Add a New Subscription

```typescript
const subscription: ICalSubscription = {
  id: `sub-${Date.now()}`,
  url: "https://calendar.example.com/cal.ics",
  name: "Company Calendar",
  lastFetched: Date.now(),
  enabled: true,
};
subscriptions.addSubscription(subscription);
```

### Count Events from a Subscription

```typescript
const count = $activities.filter(
  (a) => a.sourceId === subscriptionId && a.source === "ical"
).length;
```

### Delete Subscription with Cleanup

```typescript
// Remove activities first
const itemsToRemove = $activities.filter(
  (a) => a.sourceId === id && a.source === "ical"
);
for (const item of itemsToRemove) {
  activities.removeActivity(item.id);
}
// Then remove subscription
subscriptions.removeSubscription(id);
```

## UI Elements

| Element | Desktop | Mobile | Icon |
|---------|---------|--------|------|
| Settings Button | Header | Bottom Nav | ⚙️ |
| Templates Tab | Tab text | Tab text | (none) |
| iCal Tab | Tab text | Tab text | (none) |
| Close Button | Icon (✕) | Icon (✕) | ✕ |
| Delete Button | Text "Delete" | Text "Delete" | (none) |
| Add Button | Text "Add" | Text "Add" | (none) |
| Refresh Button | Text "Refresh" | Text "Refresh" | (none) |
| Toggle Switch | Checkbox | Checkbox | (none) |

## Styling

**Colors:**
- Primary actions (Save, Add): Blue from theme
- Destructive actions (Delete): Red from theme
- Disabled state: 50% opacity
- Error messages: Red text on light red background

**Layout:**
- Modal width: Desktop 448px max, Mobile full width
- Modal height: Desktop 80vh max, Mobile 90vh max
- Content scrolls when exceeds max height

**Responsiveness:**
- Desktop: Centered modal, md:max-w-md
- Mobile: Bottom sheet, rounded-2xl top corners
- Tablet: Same as desktop

## Error Handling

**Network Errors:**
```typescript
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  // process
} catch (e) {
  error = e instanceof Error ? e.message : String(e);
}
```

**Error Display:**
```svelte
{#if error}
  <div class="p-3 bg-destructive/10 border border-destructive/30">
    <p class="text-sm text-destructive">{error}</p>
  </div>
{/if}
```

## Event Flow

### Opening Settings
```
User clicks "⚙️ Settings" 
→ handleOpenSettings() 
→ showSettings = true 
→ SettingsSheet renders
```

### Switching Tabs
```
User clicks tab button 
→ activeTab = "templates" | "ical" 
→ Content switches reactively
```

### Adding Item
```
User clicks "+ New" 
→ showNewTemplate/showNewSubscription = true 
→ Form appears 
→ User submits 
→ handler() updates store 
→ Form hides 
→ List updates reactively
```

## Accessibility

- **ARIA Labels:** All icon buttons have ariaLabel
- **Semantic HTML:** Proper input types (url, time, text)
- **Keyboard:** Tab navigation, Enter to submit, Escape to close
- **Screen Readers:** Proper heading hierarchy, labels

## Testing Tips

### Templates
- Test adding template with valid data
- Test deleting template with confirmation
- Test template validation (name required)
- Test empty state message

### iCal
- Test adding subscription with valid URL
- Test adding subscription with invalid URL (error)
- Test refresh with working/broken URL
- Test toggle enable/disable
- Test delete removes activities
- Test item count accuracy

### General
- Test responsive layout (mobile/tablet/desktop)
- Test tab switching
- Test loading states
- Test error display and clearing

## Performance Notes

- Uses reactive Svelte stores (automatic subscriptions)
- Filters activities only when needed (O(n) complexity)
- Loading state prevents duplicate network requests
- Conditional rendering only shows active tab content

## Known Limitations

- No search/filter functionality yet
- No sorting options yet
- No bulk operations yet
- No import/export yet
- Single iCal parsing (no background sync)

## Future Enhancements

Priority High:
- Search/filter templates and subscriptions
- Sort options (name, date, count)
- Toast notifications for feedback
- Confirmation dialogs for destructive actions

Priority Medium:
- Bulk operations (multi-select delete)
- Import/export functionality
- Color coding for subscriptions
- Sync interval configuration

Priority Low:
- Background sync service
- Template groups/categories
- Usage analytics
- Undo/redo history