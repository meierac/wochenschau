# Wochenschau

A modern PWA built with Svelte, TypeScript, and Vite, following Apple's Human Interface Guidelines.

## Features

- 🚀 **PWA Support** - Install as a native app on mobile devices
- 🌓 **Native Theming** - Automatically follows system dark/light mode preferences
- 📱 **Mobile-First** - Optimized for mobile devices following iOS design patterns
- 🎨 **Tailwind CSS** - Utility-first CSS framework with custom iOS-inspired theme
- ⚡ **Vite** - Lightning-fast development and build tool
- 🔷 **TypeScript** - Type-safe development experience
- 🎯 **shadcn-inspired Components** - Beautiful, accessible UI components

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 8+

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
wochenschau/
├── public/              # Static assets
│   ├── icon.svg        # App icon (convert to PNG for production)
│   └── vite.svg
├── src/
│   ├── lib/
│   │   ├── components/ # Reusable UI components
│   │   │   ├── Button.svelte
│   │   │   └── Card.svelte
│   │   └── utils/      # Utility functions
│   │       └── cn.ts   # Class name merger
│   ├── App.svelte      # Main app component
│   ├── app.css         # Global styles with CSS variables
│   └── main.ts         # App entry point
├── index.html
├── vite.config.ts      # Vite + PWA configuration
├── tailwind.config.js  # Tailwind configuration
└── tsconfig.json       # TypeScript configuration
```

## PWA Configuration

The app is configured as a Progressive Web App with:
- Offline support via service worker
- Install prompts on mobile devices
- iOS-specific meta tags for home screen installation
- Automatic updates when new versions are deployed

### Icons

To complete the PWA setup, you need to generate PNG icons from the SVG:

1. Open `public/icon.svg` in a browser or design tool
2. Export/save as PNG in the following sizes:
   - `pwa-192x192.png` (192x192px)
   - `pwa-512x512.png` (512x512px)
   - `apple-touch-icon.png` (180x180px)

Alternatively, use an online tool like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

## Design System

The app uses a custom design system inspired by iOS:

### Colors

Colors are defined using CSS custom properties and automatically adapt to light/dark mode:
- `--background` / `--foreground`
- `--primary` / `--primary-foreground`
- `--secondary` / `--secondary-foreground`
- `--accent` / `--accent-foreground`
- `--destructive` / `--destructive-foreground`
- `--muted` / `--muted-foreground`

### Typography

Uses the iOS system font stack:
```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', ...
```

### Spacing & Borders

- Border radius: `0.75rem` (12px) for that iOS feel
- Safe area insets for notched devices
- Responsive spacing following iOS guidelines

## Components

### Button

```svelte
<Button variant="default" size="default">Click me</Button>
```

Variants: `default`, `secondary`, `destructive`, `ghost`
Sizes: `default`, `sm`, `lg`

### Card

```svelte
<Card>
  <div class="p-6">
    Content goes here
  </div>
</Card>
```

## Adding New Components

1. Create component in `src/lib/components/`
2. Use the `cn()` utility for className merging
3. Follow iOS design patterns (rounded corners, subtle shadows, etc.)
4. Support dark mode with CSS custom properties

## License

MIT
