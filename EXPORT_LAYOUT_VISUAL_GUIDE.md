# Export Layout Visual Guide

## Before vs After Comparison

### BEFORE: Screen-Size Dependent Layout
```
┌─────────────────────────────────────────────────┐
│  Small Screen (375px)                           │
│  ┌──────────────────────────────────────────┐   │
│  │ Preview Container (max-h-96, scrolls)    │   │
│  │ ┌────────────────────────────────────┐   │   │
│  │ │ Grid Layout (responsive width)     │   │   │
│  │ │ ┌──┐ ┌──┐                          │   │   │
│  │ │ │M │ │T │  ← cramped columns      │   │   │
│  │ │ │O │ │U │                          │   │   │
│  │ │ └──┘ └──┘                          │   │   │
│  │ │ Text wrapped & truncated           │   │   │
│  │ └────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────┘   │
│  Fixed height causes unwanted scrolling        │
└─────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Large Screen (1920px)                                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Preview Container (takes up available space)       │  │
│  │                                                     │  │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐           │  │
│  │  │Monday│  │Tuesdy│  │Wednes│  │Thurs │ ← stretched │  │
│  │  │      │  │      │  │ day  │  │ day  │           │  │
│  │  └──────┘  └──────┘  └──────┘  └──────┘           │  │
│  │                                                     │  │
│  └─ lots of empty space ─────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

Issues:
- Width varies with screen size
- Text wrapping inconsistent
- Ugly on small screens
- Wasted space on large screens
- Export quality unpredictable
```

### AFTER: Fixed Width, Content-Driven Height
```
┌──────────────────────────────────────────────────────────┐
│  Small Screen (375px)                                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Preview Container (max-h-[60vh], scrolls if needed)  │
│  │ ┌──────────────────────────────────────────────┐    │
│  │ │  ← 800px fixed width, centered ────────────→ │    │
│  │ │                                               │    │
│  │ │  Wochenschau                                  │    │
│  │ │  Week 42 · 17. Oct - 23. Oct                  │    │
│  │ │                                               │    │
│  │ │  ┌─────────┐ ┌─────────┐                      │    │
│  │ │  │ Monday  │ │ Tuesday │  ← perfect fit      │    │
│  │ │  │ 17. Oct │ │ 18. Oct │                      │    │
│  │ │  ├─────────┤ ├─────────┤                      │    │
│  │ │  │Activity │ │Activity │  ← readable text    │    │
│  │ │  │10:00-11 │ │14:00-15 │                      │    │
│  │ │  └─────────┘ └─────────┘                      │    │
│  │ │                                               │    │
│  │ └──────────────────────────────────────────────┘    │
│  └──────────────────────────────────────────────────┘   │
│  Perfect fit without cramping                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Large Screen (1920px)                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Preview Container (centered, same 800px width)  │   │
│  │                                                 │   │
│  │ ┌──────────────────────────────────────────┐   │   │
│  │ │  ← 800px fixed width, always centered →  │   │   │
│  │ │                                           │   │   │
│  │ │  Wochenschau                              │   │   │
│  │ │  Week 42 · 17. Oct - 23. Oct              │   │   │
│  │ │                                           │   │   │
│  │ │  ┌──────────┐ ┌──────────┐                │   │   │
│  │ │  │ Monday   │ │ Tuesday  │                │   │   │
│  │ │  │17. Oct   │ │18. Oct   │ ← consistent  │   │   │
│  │ │  ├──────────┤ ├──────────┤                │   │   │
│  │ │  │Activity  │ │Activity  │ ← readable    │   │   │
│  │ │  │10:00-11  │ │14:00-15  │                │   │   │
│  │ │  └──────────┘ └──────────┘                │   │   │
│  │ │                                           │   │   │
│  │ └──────────────────────────────────────────┘   │   │
│  │  ← centered with balanced margins on sides →  │   │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘

Benefits:
- Width stays at 800px consistently
- Text always readable
- Centered on all screen sizes
- No wasted space
- Professional appearance
```

## Layout Modes with Fixed Width

