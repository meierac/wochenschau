# Template Duplicate Detection - Flow Diagram

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    User Opens Add Activity Modal                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Select Day    │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Activity Details│
                    └────────┬───────┘
                             │
                ┌────────────┼────────────┐
                │                         │
                ▼                         ▼
        ┌──────────────┐         ┌──────────────┐
        │ Use Template?│         │ Manual Entry?│
        └──────┬───────┘         └──────┬───────┘
               │                        │
               ▼                        ▼
        ┌──────────────┐         ┌──────────────────┐
        │ Click Template│         │ Enter Details:   │
        │              │         │ - Name           │
        │ selectedTemp │         │ - Start Time     │
        │ != null      │         │ - End Time       │
        └──────┬───────┘         └──────┬───────────┘
               │                        │
               ▼                        ▼
        ┌────────────────────────────────────────┐
        │  Check: isCurrentActivityTemplate?     │
        │                                        │
        │  = selectedTemplate !== null ||        │
        │    template exists with exact match    │
        └──────┬─────────────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
   TRUE              FALSE
   (Duplicate)       (Unique)
      │                 │
      ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Disable      │  │ Enable       │
│ Checkbox     │  │ Checkbox     │
│              │  │              │
│ Label:       │  │ Label:       │
│ "Already a   │  │ "Save as     │
│  template"   │  │  template..." │
│              │  │              │
│ Opacity: 50% │  │ Opacity:100% │
└──────┬───────┘  └──────┬───────┘
       │                  │
       │                  ▼
       │         ┌──────────────────┐
       │         │ User can check   │
       │         │ "Save as         │
       │         │  template" box   │
       │         └──────┬───────────┘
       │                │
       └────────┬───────┘
                │
                ▼
        ┌──────────────────┐
        │  Click Save      │
        │  Activity        │
        └─────┬────────────┘
              │
      ┌───────┴────────┐
      │                │
      ▼                ▼
 Save Activity    Save Activity +
 Only            Create Template
      │                │
      └───────┬────────┘
              │
              ▼
    ┌──────────────────┐
    │ Activity Saved   │
    │ Modal Closes     │
    └──────────────────┘
```

## Detection Logic Flow

```
┌──────────────────────────────────────────────┐
│  Reactive Statement Triggers                 │
│  (User changes any field)                    │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ Check: Is template currently selected?       │
│ selectedTemplate !== null ?                  │
└────────────┬─────────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
     YES           NO
      │             │
      ▼             ▼
  ┌────┐      ┌──────────────────────────┐
  │TRUE│      │ Check all templates:     │
  └────┘      │ Does any template match? │
      │       └──────────┬───────────────┘
      │                  │
      │          ┌───────┴───────┐
      │          │               │
      │         YES             NO
      │          │               │
      │          ▼               ▼
      │      ┌────┐          ┌────┐
      │      │TRUE│          │FALS│
      │      └────┘          └────┘
      │          │               │
      └──────────┼───────────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │ isCurrentActivityTemplate
    │ = TRUE / FALSE         │
    └────────────┬───────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │ Update UI:             │
    │ - Disable checkbox     │
    │ - Update label         │
    │ - Apply opacity        │
    └────────────────────────┘
```

## Checkbox State Machine

```
                    ┌─────────────────────┐
                    │   Initial State     │
                    │  (No activity data) │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │                             │
                ▼                             ▼
      ┌──────────────────┐       ┌──────────────────┐
      │ User selects     │       │ User enters      │
      │ template         │       │ unique activity  │
      └──────────┬───────┘       └──────────┬───────┘
                 │                         │
                 ▼                         ▼
      ┌──────────────────┐       ┌──────────────────┐
      │ CHECKBOX DISABLED│       │ CHECKBOX ENABLED │
      │                  │       │                  │
      │ Label:           │       │ Label:           │
      │ "Already a       │       │ "Save as         │
      │  template"       │       │  template..."    │
      │                  │       │                  │
      │ Opacity: 50%     │       │ Opacity: 100%    │
      │ Cursor: not-ok   │       │ Cursor: pointer  │
      └──────────┬───────┘       └──────────┬───────┘
                 │                         │
          User modifies             User checks
          activity to be               checkbox
          unique (change name/time)    │
                 │                     │
                 └────────┬────────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Click Save       │
                 │ Activity Button  │
                 └──────────┬───────┘
                            │
                  ┌─────────┴──────────┐
                  │                    │
    Template Checkbox            Template Checkbox
    is ENABLED                   is DISABLED
    (checked)                    (unchecked or disabled)
                  │                    │
                  ▼                    ▼
         ┌─────────────────┐  ┌──────────────────┐
         │ Save Activity   │  │ Save Activity    │
         │ + Create New    │  │ Only             │
         │ Template        │  │                  │
         └─────────────────┘  └──────────────────┘
