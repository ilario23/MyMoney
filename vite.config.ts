import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // Only enable PWA in production builds
    ...(command === "build"
      ? [
          VitePWA({
            registerType: "prompt",
            filename: "sw.js",
            workbox: {
              globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
              runtimeCaching: [
                {
                  urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                  handler: "NetworkFirst",
                  options: {
                    cacheName: "supabase-api-cache",
                    expiration: {
                      maxEntries: 50,
                      maxAgeSeconds: 5 * 60, // 5 minutes
                    },
                    networkTimeoutSeconds: 10,
                  },
                },
                {
                  urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
                  handler: "CacheFirst",
                  options: {
                    cacheName: "images-cache",
                    expiration: {
                      maxEntries: 50,
                      maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                    },
                  },
                },
              ],
              cleanupOutdatedCaches: true,
              skipWaiting: true,
              clientsClaim: true,
            },
            manifest: {
              name: "ExpenseTracker - Gestione Spese",
              short_name: "ExpenseTracker",
              description: "Gestisci le tue spese personali e condivise con facilità",
              theme_color: "#3b82f6",
              background_color: "#ffffff",
              display: "standalone",
              scope: "/",
              start_url: "/",
              orientation: "portrait",
              categories: ["finance", "productivity"],
              lang: "it",
              icons: [
                {
                  src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%233b82f6'/><text x='50' y='70' font-size='60' text-anchor='middle' fill='white'>💰</text></svg>",
                  sizes: "192x192",
                  type: "image/svg+xml",
                  purpose: "any maskable",
                },
                {
                  src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%233b82f6'/><text x='50' y='70' font-size='60' text-anchor='middle' fill='white'>💰</text></svg>",
                  sizes: "512x512",
                  type: "image/svg+xml",
                  purpose: "any maskable",
                },
              ],
            },
            devOptions: {
              enabled: false, // Disable in development
            },
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
