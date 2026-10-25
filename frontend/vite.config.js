import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: {
        enabled: false,
      },

      manifest: {
        name: "FinSight AI - Smart Personal Finance Tracker",
        short_name: "FinSight AI",
        description: "FinSight AI is an AI-powered Personal Finance Tracker.",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",

        icons: [
          {
            src: "/logo192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/logo512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/logo512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, "/");
          if (!normalized.includes("/node_modules/")) return;

          if (
            /\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(normalized)
          ) {
            return "vendor-react";
          }
          if (
            /\/node_modules\/(@firebase\/auth|firebase\/auth)\//.test(normalized)
          ) {
            return "vendor-firebase-auth";
          }
          if (
            /\/node_modules\/(@firebase\/firestore|firebase\/firestore)\//.test(normalized)
          ) {
            return "vendor-firebase-firestore";
          }
          if (
            /\/node_modules\/(@firebase|firebase)\//.test(normalized)
          ) {
            return "vendor-firebase-core";
          }
          if (
            /\/node_modules\/(recharts|d3-[^/]+|victory-vendor)\//.test(normalized)
          ) {
            return "vendor-charts";
          }
          if (
            /\/node_modules\/react-icons\//.test(normalized)
          ) {
            return "vendor-icons";
          }
        },
      },
    },
  },
});