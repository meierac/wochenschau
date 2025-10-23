# Wochenschau Documentation

This directory contains comprehensive documentation for the Wochenschau calendar application, including guides for responsive design and template management features.

## Documentation Files

### 1. [RESPONSIVE_LAYOUT_GUIDE.md](RESPONSIVE_LAYOUT_GUIDE.md)
Comprehensive guide for the responsive day columns layout system.

**Topics Covered:**
- Responsive breakpoints (mobile, tablet, desktop)
- Grid configuration and CSS classes
- Desktop layout behavior (max 4 days per row)
- Scrolling behavior and mobile vs desktop experience
- Testing checklist for responsive design

**Key Takeaway:** Desktop mode displays a maximum of 4 days per row, providing optimal readability and screen space utilization.

---

### 2. [TEMPLATE_DUPLICATE_DETECTION.md](TEMPLATE_DUPLICATE_DETECTION.md)
Detailed feature guide for the template duplicate detection system.

**Topics Covered:**
- Feature overview and benefits
- When duplicate detection triggers
- Technical implementation details
- Reactive detection logic
- User workflows and scenarios
- Template matching rules
- Testing recommendations

**Key Takeaway:** The system automatically detects when an activity matches an existing template and disables the "Save as template" checkbox to prevent duplicates.

---

### 3. [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
Technical summary of the template duplicate detection implementation.

**Topics Covered:**
- Overview of changes made
- Modified files and line numbers
- Key implementation details with code examples
- Behavior in different scenarios
- Matching criteria explanation
- User experience improvements
- Testing recommendations
- Future enhancement opportunities

**Key Takeaway:** The feature is implemented through a reactive statement that continuously monitors activity fields and disables the checkbox when a duplicate is detected.

---

### 4. [FULL_HEIGHT_MODALS.md](FULL_HEIGHT_MODALS.md)
Comprehensive guide for full-height responsive modal design.

**Topics Covered:**
- Height strategy (mobile vs desktop)
- CSS structure and layout architecture
- Responsive behavior across breakpoints
- Component updates for all modals
- Scrolling behavior and performance
- Implementation patterns
- Testing checklist
- Customization options

**Key Takeaway:** All modals use full-height design on mobile (100vh) and constrained height on desktop (max 90vh), maximizing content visibility while minimizing unnecessary scrolling.

---

### 5. [MODAL_HEADER_DESIGN.md](MODAL_HEADER_DESIGN.md)
Comprehensive design guide for the unified modal header system.

**Topics Covered:**
- Header layout with centered titles and icon buttons
- Icon button component specifications
- Icon usage (dismiss, save, next, back)
- Implemented modals and their specific headers
- Accessibility features and keyboard support
- Responsive behavior across devices
- Testing recommendations

**Key Takeaway:** All modals now feature a modern header with centered titles and icon-only buttons: cancel/dismiss (✕) on left, primary action (✓ or ➜) on right.

---

### 5. [MODAL_ICON_REFERENCE.md](MODAL_ICON_REFERENCE.md)
Visual reference guide and icon specifications.

**Topics Covered:**
- Icon visual layouts and SVG specifications
- Icon button dimensions and sizing
- Icon color and contrast specifications
- Implementation code snippets
- Icon grid reference
- Sizing reference and visual hierarchy
- Accessibility specifications
- Common use cases table

**Key Takeaway:** Four icons used across modals: X (dismiss), ✓ (save), ➜ (next), ← (back) - all 24×24 px with consistent stroke styling.

---

### 6. [MODAL_REDESIGN_SUMMARY.md](MODAL_REDESIGN_SUMMARY.md)
Implementation summary for the modal header redesign project.

**Topics Covered:**
- Overview of design changes
- Files modified and new component created
- Icon specifications and IconButton component details
- Individual modal updates and behavior
- CSS implementation details
- Accessibility features
- Testing results
- Benefits and future enhancements

**Key Takeaway:** All four modals successfully updated with the new design pattern, maintaining accessibility while providing a modern, clean interface.

---

### 7. [TEMPLATE_FLOW_DIAGRAM.md](TEMPLATE_FLOW_DIAGRAM.md)
Visual flow diagrams and state machines for template duplicate detection.

**Topics Covered:**
- User flow diagram (complete journey)
- Detection logic flow with decision points
- Checkbox state machine diagram
- Matching logic decision tree
- Activity timeline example with system responses
- Code execution flow

**Key Takeaway:** Visual representation of how the system detects duplicates and updates the UI in real-time.

---

## Quick Start

### For Users
- Start with [TEMPLATE_DUPLICATE_DETECTION.md](TEMPLATE_DUPLICATE_DETECTION.md) to understand what the feature does
- Check [RESPONSIVE_LAYOUT_GUIDE.md](RESPONSIVE_LAYOUT_GUIDE.md) for layout and navigation

