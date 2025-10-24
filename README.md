# Wochenschau 📅

> Your weekly overview at a glance. A beautiful, intuitive calendar app for planning your week.

**Wochenschau** (German for "weekly review") is a modern Progressive Web App designed to help you visualize and organize your week. Built with Svelte, TypeScript, and Tailwind CSS, it combines the elegance of iOS design patterns with the power of web technologies.

## ✨ Features

### Core Functionality
- 📋 **Week-at-a-Glance View** - See all your activities organized by day in a beautiful grid layout
- ➕ **Quick Activity Creation** - Add activities with customizable titles, times, and descriptions
- 📝 **Activity Templates** - Save your most-used activities as templates for quick reuse
- 🔗 **Calendar Integration** - Subscribe to iCal calendars with automatic syncing and manual refresh
- 📸 **Export as Image** - Export your week as a beautifully formatted image to share
- 💾 **Local Storage** - All your data is stored locally on your device for privacy
- 🔄 **Auto-Sync** - iCal subscriptions automatically refresh when stale (24h default)
- 👆 **Swipeable Sheets** - Swipe down to dismiss modals on mobile devices

### User Experience
- 🚀 **Progressive Web App** - Install as a native app on iOS and Android
- 🌓 **Dark & Light Mode** - Automatic system theme detection with manual override
- 📱 **Fully Responsive** - Optimized for mobile, tablet, and desktop screens
- ✅ **Offline Support** - Works completely offline with service worker caching
- ⚡ **Lightning Fast** - Built with Vite for instant load times and smooth interactions
- 🎨 **Beautiful UI** - iOS-inspired design with Tailwind CSS and custom components

### Advanced Features
- 🎨 **Export Customization** - Control colors, fonts, borders, and background styling for exports
- 📊 **Export Layouts** - Choose between grid and list view for exports
- ✝️ **Bible Verse of the Day** - Optional daily inspiration with German verses
- 🔄 **Auto-Update** - Service worker automatically updates the app when new versions are released

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+

### Installation

```bash
git clone https://github.com/meierac/wochenschau.git
cd wochenschau
pnpm install
```

### Development

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## 📁 Project Structure

```
wochenschau/
├── public/                          # Static assets & favicons
│   ├── favicon.svg                 # App icon (SVG)
│   ├── favicon.ico                 # Favicon
│   ├── apple-touch-icon.png        # iOS home screen icon
│   ├── web-app-manifest-192x192.png
│   ├── web-app-manifest-512x512.png
│   └── [other favicon variants]
│
├── src/
│   ├── lib/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── WeekView.svelte              # Main week calendar view
│   │   │   ├── DayColumn.svelte             # Individual day column
│   │   │   ├── ActivityCard.svelte          # Activity item display
│   │   │   ├── ActivityEditSheet.svelte     # Activity editor
│   │   │   ├── ExportSheet.svelte           # Export dialog & preview
│   │   │   ├── SettingsSheet.svelte         # Settings menu
│   │   │   ├── TemplateManager.svelte       # Template management
│   │   │   ├── ICalManager.svelte           # Calendar subscriptions
│   │   │   ├── WeekPicker.svelte            # Week selection
│   │   │   └── [UI components]...           # Button, Card, Input, etc.
│   │   │
│   │   ├── stores/                 # Svelte stores
│   │   │   ├── activities.ts       # Activity data store
│   │   │   ├── bibleVerse.ts       # Bible verse store
│   │   │   ├── exportSettings.ts   # Export customization
│   │   │   ├── ical.ts             # iCal subscription management
│   │   │   ├── templates.ts        # Activity templates
│   │   │   └── week.ts             # Current week tracking
│   │   │
│   │   ├── data/
│   │   │   └── bibleVerses.ts      # 100 German Bible verses
│   │   │
│   │   ├── utils/                  # Utility functions
│   │   │   ├── date.ts             # Date calculation utilities
│   │   │   └── cn.ts               # Tailwind class merging
│   │   │
│   │   └── types/
│   │       └── index.ts            # TypeScript interfaces
│   │
│   ├── App.svelte                  # Main app component
│   ├── main.ts                     # Entry point
│   ├── app.css                     # Global styles
│   └── fonts.css                   # Google Fonts imports
│
├── index.html                       # HTML entry point
├── vite.config.ts                  # Vite & PWA configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies & scripts
└── README.md                       # This file
```

