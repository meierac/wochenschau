import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";

// When building for Tauri, TAURI_ENV_TARGET_TRIPLE is set by the Tauri CLI.
// In that case we use a relative base path so the bundled app loads correctly
// from the filesystem.  For the GitHub Pages web build we keep the repo-scoped
// base path.
const isTauri = !!process.env.TAURI_ENV_TARGET_TRIPLE;

// https://vite.dev/config/
export default defineConfig({
  base: isTauri ? "./" : "/wochenschau/",
  plugins: [
    svelte(),
    VitePWA({
      // Disable service-worker registration inside the Tauri shell – the app
      // runs locally and doesn't benefit from a SW (and it can cause issues).
      disable: isTauri,
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "apple-touch-icon.png",
        "web-app-manifest-192x192.png",
        "web-app-manifest-512x512.png",
      ],
      manifest: {
        name: "Wochenschau",
        short_name: "Wochenschau",
        id: "/wochenschau/",
        description: "Your weekly overview",
        theme_color: "#F8FAFC", // Match light background; dark mode handled by dynamic meta theme-color
        background_color: "#F8FAFC", // Soft light background matching app CSS variable feel
        display: "standalone",
        orientation: "portrait",
        scope: "/wochenschau/",
        start_url: "/wochenschau/",
        icons: [
          {
            src: "web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,ttf}"],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50 MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\/fonts\/.+\.ttf$/,
            handler: "CacheFirst",
            options: {
              cacheName: "local-fonts-cache",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  // Vite options tailored for Tauri development and only applied in `tauri dev`
  // or `tauri build`
  //
  // 1. Prevent vite from obscuring Rust errors
  clearScreen: false,
  server: {
    host: isTauri ? "localhost" : true,
    // Tauri expects a fixed port; fail if it is not available
    port: 5173,
    strictPort: isTauri,
  },
  // Expose Tauri build-time environment variables (TAURI_ENV_TARGET_TRIPLE,
  // TAURI_ENV_PLATFORM, TAURI_ENV_ARCH, etc.) to the Svelte frontend via
  // `import.meta.env` so components can adapt behaviour per platform.
  // These are compile-time constants – no runtime system information is leaked.
  envPrefix: ["VITE_", "TAURI_ENV_"],
});
