import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ["dev.zmelendez.com"],
    // Photos come from the images container, behind Traefik at
    // img.zmelendez.com; IMAGES_PROXY points elsewhere.
    proxy: Object.fromEntries(
      ["/img/", "/originals/"].map((prefix) => [
        prefix,
        {
          target: process.env.IMAGES_PROXY ?? "https://img.zmelendez.com",
          changeOrigin: true,
        },
      ]),
    ),
  },
})
