import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.test.ts",
        "**/*.config.ts",
        "src/tests/**",
        // Mappers - simple data transformation without logic
        // Coverage comes from integration and round-trip tests
        "**/*.mapper.ts",
        // Error classes - infrastructure code with environment-dependent branches
        // (Error.captureStackTrace only exists in V8/Node, creating untestable branches)
        "src/domain/types/*-errors.ts",
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
