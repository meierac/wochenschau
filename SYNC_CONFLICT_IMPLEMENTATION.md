# Sync Conflict Resolution - Implementation Summary

## Overview

This document describes the implementation of the sync conflict resolution feature, which prevents users from accidentally losing local edits when syncing iCal calendar subscriptions.

## Implementation Date

Implemented: 2024

## Problem Statement

Previously, when syncing iCal subscriptions, any local edits to synced calendar items would be silently overwritten with fresh data from the subscription source. This meant users could lose customizations like:
- Edited event titles
- Custom descriptions
- Adjusted times
- Color changes

## Solution

A conflict detection and resolution system that:
1. **Detects** when locally-modified items would be overwritten
2. **Pauses** the sync operation
3. **Asks** the user how to proceed
4. **Applies** the user's choice

## Architecture

### Components

#### 1. Type Definitions (`src/lib/types/index.ts`)

```typescript
// Represents a single conflict
export interface SyncConflict {
  localItem: CalendarItem;
  incomingItem: CalendarItem | null; // null if deleted from source
  subscriptionName: string;
}

// User's choice for resolution
export type ConflictResolution = "keep-local" | "use-synced" | "ask";

// Props for the conflict dialog
export interface SyncConflictDialogOptions {
  conflicts: SyncConflict[];
  onResolve: (resolution: ConflictResolution) => void;
}
```

#### 2. Conflict Dialog Component (`src/lib/components/SyncConflictDialog.svelte`)

A modal dialog that:
- Displays the number of conflicted items
- Shows which calendars are affected
- Previews up to 5 conflicted items
- Offers two action buttons: "Keep My Changes" and "Use Synced Data"
- Provides clear explanations of what each choice does

**Features:**
- Responsive design (works on mobile and desktop)
- Dark mode support
- Keyboard accessible (ESC to close)
- Click outside to close (treated as "keep local")
- Visual hierarchy with icons and color coding

#### 3. Activity Store Enhancement (`src/lib/stores/activities.ts`)

The `updateActivity` function now:
- Automatically updates `lastModified` timestamp
- Detects changes for synced items (source === "ical")
- Stores changes in `localOverrides` field
- Tracks modifications to: summary, description, dtstart, dtend, color

**Example:**
```typescript
updateActivity: (activity: Activity) => {
  const updatedActivity = { ...activity };
  updatedActivity.lastModified = Date.now();
  
  if (updatedActivity.source === "ical") {
    // Compare with original and store overrides
    const overrides: Partial<Activity> = {};
    
    if (updatedActivity.summary !== original.summary) {
      overrides.summary = updatedActivity.summary;
    }
    // ... more field checks
    
    if (Object.keys(overrides).length > 0) {
      updatedActivity.localOverrides = {
        ...(updatedActivity.localOverrides || {}),
        ...overrides,
      };
    }
  }
  
  saveActivity(updatedActivity);
  // ... update store
}
```

#### 4. Sync Logic Update (`src/App.svelte`)

Enhanced `refreshSubscription` function:

**Before:**
```typescript
async function refreshSubscription(subscriptionId: string) {
  // Fetch new data
  // Delete all old items
  // Add all new items
  // Update subscription timestamp
}
```

**After:**
```typescript
async function refreshSubscription(
  subscriptionId: string, 
  skipConflictCheck = false
) {
  // Fetch new data
  
  if (!skipConflictCheck) {
    // Find items modified after last sync
    const conflicts = detectConflicts(oldActivities, subscriptionLastFetched);
    
    if (conflicts.length > 0) {
      // Store pending data
      pendingConflicts = [...pendingConflicts, ...conflicts];
      pendingSyncData.set(subscriptionId, { subscription, items });
      showConflictDialog = true;
      return; // Pause sync
    }
  }
  
  // No conflicts - proceed with sync
  // Delete old items
  // Add new items
  // Update subscription timestamp
}
```

