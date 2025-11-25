import { writeFileSync } from "fs";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "bin/kaiord": "src/bin/kaiord.ts",
  },
  format: ["esm"],
  dts: false,
  clean: true,
  shims: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  onSuccess: async () => {
    // Create package.json in dist to mark it as ESM
    writeFileSync(
      "dist/package.json",
      JSON.stringify({ type: "module" }, null, 2)
    );
  },
});
