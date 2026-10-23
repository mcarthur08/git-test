import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

// base "./" keeps asset and kjv/ URLs relative, so the same build works on web.app and on a GitHub Pages sub-path.
// "@" points at src/, so deep files import with "@/store.js" instead of "../../../store.js".
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: { outDir: "dist" }
});
