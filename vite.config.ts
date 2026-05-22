import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  /** Root-absolute `/assets/...` so deep links (e.g. /public/prescriptions/:id) still load JS. `./` breaks those routes. */
  base: "/",
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
  /**
   * Same-origin `/api-proxy` → API so PDF image `fetch`/canvas works without CORS.
   * Production hosts should mirror this (e.g. nginx `location /api-proxy/` → `API_BASE_URL`).
   */
  server: {
    proxy: {
      "/api-proxy": {
        target: "https://api.samvaadai.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, "") || "/",
      },
    },
  },
  preview: {
    proxy: {
      "/api-proxy": {
        target: "https://api.samvaadai.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, "") || "/",
      },
    },
  },
});
