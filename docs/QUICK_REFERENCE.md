# Template Duplicate Detection - Quick Reference Card

## Feature At A Glance

When adding an activity to the calendar, the system automatically detects if the activity matches an existing template and prevents saving it as a duplicate template.

---

## User Quick Reference

### ✅ When Checkbox is ENABLED
- Activity is unique
- No matching template exists
- You CAN save as a new template
- Label: "Save as template for reuse"

### ❌ When Checkbox is DISABLED
- Activity matches existing template
- OR a template is currently selected
- You CANNOT save as a new template
- Label: "Already a template"
- Appearance: Faded (50% opacity)

### What To Do
1. **Want to use an existing template?**
   - Click on template in "Use Template" section
   - Checkbox automatically disables

2. **Want to create a new template?**
   - Enter unique activity details
   - Checkbox remains enabled
   - Check the box before saving

3. **Accidentally matched a template?**
   - Change name, start time, or end time
   - Checkbox re-enables when no match found

---

## Matching Rules

Templates match when ALL three are identical:
- **Name**: Exact match (case-sensitive)
- **Start Time**: Exact match (HH:MM)
- **End Time**: Exact match (HH:MM)

### ✓ Will Match
- "Team Meeting" 09:00-10:00 = "Team Meeting" 09:00-10:00

### ✗ Won't Match
- "Team Meeting" 09:00-10:00 ≠ "Team Meeting" 09:30-10:00 (time differs)
- "Team Meeting" 09:00-10:00 ≠ "team meeting" 09:00-10:00 (case differs)
- "Team Meeting" 09:00-10:00 ≠ "Team Meeting 2" 09:00-10:00 (name differs)

---

## Technical Reference

### Location
**File**: `src/lib/components/AddActivityModal.svelte`

### Reactive Detection
```typescript
$: isCurrentActivityTemplate =
    selectedTemplate !== null ||
    $templates.some(
        (t) =>
            t.name === activityName &&
            t.startTime === startTime &&
            t.endTime === endTime
    );
```

### How It Works
1. Monitors: `selectedTemplate`, `activityName`, `startTime`, `endTime`
2. Checks: Is a template selected OR does activity match any template?
3. Updates: Checkbox disabled/enabled state in real-time
4. Displays: Label and styling change automatically

### Checkbox HTML
```html
<input
    type="checkbox"
    bind:checked={saveAsTemplate}
    disabled={isCurrentActivityTemplate}
    class="..."
/>
```

---

## Workflow Examples

### Example 1: Using a Template
```
1. Select day
2. Click "Daily Standup" template (09:00-10:00)
3. Fields populate automatically
4. ✗ Checkbox disables ("Already a template")
5. Save activity (template is not duplicated)
```

### Example 2: Creating New Template
```
1. Select day
2. Manually enter "Team Review" 14:00-15:00
3. No matching template found
4. ✓ Checkbox enables ("Save as template...")
5. Check checkbox
6. Save activity (creates new template)
```

### Example 3: Preventing Duplication
```
1. Select day
2. Type exact details: "Daily Standup" 09:00-10:00
3. System detects match with existing template
4. ✗ Checkbox automatically disables
5. User is prevented from creating duplicate
```

---

## Quick Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Checkbox is disabled | Template selected or activity matches template | Change activity details or don't select template |
| Can't create template | Another template already exists with same details | Change name, start time, or end time |
| Checkbox still disabled | Partial match (e.g., right time, wrong name) | Verify all three fields are unique |
| Checkbox state not updating | Browser cache or component not re-rendered | Refresh page or modify fields again |

---

## Benefits

✨ **Smart Protection**: Prevents accidental duplicate templates  
✨ **Clear Feedback**: Always know why checkbox is disabled  
✨ **Automatic Detection**: No manual checking needed  
✨ **Real-Time Updates**: Changes immediately as you type  
✨ **Consistent UI**: Visual indicators are intuitive

---

## Related Features

- **Responsive Layout**: Desktop shows max 4 days per row
- **Template Manager**: View and delete all templates
- **Activity Editing**: Modify activities after creation
- **Swipe Gestures**: Quick edit/delete actions

---

## Key Takeaways

1. **One checkbox**: Same template = checkbox disabled
2. **Real-time detection**: Updates as you type
3. **Three criteria**: Name, start time, end time must match
4. **Clear feedback**: Label changes to explain state
5. **User control**: You choose when to save as template

---

## Keyboard Shortcuts

- **Tab**: Navigate to checkbox
- **Space**: Toggle checkbox (when enabled)
- **Enter**: Save activity

---

## Accessibility

- Disabled checkbox has proper ARIA attributes
- Label clearly associated with input
- Keyboard navigation supported
- Screen reader announces disabled state
- Visual and text indicators provided

---

## For Developers

### Testing Duplicate Detection
```
1. Create template: "Team Meeting" 09:00-10:00
2. Open add activity modal
3. Enter exact details: "Team Meeting" 09:00-10:00
4. Verify: isCurrentActivityTemplate = true
5. Verify: checkbox disabled attribute is set
6. Verify: label shows "Already a template"
```

### Debug Tips
- Check browser console for reactive statement updates
- Use Vue/Svelte DevTools to inspect `isCurrentActivityTemplate`
- Verify store contains expected templates
- Confirm time format is HH:MM (24-hour)

---

## Performance Notes

- Detection runs on every field change
- O(n) complexity where n = number of templates
- No performance impact for typical use (< 100 templates)
- Reactive statement is optimized and memoized

---

## Browser Support

- Chrome/Edge: ✓ Full support
- Firefox: ✓ Full support
- Safari: ✓ Full support
- Mobile browsers: ✓ Full support

---

## Version

Template Duplicate Detection v1.0  
Last Updated: 2024

---

## Need More Help?

- **Full Guide**: See `TEMPLATE_DUPLICATE_DETECTION.md`
- **Implementation**: See `IMPLEMENTATION_SUMMARY.md`
- **Flow Diagrams**: See `TEMPLATE_FLOW_DIAGRAM.md`
- **Responsive Layout**: See `RESPONSIVE_LAYOUT_GUIDE.md`
