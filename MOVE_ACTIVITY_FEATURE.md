# Move Activity to Another Day Feature

## Overview
When editing an activity, users can now move it to a different day within the current week. This feature provides a convenient way to reschedule activities without having to delete and recreate them.

## Implementation Details

### Changes Made
The `ActivityEditSheet.svelte` component has been enhanced with the following additions:

1. **Day Selector UI**: A grid of buttons showing all 7 days of the week with their dates
2. **Date Recalculation**: Automatic updating of all date-related fields when the day changes
3. **Visual Feedback**: The currently selected day is highlighted with primary colors

### Technical Implementation

#### New Imports
- `WEEKDAYS_DE`: German weekday names for display
- `currentWeek`, `currentYear`: Stores to get the current week context
- `getWeekNumber`, `getDaysOfWeek`: Utility functions for date calculations

#### New State
```typescript
let selectedDay = activity.day; // Tracks the selected day (0-6, Monday-Sunday)
```

#### Day Change Detection
The `hasChanges` reactive statement now includes:
```typescript
selectedDay !== activity.day
```

#### Date Field Updates
When saving an activity with a changed day, the following fields are recalculated:
- `dtstart`: Start date/time in iCal format
- `dtend`: End date/time in iCal format
- `startDate`: Date in YYYYMMDD format
- `endDate`: Date in YYYYMMDD format
- `day`: Day index (0-6)
- `week`: ISO week number
- `year`: Year

### User Interface

The day selector appears between the "Activity Name" field and the "Time Selection" section. It displays:
- **7 buttons** in a 2-column grid
- **German weekday names** (Montag, Dienstag, etc.)
- **Formatted dates** (e.g., "15. Jan")
- **Visual highlighting** for the currently selected day

#### Visual Mockup

```
┌─────────────────────────────────────┐
│  ✕    Edit Activity           ✓     │
├─────────────────────────────────────┤
│                                     │
│ Activity Name                       │
│ ┌─────────────────────────────────┐ │
│ │ Team Meeting                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Day                                 │
│ ┌────────────┬────────────────────┐ │
│ │  Montag    │    Dienstag        │ │
│ │  13. Jan   │    14. Jan         │ │
│ ├────────────┼────────────────────┤ │
│ │ ▓▓▓▓▓▓▓▓▓▓ │    Donnerstag      │ │ ← Selected
│ │▓ Mittwoch ▓│    16. Jan         │ │
│ │▓ 15. Jan  ▓│                    │ │
│ ├────────────┼────────────────────┤ │
│ │  Freitag   │    Samstag         │ │
│ │  17. Jan   │    18. Jan         │ │
│ ├────────────┴────────────────────┤ │
│ │        Sonntag                  │ │
│ │        19. Jan                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Start Time          End Time        │
│ ┌─────────┐        ┌─────────┐     │
│ │ 09:00   │        │ 10:00   │     │
│ └─────────┘        └─────────┘     │
│                                     │
│ Duration                            │
│ ┌─────────────────────────────────┐ │
│ │ 1h 0m                           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Description                         │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│        Delete Activity              │
└─────────────────────────────────────┘
```

### User Experience Flow

1. User clicks edit (✎) on an activity card
2. Edit sheet opens with all current activity details
3. User can click any day button to move the activity
4. Selected day is highlighted immediately
5. User makes other edits (time, name, description) if desired
6. User clicks save (✓)
7. Activity is moved to the new day with updated date fields

### Edge Cases Handled

- **Same day selection**: No date fields are recalculated if day hasn't changed
- **Time preservation**: Start and end times remain unchanged when moving days
- **Week context**: Uses the current week being viewed for date calculations
- **All-day events**: Properly handles both timed and all-day events

### Compatibility

This feature works with activities from all sources:
- ✓ Manual activities
- ✓ iCal synced events (local overrides tracked)
- ✓ Template-based activities

For synced iCal events, changes are stored in the `localOverrides` field to preserve sync integrity.

## Future Enhancements

Potential improvements for future versions:
- [ ] Move activities across different weeks
- [ ] Bulk move multiple activities
- [ ] Drag-and-drop to move activities between days
- [ ] Move activities with keyboard shortcuts
- [ ] Undo/redo for move operations

## Testing Checklist

- [x] Build completes successfully
- [ ] Day selector displays correct dates
- [ ] Selected day is visually highlighted
- [ ] Moving activity updates all date fields correctly
- [ ] Activity appears in the correct day column after save
- [ ] Time remains unchanged after moving
- [ ] Works on both mobile and desktop layouts
- [ ] Works with manual, iCal, and template activities
- [ ] Local overrides tracked for synced events