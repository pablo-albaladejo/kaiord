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
<<<<<<< HEAD
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
=======
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.config.ts",
        "**/*.config.js",
        "**/__tests__/**",
<<<<<<< HEAD
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
=======
      ],
    },
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)
  },
});
