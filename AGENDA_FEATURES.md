# Wochenschau - Agenda Features Guide

## Overview

Wochenschau now includes a comprehensive week-view agenda system with support for activities, templates, and iCal subscriptions. All data is stored locally in your browser using localStorage.

## Core Features

### 1. Week View

The main interface displays a full week starting with Monday through Sunday. Each day has its own column showing all activities for that day.

**Desktop:**
- Full 7-column grid layout
- Week navigation buttons (Previous/Next)
- Week picker for quick date selection
- Activity cards with edit/delete options

**Mobile:**
- Vertical scrolling columns
- Floating navigation bar at the bottom
- Week picker integrated into floating nav
- Touch-optimized interface

### 2. Activity Management

#### Creating Activities

**Method 1: Global Add Button**
1. Click "+ Add Activity" button
2. Select a day of the week (Mon-Sun)
3. Fill in details:
   - Activity name (required)
   - Start time
   - End time
   - Optional: Save as template
4. Confirm to add

**Method 2: Quick Add (Day Column)**
- Click "+ Add" button on any day column
- Enter activity details inline
- Save or cancel

#### Editing Activities

- Click the edit icon (✎) on any activity card
- Modify name, start time, or end time
- Click Save to confirm

#### Deleting Activities

- Click the delete icon (✕) on any activity card
- Confirm deletion in the popup

### 3. Activity Templates

Templates allow you to quickly reuse activities with the same settings.

#### Creating Templates

**Option A: Save during Activity Creation**
- When creating a new activity, check "Save as template"
- The activity and template are created together

**Option B: Create from Template Manager**
1. Click "Templates" button
2. Click "+ New Template"
3. Enter template details
4. Click Save

#### Using Templates

1. Click "+ Add Activity"
2. Select day
3. In the template section, click the template you want to use
4. Template name, start time, and end time are auto-filled
5. Modify if needed and save

#### Managing Templates

- Open Templates manager
- View all saved templates
- Delete templates you no longer need
- Templates are listed with their time slots

### 4. Calendar Week Picker

Select any week from this year or next year.

**How to Use:**
1. Click the week picker button (shows current week number)
2. Select year (current year or next year)
3. Select week number (1-52)
4. Click "Select" to update the view

**Available in:**
- Desktop: Top navigation bar
- Mobile: Floating navigation bar (calendar icon)

### 5. iCal Subscriptions

Integrate events from external calendars (Google Calendar, Outlook, etc.) via iCal links.

#### Adding a Subscription

1. Click "iCal" or the calendar link icon
2. Click "+ Add Subscription"
3. Enter subscription details:
   - **Name**: Friendly name (e.g., "Work Calendar")
   - **URL**: Full iCal URL (must be publicly accessible)
4. Click "Add"
5. Events will be imported and added to your week view

#### Managing Subscriptions

**Enable/Disable:**
- Toggle the checkbox next to each subscription
- Disabled subscriptions still keep their data but won't show in the view

**Refresh:**
- Click "Refresh" on individual subscription to update
- Click "Refresh All" to update all enabled subscriptions
- Last fetched date is shown below each subscription

**Delete:**
- Click "Delete" to remove a subscription
- This removes the subscription but not any activities already created

#### iCal Event Overrides

Events imported from iCal can be locally modified:
- Edit the imported event as normal
- Changes are saved to localStorage
- Original iCal data remains unchanged
- When subscription refreshes, your edits are preserved

### 6. Data Storage

All data is stored locally in your browser:

**Storage Items:**
- `wochenschau_activities` - All activities
- `wochenschau_templates` - Saved templates
- `wochenschau_ical_subscriptions` - iCal subscription URLs and settings
- `wochenschau_ical_events` - Imported iCal events

**Data Persistence:**
- Data persists across browser sessions
- Data is per-browser (not synced across devices)
- Clearing browser data will delete everything

### 7. Theme Support

The app automatically adapts to your system theme:

**Light Mode:**
- Clean white background
- Dark text
- Blue accent colors

**Dark Mode:**
- Dark background
- Light text
- Lighter blue accents

Theme changes apply instantly when you change your system preferences.

## User Interface

### Desktop Layout

