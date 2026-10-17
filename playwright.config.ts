import { defineConfig, devices } from "@playwright/test"

const preview = process.env.E2E_PREVIEW === "1"
const PORT = preview ? 4174 : 4173

/**
 * Targets, in order: an already-running site (E2E_BASE_URL, e.g. the Docker
 * container at http://localhost:8080), the production build served by
 * `vite preview` (E2E_PREVIEW=1), or the dev server.
 */
const external = process.env.E2E_BASE_URL

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: external ?? `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: external
    ? undefined
    : {
        command: preview
          ? `pnpm build && pnpm preview --port ${PORT} --strictPort`
          : `pnpm dev --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI && !preview,
        timeout: 120_000,
      },
})
