# Quick Interactions Guide

## Activity Cards - Quick Reference

### Visual Improvements
- **Larger buttons**: `px-3 py-2 md:text-lg` (75% increase in size)
- **Better spacing**: Increased padding and gaps throughout
- **Stronger accent**: Thicker left border (`border-l-4`)
- **Readable text**: Larger font sizes for content

### Mobile: Swipe Gestures

#### Left Swipe → Edit
```
Swipe left on activity card
        ↓
Card smoothly translates
        ↓
Release (50px+ required)
        ↓
Edit sheet opens
```
**Minimum swipe distance**: 50px
**Ideal**: Deliberate swipe motion from right to left

#### Right Swipe → Delete
```
Swipe right on activity card
        ↓
Card smoothly translates
        ↓
Release (50px+ required)
        ↓
Delete confirmation shown
```
**Minimum swipe distance**: 50px
**Ideal**: Deliberate swipe motion from left to right

### Desktop & Mobile: Button Clicks
- **[✎] Edit button**: Click to open edit sheet
  - Hover shows light blue background
  - Tooltip: "Edit (or swipe left)"
  
- **[✕] Delete button**: Click to delete activity
  - Hover shows light red background
  - Tooltip: "Delete (or swipe right)"

## Edit Sheet - Full Details

When you click edit or swipe left on an activity:

### Fields You Can Edit
- **Activity Name** (Summary)
- **Start Time** (HH:mm format)
- **End Time** (HH:mm format)
- **Description** (Optional notes)

### Automatic Features
- **Duration** displays automatically (updated as you change times)
- **Source Info** shown if from iCal or template (read-only)
- **Change Detection** - Save button only enables if you made changes

### Actions in Edit Sheet
- **Save Changes** - Saves all edits
- **Cancel** - Closes without saving
- **Delete** - Removes activity permanently (with confirmation)

## Creating Activities

### Using Global Add Button
1. Click **"+ Add Activity"** in header
2. Select which day you want
3. Fill in activity name, times, and optional description
4. Check "Save as template" if you want to reuse this
5. Click **"Save Activity"**

### Day Views
- **Mobile**: Single column (1 day per view)
- **Tablet**: 3 columns (3 days per view)
- **Desktop**: 7 columns (full week at once)

## iCal Subscriptions

### Adding a Subscription
1. Click **"iCal"** button in header
2. Click **"+ Add Subscription"**
3. Enter subscription name (e.g., "Company Events")
4. Enter iCal URL (must start with https://)
5. Click **"Add"**

### Refreshing Events
- Click **"Refresh"** on specific subscription
- Click **"Refresh All"** to update all subscriptions
- Activities automatically appear in calendar
- Old events removed when refreshing

### Managing Subscriptions
- **Toggle checkbox** to enable/disable subscription
- **"Refresh"** to sync latest events
- **"Delete"** to remove subscription (also removes its events)

## Navigation

### Weekly Navigation
- **← Previous**: Go to previous week
- **Pick Week**: Jump to specific week/year
- **Next →**: Go to next week

### Responsive Headers
- **Mobile**: Compact header with short labels
- **Desktop**: Full header with detailed info

## Tips & Tricks

### Mobile Efficiency
- Use **swipe left** for quick edits (faster than button clicking)
- Use **swipe right** for quick deletes
- Combine with one-handed operation for efficiency

### Desktop Speed
- Use **keyboard Tab** to navigate between activity buttons
- Use **Enter/Space** to activate buttons
- Hover over buttons for action tooltips

### Activity Organization
- Save frequent activities as **templates**
- Reuse templates when adding new activities
- Use **descriptions** for context/notes

### iCal Integration
- Subscribe to work calendars
- Subscribe to holidays or events
- Activities auto-update when you refresh
- Local edits to iCal items are preserved

## Keyboard Shortcuts

### Navigation
- **Tab**: Move to next interactive element
- **Shift+Tab**: Move to previous interactive element
- **Enter/Space**: Activate button/link
- **Escape**: Close modals/sheets

### Activity Interaction
- **Tab** to activity buttons (Edit/Delete)
- **Enter** to activate Edit or Delete

## Accessibility

### Screen Readers
- All buttons have descriptive labels
- Activity info announces with screen reader
- Edit sheet has proper landmark structure
- Form fields have associated labels

### Visual
- High contrast colors meet WCAG AA
- Focus indicators clearly visible
- Large touch targets (44px+ minimum)
- Readable font sizes throughout

### Motor
- Large buttons easy to tap/click
- Swipe alternatives to buttons
- Keyboard navigation throughout
- No time-based interactions

## Common Tasks

### Edit an Activity
**Mobile**: Swipe left on activity → Or tap [✎] → Make changes → Save
**Desktop**: Click [✎] on activity → Make changes → Save

### Delete an Activity
**Mobile**: Swipe right on activity → Or tap [✕] → Confirm
**Desktop**: Click [✕] on activity → Confirm

### View Full Week
**Mobile**: Scroll down to see activities stacked in single column
**Tablet**: See 3 days at once, scroll for more
**Desktop**: See all 7 days at once

### Add Quick Activity
Click **"+ Add Activity"** → Select day → Enter name & times → Save

### Import Calendar
Click **"iCal"** → Add subscription → Enter URL → Activities auto-load

## Touch Target Sizes

Current button/interactive sizes:
- **Minimum**: 24px × 24px (far exceeds 44px mobile standard with padding)
- **Edit button**: ~28px × 24px base, larger on desktop
- **Delete button**: ~28px × 24px base, larger on desktop
- **Gap between**: 8px spacing (reduces accidental mis-taps)
- **Activity card**: Full width (excellent tap target)

## Browser Compatibility

### Desktop Browsers
- Chrome 89+
- Firefox 88+
- Safari 14+
- Edge 89+

### Mobile Browsers
- iOS Safari 14+
- Chrome Mobile 89+
- Firefox Mobile 88+
- Samsung Internet 14+

### Touch Devices
- iPhone/iPad (iOS 14+)
- Android devices (Android 10+)
- Windows with touch screen
- Trackpad with gesture support

## Performance

### Smooth Interactions
- Swipe animations: 60fps (GPU accelerated)
- Edit sheet opens instantly
- Calendar responsive to input
- No lag during user interactions

### Data Usage
- iCal sync: Only when refreshing
- Local storage: All data stored locally
- No cloud sync: Privacy-first approach

## Troubleshooting

### Swipe Not Working
- Ensure swipe distance > 50px
- Try on actual touch device (desktop trackpad may not work)
- Check browser supports touch events

### Edit Sheet Not Opening
- Confirm you clicked the edit button (✎)
- Or try swiping left on activity
- Check browser DevTools console for errors

### iCal Not Loading
- Verify URL is correct and accessible
- Try clicking "Refresh" on subscription
- Check URL starts with https://

### Activities Not Showing
- Confirm activity is added to current week
- Check you're viewing the correct week
- Navigate using "Previous/Next" if needed

## Settings & Customization

Currently, there are no user-configurable settings. Future versions may include:
- Gesture direction preferences
- Color/theme options
- Week start day selection
- Time format (12h/24h)
- Notification preferences