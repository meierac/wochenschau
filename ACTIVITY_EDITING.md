# Activity Editing Sheet Documentation

## Overview

Activities are now edited in a dedicated sheet/drawer component instead of inline editing. This provides a better user experience with more space for editing and consistent UI patterns.

## Architecture

### Components

#### ActivityCard.svelte
- **Purpose**: Display a calendar activity in compact form
- **Responsibility**: Show activity details, dispatch edit/delete events
- **No longer handles**: Inline editing
- **Events dispatched**:
  - `edit`: Fired when user clicks edit button, passes the activity
  - `delete`: Fired when user confirms delete

#### ActivityEditSheet.svelte
- **Purpose**: Modal/drawer for editing a calendar activity
- **Type**: Fixed position overlay (bottom sheet on mobile, centered on desktop)
- **Features**:
  - Full editing of activity details (name, start time, end time, description)
  - Duration display (calculated from start/end times)
  - Source information display (for iCal/template sourced activities)
  - Delete button
  - Save/Cancel actions
- **Props**:
  - `activity: CalendarItem` - The activity being edited
  - `isDesktop: boolean` - Layout mode
- **Events**:
  - `save`: Fired with updated activity data
  - `delete`: Fired when user confirms delete
  - `close`: Fired when user cancels

#### DayColumn.svelte
- **Purpose**: Display all activities for a specific day
- **Changes**: Now manages edit sheet state
- **Responsibilities**:
  - Display activities via ActivityCard
  - Listen for edit events from ActivityCard
  - Show ActivityEditSheet when editing
  - Handle save/delete from edit sheet
  - Update activities store

### Data Flow

```
User clicks edit button on ActivityCard
  ↓
ActivityCard dispatches "edit" event with activity
  ↓
DayColumn receives event, sets editingActivity
  ↓
ActivityEditSheet mounts and displays
  ↓
User makes changes and clicks Save
  ↓
ActivityEditSheet dispatches "save" event with updated activity
  ↓
DayColumn receives event, calls activities.updateActivity()
  ↓
Activity updated in store and UI updates automatically
```

## User Experience

### Desktop
- Click edit button (✎) on an activity card
- Sheet opens as a modal centered on screen
- Max-width: 28rem (md:max-w-md)
- User edits details
- Click "Save Changes" or "Cancel"

### Mobile
- Click edit button (✎) on an activity card
- Sheet slides up from bottom
- Full width with rounded top corners
- User edits details
- Click "Save Changes" or "Cancel"
- Sheet slides back down

## Features

### Activity Fields
- **Summary**: Activity name/title
- **Start Time**: Using time input (HH:mm format)
- **End Time**: Using time input (HH:mm format)
- **Description**: Optional longer text field
- **Source Info**: Read-only display of where activity came from (iCal, template, etc.)

### Computed Fields
- **Duration**: Automatically calculated and displayed
  - Format: "Xh Ym" (e.g., "1h 30m")
  - Updates in real-time as user changes times

### Change Detection
- "Save Changes" button only enables if user has made changes
- Compares: summary, startTime, endTime, description
- Prevents unnecessary saves

### Accessibility
- All inputs have associated labels with `for` attributes
- Descriptive aria-labels for buttons
- Proper focus management with keyboard navigation
- High contrast mode compatible

## Styling

### Layout
- Uses Tailwind CSS for responsive design
- Grid layout for time inputs (2 columns on mobile+)
- Dark mode compatible via CSS variables

### Colors
- Primary color for save button
- Secondary color for cancel button
- Destructive color for delete button
- Muted background for info sections

### States
- Normal: Standard appearance
- Hover: Subtle background color change
- Focus: Ring focus indicator
- Disabled: Reduced opacity, not clickable

## API Integration

### Saving Changes
```typescript
// DayColumn handles this:
function handleSaveActivity(event: CustomEvent<CalendarItem>) {
    const updatedActivity = event.detail;
    activities.updateActivity(updatedActivity);
    editingActivity = null;
}
```

### Deleting Activity
```typescript
// DayColumn handles this:
on:delete={() => {
    if (editingActivity) {
        activities.removeActivity(editingActivity.id);
    }
    editingActivity = null;
}}
```

## Future Enhancements

### Potential Features
- Recurrence rules (repeat daily, weekly, etc.)
- Category/color selection
- Attachments or file uploads
- Reminders/notifications
- Participant invitations (for team calendars)
- Activity templates
- Drag-to-reschedule from calendar view

### Considerations
- Currently only supports editing within current week
- Time zone handling not yet implemented
- Bulk edit operations not available
- History/undo not implemented

## Testing Checklist

- [ ] Edit button appears on activity cards
- [ ] Clicking edit opens the sheet
- [ ] Sheet displays current activity values
- [ ] Can edit summary text
- [ ] Can change start and end times
- [ ] Duration updates in real-time
- [ ] Can add/edit description
- [ ] Source info displays for iCal items
- [ ] Save button disabled until changes made
- [ ] Clicking Save updates the activity
- [ ] Clicking Cancel closes without saving
- [ ] Delete button shows confirmation
- [ ] Clicking Delete removes activity
- [ ] Sheet opens at bottom on mobile
- [ ] Sheet opens centered on desktop
- [ ] Close button (✕) works
- [ ] Keyboard escape closes sheet
- [ ] All fields are keyboard accessible

## Browser Support

Tested and working on:
- Chrome 89+
- Firefox 88+
- Safari 14+
- Edge 89+
- iOS Safari 14+
- Chrome Mobile