```
┌─────────────────────────────────────────────────┐
│ 📅 Wochenschau │ + Add Activity │ Templates │ iCal │
├─────────────────────────────────────────────────┤
│ Week 42, 2024          Oct 14 - Oct 20         │
│ ← Previous  │  Pick Week  │  Next →            │
├──┬──┬──┬──┬──┬──┬──────────────────────────────┤
│M │T │W │Th│F │Sa│Su                           │
├──┼──┼──┼──┼──┼──┼──────────────────────────────┤
│  │  │  │  │  │  │                              │
│  │  │  │  │  │  │  Activities Display         │
│  │  │  │  │  │  │                              │
└──┴──┴──┴──┴──┴──┴──────────────────────────────┘
```

### Mobile Layout

```
┌──────────────────────────┐
│ 📅 Wochenschau          │
├──────────────────────────┤
│  Mon  │ Tue │ Wed │...  │
│       │     │     │     │
│       │     │     │     │
│       │     │     │     │
│       │     │     │     │
├──────────────────────────┤
│ W42 │ + Activity │ ⭐ │ 🔗 │  ← Floating Nav
└──────────────────────────┘
```

## Common Tasks

### Add a Recurring Activity

Wochenschau doesn't have built-in recurring, but you can:
1. Create the activity for one week
2. Save it as a template
3. For future weeks, use the template to quickly add it

### Import Calendar Events

1. Get your calendar's iCal URL:
   - Google Calendar: Right-click calendar → Settings → Copy URL
   - Outlook: Export calendar as .ics, then host the link
   - Other services: Usually in Settings → Export/Subscribe

2. Add subscription in Wochenschau:
   - Click "iCal"
   - Click "+ Add Subscription"
   - Paste URL and give it a name
   - Click "Add"

3. Events appear in your week view automatically

### Edit Imported Events

1. Imported events appear just like regular activities
2. Click the edit icon (✎) on an imported event
3. Make your changes
4. Your changes are saved locally and preserved on refresh

### Clear All Data

To reset everything:
1. Open browser settings
2. Clear browsing data
3. Select "All time"
4. Check "Cookies and other site data"
5. Clear data

Or programmatically: Wochenschau stores data under these keys:
- `wochenschau_activities`
- `wochenschau_templates`
- `wochenschau_ical_subscriptions`
- `wochenschau_ical_events`

## Tips & Best Practices

### Organization

- **Use templates** for frequently used activities (e.g., meetings, gym sessions)
- **Give descriptive names** to activities and subscriptions
- **Use iCal subscriptions** for read-only calendars (shared calendars, holidays)

### Performance

- Large week views (100+ activities per week) may be slow
- Consider archiving old weeks by clearing activities
- Limit number of active iCal subscriptions

### Mobile

- Use the floating navigation bar for quick access
- Week picker is integrated into the bottom nav
- Swipe left/right to scroll between days
- Pull down to refresh iCal subscriptions

### Accessibility

- All buttons are touch-friendly (minimum 44px tap targets)
- Keyboard navigation works on desktop
- High contrast theme support
- Screen reader friendly

## Data Limits

- **Activities**: No hard limit (browser storage ~5-10MB)
- **Templates**: Recommended max 100 (fast lookup)
- **iCal Subscriptions**: Recommended max 10 (performance)
- **Week View**: Recommended max 100 activities/week (display performance)

## Troubleshooting

### Activities not appearing

1. Check the correct week is selected
2. Verify the year is correct
3. Check iCal subscription is enabled
4. Try refreshing in the iCal manager

### iCal events not importing

1. Verify the iCal URL is valid and publicly accessible
2. Check the calendar service exports in iCal format (.ics)
3. Try refreshing the subscription
4. Check browser console for error messages

### Data disappeared

1. Check if browser data was cleared
2. Verify you're using the same browser
3. Check if cookies are enabled
4. Try restoring from browser history if available

### Performance issues

1. Try limiting active subscriptions
2. Clear old activities from past weeks
3. Reduce number of templates
4. Close other browser tabs

## Browser Compatibility

- ✅ Chrome/Chromium 90+
- ✅ Firefox 90+
- ✅ Safari 14+ (iOS 14+)
- ✅ Edge 90+

## Privacy & Security

- All data stored locally in your browser
- No data sent to external servers (except iCal fetch)
- iCal URLs are stored in localStorage
- Clear browser data to delete everything
- Consider using HTTPS for iCal URLs

## Future Enhancements

Potential features for future updates:
- Recurring activities
- Activity categories/colors
- Activity notes/descriptions
- Week view export (PDF/CSV)
- Local backup/restore
- Activity search
- Dark/light theme toggle
- Multi-language support
- Time zone support
- Activity reminders