import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  base: "/wochenschau/",
  plugins: [
    svelte(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "icon.svg",
        "icon-pwa.svg",
        "icon-rounded.svg",
        "apple-touch-icon.png",
        "apple-touch-icon-monochrome.svg",
        "web-app-manifest-192x192.png",
        "web-app-manifest-512x512.png",
      ],
      manifest: {
        name: "Wochenschau",
        short_name: "Wochenschau",
        id: "/wochenschau/",
        description: "Your weekly overview",
        theme_color: "#3450d1", // Match logo blue color
        background_color: "#3450d1", // Match logo blue color
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
          {
            src: "icon-pwa.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "apple-touch-icon-monochrome.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "monochrome",
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
  server: {
    host: true,
  },
});
