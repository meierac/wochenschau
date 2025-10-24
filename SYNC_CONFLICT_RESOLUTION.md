# Sync Conflict Resolution

## Overview

The Wochenschau app includes intelligent conflict detection when syncing iCal calendar subscriptions. If you've made local edits to calendar items that would be overwritten by a sync operation, the app will ask you whether to keep your changes or accept the synced data.

## How It Works

### Conflict Detection

When syncing calendar subscriptions, the app checks for conflicts by:

1. **Tracking Modifications**: Every calendar item has a `lastModified` timestamp that updates whenever you edit it
2. **Detecting Local Changes**: Items modified after the last sync are flagged as potential conflicts
3. **Tracking Overrides**: The `localOverrides` field stores exactly what you changed from the original synced data
4. **Comparing UID**: Matches local items with incoming items using their unique identifier (`uid`)

### When Conflicts Are Detected

If the app finds calendar items that:
- Have been modified locally since the last sync, OR
- Have local overrides stored in their metadata

...it will pause the sync and show you a **Sync Conflict Dialog**.

### The Conflict Dialog

The dialog displays:
- **Total number of conflicts**: How many items have local changes
- **Affected calendars**: Which subscription(s) contain conflicts
- **Modified items list**: Preview of up to 5 conflicted items with their titles and descriptions

You have two choices:

#### 1. Keep My Changes
- **What happens**: Your local edits are preserved
- **Sync behavior**: The lastFetched timestamp updates, but conflicted items remain unchanged
- **Note**: Your changes won't sync back to the original calendar source (one-way sync)
- **Best for**: When you've customized items and want to keep your version

#### 2. Use Synced Data
- **What happens**: Your local changes are discarded
- **Sync behavior**: All items are replaced with fresh data from the calendar subscription
- **Note**: Any edits you made to these items will be lost
- **Best for**: When you want the latest data from the source and don't need your local edits

### No Conflicts Detected

If you haven't modified any synced calendar items, the sync proceeds automatically without showing the dialog.

## Technical Implementation

### Data Structure

Calendar items track modifications with these fields:

```typescript
interface CalendarItem {
  // ... other fields ...
  
  source: "manual" | "ical" | "template";
  sourceId?: string; // Subscription ID for synced items
  uid?: string; // Original iCal UID for tracking
  
  lastModified: number; // Timestamp of last edit
  localOverrides?: Partial<CalendarItem>; // What was changed locally
  
  createdAt: number;
}
```

### Conflict Detection Logic

```typescript
// Check if item was modified after last sync
const wasModifiedLocally = oldActivity.lastModified > subscriptionLastFetched;

// Check if item has any local overrides
const hasLocalOverrides = oldActivity.localOverrides && 
  Object.keys(oldActivity.localOverrides).length > 0;

if (wasModifiedLocally || hasLocalOverrides) {
  // This is a conflict!
}
```

### Automatic Tracking

When you edit a synced calendar item through the UI:

1. The `updateActivity` function automatically detects what changed
2. Changes are stored in the `localOverrides` field
3. The `lastModified` timestamp is updated
4. All of this happens transparently - you don't need to do anything special

### Tracked Fields

The following fields are tracked for conflicts:
- **summary** (title)
- **description**
- **dtstart** (start date/time)
- **dtend** (end date/time)
- **color**

## User Experience Flow

### Example Scenario

1. **Initial Sync**: You subscribe to a work calendar, syncing 20 events
2. **Local Edit**: You edit one event's title from "Team Meeting" to "Team Meeting - POSTPONED"
3. **Next Sync**: 24 hours later, auto-sync triggers
4. **Conflict Detected**: The app notices you edited "Team Meeting"
5. **Dialog Shown**: You're asked if you want to keep "POSTPONED" or use the original
6. **Your Choice**: 
   - Choose "Keep My Changes" → Your version stays, sync timestamp updates
   - Choose "Use Synced Data" → Original "Team Meeting" is restored

