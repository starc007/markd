import { defineConfig } from "astro/config";
import tailwind from "@tailwindcss/vite";

// Fully static output — the site is a single marketing page plus the static
// update-server files under public/ (latest.json + bundles). No SSR adapter
// needed; wrangler serves dist/ as static assets.
export default defineConfig({
  site: "https://usemarkd.app",
  vite: {
    plugins: [tailwind()],
  },
});
