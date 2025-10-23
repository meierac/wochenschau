# Settings Technical Integration Guide

## Architecture Overview

The Settings feature is built on a modular architecture that separates concerns:

```
App.svelte (Main Component)
    ↓
    ├── showSettings state
    ├── handleOpenSettings() function
    └── Conditional SettingsSheet rendering
        ↓
        SettingsSheet.svelte (Unified Settings Modal)
            ├── Tab Navigation State
            ├── Templates Tab
            │   ├── templates store
            │   └── Template CRUD operations
            └── iCal Tab
                ├── subscriptions store
                ├── activities store
                └── iCal CRUD operations
```

## File Structure

### Modified Files

#### 1. `src/App.svelte`

**Key Changes:**
```typescript
// Before
import TemplateManager from "./lib/components/TemplateManager.svelte";
import ICalManager from "./lib/components/ICalManager.svelte";

let showTemplates = false;
let showICal = false;

function handleOpenTemplates() { showTemplates = true; }
function handleOpenICal() { showICal = true; }

// After
import SettingsSheet from "./lib/components/SettingsSheet.svelte";

let showSettings = false;

function handleOpenSettings() { showSettings = true; }
```

**Desktop Header:**
```svelte
<!-- Before -->
<button on:click={handleOpenTemplates}>Templates</button>
<button on:click={handleOpenICal}>iCal</button>

<!-- After -->
<button on:click={handleOpenSettings} class="flex items-center gap-2">
  <svg><!-- gear icon --></svg>
  Settings
</button>
```

**Modal Rendering:**
```svelte
<!-- Before -->
{#if showTemplates}
  <TemplateManager on:close={() => (showTemplates = false)} {isDesktop} />
{/if}
{#if showICal}
  <ICalManager on:close={() => (showICal = false)} {isDesktop} />
{/if}

<!-- After -->
{#if showSettings}
  <SettingsSheet on:close={() => (showSettings = false)} {isDesktop} />
{/if}
```

#### 2. `src/lib/components/FloatingNav.svelte`

**Key Changes:**
```typescript
// Before
dispatch('openTemplates')  // Templates button
dispatch('openICal')       // iCal button

// After
dispatch('openSettings')   // Settings button
```

**Navigation Buttons:**
```svelte
<!-- Before (3 buttons) -->
<button on:click={() => dispatch('openTemplates')}>
  <span>⭐</span>
  <span>Templates</span>
</button>
<button on:click={() => dispatch('openICal')}>
  <span>🔗</span>
  <span>iCal</span>
</button>

<!-- After (1 button) -->
<button on:click={() => dispatch('openSettings')}>
  <span>⚙️</span>
  <span>Settings</span>
</button>
```

#### 3. `src/lib/components/SettingsSheet.svelte` (NEW)

**Component Structure:**
```typescript
<script lang="ts">
  // Stores
  import { templates } from "../stores/templates";
  import { subscriptions } from "../stores/ical";
  import { activities } from "../stores/activities";

  // State Management
  let activeTab: "templates" | "ical" = "templates";
  let showNewTemplate = false;
  let showNewSubscription = false;
  let isLoading = false;
  let error = "";

  // Template Operations
  function handleAddTemplate() { /* ... */ }
  function handleDeleteTemplate(id: string) { /* ... */ }
  function handleCancelNewTemplate() { /* ... */ }

  // iCal Operations
  async function handleAddSubscription() { /* ... */ }
  async function handleRefresh(subscriptionId: string) { /* ... */ }
  function handleToggleSubscription(id: string, enabled: boolean) { /* ... */ }
  function handleDeleteSubscription(id: string) { /* ... */ }
  async function handleRefreshAll() { /* ... */ }

  // Utilities
  function itemCount(subscriptionId: string): number { /* ... */ }
</script>

<!-- Markup -->
<div>
  <!-- Header with close button -->
  <!-- Tab navigation -->
  <!-- Conditional tab content -->
</div>
```

## Store Integration

### Templates Store

**Location:** `src/lib/stores/templates.ts`

**Operations Used:**
```typescript
templates.addTemplate(template)      // Create
templates.removeTemplate(id)         // Delete
$templates                           // Read (reactive)
```

**Template Structure:**
```typescript
interface ActivityTemplate {
  id: string;
  name: string;
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
  createdAt: number;
}
```

### iCal Store

**Location:** `src/lib/stores/ical.ts`