## 🎯 Key Technologies

- **Svelte 5** - Reactive UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **PWA Kit** - Progressive Web App support
- **Svelte Stores** - State management
- **html2canvas** - Image export functionality
- **Google Fonts** - Typography

## 🎨 Customization

### Export Settings
Users can customize how their week is exported:
- **Colors**: Text, accent, background colors for week containers
- **Typography**: Font families for headers and body text
- **Styling**: Border radius, opacity, border visibility
- **Layout**: Grid or list view options
- **Background**: Optional background images with opacity control

### Settings Menu
The settings panel includes:
- **Activity Templates** - Create and manage reusable activity templates
- **Calendar Subscriptions** - Add iCal URLs to sync external calendars
- **Export Settings** - Customize export appearance
- **Bible Verse Settings** - Toggle daily inspiration
- **About** - App version and hidden features guide

## 💾 Data Storage

- **Local Storage** - All activities, templates, and settings are stored in browser's local storage
- **No Cloud Required** - Your data stays on your device
- **Privacy First** - No data is sent to any server
- **Persistent** - Data survives app updates and browser restarts

## 📤 iCal Integration

Subscribe to external calendars (Google Calendar, Outlook, Apple Calendar, etc.) via their iCal URLs:
1. Get the iCal subscription URL from your calendar provider
2. Add it in Settings → Calendar Subscriptions
3. Events automatically sync and appear in your weekly view
4. Toggling subscriptions on/off doesn't delete the events

### 🔄 Sync Conflict Resolution

**Protecting Your Local Edits**

If you've edited synced calendar items (changed titles, times, descriptions, etc.), the app will detect conflicts before overwriting your changes:

- **Automatic Detection** - Tracks when you modify synced items
- **User Choice** - Asks whether to keep your changes or use synced data
- **No Data Loss** - Your edits are never silently overwritten

**How It Works:**
1. You edit a synced calendar item (e.g., change "Meeting" to "Meeting - POSTPONED")
2. Next sync detects the local modification
3. A dialog appears showing what you changed
4. You choose: **Keep My Changes** or **Use Synced Data**

**Your Options:**
- **Keep My Changes** - Preserves your edits, updates sync timestamp (your changes won't sync back to source)
- **Use Synced Data** - Discards your edits, accepts fresh data from calendar subscription

See [SYNC_CONFLICT_RESOLUTION.md](./SYNC_CONFLICT_RESOLUTION.md) for detailed documentation.

## 📸 Export & Sharing

Export your week as a high-quality image:
- **Customizable appearance** - Colors, fonts, backgrounds, borders
- **Multiple layouts** - Grid (compact) or list (detailed) view
- **Direct sharing** - Copy to clipboard or share via native share sheet
- **Beautiful format** - Perfect for sharing on social media or printing

## 🛠️ Development

### Project Setup
```bash
pnpm install
```

### Start Development Server
```bash
pnpm dev
```

### Type Check
```bash
pnpm check
```

### Build for Production
```bash
pnpm build
```

### Preview Production Build
```bash
pnpm preview
```

## 📦 PWA Configuration

The app is fully configured as a Progressive Web App:
- **Service Worker** - Offline support and caching
- **Auto-Update** - New versions automatically downloaded and installed
- **Home Screen Installation** - "Add to Home Screen" on iOS/Android
- **App Manifest** - Custom app name, colors, and icons
- **Web App Icon** - Beautiful Wochenschau logo

### Installing the App

**iOS:**
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

**Android:**
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Install app" or "Add to Home screen"

## 🌍 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 15.1+
- Any modern browser supporting PWA standards

## 📄 License

MIT

## 👤 About

**Created in the heart of Kaiserstuhl 🍇**

Wochenschau is a passion project designed to help you stay organized and focused on what matters most – your weekly goals and activities.

---

**Version:** 1.0.1 | [GitHub](https://github.com/meierac/wochenschau)