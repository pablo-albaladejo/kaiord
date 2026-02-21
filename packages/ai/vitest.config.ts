import { readFileSync } from "fs";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const rawMd = (): Plugin => ({
  name: "raw-md",
  transform(_code: string, id: string) {
    if (id.endsWith(".md")) {
      const content = readFileSync(id, "utf-8");
      return { code: `export default ${JSON.stringify(content)};` };
    }
  },
});

export default defineConfig({
  plugins: [rawMd()],
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
      ],
    },
  },
});
