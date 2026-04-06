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
});
