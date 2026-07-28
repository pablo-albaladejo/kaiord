import { writeFileSync } from "fs";
import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: true,
    clean: true,
    shims: true,
    treeshake: true,
    outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
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
    // tsdown cleans by default; keep the library build's output intact.
    clean: false,
    shims: true,
    treeshake: true,
    outExtensions: () => ({ js: ".js" }),
    banner: "#!/usr/bin/env node",
  },
]);
