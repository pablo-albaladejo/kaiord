import { writeFileSync } from "fs";
import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: true,
    clean: true,
    shims: true,
    splitting: false,
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
    splitting: false,
    banner: { js: "#!/usr/bin/env node" },
  },
]);