**Operations Used:**
```typescript
subscriptions.addSubscription(subscription)        // Create
subscriptions.updateSubscription(subscription)     // Update
subscriptions.removeSubscription(id)               // Delete
$subscriptions                                     // Read (reactive)
```

**Subscription Structure:**
```typescript
interface ICalSubscription {
  id: string;
  url: string;
  name: string;
  enabled: boolean;
  lastFetched?: number;
  color?: string;
  syncInterval?: number;
}
```

### Activities Store

**Location:** `src/lib/stores/activities.ts`

**Operations Used:**
```typescript
activities.removeActivity(id)        // Delete (when removing subscription)
$activities                          // Read (to count events)
```

**Used For:**
- Counting events from a specific subscription: `$activities.filter(a => a.sourceId === subscriptionId && a.source === "ical")`
- Cleaning up when deleting a subscription

## State Flow

### Opening Settings

```
App.svelte
  └─ User clicks "⚙️ Settings" button
     └─ handleOpenSettings() called
        └─ showSettings = true
           └─ SettingsSheet rendered
              └─ Loads from stores
                 ├─ $templates (all templates)
                 ├─ $subscriptions (all subscriptions)
                 └─ $activities (for counting)
```

### Adding a Template

```
SettingsSheet
  └─ User clicks "+ New Template"
     └─ showNewTemplate = true
        └─ Form appears
           └─ User fills details
              └─ User clicks "Save"
                 └─ handleAddTemplate()
                    └─ templates.addTemplate(template)
                       └─ Template added to store
                          └─ Reactive $templates updates
                             └─ UI re-renders with new template
```

### Adding a Subscription

```
SettingsSheet
  └─ User clicks "+ Add Subscription"
     └─ showNewSubscription = true
        └─ Form appears
           └─ User enters URL and name
              └─ User clicks "Add"
                 └─ handleAddSubscription()
                    └─ fetch(url) to get iCal data
                       ├─ (Error handling with error state)
                       └─ subscriptions.addSubscription(subscription)
                          └─ Subscription added to store
                             └─ Form clears
                                └─ UI updates list
```

### Refreshing Subscriptions

```
SettingsSheet
  └─ User clicks "Refresh"
     └─ handleRefresh(subscriptionId)
        ├─ isLoading = true
        ├─ fetch subscription URL
        └─ subscriptions.updateSubscription(updated)
           └─ lastFetched timestamp updates
              └─ UI shows new timestamp
```

## Event Handling

### Modal Events

```svelte
<!-- Close -->
<SettingsSheet on:close={() => (showSettings = false)} />

<!-- Dispatch -->
dispatch('close')  <!-- sent from SettingsSheet when user clicks close -->
```

### Form Events

```svelte
<!-- Template Form -->
<input bind:value={newTemplate.name} />
<input type="time" bind:value={newTemplate.startTime} />
<input type="time" bind:value={newTemplate.endTime} />
<button on:click={handleAddTemplate}>Save</button>

<!-- iCal Form -->
<input type="url" bind:value={newSubscription.url} />
<input type="text" bind:value={newSubscription.name} />
<button on:click={handleAddSubscription}>Add</button>
```

### Button Events

```svelte
<!-- Tab Switching -->
<button on:click={() => (activeTab = "templates")}>Templates</button>
<button on:click={() => (activeTab = "ical")}>iCal</button>

<!-- List Actions -->
<button on:click={() => handleDeleteTemplate(template.id)}>Delete</button>
<button on:click={() => handleRefresh(subscription.id)}>Refresh</button>
<input type="checkbox" on:change={(e) => handleToggleSubscription(id, e.currentTarget.checked)} />
```

## Styling Strategy

### Tailwind Classes Used

**Layout:**
- `fixed inset-0`: Full screen overlay
- `bg-black/50`: Semi-transparent backdrop
- `rounded-2xl md:rounded-lg`: Responsive border radius
- `flex flex-col`: Vertical flex layout
- `max-h-[90vh] md:max-h-[80vh]`: Responsive max height

**Colors:**
- `bg-card`: Modal background
- `bg-muted`: Section backgrounds
- `text-foreground`: Primary text
- `text-muted-foreground`: Secondary text
- `text-destructive`: Error/delete actions
- `border-border`: Normal borders
- `border-destructive`: Error state borders

