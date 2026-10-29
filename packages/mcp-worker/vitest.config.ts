import { readFileSync } from "node:fs";

import { defineConfig } from "vitest/config";

// wrangler.toml bundles `.md` imports as text modules; this mirrors that rule
// so the tests import the format spec exactly as the Worker does.
const textModules = {
  name: "kaiord-text-modules",
  enforce: "pre" as const,
  load(id: string) {
    if (!id.endsWith(".md")) return null;
    return `export default ${JSON.stringify(readFileSync(id, "utf8"))};`;
  },
};

export default defineConfig({
  plugins: [textModules],
  // The Worker bundle resolves the `browser` entries (ZWO without the JVM).
  resolve: { conditions: ["browser", "import", "default"] },
  ssr: { resolve: { conditions: ["browser", "import", "default"] } },
  test: {
    globals: false,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.d.ts", "src/test-utils/**"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
