import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  server: { port: 5180, allowedHosts: true },
  preview: { port: 5180, allowedHosts: true },
});