### Grid View (4 Columns × 7 Days)
```
┌──────────────────────────────────────────────────────────┐
│                    800px Fixed Width                     │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Wochenschau                                          │ │
│ │ Week 42 · 17. Oct - 23. Oct                          │ │
│ │                                                      │ │
│ │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │ │
│ │ │ Mon  │ │ Tue  │ │ Wed  │ │ Thu  │                 │ │
│ │ │17.10 │ │18.10 │ │19.10 │ │20.10 │                 │ │
│ │ ├──────┤ ├──────┤ ├──────┤ ├──────┤                 │ │
│ │ │Team  │ │Lunch │ │Report│ │1:1   │                 │ │
│ │ │09:00 │ │12:00 │ │10:00 │ │14:00 │                 │ │
│ │ │      │ │      │ │      │ │      │                 │ │
│ │ │Retro │ │      │ │Demo  │ │      │                 │ │
│ │ │16:00 │ │      │ │15:00 │ │      │                 │ │
│ │ └──────┘ └──────┘ └──────┘ └──────┘                 │ │
│ │                                                      │ │
│ │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │ │
│ │ │ Fri  │ │ Sat  │ │ Sun  │ │      │                 │ │
│ │ │21.10 │ │22.10 │ │23.10 │ │      │                 │ │
│ │ ├──────┤ ├──────┤ ├──────┤ ├──────┤                 │ │
│ │ │Review│ │      │ │      │ │      │                 │ │
│ │ │11:00 │ │      │ │      │ │      │                 │ │
│ │ │      │ │      │ │      │ │      │                 │ │
│ │ │Standup
│ │ │13:00 │ │      │ │      │ │      │                 │ │
│ │ └──────┘ └──────┘ └──────┘ └──────┘                 │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘

Perfect spacing: 800px ÷ 4 columns = 200px per column
Height expands with content (no fixed limit)
```

### List View (Vertical Layout)
```
┌──────────────────────────────────────────────────────────┐
│                    800px Fixed Width                     │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Wochenschau                                          │ │
│ │ Week 42 · 17. Oct - 23. Oct                          │ │
│ │                                                      │ │
│ │ ▌ Monday · 17. Oct                                  │ │
│ │ ├─ Team Meeting (09:00 - 10:00)                     │ │
│ │ ├─ Retrospective (16:00 - 16:30)                    │ │
│ │                                                      │ │
│ │ ▌ Tuesday · 18. Oct                                 │ │
│ │ ├─ Lunch (12:00 - 13:00)                            │ │
│ │                                                      │ │
│ │ ▌ Wednesday · 19. Oct                               │ │
│ │ ├─ Report Writing (10:00 - 11:00)                   │ │
│ │ ├─ Demo Prep (15:00 - 16:00)                        │ │
│ │                                                      │ │
│ │ ▌ Thursday · 20. Oct                                │ │
│ │ ├─ 1:1 with Manager (14:00 - 14:30)                 │ │
│ │                                                      │ │
│ │ ▌ Friday · 21. Oct                                  │ │
│ │ ├─ Weekly Review (11:00 - 12:00)                    │ │
│ │ ├─ Standup (13:00 - 13:15)                          │ │
│ │                                                      │ │
│ │ ▌ Saturday · 22. Oct                                │ │
│ │ ├─ No activities                                    │ │
│ │                                                      │ │
│ │ ▌ Sunday · 23. Oct                                  │ │
│ │ ├─ No activities                                    │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘

Optimal for reading long activity names
Height adjusts to content length
Scrolls gracefully if exceeds 60vh
```

## Height Behavior

### Dynamic Height Adjustment
```
WEEK WITH FEW ACTIVITIES:
┌──────────────────────────────────┐
│  200px content                   │
│  ↓ height adjusts to content     │
│  Preview shows full without scroll│
└──────────────────────────────────┘

WEEK WITH MANY ACTIVITIES:
┌──────────────────────────────────┐
│  800px content                   │
│  ↓ exceeds max-h-[60vh]          │
│  (max height = 60% of viewport)  │
│  ↓ scrollable preview area       │
│  User can scroll to see all      │
└──────────────────────────────────┘

WEEK WITH MODERATE ACTIVITIES:
┌──────────────────────────────────┐
│  400px content                   │
│  ↓ fits nicely in preview        │
│  No scroll needed                │
│  Perfect preview experience      │
└──────────────────────────────────┘
```

## Export Quality

### JPG Export Output
```
Original Preview (800px × variable height)
        ↓
html2canvas renders at 2x scale (1600px × variable)
        ↓
Converts to JPEG at 0.95 quality
        ↓
Consistent, professional-looking image
        ↓
File: Wochenschau_W42_2024.jpg
```

## Technical Implementation

```
HTML Structure:
┌─ Dialog (responsive, 90vh max)
│  ├─ Header (fixed)
│  ├─ Content (scrollable)
│  │  └─ Preview Container (overflow-auto, max-h-[60vh])
│  │     └─ Export Preview (#export-preview)
│  │        ├─ style="width: 800px; margin: 0 auto;"
│  │        ├─ Header (title & date)
│  │        └─ Content (grid or list)
│  └─ Footer (fixed)
```

## Key CSS Classes

| Class | Purpose |
|-------|---------|
| `max-h-[60vh]` | Maximum height = 60% viewport height |
| `overflow-auto` | Scroll only when needed |
| `margin: 0 auto` | Center content horizontally |
| `width: 800px` | Fixed width (not responsive) |
| `grid grid-cols-4` | Grid: 4 columns for grid view |
| `space-y-4` | Vertical spacing in list view |

## Browser Compatibility

- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Responsive on all screen sizes
- ✅ Works with html2canvas for JPG export