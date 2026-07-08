import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base "./" keeps asset URLs relative so it works on GitHub Pages project subpaths.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
});
