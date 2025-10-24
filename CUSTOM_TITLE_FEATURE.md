# Custom Title Feature

## Overview

The export feature now allows users to customize the headline/title displayed on exported images, control the font size of the title, and toggle the week number (KW) display. Previously, the title was hardcoded as "Wochenschau" with a fixed size and the week number was always shown.

## Features

### 1. Custom Title Text
- Users can set any custom text as the export title
- Default value: "Wochenschau"
- No character limit (but shorter titles work best visually)
- Examples: "My Week", "Weekly Plan", "Wochenübersicht", "Agenda", etc.

### 2. Adjustable Title Font Size
- Range: 24px to 72px
- Default: 48px (equivalent to text-3xl)
- Step size: 2px for fine-tuned control
- Real-time preview updates

### 3. Optional Week Number Display
- Toggle to show/hide "KW XX" below the title
- Default: Hidden (false)
- Useful when title already includes week information or for cleaner exports
- Appears below title when enabled

## How to Use

### Accessing Settings

1. Open the **Settings** menu (⚙️ icon)
2. Navigate to **Export Settings**
3. Look for the **Typography** section at the top

### Setting Custom Title

1. Find the **Title/Headline** input field
2. Type your desired title (e.g., "Meine Woche", "Weekly Planner")
3. Changes apply immediately to the export preview

### Adjusting Font Size

1. Find the **Title Font Size** slider
2. Drag to adjust between 24px and 72px
3. Current size is displayed next to the label (e.g., "Title Font Size: 48px")
4. Preview updates in real-time

### Toggling Week Number

1. Find the **Show Week Number (KW)** checkbox
2. Check to display "KW XX" below the title
3. Uncheck to hide the week number
4. Default is unchecked (hidden)

## Implementation Details

### Store Configuration

**File:** `src/lib/stores/exportSettings.ts`

```typescript
export interface ExportSettings {
  // Title/Headline
  title: string;
  titleFontSize: number; // in pixels
  showWeekNumber: boolean; // Show "KW XX" below title
  
  // ... other settings
}

const defaultSettings: ExportSettings = {
  title: "Wochenschau",
  titleFontSize: 48,
  showWeekNumber: false,
  // ... other defaults
};
```

### Export Preview

**File:** `src/lib/components/ExportSheet.svelte`

The title is rendered with dynamic styling:

```svelte
<h2
    class="font-bold mb-2"
    style="font-family: {$exportSettings.headerFontFamily}; 
           color: {$exportSettings.textColor}; 
           font-size: {$exportSettings.titleFontSize}px;"
>
    {$exportSettings.title}
</h2>
{#if $exportSettings.showWeekNumber}
    <p
        class="text-lg font-semibold"
        style="font-family: {$exportSettings.bodyFontFamily}; 
               color: {$exportSettings.textColor}; 
               opacity: 0.8;"
    >
        KW{$currentWeek}
    </p>
{/if}
```

### Settings UI

**File:** `src/lib/components/SettingsSheet.svelte`

Three controls added to both mobile and desktop views:

1. **Text Input** for title text
2. **Range Slider** for font size (24-72px)
3. **Checkbox** for week number display toggle

## Use Cases

### Personal Planning
- "Sarah's Week" - Personalize with your name
- "Family Schedule" - For shared planning
- "Work Week" - Professional context

### Language Preferences
- "Wochenschau" - German (default)
- "Weekly Review" - English
- "Aperçu Hebdomadaire" - French
- "Vista Semanal" - Spanish

### Different Contexts
- "Homework Tracker" - For students
- "Training Schedule" - For athletes
- "Meal Prep Plan" - For cooking planning
- "Project Timeline" - For work projects

### Week Number Display Options

| Scenario | Title | Show Week Number | Result |
|----------|-------|------------------|--------|
| Default | "Wochenschau" | No | Just title, clean look |
| With week info | "Week 42 Plan" | No | Week already in title |
| Traditional | "Wochenschau" | Yes | Title + "KW 42" |
| Minimal | "" (empty) | Yes | Only "KW 42" shown |

### Font Size Recommendations

| Size | Best For | Example |
|------|----------|---------|
| 24-32px | Long titles (15+ characters) | "My Weekly Activity Planner" |
| 36-48px | Medium titles (8-12 characters) | "Wochenschau" |
| 48-60px | Short titles (5-8 characters) | "My Week" |
| 60-72px | Very short titles (3-5 characters) | "KW 42" |

## Settings Persistence

- Title, font size, and week number toggle are saved to localStorage
- Settings persist across app sessions
- Export with different titles doesn't affect stored activities
- Reset option returns to defaults:
  - Title: "Wochenschau"
  - Font Size: 48px
  - Week Number: Hidden

## Visual Examples

### Default (Clean)
```
Title: "Wochenschau"
Font Size: 48px
Week Number: Hidden
Result: Large, bold title only
```

### Traditional (With Week)
```
Title: "Wochenschau"
Font Size: 48px
Week Number: Shown
Result: Title + "KW 42" below
```

### Compact
```
Title: "My Weekly Plan & Activities"
Font Size: 28px
Week Number: Hidden
Result: Smaller font accommodates longer title
```

### Minimal (Week Only)
```
Title: "" (empty)
Font Size: Any
Week Number: Shown
Result: Only "KW 42" displayed
```

### Ultra Minimal
```
Title: "" (empty)
Font Size: Any
Week Number: Hidden
Result: No header, activities start immediately
```

## Accessibility

- **Label Association:** Input has proper `for` attribute linking
- **Semantic HTML:** Uses `<h2>` heading element
- **Screen Reader Support:** Title and font size are announced
- **Keyboard Navigation:** All controls are keyboard accessible
- **Visual Feedback:** Current font size displayed in label

## Technical Notes

### Font Size Range Selection

**Minimum (24px):**
- Ensures readability even on small exports
- Prevents title from becoming too subtle
- Works well with long titles

**Maximum (72px):**
- Large enough for impactful single-word titles
- Prevents oversized titles that break layout
- Maintains visual balance with week number

**Step Size (2px):**
- Granular enough for fine-tuning
- Not too granular to cause confusion
- 24 total steps for smooth adjustment

### Backward Compatibility

Existing users who upgrade will automatically receive:
- Default title: "Wochenschau"
- Default font size: 48px
- Week number: Hidden (false)
- No breaking changes to existing exports

The `createExportSettingsStore()` function ensures new fields are added:

```typescript
if (stored) {
  const parsed = JSON.parse(stored);
  initial = {
    ...defaultSettings,
    ...parsed,
    // New fields get defaults if not present
  };
}
```

## Future Enhancements

Potential improvements to consider:
- [ ] Title text alignment (left, center, right)
- [ ] Title font weight control (light, normal, bold, extra bold)
- [ ] Title text transform (uppercase, lowercase, capitalize)
- [ ] Separate title font family (independent from header font)
- [ ] Title color independent from text color
- [ ] Preset title templates ("Week of [date]", "KW [number]", etc.)
- [ ] Multi-line title support
- [ ] Title with emoji support
- [ ] Title with custom icon/logo
- [ ] Custom week number format (e.g., "Week 42", "W42", "Woche 42")
- [ ] Week number position (above/below title, inline)
- [ ] Week number font size control

## Related Settings

The title and week number work in conjunction with other export settings:

- **Header Font Family:** Controls the typeface of the title
- **BodyText Color:** Applies to the title text
- **Background:** Title appears above the background with overlay
- **Layout Mode:** Title displays the same in both grid and list views

---

**Version:** 1.0.1  
**Date:** October 2024  
**Status:** ✅ Implemented and Tested