import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.config.ts",
        "**/*.test.ts",
        "src/tests/**",
      ],
      // CLI meets the 80% core-package standard on lines/functions/
      // statements. Branches stay at 70%: the remainder is process-level
      // error plumbing (exit-code paths, signal handling) that needs
      // subprocess harnesses with little assertion value.
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