### For Developers
- Read [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for technical overview
- Reference [TEMPLATE_FLOW_DIAGRAM.md](TEMPLATE_FLOW_DIAGRAM.md) for visual understanding
- Check [TEMPLATE_DUPLICATE_DETECTION.md](TEMPLATE_DUPLICATE_DETECTION.md) for detailed behavior specs

### For Designers
- Review [RESPONSIVE_LAYOUT_GUIDE.md](RESPONSIVE_LAYOUT_GUIDE.md) for grid system
- Check [TEMPLATE_FLOW_DIAGRAM.md](TEMPLATE_FLOW_DIAGRAM.md) for user flows

---

## Key Features Documented

### 1. Responsive Day Columns Layout
- **Mobile**: 1 day per row
- **Tablet**: 3 days per row
- **Desktop**: 4 days per row (maximum)
- Full-height day columns with scrolling only at grid level

### 2. Template Duplicate Detection
- Automatic detection of matching templates
- Disabled "Save as template" checkbox when duplicate found
- Clear user feedback with dynamic label text
- Real-time reactive detection as user enters data

---

## Related Files in Codebase

### Component Files
- `src/lib/components/AddActivityModal.svelte` - Main component with duplicate detection logic
- `src/lib/components/WeekView.svelte` - Responsive grid layout
- `src/lib/components/DayColumn.svelte` - Individual day column
- `src/lib/components/TemplateManager.svelte` - Template management UI

### Store Files
- `src/lib/stores/templates.ts` - Template storage and management
- `src/lib/stores/activities.ts` - Activity storage

### Type Files
- `src/lib/types/index.ts` - Type definitions including `ActivityTemplate` and `CalendarItem`

---

## Implementation Details

### Responsive Layout
**File:** `src/lib/components/WeekView.svelte` (Lines 110-115)

```
Class: grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4
- Mobile (< 768px): 1 column
- Tablet (768px-1023px): 3 columns
- Desktop (≥ 1024px): 4 columns
```

### Template Duplicate Detection
**File:** `src/lib/components/AddActivityModal.svelte`

**Reactive Detection (Lines 27-33):**
```
$: isCurrentActivityTemplate = selectedTemplate !== null ||
    $templates.some(t =>
        t.name === activityName &&
        t.startTime === startTime &&
        t.endTime === endTime
    );
```

**Disabled Checkbox (Lines 248-263):**
```
Checkbox disabled when isCurrentActivityTemplate is true
Label shows "Already a template" when disabled
Opacity reduced to 50% for visual indication
```

---

## Testing Checklist

### Responsive Layout
- [ ] Mobile (320px-767px): 1 day per row displays correctly
- [ ] Tablet (768px-1023px): 3 days per row displays correctly
- [ ] Desktop (1024px+): 4 days per row displays correctly
- [ ] Day columns maintain 100% height
- [ ] Scrolling works only at grid level
- [ ] No layout shift on breakpoint transitions

### Template Duplicate Detection
- [ ] Select template → checkbox disables with "Already a template" message
- [ ] Enter unique activity details → checkbox enables
- [ ] Enter details matching existing template → checkbox disables
- [ ] Change one field → checkbox re-evaluates correctly
- [ ] Save with enabled checkbox → creates new template
- [ ] Save with disabled checkbox → creates activity only

---

## Glossary

- **Template**: A reusable activity pattern with name, start time, and end time
- **Activity**: A calendar event with date, time, and description
- **isCurrentActivityTemplate**: Reactive variable indicating if activity is duplicate of template
- **Responsive Breakpoint**: Screen width threshold where layout changes
- **Grid Column**: Vertical section in the calendar grid (one day per column)

---

## Support & Feedback

For questions or issues regarding these features:
1. Review the relevant documentation file
2. Check the code examples and flow diagrams
3. Consult the testing checklist
4. Review the implementation location in source code

---

## Version History

- **v1.0** (Initial Release)
  - Responsive layout with max 4 days per row on desktop
  - Template duplicate detection with disabled checkbox
  - Comprehensive documentation suite

---

## Future Documentation

Additional documentation to be added:
- [ ] iCal integration and import/export guide
- [ ] Swipe gestures user guide
- [ ] Activity editing workflow documentation
- [ ] Accessibility features and keyboard shortcuts
- [ ] Color theming and customization guide
- [ ] Performance optimization notes
- [ ] Browser compatibility matrix

---

## Last Updated

Documentation for features implemented with responsive layout optimization and template duplicate detection. See individual files for specific update dates and detailed changelogs.