### Manual vs Auto Sync

- **Manual Sync**: Click the sync button in the header
- **Auto Sync**: Happens on app startup if data is older than 24 hours
- **Conflict Detection**: Works the same for both

Both trigger conflict detection if you have local modifications.

## Best Practices

### When to Keep Local Changes

- You've customized event titles for personal clarity
- You've added important notes in the description
- You've adjusted times to match your schedule
- You're using synced items as templates and personalizing them

### When to Use Synced Data

- You want to ensure you have the latest information
- The source calendar is the "source of truth"
- Your local edits were experimental or temporary
- You accidentally modified items and want to reset them

### Avoiding Conflicts

If you prefer to never see the conflict dialog:

1. **Don't edit synced items**: Only edit manually created items
2. **Use Templates**: Create templates instead of modifying synced items
3. **Disable Auto-Sync**: Turn off specific subscriptions when you don't need them

## Configuration

### Sync Interval

By default, subscriptions auto-refresh if data is older than 24 hours. You can modify this in `App.svelte`:

```typescript
const REFRESH_INTERVAL_HOURS = 24; // Change this value
```

### Skipping Conflict Check

The `refreshSubscription` function accepts a second parameter to skip conflict checking:

```typescript
await refreshSubscription(subscriptionId, true); // Skip conflict check
```

This is used internally when you choose "Use Synced Data" to apply the resolution.

## Limitations

### One-Way Sync Only

- Local changes don't sync back to the original calendar
- This is a subscription-based model, not bi-directional sync
- The app is designed to consume calendar data, not publish it

### No Per-Item Resolution

- The conflict dialog operates at the subscription level
- You can't choose "keep" for some items and "discard" for others
- It's an all-or-nothing choice per sync operation

### No Merge Capability

- You can't merge changes (e.g., keep your title but use their time)
- It's either your complete version or their complete version
- Manual re-editing is required if you want a hybrid approach

## Future Enhancements

Potential improvements for conflict resolution:

- **Per-Item Granularity**: Choose keep/discard for each conflicted item individually
- **Field-Level Resolution**: Mix and match fields (your title, their time, etc.)
- **Conflict History**: View what changed between your version and the synced version
- **Auto-Resolution Rules**: Set preferences like "always keep local changes"
- **Three-Way Merge**: Show original, your changes, and incoming changes side-by-side
- **Backup Before Sync**: Automatically save a backup before discarding local changes

## Troubleshooting

### Dialog Appears Unexpectedly

**Cause**: You may have inadvertently edited synced items.

**Solution**: 
- Review the conflict list to see what changed
- Choose "Use Synced Data" to reset to original
- Be more careful about which items you edit

### Changes Lost After Sync

**Cause**: You chose "Use Synced Data" or closed the dialog without choosing.

**Solution**:
- There's no undo for this - changes are permanently lost
- In the future, choose "Keep My Changes" if you want to preserve edits
- Note: Closing the dialog without choosing treats it as "Keep My Changes"

### Conflicts for Items I Didn't Edit

**Cause**: The `lastModified` timestamp might have been updated by another process, or the app's time tracking had issues.

**Solution**:
- If the items look correct, choose "Keep My Changes"
- If you're unsure, choose "Use Synced Data" to get fresh data
- This should be rare - please report if it happens frequently

### Sync Button Doesn't Show Conflicts

**Cause**: No conflicts exist, or auto-sync already processed them.

**Solution**:
- Conflicts only appear when you have local modifications
- Check that you actually edited items from synced calendars
- Manual-created items never trigger conflicts

## See Also

- [ICAL_AUTO_SYNC.md](./ICAL_AUTO_SYNC.md) - Auto-sync implementation details
- [README.md](./README.md) - General app documentation
- [SWIPEABLE_SHEETS_IMPLEMENTATION.md](./SWIPEABLE_SHEETS_IMPLEMENTATION.md) - UI component details