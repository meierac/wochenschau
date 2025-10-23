# Template Duplicate Detection Guide

## Overview
This document describes the template duplicate detection feature in the Wochenschau calendar application. When adding a new activity, the system automatically detects if the activity matches an existing template and prevents saving it as a duplicate template.

## Feature Description

### What It Does
- **Automatic Detection**: When you fill in activity details (name, start time, end time), the system checks if those exact details match an existing template
- **Checkbox Disabling**: If a match is found, the "Save as template" checkbox is automatically disabled
- **User Feedback**: The checkbox label changes to "Already a template" to inform the user why it's disabled
- **Visual Indicator**: The label and checkbox become slightly faded (opacity-50) to show the disabled state

### When It Triggers
The "Save as template" checkbox is disabled when:
1. **A template is currently selected**: You've clicked on a template in the "Use Template" section
2. **Activity matches an existing template**: The current activity name, start time, and end time exactly match a saved template

### Benefits
✅ **Prevents Duplicates**: No duplicate templates can be created  
✅ **Better UX**: Clear visual feedback about why the checkbox is disabled  
✅ **Smart Defaults**: If you select a template, you can't save the same thing twice  
✅ **Consistency**: Keeps the template library clean and organized

## Technical Implementation

### Reactive Detection Logic

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

This reactive statement:
- Returns `true` if a template is currently selected (`selectedTemplate !== null`)
- Returns `true` if any existing template matches the current activity details
- Updates automatically whenever any activity field changes

### Checkbox Binding

```svelte
<input
    type="checkbox"
    bind:checked={saveAsTemplate}
    disabled={isCurrentActivityTemplate}
    class="w-4 h-4 rounded border-input {isCurrentActivityTemplate
        ? 'cursor-not-allowed'
        : 'cursor-pointer'}"
/>
```

The checkbox is:
- **Disabled**: When `isCurrentActivityTemplate` is `true`
- **Cursor Changes**: Shows "not-allowed" cursor when disabled, "pointer" when enabled
- **Bound to**: `saveAsTemplate` variable (only works when enabled)

### Label Text Update

```svelte
<span class="text-sm text-foreground">
    {isCurrentActivityTemplate
        ? "Already a template"
        : "Save as template for reuse"}
</span>
```

The label dynamically shows:
- **"Already a template"**: When the activity matches an existing template or one is selected
- **"Save as template for reuse"**: When the activity is unique and can be saved as a template

## User Workflows

### Scenario 1: Using an Existing Template
1. User selects a day
2. User clicks on a template (e.g., "Daily Standup 09:00-10:00")
3. Activity fields are populated with template values
4. "Save as template" checkbox is disabled with label "Already a template"
5. User can still save the activity, just not as a new template

### Scenario 2: Creating a Unique Activity
1. User selects a day
2. User manually enters activity details
3. Details don't match any existing template
4. "Save as template" checkbox is enabled
5. User can check the box to save this as a reusable template

### Scenario 3: Manually Recreating Template Details
1. User selects a day
2. User doesn't use a template, but manually types the exact same details
3. System detects the activity matches an existing template
4. "Save as template" checkbox is disabled
5. User is prevented from creating a duplicate template

## Template Matching Rules

Templates match based on **exact equality**:

| Field | Match Type | Required |
|-------|-----------|----------|
| Name | Exact string match | Yes |
| Start Time | Exact time match (HH:MM) | Yes |
| End Time | Exact time match (HH:MM) | Yes |

**Example Matches:**
- ✅ "Team Meeting" 09:00-10:00 = Template "Team Meeting" 09:00-10:00
- ❌ "Team Meeting" 09:00-10:00 ≠ Template "Team Meeting" 09:30-10:00
- ❌ "Team Meeting" 09:00-10:00 ≠ Template "team meeting" 09:00-10:00 (case-sensitive)
- ❌ "Team Meeting" 09:00-10:00 ≠ Template "Team Meeting 2" 09:00-10:00

## Implementation Location

**File**: `src/lib/components/AddActivityModal.svelte`

**Key Components:**
- Lines 27-33: Reactive statement for duplicate detection
- Lines 248-263: Checkbox with duplicate detection logic
- Lines 264-267: Dynamic label text

## Related Files

- `src/lib/stores/templates.ts` – Template storage and management
- `src/lib/types/index.ts` – ActivityTemplate type definition
- `src/lib/components/TemplateManager.svelte` – Template management UI

## Testing Checklist

- [ ] Select a template → checkbox is disabled with "Already a template" message
- [ ] Deselect template and enter different activity details → checkbox becomes enabled
- [ ] Enter activity details matching a template exactly → checkbox is disabled
- [ ] Change one field slightly (time, name) → checkbox becomes enabled
- [ ] Case sensitivity: Enter template name with different case → checkbox remains enabled
- [ ] Save activity without using template → checkbox is enabled and functional
- [ ] Add activity as template → subsequent activities with same details show disabled checkbox

## Future Enhancements

- Add a tooltip explaining why the checkbox is disabled
- Show which template matches the current activity
- Allow case-insensitive matching
- Include description field in template matching logic
- Add "Update existing template" option instead of disabling checkbox