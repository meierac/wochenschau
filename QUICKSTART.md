# Wochenschau - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Development Server
```bash
pnpm dev
```

Your app will be available at `http://localhost:5173`

### 3. Build for Production
```bash
pnpm build
```

## 📱 Test on Mobile

### On the same WiFi network:

1. Start dev server: `pnpm dev`
2. Find your computer's IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
3. On your phone, open: `http://<your-ip>:5173`
4. Install as PWA:
   - **iOS Safari**: Tap Share → "Add to Home Screen"
   - **Android Chrome**: Tap menu → "Add to Home screen"

## 📦 What's Included?

- ✅ **Svelte 5** with TypeScript
- ✅ **Vite** for lightning-fast development
- ✅ **Tailwind CSS v4** with iOS-inspired theme
- ✅ **PWA Support** - works offline, installable
- ✅ **Dark/Light Mode** - follows system preferences
- ✅ **Mobile-First** - optimized for iOS/Android

## 🎨 Pre-built Components

```svelte
<script>
  import { Button, Card, Input, List, ListItem } from './lib/components';
</script>

<!-- Button with variants -->
<Button variant="default">Primary Button</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>

<!-- Card container -->
<Card>
  <div class="p-6">
    <h2>Card Title</h2>
    <p>Content goes here</p>
  </div>
</Card>

<!-- iOS-style list -->
<List>
  <ListItem>Settings</ListItem>
  <ListItem chevron href="/profile">Profile</ListItem>
</List>

<!-- Input field -->
<Input type="text" placeholder="Search..." bind:value={searchTerm} />
```

## 🎯 Next Steps

1. **Edit `src/App.svelte`** - Start building your app
2. **Add components** in `src/lib/components/`
3. **Customize theme** in `src/app.css`
4. **Generate PWA icons** - See README.md

## 📚 Documentation

- **README.md** - Project overview and features
- **SETUP.md** - Detailed setup and architecture guide
- **This file** - Quick start reference

## 🛠 Available Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm preview  # Preview production build
pnpm check    # Run TypeScript type checking
```

## 🎨 Customization

### Change Colors
Edit `src/app.css`:
```css
@theme {
  --color-primary: oklch(0.62 0.2 252);  /* Your color here */
}
```

### Add New Component
1. Create `src/lib/components/MyComponent.svelte`
2. Export in `src/lib/components/index.ts`
3. Import: `import { MyComponent } from './lib/components'`

## 🐛 Troubleshooting

**Build fails?**
- Ensure pnpm is installed: `npm install -g pnpm`
- Clear cache: `rm -rf node_modules && pnpm install`

**PWA not working?**
- Service Worker only works in production build
- Use HTTPS or localhost

**Styles not applying?**
- Restart dev server
- Check browser console for errors

## 💡 Tips

- **Live reload**: Changes appear instantly
- **Mobile testing**: Access via local network
- **Type safety**: TypeScript catches errors early
- **Dark mode**: Automatically follows system settings
- **Touch-friendly**: All interactions optimized for mobile

## 🚢 Deploy

Build and deploy to any static host:

```bash
pnpm build
# Upload 'dist/' folder to your hosting provider
```

**Recommended hosts:**
- Vercel (easiest)
- Netlify
- GitHub Pages
- Firebase Hosting

---

**Need help?** Check SETUP.md for detailed documentation!