```

## Matching Logic Decision Tree

```
┌─────────────────────────────────────────────────────┐
│ User enters or selects activity details             │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ Does selectedTemplate have a value?                 │
│ (selectedTemplate !== null)                         │
└────────┬────────────────────────────────┬───────────┘
         │                                │
        YES                              NO
         │                                │
         ▼                                ▼
    ┌────────┐           ┌────────────────────────────────┐
    │ MATCH  │           │ Check all $templates array:    │
    │ FOUND  │           │ Does ANY template match?       │
    │        │           │                                │
    │isTrue  │           │ For each template t:           │
    └────────┘           │   t.name === activityName &&   │
         │               │   t.startTime === startTime && │
         │               │   t.endTime === endTime        │
         │               └──┬──────────────────────────┬──┘
         │                  │                         │
         │                 YES                       NO
         │                  │                         │
         │                  ▼                         ▼
         │             ┌────────┐                ┌────────┐
         │             │ MATCH  │                │ NO     │
         │             │ FOUND  │                │ MATCH  │
         │             │ isTrue │                │ isFalse│
         │             └────────┘                └────────┘
         │                  │                         │
         └──────────┬───────┘                         │
                    │                                 │
                    ▼                                 ▼
         ┌────────────────────┐         ┌──────────────────────┐
         │ isCurrentActivity  │         │ isCurrentActivity    │
         │ Template = TRUE    │         │ Template = FALSE     │
         │                    │         │                      │
         │ Disable Checkbox   │         │ Enable Checkbox      │
         │ Show "Already a    │         │ Show "Save as        │
         │  template"         │         │  template..."        │
         └────────────────────┘         └──────────────────────┘
```

## Activity Timeline Example

```
Timeline of User Actions and System Responses:
═════════════════════════════════════════════════════════════════

T1: User opens modal
    └─ isCurrentActivityTemplate = FALSE
       └─ Checkbox: ENABLED

T2: User enters activity name "Daily Standup"
    └─ Check templates... no match yet
       └─ isCurrentActivityTemplate = FALSE
          └─ Checkbox: ENABLED

T3: User sets time 09:00 - 10:00
    └─ Check templates... still no match
       └─ isCurrentActivityTemplate = FALSE
          └─ Checkbox: ENABLED

T4: User checks "Save as template" checkbox
    └─ saveAsTemplate = TRUE
       └─ Checkbox: remains ENABLED

T5: User clicks "Save Activity"
    └─ Activity saved + New template created
    
T6: User opens modal again for same day
    └─ Same activity details exist as template

T7: User enters same activity details
    ├─ Activity name: "Daily Standup"
    ├─ Start time: 09:00
    └─ End time: 10:00
       └─ Check templates: MATCH FOUND!
          └─ isCurrentActivityTemplate = TRUE
             └─ Checkbox: DISABLED
                └─ Label: "Already a template"

T8: User cannot save this as a new template
    └─ Prevents duplicate creation ✓

T9: User changes start time to 09:30
    └─ Check templates: No exact match anymore
       └─ isCurrentActivityTemplate = FALSE
          └─ Checkbox: RE-ENABLED
             └─ User can now save as template ✓
```

## Code Execution Flow

```
┌───────────────────────────────────────────┐
│ Svelte Component Mounts                   │
│ AddActivityModal.svelte                   │
└────────────┬────────────────────────────────┘
             │
             ▼
┌───────────────────────────────────────────┐
│ Initialize Variables:                     │
│ - step = "selectDay"                      │
│ - selectedDay = null                      │
│ - activityName = ""                       │
│ - startTime = "09:00"                     │
│ - endTime = "10:00"                       │
│ - saveAsTemplate = false                  │
│ - selectedTemplate = null                 │
└────────────┬────────────────────────────────┘
             │
             ▼
┌───────────────────────────────────────────┐
│ Set Up Reactive Statements:               │
│ $: filteredTemplates = $templates        │
│ $: isCurrentActivityTemplate = ...        │
└────────────┬────────────────────────────────┘
             │
             ▼
┌───────────────────────────────────────────┐
│ User Interaction Event                    │
│ (click, input, change)                    │
└────────────┬────────────────────────────────┘
             │
             ▼
┌───────────────────────────────────────────┐
│ Variable Value Updates                    │
│ - selectedDay                             │
│ - activityName                            │
│ - startTime / endTime                     │
│ - selectedTemplate                        │
└────────────┬────────────────────────────────┘
             │
             ▼
┌───────────────────────────────────────────┐
│ Reactive Statement Re-evaluates:          │
│ isCurrentActivityTemplate = ...           │
│ (checks all conditions)                   │
└────────────┬────────────────────────────────┘
             │
             ▼
┌───────────────────────────────────────────┐
│ Component Re-renders:                     │
│ - Checkbox disabled/enabled               │
│ - Label text updated                      │
│ - Classes applied                         │
│ - Opacity adjusted                        │
└────────────┬────────────────────────────────┘
             │
             ▼
┌───────────────────────────────────────────┐
│ DOM Updated Visually                      │
│ User sees immediate feedback              │
└───────────────────────────────────────────┘
```
