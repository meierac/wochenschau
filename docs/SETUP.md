# Wochenschau - Setup Guide

This document provides detailed setup instructions and information about the project architecture.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type check
pnpm check
```

## Project Overview

**Wochenschau** is a Progressive Web App (PWA) built with:
- **Svelte 5** - Reactive UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework
- **vite-plugin-pwa** - PWA capabilities with Workbox

## Architecture

### Directory Structure

```
wochenschau/
├── .vscode/              # VS Code settings and extensions
├── dist/                 # Production build output (generated)
├── public/               # Static assets
│   ├── icon.svg         # App icon
│   └── vite.svg         # Vite logo
├── src/
│   ├── lib/
│   │   ├── components/  # Reusable UI components
│   │   │   ├── Button.svelte
│   │   │   ├── Card.svelte
│   │   │   ├── Input.svelte
│   │   │   ├── List.svelte
│   │   │   ├── ListItem.svelte
│   │   │   └── index.ts
│   │   └── utils/       # Utility functions
│   │       └── cn.ts    # Class name merger utility
│   ├── App.svelte       # Root component
│   ├── app.css          # Global styles and Tailwind config
│   ├── main.ts          # Application entry point
│   ├── global.d.ts      # Global TypeScript declarations
│   └── vite-env.d.ts    # Vite environment types
├── index.html           # HTML entry point
├── vite.config.ts       # Vite and PWA configuration
├── postcss.config.js    # PostCSS configuration
├── svelte.config.js     # Svelte preprocessor config
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Design System

### iOS-Inspired Design

This app follows Apple's Human Interface Guidelines (HIG) with:

- **Native feel**: Touch-optimized interactions, system fonts
- **Safe areas**: Support for notched devices (iPhone X+)
- **Smooth animations**: 150ms transitions, active states
- **Rounded corners**: 12px (0.75rem) default radius
- **Elevation**: Subtle shadows, backdrop blur effects

### Color System

Colors use CSS custom properties and automatically adapt to system preferences:

#### Light Mode
- Background: White
- Foreground: Black
- Primary: Blue (#0ea5e9)
- Secondary: Light gray
- Muted: Light gray with reduced contrast

#### Dark Mode
- Background: Black
- Foreground: White
- Primary: Lighter blue
- Secondary: Dark gray
- Muted: Dark gray with reduced contrast

### Typography

Uses the native iOS font stack:
```css
-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", ...
```

Features:
- Font smoothing for better readability
- Ligatures enabled
- Optimized for mobile screens

## Components

### Button

A versatile button component with multiple variants and sizes.

```svelte
<script>
  import { Button } from '$lib/components';
</script>

<Button variant="default" size="default" on:click={handleClick}>
  Click me
</Button>
```

**Props:**
- `variant`: 'default' | 'secondary' | 'destructive' | 'ghost'
- `size`: 'default' | 'sm' | 'lg'
- `disabled`: boolean
- `class`: string (additional classes)

### Card

A container with rounded corners and subtle shadow.

```svelte
<Card>
  <div class="p-6">
    <h2>Card Title</h2>
    <p>Card content goes here</p>
  </div>
</Card>
```

### Input

A styled input field with focus states.

```svelte
<Input
  type="text"
  placeholder="Enter text..."
  bind:value={inputValue}
/>
```

**Props:**
- `type`: 'text' | 'email' | 'password' | 'number' | 'search'
- `value`: string
- `placeholder`: string
- `disabled`: boolean

### List & ListItem

iOS-style grouped lists.

```svelte
<List>
  <ListItem>Item 1</ListItem>
  <ListItem chevron>Item 2 with chevron</ListItem>
  <ListItem href="/somewhere">Linked item</ListItem>
</List>
```

**ListItem Props:**
- `chevron`: boolean (shows right arrow)
- `href`: string (makes it a link)

## PWA Configuration

### Features

- ✅ Offline support via Service Worker
- ✅ Install to home screen
- ✅ Auto-updates when new version deployed
- ✅ iOS splash screens and icons
- ✅ Cache-first strategy for assets

### Icons

The project includes an SVG icon template (`public/icon.svg`). For production, generate PNG icons:

**Required sizes:**
- `pwa-192x192.png` - Android
- `pwa-512x512.png` - Android, maskable
- `apple-touch-icon.png` - iOS (180x180)

**Tools to generate icons:**
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [PWA Builder](https://www.pwabuilder.com/imageGenerator)

### Manifest

The PWA manifest is configured in `vite.config.ts`:
- Name: "Wochenschau"
- Display: Standalone
- Orientation: Portrait
- Theme color: Adapts to system theme

## Tailwind CSS v4

This project uses Tailwind CSS v4, which has a different configuration approach:

- **No `tailwind.config.js`** - Configuration is in CSS using `@theme`
- **Uses `@tailwindcss/postcss`** - New PostCSS plugin
- **CSS-first** - Theme tokens defined in `src/app.css`

### Custom Utilities

```css
/* Safe area utilities for notched devices */
.safe-top    /* padding-top: env(safe-area-inset-top) */
.safe-bottom /* padding-bottom: env(safe-area-inset-bottom) */
.safe-left   /* padding-left: env(safe-area-inset-left) */
.safe-right  /* padding-right: env(safe-area-inset-right) */
```

## Development Tips

### Hot Module Replacement (HMR)

Vite provides instant HMR. Changes to Svelte components update instantly without page reload.

### Mobile Testing

1. **Local network testing:**
   ```bash
   pnpm dev
   ```
   The server runs on `0.0.0.0`, accessible from your phone on the same network.

2. **Use your phone's browser** and navigate to `http://<your-ip>:5173`

3. **Install as PWA:**
   - Chrome Android: "Add to Home Screen"
   - Safari iOS: Share → "Add to Home Screen"

### Type Checking

Run type checking without building:
```bash
pnpm check
```

### Building for Production

```bash
pnpm build
```

Output goes to `dist/` directory. The PWA service worker is automatically generated.

## Deployment

The app can be deployed to any static hosting service:

- **Vercel**: `vercel deploy`
- **Netlify**: Drag & drop `dist/` folder
- **GitHub Pages**: Use GitHub Actions
- **Firebase Hosting**: `firebase deploy`

### Build Output

- `dist/index.html` - Main HTML file
- `dist/assets/` - JavaScript and CSS bundles
- `dist/sw.js` - Service Worker
- `dist/manifest.webmanifest` - PWA manifest

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Safari 14+ (iOS 14+)
- ✅ Firefox 90+

## Customization

### Changing Colors

Edit `src/app.css` in the `@theme` blocks:

```css
@theme {
  --color-primary: oklch(0.62 0.2 252);  /* Your color */
  /* ... */
}
```

### Adding Components

1. Create component in `src/lib/components/`
2. Use `cn()` for className merging
3. Export from `src/lib/components/index.ts`
4. Import in your pages

Example:
```typescript
// src/lib/components/MyComponent.svelte
<script lang="ts">
  import { cn } from '../utils/cn';
  let className = '';
  export { className as class };
</script>

<div class={cn('base-classes', className)}>
  <slot />
</div>
```

## Troubleshooting

### Port already in use
Change port in `vite.config.ts`:
```typescript
server: {
  port: 3000,
}
```

### PWA not updating
- Clear browser cache
- Unregister service worker in DevTools
- Hard reload (Ctrl/Cmd + Shift + R)

### Styles not applying
- Ensure `@import "tailwindcss"` is in `app.css`
- Check PostCSS config has `@tailwindcss/postcss`
- Restart dev server

## Resources

- [Svelte Documentation](https://svelte.dev/docs)
- [Vite Documentation](https://vite.dev/)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

## License

MIT