**Conflict Detection Logic:**
```typescript
for (const oldActivity of oldActivities) {
  const wasModifiedLocally = 
    oldActivity.lastModified > subscriptionLastFetched;
  
  const hasLocalOverrides = 
    oldActivity.localOverrides && 
    Object.keys(oldActivity.localOverrides).length > 0;
  
  if (wasModifiedLocally || hasLocalOverrides) {
    const incomingItem = calendarItems.find(
      item => item.uid === oldActivity.uid
    );
    
    conflicts.push({
      localItem: oldActivity,
      incomingItem: incomingItem || null,
      subscriptionName: subscription.name,
    });
  }
}
```

**Resolution Handlers:**
```typescript
function handleConflictResolution(event: CustomEvent<ConflictResolution>) {
  const resolution = event.detail;
  
  if (resolution === "keep-local") {
    // Just update lastFetched timestamp
    // Don't overwrite any items
    for (const [_subscriptionId, data] of pendingSyncData.entries()) {
      subscriptions.updateSubscription({
        ...data.subscription,
        lastFetched: Date.now(),
      });
    }
  } else if (resolution === "use-synced") {
    // Proceed with sync, skipping conflict check
    for (const [subscriptionId, _data] of pendingSyncData.entries()) {
      refreshSubscription(subscriptionId, true);
    }
  }
  
  // Clear pending state
  pendingConflicts = [];
  pendingSyncData.clear();
  showConflictDialog = false;
}
```

### State Management

**New state variables in App.svelte:**
```typescript
let showConflictDialog = false;
let pendingConflicts: SyncConflict[] = [];
let pendingSyncData: Map<
  string, 
  { subscription: any; items: CalendarItem[] }
> = new Map();
```

These track:
- Whether the dialog should be shown
- All detected conflicts across all subscriptions
- The synced data waiting to be applied (or discarded)

## User Flow

### Scenario: User Edited a Synced Event

1. **User edits event**: Changes "Team Meeting" to "Team Meeting - POSTPONED"
2. **Edit is tracked**: 
   - `lastModified` updates to current timestamp
   - `localOverrides.summary` stores the new title
3. **24 hours pass**: Auto-sync triggers
4. **Sync starts**: `refreshSubscription` is called
5. **Conflict detected**: Item was modified after last sync
6. **Sync pauses**: Dialog appears
7. **User sees**:
   - "1 item modified locally"
   - Calendar name: "Work Calendar"
   - Item preview: "Team Meeting - POSTPONED"
8. **User chooses**:
   - **Keep My Changes**: Event stays "POSTPONED", sync timestamp updates
   - **Use Synced Data**: Event reverts to "Team Meeting"
9. **Sync completes**: Dialog closes, state clears

### Scenario: No Conflicts

1. **Sync triggers**
2. **No modified items found**
3. **Sync proceeds automatically**
4. **No dialog shown**

## Edge Cases Handled

### 1. Multiple Subscriptions with Conflicts
- Conflicts from all subscriptions are aggregated
- Dialog shows combined count and all affected calendars
- Resolution applies to all subscriptions at once

### 2. Item Deleted from Source
- `incomingItem` is `null` if not found in synced data
- Still shown as conflict if locally modified
- User can keep the local version or let it be deleted

### 3. User Closes Dialog
- Treated as "keep local" (safe default)
- No data is lost

### 4. Sync Already in Progress
- `isSyncing` flag prevents duplicate syncs
- New sync requests are ignored until current one completes

### 5. Disabled Subscriptions
- Not synced, so no conflicts
- Conflicts only checked for enabled subscriptions

## Performance Considerations

### Efficient Conflict Detection
- Only items from the specific subscription are checked
- Uses timestamp comparison (fast)
- UID matching for item correlation (O(n*m) but typically small n and m)

### Minimal UI Blocking
- Dialog is lightweight (only renders when needed)
- Conflict detection is synchronous but fast
- Actual sync is async and non-blocking

### Memory Management
- Pending data is stored only during conflict resolution
- Cleared immediately after user choice
- No long-term memory overhead

