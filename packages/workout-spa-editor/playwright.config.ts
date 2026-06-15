import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["list"], ["html"], ["github"]]
    : [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10000, // 10 seconds for actions (click, fill, etc.)
  },

  expect: {
    timeout: 10_000, // 10s for assertions (Dexie clear + reload is slow on Mobile Safari)
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
      use: {
        ...devices["Desktop Firefox"],
        launchOptions: {
          // Headless Firefox on Linux (CI) does not treat the page as the
          // active focus owner, so programmatic `element.focus()` in app
          // code (e.g. useFocusOnRouteChange) is not reflected as `:focus`
          // and `toBeFocused()` reports "inactive" — even though real
          // headed Firefox and headless Firefox on macOS focus correctly.
          // geckodriver/Selenium set this pref by default; Playwright does
          // not. Enabling it aligns the test env with real-browser focus
          // behaviour. Fixes the firefox-only library-flows focus failure.
          firefoxUserPrefs: { "focusmanager.testmode": true },
        },
      },
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
      use: { viewport: { width: 768, height: 1024 } },
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
