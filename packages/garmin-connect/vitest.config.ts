import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    // *.integration.test.ts hit the live Garmin SSO endpoint and are
    // credential-gated (GARMIN_TEST_EMAIL / GARMIN_TEST_PASSWORD). Run
    // them explicitly via:
    //   pnpm exec vitest --run src/index.integration.test.ts
    // CI does not inject credentials, so the live auth flow is verified
    // manually before releases that touch the SSO code path.
    exclude: ["**/node_modules/**", "**/dist/**", "**/*.integration.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.test.ts",
        "**/*.config.ts",
        "**/*.mapper.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
