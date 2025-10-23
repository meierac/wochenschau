# Wochenschau - Quick Reference Guide

## 🚀 Getting Started

### First Time Setup
1. Open the app in your browser
2. You're viewing the current week
3. Start adding activities!

### Basic Navigation
- **Desktop**: Use navigation buttons at the top
- **Mobile**: Use the floating bar at the bottom

## 📅 Week View

### Reading the Week
- Each column is a day (Mon-Sun)
- Activities shown as cards with time
- Color indicates source (blue = manual, darker = imported)

### Changing Weeks
1. Click the week picker (shows "W##")
2. Select year and week number
3. Click "Select" to update

### Quick Navigation
- **← Previous**: Go to last week
- **Next →**: Go to next week

## ➕ Adding Activities

### Method 1: Quick Add (Mobile/Desktop)
1. Click "+ Add" on any day column
2. Enter activity details inline
3. Save

### Method 2: Global Add (Recommended)
1. Click "+ Add Activity" button
2. Select day (Mon-Sun grid)
3. Fill in details:
   - **Name**: Activity title (required)
   - **Start time**: When it starts
   - **End time**: When it ends
   - **Save as template**: For reuse

### Activity Details
```
Activity Name: "Team Meeting"
Start: 10:00
End: 11:00
Duration: 1h 0m  ← Calculated automatically
```

## ✏️ Editing & Deleting

### Edit Activity
1. Click the edit icon (✎) on activity card
2. Change name, start, or end time
3. Click "Save"

### Delete Activity
1. Click delete icon (✕) on activity card
2. Confirm in popup
3. Activity removed

## ⭐ Templates

### Save as Template
During "Add Activity" step → Check "Save as template"

### Use Template
1. "+ Add Activity"
2. Select day
3. Click template in the list
4. Details auto-fill
5. Modify if needed → Save

### Manage Templates
1. Click "Templates" button
2. View all saved templates
3. Create new or delete existing

**Templates are perfect for:**
- Recurring meetings
- Gym sessions
- Lunch breaks
- Regular tasks

## 🔗 iCal Integration

### Add Calendar from URL

1. Click "iCal" button
2. Click "+ Add Subscription"
3. Enter:
   - **Name**: e.g., "Work Calendar"
   - **URL**: iCal link from your calendar
4. Click "Add"
5. Events appear in your week!

### Finding iCal URLs

**Google Calendar:**
1. Right-click calendar
2. Settings
3. Copy iCal URL

**Outlook/Microsoft:**
1. Settings → Calendar
2. Export as .ics
3. Host the file and use URL

**Apple Calendar:**
1. Share calendar
2. Copy public link
3. Add .ics to URL

### Manage Subscriptions

**Refresh Events:**
- "Refresh" = Update one calendar
- "Refresh All" = Update all calendars

**Enable/Disable:**
- Toggle checkbox to show/hide events
- Data stays saved when disabled

**Delete:**
- Click "Delete" to remove subscription
- Activities imported stay (you can delete manually)

## 🌙 Theme

The app automatically matches your system:

**Light Mode:**
- White background
- Dark text
- Blue accents

**Dark Mode:**
- Dark background
- Light text
- Light blue accents

**To Change:**
Change your system theme settings → App updates instantly

## 💾 Data Storage

### Where is My Data?
- Stored in your browser (localStorage)
- Not on any server
- Private and secure
- Persists when you close browser

### Data Includes
- ✅ All activities
- ✅ Templates
- ✅ iCal subscriptions
- ✅ Settings

### Backup Your Data
Browser dev tools → Application → Local Storage → Find `wochenschau_*` → Copy values

### Delete Everything
1. Browser Settings → Clear browsing data
2. Select "All time"
3. Check "Cookies and site data"
4. Clear

## 🎯 Pro Tips

### Organize Activities
- Use templates for recurring activities
- Name activities clearly
- Set accurate times for better visualization

### Use iCal for
- Imported/shared calendars (work, family)
- Holiday calendars
- Read-only calendars
- External events

### Performance
- Keep ~100 activities per week max
- Delete old activities from past weeks
- Limit active iCal subscriptions to 10

### Mobile Tips
- Use floating nav for quick access
- Week picker is in the floating bar
- Buttons are thumb-friendly (44px+)
- Swipe left/right to scroll days

## ❓ Common Issues

### Activities disappeared
- Check if correct week selected
- Refresh browser
- Check browser didn't clear data

### iCal events not showing
- Verify URL is public/accessible
- Try "Refresh" button
- Check calendar exports .ics format
- Look at browser console for errors

### Slow performance
- Delete old activities
- Disable unused iCal subscriptions
- Try a different browser
- Close other tabs

### Data not saving
- Check if cookies enabled
- Try different browser
- Check storage quota (usually 5-10MB)
- Clear browser cache

## 🎨 Keyboard Shortcuts (Desktop)

| Action | Shortcut |
|--------|----------|
| Add Activity | Alt + A |
| Templates | Alt + T |
| iCal | Alt + I |
| Close Modal | Esc |

## 📱 Mobile Floating Nav

**Bottom Bar Icons:**
- 📅 **Calendar**: Pick different week
- ➕ **Plus**: Add new activity
- ⭐ **Star**: Manage templates
- 🔗 **Link**: Manage iCal

Long-press for more options (future feature)

## 🔒 Privacy & Security

- ✅ All data stored locally
- ✅ No tracking
- ✅ No data sent anywhere (except iCal fetch)
- ✅ HTTPS recommended for iCal URLs
- ✅ Safe on public WiFi (data stays local)

## ⚡ Quick Workflow

### Daily Use
```
1. Open app (your week loads)
2. Scan activities
3. Add new activities as needed
4. Click on activity to edit/delete
```

### Weekly Planning
```
1. Open app
2. Pick next week
3. Create activities for that week
4. Use templates to speed up
```

### Calendar Integration
```
1. Get iCal URL from calendar
2. Click "iCal"
3. Add subscription
4. Events appear instantly
5. Refresh weekly or as needed
```

## 📞 Need Help?

**Feature Guide:** See `AGENDA_FEATURES.md`
**Technical Details:** See `IMPLEMENTATION_SUMMARY.md`
**Main Docs:** See `README.md` and `SETUP.md`

## 🎉 You're Ready!

Start with:
1. Add a few activities for today
2. Try creating a template
3. Pick a different week and add more
4. Optional: Add an iCal subscription

Enjoy organizing your week! 📅✨