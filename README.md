# Wochenschau 📅

> Your weekly overview at a glance. A beautiful, intuitive calendar app for planning your week.

**Wochenschau** (German for "weekly review") is a modern Progressive Web App built with Svelte 5, TypeScript, Tailwind CSS and Vite. It blends iOS-inspired design patterns with fast, private, offline-first functionality.

---

## ✨ Features

### Core
- Week-at-a-glance grid view (Mon–Sun, ISO week)
- Manual activity creation with time range
- Activity templates (quick reuse of routine items)
- iCal calendar subscription (import external events)
- Local edit tracking for subscribed events (conflict resolution dialog)
- Multi-layout export (grid, list, compact)
- Image export (PNG) with clipboard and share-sheet support
- Local-only data (activities, templates, subscriptions, export preferences)

### User Experience
- Responsive (mobile-first, tablet & desktop enhancements)
- Swipeable sheets & modals (mobile UX)
- Floating bottom navigation + Add button (FAB)
- Light/Dark mode (system detection with CSS variables)
- IndexedDB-backed background image handling (memory efficient)
- Local font set (reliable embedding for exports)
- Optional daily Bible verse (German verses)

### Export & Customization
- Customizable title, fonts, colors, accent, borders, opacity, corner radius
- Background: solid color or selected image (default gallery or user upload)
- Separate week container styling (overlay color + opacity)
- High-resolution rendering with platform-aware scale & caching heuristics
- Automatic iOS/Safari workarounds (background image capture reliability)
- Troubleshooting & platform-specific documentation (see `docs/`)

### Reliability & Privacy
- 100% client-side: no backend services
- IndexedDB storage for large background images (migrated from legacy localStorage)
- Graceful fallback if fonts/backgrounds unavailable
- Conflict-safe sync: local changes to imported iCal events are never silently overwritten

### Advanced Internals
- Sync conflict detection groups modified subscribed items and prompts a global choice:
  - Keep local changes (preserve overrides)
  - Use fresh subscribed data (discard overrides)
- Local override tracking per field (`summary`, `description`, times, color)
- Derivable store helpers (`activitiesByWeek`, `activitiesByDay`)
- Structured design tokens via Tailwind utility composition

---

## 🚧 Current Limitations

| Area | Status |
|------|--------|
| Recurring iCal events (RRULE) | Not yet implemented (RRULE field parsed but unused) |
| Per-item conflict resolution | Global apply (dialog offers one decision for all conflicts) |
| Multi-week span events | Represented as single-day; week-crossing logic is minimal |
| Cloud sync / multi-device | Not supported (intentionally local-first) |
| Authentication | None (no external services) |

---

## 📂 Project Structure (High-level)

```
src/
└── lib/
    ├── components/
    │   ├── WeekView.svelte
    │   ├── DayColumn.svelte
    │   ├── ActivityCard.svelte
    │   ├── ActivityEditSheet.svelte
    │   ├── AddActivityModal.svelte
    │   ├── TemplateManager.svelte
    │   ├── ICalManager.svelte
    │   ├── SyncConflictDialog.svelte
    │   ├── ExportSheet.svelte
    │   ├── SettingsSheet.svelte
    │   ├── DefaultBackgroundSelector.svelte
    │   ├── FloatingNav.svelte
    │   ├── WeekPicker.svelte
    │   ├── SwipeableSheet.svelte
    │   ├── RangeSlider.svelte
    │   ├── SettingIcon.svelte
    │   ├── Button.svelte / IconButton.svelte
    │   ├── Card.svelte / Input.svelte / List*.svelte
    │   └── index.ts
    ├── stores/
    │   ├── activities.ts
    │   ├── templates.ts
    │   ├── ical.ts
    │   ├── exportSettings.ts
    │   ├── imageStorage.ts
    │   ├── bibleVerse.ts
    │   ├── defaultBackgrounds.ts
    │   └── week.ts
    ├── utils/
    │   ├── date.ts
    │   ├── cn.ts
    │   └── storage.ts
    ├── types/
    │   └── index.ts
    ├── data/
    │   └── bibleVerses.ts
    ├── App.svelte
    ├── main.ts
    ├── app.css
    └── fonts.css
docs/
└── export-troubleshooting.md
└── ios-background-fix.md
public/
└── backgrounds/ (default selectable images)
```

---

## 🧱 Key Technologies