## Testing Recommendations

### Manual Testing Scenarios

1. **Basic Conflict**:
   - Subscribe to a calendar
   - Edit an event
   - Manually sync
   - Verify dialog appears

2. **Keep Local**:
   - Create conflict
   - Choose "Keep My Changes"
   - Verify event stays edited
   - Verify no re-sync attempts

3. **Use Synced**:
   - Create conflict
   - Choose "Use Synced Data"
   - Verify event reverts to original
   - Verify sync completes

4. **Multiple Conflicts**:
   - Edit 3+ events from same subscription
   - Sync
   - Verify count shows "3 items"
   - Verify preview shows up to 5 items

5. **Cross-Subscription**:
   - Edit events from 2 different subscriptions
   - Sync all
   - Verify both calendars listed
   - Verify total count is correct

6. **No Conflicts**:
   - Don't edit any synced events
   - Sync
   - Verify no dialog, sync proceeds silently

### Automated Testing (Future)

```typescript
// Example test cases
describe('Sync Conflict Resolution', () => {
  test('detects modified items', () => {
    // Create item, sync, modify, sync again
    // Assert conflict is detected
  });
  
  test('keeps local changes when chosen', () => {
    // Create conflict, choose keep
    // Assert original edit remains
  });
  
  test('uses synced data when chosen', () => {
    // Create conflict, choose synced
    // Assert edit is discarded
  });
  
  test('handles dialog close gracefully', () => {
    // Create conflict, close dialog
    // Assert treated as keep local
  });
});
```

## Known Limitations

### 1. All-or-Nothing Resolution
- Can't pick and choose individual items
- Can't merge fields (keep your title but their time)
- Resolution applies to entire subscription

### 2. One-Way Sync Only
- Local changes don't sync back to source
- This is by design (read-only subscription model)

### 3. No Conflict History
- No log of what was changed
- No side-by-side comparison view
- Limited to item preview

### 4. Timestamp-Based Detection
- Relies on accurate system clocks
- Could theoretically have false positives if clock changes

## Future Enhancements

### Short-Term
- [ ] Toast notifications for sync success/failure
- [ ] Per-item conflict resolution
- [ ] Conflict history log

### Medium-Term
- [ ] Side-by-side comparison view
- [ ] Field-level merge capability
- [ ] Auto-resolution preferences

### Long-Term
- [ ] Two-way sync support
- [ ] Conflict resolution rules engine
- [ ] Backup/restore before discarding changes

## Migration Notes

### For Existing Users
- No breaking changes
- Existing data structure is compatible
- `localOverrides` field is optional
- `lastModified` is set on next edit

### Data Migration
None required. The fields are optional and will populate naturally as users edit items.

## Files Modified

1. `src/lib/types/index.ts` - Added conflict types
2. `src/lib/components/SyncConflictDialog.svelte` - New component
3. `src/lib/stores/activities.ts` - Enhanced update tracking
4. `src/App.svelte` - Updated sync logic and added dialog

## Files Created

1. `SYNC_CONFLICT_RESOLUTION.md` - User documentation
2. `SYNC_CONFLICT_IMPLEMENTATION.md` - This file

## Dependencies

No new external dependencies required. Uses:
- Svelte core features (stores, events, components)
- Native JavaScript Map for pending data
- Existing UI patterns and styles

## Accessibility

- Keyboard navigable (Tab, Enter, Escape)
- ARIA labels on interactive elements
- Focus management (dialog traps focus)
- Screen reader friendly structure
- High contrast support via dark mode

## Security Considerations

No security implications. All operations are local to the client:
- No new network requests
- No data sent to external services
- No new storage of sensitive data
- Conflict resolution is purely UI logic

## Conclusion

This implementation provides a robust, user-friendly solution to prevent data loss during calendar syncs. It maintains the simplicity of the existing sync system while adding safety guardrails for users who customize their synced events.

The design is extensible for future enhancements like per-item resolution and field-level merging, while remaining simple and efficient for the common case (no conflicts).