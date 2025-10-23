# Settings Menu-Based Design - Quick Reference

## Architecture Overview

```
SettingsSheet Component
├── Header (Fixed on top)
│   ├── Back button (mobile) or Title
│   └── Close button
│
├── Mobile View
│   └── Layer Navigation
│       ├── Menu List (selectedSetting === null)
│       └── Details View (selectedSetting === "id")
│
└── Desktop View
    └── Two-Column Layout
        ├── Left: Menu (fixed 192px)
        └── Right: Details (flexible)
```

## State Management

```typescript
// Current view on mobile or selected item on desktop
let selectedSetting: SettingType | null = isDesktop ? "templates" : null;

// SettingType union
type SettingType = "templates" | "ical";

// Menu items configuration
interface SettingItem {
  id: SettingType;
  label: string;
  icon: string;
  description: string;
}
```

## Key Functions

### Navigation
```typescript
selectSetting(id: SettingType)  // Navigate to detail/select on desktop
backToList()                     // Return to menu (mobile only)
handleClose()                    // Close entire settings
```

### Templates
```typescript
handleAddTemplate()         // Save new template
handleDeleteTemplate(id)    // Delete with confirmation
handleCancelNewTemplate()   // Cancel form
```

### iCal
```typescript
handleAddSubscription()           // Add new subscription
handleRefresh(id)                 // Refresh single subscription
handleRefreshAll()                // Refresh all enabled
handleToggleSubscription(id, enabled)  // Enable/disable
handleDeleteSubscription(id)      // Delete (removes events)
itemCount(id)                     // Count events from activities
```

## Responsive Behavior

### Mobile (default)
- Single column
- Full-width sheet from bottom
- selectedSetting controls view
- null = show menu, "id" = show details
- Back button to return to menu
- Close button always available

### Desktop (md breakpoint, 768px+)
- Two column layout
- Header on top (full width)
- Left menu: 192px wide, scrollable
- Right details: flex-1, scrollable
- selectedSetting always has value
- Defaults to "templates"

## Component Structure

### Header (All Views)
```svelte
<!-- Mobile: Back or Title -->
{#if !isDesktop && selectedSetting}
  <button on:click={backToList}>← Back</button>
{:else}
  <h3>Settings</h3>
{/if}

<!-- Always: Close button -->
<IconButton on:click={handleClose}>✕</IconButton>
```

### Content Container
```svelte
<div class="flex flex-1 overflow-hidden">
  {#if !isDesktop}
    <!-- Mobile: Menu or Details -->
  {:else}
    <!-- Desktop: Two columns -->
  {/if}
</div>
```

## Adding New Settings

### 1. Update Type
```typescript
type SettingType = "templates" | "ical" | "notifications";
```

### 2. Add to Menu Items
```typescript
const settingItems: SettingItem[] = [
  // ... existing
  {
    id: "notifications",
    label: "Notifications",
    icon: "🔔",
    description: "Configure alerts", // or dynamic count
  },
];
```

### 3. Add Details View

**Mobile:**
```svelte
{:else if selectedSetting === "notifications"}
  <!-- Mobile notification settings -->
```

**Desktop:**
```svelte
{:else if selectedSetting === "notifications"}
  <h3 class="text-xl font-semibold mb-4">Notifications</h3>
  <!-- Desktop notification settings -->
{/if}
```

### 4. Add Logic
- Import stores if needed
- Add event handlers
- Implement CRUD operations

## Styling Quick Reference

### Menu Items

**Mobile (Full Width Buttons):**
```
p-4 bg-muted rounded-lg border border-border
hover:border-primary transition-colors text-left
flex items-center justify-between
```

**Desktop (Sidebar Items):**
```
Selected:    bg-primary text-primary-foreground
Unselected:  text-foreground hover:bg-muted
Padding:     px-4 py-3
Width:       w-full (in 192px container)
```

### Details Area

**Mobile:**
- p-6 (padding)
- w-full (full width)
- overflow-y-auto

**Desktop:**
- flex-1 (fills space)
- overflow-y-auto
- p-6 (padding)

## Template & iCal Implementation

### Templates Tab
**Features:**
- View all templates with times
- Add new template (name, start/end time)
- Delete with confirmation
- Empty state messaging
- State: showNewTemplate, newTemplate object

**Stores Used:**
- templates (addTemplate, removeTemplate, $templates)

### iCal Tab
**Features:**
- View subscriptions with status
- Add new (URL, optional name)
- Toggle enable/disable
- Refresh individual or all
- Display event count, last fetch time
- Delete removes associated activities

**Stores Used:**
- subscriptions (add, update, remove, $subscriptions)
- activities (count, removeActivity, $activities)

## Error Handling

```typescript
// Setup
let error = "";
let isLoading = false;

// Operation
try {
  error = "";
  isLoading = true;
  // do operation
  // reset forms on success
} catch (e) {
  error = `Failed to...: ${e.message}`;
} finally {
  isLoading = false;
}

// Display
{#if error}
  <div class="p-3 bg-destructive/10 border border-destructive/30">
    <p class="text-sm text-destructive">{error}</p>
  </div>
{/if}
```

## Loading States

```typescript
// Prevent duplicates
disabled={isLoading}

// Show user feedback
{isLoading ? "Adding..." : "Add"}

// Apply to buttons and forms
<button disabled={isLoading}>
  {isLoading ? "Loading..." : "Action"}
</button>
```

## Class Patterns