| Tech | Purpose |
|------|---------|
| Svelte 5 | Reactive UI & compiled components |
| TypeScript | Type safety & domain modeling |
| Tailwind CSS | Utility-first styling |
| Vite | Fast dev server + build |
| vite-plugin-pwa | Service worker + manifest |
| IndexedDB | Large background image persistence |
| LocalStorage | Lightweight structured data (activities, templates, subscriptions) |
| Custom render/export logic | High-quality image export (PNG) using tuned caching & scale |

---

## 🔄 Data Model Overview

### `Activity` (alias of `CalendarItem`)
- `source`: `"manual" | "ical" | "template"`
- `localOverrides`: captured differences for iCal-origin events
- Time stored in iCal-like (`YYYYMMDDTHHMMSS`) for start/end + derived fields (`startTime`, `day`, `week`)

### Sync Conflict Flow
1. Subscription refresh pulls raw iCal items.
2. Items matched by `uid` / local `id`.
3. Modified subscribed items (with `localOverrides`) aggregated.
4. Dialog: user chooses global resolution.
5. Applied accordingly; local timestamps updated.

---

## 📤 Export Logic (Summary)

Adaptive strategies:
- Scale: Desktop up to 4×, iOS/Safari reduced to 3× (fallback 2× on memory pressure)
- Cache strategy: Disabled when using image background to avoid stale/corruption issues
- DOM layering: Real `<img>` element for background (fixes iOS CSS background capture)
- Font embedding: Local font families only (ensures reproducibility)
- Filter excludes transient UI elements (sheet chrome, buttons)

Troubleshooting references:
- `docs/export-troubleshooting.md`
- `docs/ios-background-fix.md`

---

## 💾 Storage Strategy

| Concern | Approach |
|---------|----------|
| Large images | IndexedDB (blob) via `imageStorage` |
| Migration | Automatic from legacy base64 in export settings |
| Settings | Stored sans large base64 to keep localStorage lean |
| Activities | LocalStorage list with incremental append/replace |
| Templates | LocalStorage list |
| Subscriptions | LocalStorage list (items stored inside activities; no separate event cache now) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm ≥ 8

### Install
```bash
git clone https://github.com/meierac/wochenschau.git
cd wochenschau
pnpm install
```

### Development
```bash
pnpm dev
```
Visit: `http://localhost:5173`

### Type Check
```bash
pnpm check
```

### Production Build
```bash
pnpm build
```

### Preview Production
```bash
pnpm preview
```

---

## 🛠 Contributing

While this is a personal project, feel free to:
1. Open issues describing UX or export reliability improvements.
2. Suggest performance tweaks (DOM size during export, memory usage).
3. Propose modularization (e.g., per-item conflict resolution, recurrence parsing).

Please:
- Keep PRs focused (one feature/fix).
- Include before/after screenshots for UI changes.
- Avoid adding external heavy dependencies without clear benefit.

---

## 🧪 Ideas / Future Enhancements

| Idea | Description |
|------|-------------|
| Recurrence support | Parse & expand `RRULE` for weekly repeating events |
| Per-item conflict choices | Granular keep/replace decisions in dialog |
| Timezone handling | Explicit timezone conversions for cross-region subscriptions |
| Multi-day events | Span rendering across columns (current simplified to single-day) |
| Export presets | Save & load multiple export style configurations |
| Data portability | Import/export JSON bundle for activities & templates |

---

## 🔐 Privacy

- No tracking, analytics, or network calls except explicit iCal subscriptions & background image fetches.
- All computation happens locally.
- Removing background image clears IndexedDB blob cleanly.

---

## 🌍 Browser Support (Targeted)

- Chrome / Edge (latest two versions)
- Firefox (recent ESR + latest)
- Safari (15.1+; iOS tweaks implemented)
- Progressive Web App install flows (Android Chrome, iOS Safari manual Add to Home Screen)

---

## 📚 Documentation Index

| File | Purpose |
|------|---------|
| `docs/export-troubleshooting.md` | Debugging broken or corrupted exports |
| `docs/ios-background-fix.md` | Technical breakdown of iOS image rendering fix |

---

## 🧾 License

MIT

---

## 👤 About

Created in the heart of Kaiserstuhl 🍇  
A focused weekly planner prioritizing clarity, speed, and local ownership of your data.

---

**Version:** 1.0.0  
**Repository:** https://github.com/meierac/wochenschau