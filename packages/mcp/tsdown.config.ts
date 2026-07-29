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
    // tsdown auto-enables dts when package.json declares `types`; the bin
    // entry ships no type surface.
    dts: false,
    // tsdown cleans by default; keep the library build's output intact.
    // The build script passes --concurrency 1 so this build cannot start
    // before the first one's clean+write finishes (tsdown runs array
    // configs in parallel by default).
    clean: false,
    shims: true,
    treeshake: true,
    outExtensions: () => ({ js: ".js" }),
    banner: "#!/usr/bin/env node",
  },
]);
