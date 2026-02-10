import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    css: true,
    onConsoleLog(log: string, type: "stdout" | "stderr"): false | void {
      // Suppress act() warnings from Radix UI components (false positives in Node 20.x)
      if (
        type === "stderr" &&
        log.includes("not wrapped in act(...)") &&
        (log.includes("Tooltip") ||
          log.includes("Presence") ||
          log.includes("Portal") ||
          log.includes("PopperContent") ||
          log.includes("DismissableLayer") ||
          log.includes("FocusScope") ||
          log.includes("TargetPicker"))
      ) {
        return false;
      }
      // Suppress adapter logger output from @kaiord/fit, @kaiord/tcx, @kaiord/zwo.
      // Pre-built adapters use consoleLogger which outputs during conversions.
      // These are expected in tests that exercise import/export pipelines.
      if (
        /^(Encoding|Converting|Parsing|Building|Validating|Writing|Converted|Browser environment|Invalid (Zwift|TCX|step)|Zwift XML|KRD (to|encoded)|TCX XML|FIT parsing|Not implemented: navigation)/.test(
          log,
        )
      ) {
        return false;
      }
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.config.ts",
        "**/*.config.js",
        "**/__tests__/**",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/test-setup.ts",
        "**/types/**",
        "**/*.d.ts",
        "**/main.tsx",
        "**/vite-env.d.ts",
        // Storybook stories - documentation, not production code
        "**/*.stories.tsx",
        "**/*.stories.ts",
        // Type definition files - validated by TypeScript at compile-time
        "**/*.types.ts",
        // Re-export index files - no logic to test
        "**/index.ts",
        "src/components/atoms/index.ts",
        "src/components/molecules/index.ts",
        "src/components/organisms/index.ts",
        "src/components/pages/index.ts",
        "src/components/templates/index.ts",
        "src/store/index.ts",
        "src/utils/index.ts",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
      all: true,
      include: ["src/**/*.{ts,tsx}"],
    },
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],
  },
});
