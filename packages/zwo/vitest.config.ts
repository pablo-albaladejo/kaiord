import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    // XSD validation shells out to a Java subprocess (xsd-schema-validator).
    // Running test files in parallel spawns many JVMs at once; under load (CI,
    // the nightly's full build) those spawns fail transiently and surface as
    // spurious "does not conform to XSD schema" errors. Serialize files so at
    // most one validation subprocess runs at a time.
    fileParallelism: false,
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
