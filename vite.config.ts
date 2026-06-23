import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { VitePWA } from "vite-plugin-pwa";

const basePath = process.env.BASE_PATH ?? "";
const appBase =
  basePath === "" || basePath === "/" ? "/" : `${basePath.replace(/\/$/, "")}/`;

export default defineConfig({
  plugins: [
    sveltekit(),
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
        id: appBase,
        description: "Your weekly overview",
        theme_color: "#3450d1",
        background_color: "#3450d1",
        display: "standalone",
        orientation: "portrait",
        scope: appBase,
        start_url: appBase,
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
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
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
                maxAgeSeconds: 60 * 60 * 24 * 365,
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
