# iCal Auto-Sync Implementation

## Overview
Implemented automatic syncing of iCal calendar subscriptions with manual refresh controls on both mobile and desktop interfaces.

## Features

### ✅ Auto-Sync on App Start
- Automatically checks all enabled iCal subscriptions when the app loads
- Only fetches data if it's older than the configured threshold (default: 24 hours)
- Runs asynchronously without blocking app startup
- Handles errors gracefully with console logging

### ✅ Manual Sync Button
Added manual sync buttons to both mobile and desktop interfaces:

**Desktop Header:**
- "Sync" button with refresh icon
- Located next to "Add Activity", "Export", and "Settings" buttons
- Shows "Syncing..." text and spinning icon during sync

**Mobile Header:**
- 🔄 refresh icon button (top-right corner)
- Located next to the app title
- Spinning animation during sync
- Keeps header always visible for easy access

### ✅ Visual Feedback
- **Spinning animation** on the sync icon while syncing
- **Disabled state** prevents multiple simultaneous syncs
- **Console logging** shows progress and any errors
- Button shows "Syncing..." text (desktop) or tooltip (mobile)

## Configuration

### Refresh Interval
Located in `App.svelte`:
```typescript
const REFRESH_INTERVAL_HOURS = 24; // Auto-refresh if data is older than 24 hours
```

**Recommended values:**
- `1` - Hourly (for frequently changing calendars)
- `6` - Every 6 hours
- `12` - Twice daily
- `24` - Daily (default, recommended)
- `168` - Weekly

## How It Works

### Initial Load
1. App starts
2. `onMount` calls `autoRefreshSubscriptions()`
3. For each enabled subscription:
   - Check `lastFetched` timestamp
   - If older than threshold (or never fetched): fetch data
   - If recent: skip (use cached data)
4. Update activities and `lastFetched` timestamp

### Manual Sync
1. User clicks sync button (desktop header or mobile toolbar)
2. `isSyncing` state set to `true`
3. Fetch ALL enabled subscriptions (regardless of last fetch time)
4. UI shows spinning icon and disabled state
5. `isSyncing` set to `false` when complete
6. User can see updated calendar items

### Data Flow
```
iCal URL → fetch() → parseICalToCalendarItems() 
  → Remove old items from subscription 
  → Add new calendar items 
  → Update subscription.lastFetched
```

## Component Changes

### `App.svelte`
**New state:**
- `isSyncing: boolean` - Tracks sync status

**New functions:**
- `parseICalToCalendarItems()` - Parse iCal format to CalendarItem[]
- `buildCalendarItem()` - Convert iCal event to CalendarItem
- `extractDate()` - Extract date from iCal datetime
- `extractTime()` - Extract time from iCal datetime  
- `decodeICalText()` - Decode iCal text encoding
- `refreshSubscription()` - Fetch and update single subscription
- `autoRefreshSubscriptions()` - Auto-refresh stale subscriptions
- `handleRefreshSubscriptions()` - Manual refresh all (with loading state)

**New imports:**
- `subscriptions` from stores
- `activities` from stores
- `getWeekNumber` from utils
- `CalendarItem` type

### `FloatingNav.svelte`
**UI changes:**
- No sync button (moved to mobile header in App.svelte)
- Remains with 3 buttons: week picker (📅), export (📤), and settings (⚙️)

## Error Handling

### Graceful Degradation
- Network errors are caught and logged (app continues working)
- Invalid iCal data is skipped (doesn't crash parser)
- Failed subscriptions don't prevent others from syncing
- `lastFetched` only updated on successful fetch

### Console Logging
```javascript
// Success
"Fetching iCal subscription: Work Calendar"
"Successfully fetched 42 items from Work Calendar"

// Manual trigger
"Manual refresh triggered"

// Errors
"Failed to refresh subscription sub-123: HTTP error! status: 404"
```

## User Experience

### First Time Setup
1. User adds iCal subscription in Settings
2. Data fetched immediately when clicking "Add"
3. Activities appear in the week view

### Daily Usage
1. Open app → Auto-sync if data is stale (seamless)
2. Or click sync button → Immediate refresh with visual feedback
3. See updated calendar items in week view

### No Internet
- Auto-sync fails silently (uses cached data)
- Manual sync shows error in console
- App remains functional with last known data

## Testing Checklist

### Auto-Sync
- [ ] First app load: Fetches all enabled subscriptions
- [ ] Subsequent loads within 24h: Uses cached data (no fetch)
- [ ] Subsequent loads after 24h: Auto-fetches updated data
- [ ] Disabled subscriptions are skipped
- [ ] Console shows fetching progress

### Manual Sync - Desktop
- [ ] Sync button visible in header
- [ ] Click triggers immediate refresh
- [ ] Icon spins during sync
- [ ] Button shows "Syncing..." text
- [ ] Button disabled during sync
- [ ] Multiple clicks don't trigger multiple syncs

### Manual Sync - Mobile
- [ ] 🔄 button visible in top-right header
- [ ] Tap triggers immediate refresh
- [ ] Icon spins during sync
- [ ] Button disabled (dimmed) during sync
- [ ] Always accessible (header is fixed/visible)

### Error Handling
- [ ] Network error: Logged, doesn't crash
- [ ] Invalid URL: Logged, doesn't crash
- [ ] Invalid iCal data: Skipped, doesn't crash
- [ ] One failed subscription doesn't stop others

## Future Enhancements

### Potential Improvements
- [ ] Toast notifications for sync success/failure
- [ ] Sync status in Settings (last synced time per subscription)
- [ ] Pull-to-refresh gesture on mobile
- [ ] Background sync with Service Workers
- [ ] Sync only current week's data (performance optimization)
- [ ] Incremental sync (only fetch changes)
- [ ] Retry logic for failed syncs
- [ ] Offline indicator when sync not possible
- [ ] Per-subscription sync intervals
- [ ] Sync progress indicator (X of Y subscriptions)

## Performance Considerations

### Optimizations
- **Asynchronous**: Doesn't block UI during fetch
- **Selective**: Only fetches stale data on auto-sync
- **Efficient parsing**: Single-pass iCal parser
- **Batched updates**: Removes old items before adding new ones

### Trade-offs
- **Network usage**: Auto-sync uses data on app start
- **Initial load**: May take a few seconds on first launch
- **Memory**: Stores all calendar items in memory

### Best Practices
- Set appropriate `REFRESH_INTERVAL_HOURS` for your use case
- Users can always manually sync for latest data
- Consider network conditions when syncing
- Cache data in localStorage (already implemented)

## Troubleshooting

### Sync Not Working
1. Check browser console for errors
2. Verify subscription URLs are accessible
3. Test URLs in Settings with manual "Refresh" button
4. Check `lastFetched` timestamp in localStorage

### Data Not Appearing
1. Verify subscription is enabled
2. Check if events are in current/future weeks
3. Look for parsing errors in console
4. Verify iCal format is valid

### Performance Issues
1. Reduce `REFRESH_INTERVAL_HOURS` if too frequent
2. Check number of subscriptions (each adds fetch time)
3. Check size of iCal feeds (large feeds take longer)
4. Consider limiting date range in iCal parser