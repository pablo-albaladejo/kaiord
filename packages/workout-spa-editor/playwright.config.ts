import { defineConfig, devices } from "@playwright/test";

// Another worktree's dev server on 5173 would otherwise be silently reused and
// the specs would run against its code. Setting PLAYWRIGHT_PORT moves this
// run to its own port and refuses to adopt a server that is already there.
const RAW_PORT = process.env.PLAYWRIGHT_PORT?.trim() || undefined;
const CUSTOM_PORT = RAW_PORT !== undefined;
const PORT = CUSTOM_PORT ? Number(RAW_PORT) : 5173;
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error(
    `PLAYWRIGHT_PORT must be an integer between 1 and 65535, got "${RAW_PORT}"`
  );
}
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Playwright configuration for E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  // The production-base specs serve a real build. It is produced once, here,
  // because two spec files sharing one `dist/` raced their own `vite build`
  // calls and died on ENOTEMPTY whenever the workers overlapped.
  globalSetup:
    process.env.E2E_PROD_BASE === "1"
      ? "./e2e/fixtures/prod-base-global-setup.ts"
      : undefined,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["list"], ["html"], ["github"]]
    : [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: BASE_URL,
    // Pin the browser locale so `navigator.language` is deterministic: the
    // SPA's `auto` locale preference resolves to English regardless of the
    // runner's system locale, keeping the English UI assertions stable.
    locale: "en-US",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10000, // 10 seconds for actions (click, fill, etc.)
  },

  expect: {
    timeout: 10_000, // 10s for assertions (Dexie clear + reload is slow on Mobile Safari)
    toHaveScreenshot: {
      // Absorb CI font-hinting/anti-aliasing jitter between runs (observed:
      // ~0.01% of pixels on coaching-sidebar.visual.spec.ts) without masking
      // real visual regressions.
      maxDiffPixelRatio: 0.01,
    },
  },

  // Global timeout for tests
  timeout: 60000, // 60 seconds per test

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        permissions: ["clipboard-read", "clipboard-write"],
      },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"], hasTouch: true },
    },
    // Mobile viewports
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 5"],
        permissions: ["clipboard-read", "clipboard-write"],
      },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
    {
      name: "Mobile-768",
      use: {
        viewport: { width: 768, height: 1024 },
        // Chromium-backed like the other two chromium projects, and the
        // copy/paste specs seed the clipboard directly. Without the grant
        // they fail on `Write permission denied` — invisible until now
        // because no CI job runs this project.
        permissions: ["clipboard-read", "clipboard-write"],
      },
    },
  ],

  webServer: {
    command: `pnpm dev --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI && !CUSTOM_PORT,
    timeout: 120 * 1000,
  },
});
