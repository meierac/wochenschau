# Wochenschau - Deployment Checklist

## ✅ Configuration Summary

### Base Path Configuration
- **Base URL**: `/` (root)
- **Vite Config**: `base: "/"`
- **PWA Scope**: `/`
- **PWA Start URL**: `/`

### Local Development
- **Dev Server**: `http://localhost:5173/`
- **Command**: `pnpm dev`

### Production Build
- **Build Command**: `pnpm run build`
- **Output Directory**: `dist/`
- **Preview Command**: `pnpm preview`

## 🚀 Deployment Options

### Option 1: GitHub Pages (Root Domain)
**URL**: `https://username.github.io/`

**Setup**:
1. Repository must be named `username.github.io`
2. Current configuration is correct (base: `/`)
3. Deploy workflow will publish to root

**Verification**:
- ✅ `vite.config.ts` has `base: "/"`
- ✅ PWA manifest has `scope: "/"`
- ✅ GitHub Actions workflow exists at `.github/workflows/deploy.yml`

### Option 2: GitHub Pages (Subdirectory)
**URL**: `https://username.github.io/wochenschau/`

**Required Changes**:
```typescript
// vite.config.ts
export default defineConfig({
  base: "/wochenschau/",
  // ...
  manifest: {
    scope: "/wochenschau/",
    start_url: "/wochenschau/",
  }
})
```

### Option 3: Custom Domain
**URL**: `https://yourdomain.com/`

**Setup**:
1. Add `CNAME` file to `public/` directory with your domain
2. Configure DNS records with your provider
3. Current configuration is correct (base: `/`)

### Option 4: Netlify/Vercel
**URL**: `https://your-app.netlify.app/` or `https://your-app.vercel.app/`

**Setup**:
1. Connect repository to platform
2. Build command: `pnpm run build`
3. Publish directory: `dist`
4. Current configuration is correct (base: `/`)

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] Run `pnpm run check` - TypeScript checks pass
- [ ] Run `pnpm run build` - Build completes successfully
- [ ] Test production build with `pnpm preview`
- [ ] Test on mobile device (responsive design)
- [ ] Test PWA installation
- [ ] Test offline functionality

### Configuration Files
- [ ] `vite.config.ts` - Base path is correct
- [ ] `package.json` - Version number is updated
- [ ] `README.md` - Documentation is up to date

### Assets & Resources
- [ ] Favicon files present in `public/`
- [ ] PWA icons (192x192, 512x512) present
- [ ] Apple touch icon present
- [ ] Google Fonts URLs are correct

### PWA Manifest
- [ ] Name and short_name are correct
- [ ] Icons are properly configured
- [ ] Theme colors are set
- [ ] Start URL matches base path
- [ ] Scope matches base path

### Service Worker
- [ ] Service worker is enabled in production
- [ ] Caching strategy is appropriate
- [ ] Update mechanism works correctly

## 🧪 Testing After Deployment

### Functionality Tests
- [ ] App loads at root URL
- [ ] Week view displays correctly
- [ ] Add activity modal works
- [ ] Settings sheet opens and saves
- [ ] Week navigation works (swipe on mobile)
- [ ] Export functionality works
- [ ] Dark/light mode toggles correctly

### PWA Tests
- [ ] Can install as PWA on iOS
- [ ] Can install as PWA on Android
- [ ] Works offline after installation
- [ ] Service worker updates properly
- [ ] Icons display correctly when installed

### Performance Tests
- [ ] Lighthouse score (Performance, Accessibility, Best Practices, PWA)
- [ ] Page load time < 2 seconds
- [ ] Time to Interactive < 3 seconds
- [ ] No console errors
- [ ] No 404 errors for assets

## 📱 Browser/Device Testing

### Desktop Browsers
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

### Mobile Browsers
- [ ] iOS Safari
- [ ] Chrome on Android
- [ ] Samsung Internet

### Screen Sizes
- [ ] Mobile (< 768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (> 1024px)

## 🔧 Troubleshooting

### Issue: App doesn't load after deployment
**Solution**: Check browser console for 404 errors. Verify `base` path in `vite.config.ts` matches deployment URL structure.

### Issue: Assets not loading (CSS, JS, images)
**Solution**: Ensure `base` path is correct. For GitHub Pages subdirectory, use `base: "/repo-name/"`.

### Issue: PWA not installing
**Solution**: 
1. Check manifest.webmanifest is accessible
2. Verify HTTPS is enabled (required for PWA)
3. Check service worker registration in console
4. Ensure icons are correctly referenced

### Issue: Service worker not updating
**Solution**: 
1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache and service workers
3. Check `registerType: "autoUpdate"` in vite.config.ts

### Issue: Dark mode not working
**Solution**: Check system preferences are being detected correctly. Settings are stored in localStorage.

## 📊 Current Status

**Last Build**: 2024-10-24
**Version**: 1.0.0
**Node Version**: 22.9.0 (Note: Upgrade to 22.12+ recommended)
**Base Path**: `/` (root)
**Deployment**: Ready for root-level deployment

## 🎯 Quick Deploy Commands

```bash
# Development
pnpm dev

# Build for production
pnpm run build

# Preview production build locally
pnpm preview

# Type checking
pnpm run check

# Deploy to GitHub Pages (automatic on push to main)
git push origin main
```

## 📝 Notes

- All data is stored in browser localStorage with keys prefixed `wochenschau_*`
- No backend server required - fully static deployment
- CORS not an issue for iCal subscriptions (handled by browser)
- Supports offline functionality via service worker
- PWA can be installed on home screen (iOS/Android)

---

**Last Updated**: October 24, 2024
**Status**: ✅ Production Ready