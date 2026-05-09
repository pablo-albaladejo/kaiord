import { writeFileSync } from "fs";
import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: true,
    clean: true,
    shims: true,
    splitting: true,
    treeshake: true,
    onSuccess: async () => {
      writeFileSync(
        "dist/package.json",
        JSON.stringify({ type: "module" }, null, 2)
      );
    },
  },
  {
    entry: { "bin/kaiord-mcp": "src/bin/kaiord-mcp.ts" },
    format: ["esm"],
    shims: true,
    splitting: true,
    treeshake: true,
    banner: { js: "#!/usr/bin/env node" },
  },
]);
