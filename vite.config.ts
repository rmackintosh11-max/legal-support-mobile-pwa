import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/legal-support-mobile-pwa/",
  clearScreen: false,
  server: {
    port: 1430,
    strictPort: true
  },
  build: {
    outDir: "dist"
  }
});
