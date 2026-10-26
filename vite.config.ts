/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// `base` is the public path the site is served from. On GitHub Pages the site
// lives under https://<user>.github.io/<repo>/, so the base must be "/Ematis/".
// It can be overridden via the VITE_BASE env var (the Pages workflow sets it).
export default defineConfig({
  base: process.env.VITE_BASE ?? "/Ematis/",
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