**Components:**
- `rounded-lg`: Rounded corners
- `border`: Standard border
- `p-4`, `px-4 py-4`: Padding variants
- `gap-2`, `gap-4`: Spacing
- `transition-colors`: Smooth transitions

### Responsive Design

```css
/* Mobile (default) */
.bg-card rounded-2xl w-full
flex items-end          /* bottom sheet */

/* Desktop (md and up) */
@media (min-width: 768px)
  rounded-lg            /* smaller radius */
  flex items-center     /* centered modal */
  md:max-w-md           /* fixed width */
```

## Error Handling

### Try-Catch Pattern

```typescript
async function handleAddSubscription() {
  error = "";
  isLoading = true;

  try {
    const response = await fetch(newSubscription.url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // Process response
  } catch (e) {
    error = `Failed to add subscription: ${
      e instanceof Error ? e.message : String(e)
    }`;
  } finally {
    isLoading = false;
  }
}
```

### Error Display

```svelte
{#if error}
  <div class="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
    <p class="text-sm text-destructive">{error}</p>
  </div>
{/if}
```

## Loading States

```typescript
// Prevent multiple operations
let isLoading = false;

// Disable buttons during loading
<button disabled={isLoading}>
  {isLoading ? "Adding..." : "Add"}
</button>
```

## Accessibility Features

### Semantic HTML

```svelte
<label class="flex items-center gap-2 cursor-pointer">
  <input type="checkbox" checked={enabled} on:change={...} />
</label>
```

### ARIA Labels

```svelte
<IconButton ariaLabel="Close settings" on:click={handleClose}>
  <!-- icon -->
</IconButton>
```

### Keyboard Navigation

- **Tab**: Move focus through interactive elements
- **Enter**: Activate buttons, submit forms
- **Spacebar**: Toggle checkboxes
- **Escape**: Close modal (can be added)

## Performance Considerations

### Reactive Stores

```typescript
// Automatically updates when store changes
$templates  // Reactively subscribed
$subscriptions
$activities
```

### Filtered Subscriptions

```typescript
// Only count relevant items
$activities.filter(a => a.sourceId === subscriptionId && a.source === "ical")
```

### Conditional Rendering

```svelte
<!-- Only show when needed -->
{#if showNewTemplate}
  <!-- expensive form rendering -->
{/if}
```

## Testing Considerations

### Unit Tests

```typescript
// Test template operations
test('adds template', () => { /* ... */ })
test('deletes template', () => { /* ... */ })
test('validates template name', () => { /* ... */ })

// Test iCal operations
test('adds subscription', async () => { /* ... */ })
test('refreshes subscription', async () => { /* ... */ })
test('counts subscription items', () => { /* ... */ })
test('handles fetch errors', async () => { /* ... */ })
```

### Integration Tests

```typescript
// Test store interactions
test('settings reflects template store changes', () => { /* ... */ })
test('deleting subscription removes activities', () => { /* ... */ })

// Test modal lifecycle
test('opens and closes settings', () => { /* ... */ })
test('tabs switch content correctly', () => { /* ... */ })
```

## Future Enhancement Points

### Easy Additions

1. **Search/Filter:** Add input field to filter templates/subscriptions
2. **Sorting:** Sort by name, date, count
3. **Bulk Operations:** Select multiple items to delete
4. **Import/Export:** Export templates as JSON, import from file
5. **Toast Notifications:** Success/error feedback
6. **Confirmation Dialogs:** Before destructive operations
7. **Color Coding:** Assign colors to subscriptions
8. **Sync Interval:** Configure auto-refresh frequency

### Architectural Additions

1. **Settings Persistence:** Save preferences (default tab, sort order)
2. **Subscription Sync:** Background job to refresh subscriptions
3. **Template Groups:** Organize templates by category
4. **Validation Rules:** More comprehensive input validation
5. **Analytics:** Track template and subscription usage
6. **Undo/Redo:** Operation history within settings

## Deployment Checklist

- [ ] Verify SettingsSheet component renders correctly
- [ ] Test template CRUD operations
- [ ] Test iCal subscription CRUD operations
- [ ] Test error handling with invalid URLs
- [ ] Test responsive layout (mobile/tablet/desktop)
- [ ] Test keyboard navigation
- [ ] Test with screen readers
- [ ] Verify all icons display correctly
- [ ] Test state persistence across app sessions
- [ ] Performance test with many templates/subscriptions