### Layout
```
flex flex-col           - Vertical layout
flex flex-1 overflow-hidden - Container with scrolling
w-48 flex-shrink-0      - Fixed width sidebar
border-r border-border  - Divider
```

### Spacing
```
p-4, p-6        - Padding
gap-2, gap-3    - Gaps
space-y-2       - Vertical spacing between items
mb-4            - Margin bottom
mt-4            - Margin top
```

### Colors
```
bg-primary                - Primary action background
text-primary-foreground   - Primary text
bg-muted                  - Secondary background
text-muted-foreground     - Secondary text
text-destructive          - Danger/delete text
bg-destructive/10         - Danger background (light)
```

### States
```
hover:bg-muted          - Hover state
active:opacity-80       - Pressed state
disabled:opacity-50     - Disabled state
disabled:pointer-events-none - Prevent clicks
transition-colors       - Smooth color transition
```

## Common Tasks

### Open Settings
```typescript
// In App.svelte
let showSettings = false;
function handleOpenSettings() {
  showSettings = true;
}

// Render
{#if showSettings}
  <SettingsSheet on:close={() => (showSettings = false)} {isDesktop} />
{/if}
```

### Navigate Menu Item
```typescript
// Mobile: Go to details
selectSetting("templates")  // selectedSetting = "templates"

// Desktop: Same action (just updates right panel)
selectSetting("templates")
```

### Return to Menu
```typescript
// Mobile only: Go back to menu list
backToList()  // selectedSetting = null

// Desktop: No-op (menu always visible)
```

### Add New Item
```typescript
// Template example
const template = {
  id: `template-${Date.now()}`,
  name: newTemplate.name,
  startTime: newTemplate.startTime,
  endTime: newTemplate.endTime,
  createdAt: Date.now(),
};
templates.addTemplate(template);
showNewTemplate = false;
newTemplate = { name: "", startTime: "09:00", endTime: "10:00" };
```

## Desktop Menu Highlighting

```svelte
<button
  on:click={() => selectSetting(item.id)}
  class={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
    selectedSetting === item.id
      ? "bg-primary text-primary-foreground"
      : "text-foreground hover:bg-muted"
  }`}
>
  {item.icon} {item.label}
</button>
```

## Mobile Navigation

```svelte
<!-- Show menu or details based on state -->
{#if selectedSetting === null}
  <!-- Menu list with buttons that call selectSetting(id) -->
{:else}
  <!-- Details with handleClose() and backToList() buttons -->
{/if}
```

## Testing Checklist

- [ ] Mobile: Menu displays all items
- [ ] Mobile: Click item navigates to details
- [ ] Mobile: Back button returns to menu
- [ ] Mobile: Close button closes settings
- [ ] Desktop: Menu always visible on left
- [ ] Desktop: Click item updates right panel
- [ ] Desktop: Selected item highlighted
- [ ] Both: Forms work correctly
- [ ] Both: Error messages display
- [ ] Both: Loading states prevent duplicates
- [ ] Both: Responsive at breakpoints
- [ ] Both: Keyboard navigation works
- [ ] Both: Screen reader compatible

## Files Reference

**Modified:**
- `src/App.svelte` - State and rendering
- `src/lib/components/FloatingNav.svelte` - Mobile nav button
- `src/lib/components/SettingsSheet.svelte` - Menu-based component

**Still Available (Deprecated):**
- `src/lib/components/TemplateManager.svelte`
- `src/lib/components/ICalManager.svelte`

## Stores Quick Reference

### Templates Store
```typescript
import { templates } from "../stores/templates";

$templates                    // Reactive list
templates.addTemplate(t)      // Add
templates.removeTemplate(id)  // Remove
```

### Subscriptions Store
```typescript
import { subscriptions } from "../stores/ical";

$subscriptions                    // Reactive list
subscriptions.addSubscription(s)  // Add
subscriptions.updateSubscription(s) // Update
subscriptions.removeSubscription(id) // Remove
```

### Activities Store
```typescript
import { activities } from "../stores/activities";

$activities                   // Reactive list
activities.removeActivity(id) // Remove

// Use with filter to count
$activities.filter(a => a.sourceId === id && a.source === "ical").length
```

## Performance Tips

1. **Conditional Rendering**: Only render active tab/detail content
2. **Store Subscriptions**: Automatic via Svelte (no manual cleanup)
3. **Avoid Recalculation**: Use reactive expressions for counts
4. **Mobile-First**: Simpler DOM on mobile (single column)
5. **Lazy Loading**: Details only render when needed

## Future Extensibility

The menu-based design makes it easy to add:
- 🔔 Notifications settings
- 🎨 Appearance/Theme settings
- ⌨️ Keyboard shortcuts
- 📊 Export/Import settings
- 👤 Profile settings
- ⚙️ Advanced options

Just extend `settingItems` and add detail views!

## Common Issues & Solutions

**Issue: Desktop menu not showing**
- Solution: Ensure isDesktop prop passed correctly
- Check: `{:else}` branch in layout conditional

**Issue: Mobile back button missing**
- Solution: Check `!isDesktop && selectedSetting` condition
- Verify: selectSetting is not hardcoded to always have value

**Issue: Form not clearing after save**
- Solution: Reset state variables after dispatch
- Example: `newTemplate = { name: "", startTime: "09:00", endTime: "10:00" }`

**Issue: Errors not displaying**
- Solution: Check error state is cleared before operation
- Verify: Error display conditional is correct

**Issue: Loading state not preventing duplicates**
- Solution: Add `disabled={isLoading}` to buttons
- Verify: `finally` block sets `isLoading = false`
