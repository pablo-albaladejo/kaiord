import { writeFileSync } from "fs";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    "bin/kaiord": "src/bin/kaiord.ts",
  },
  format: ["esm"],
  dts: false,
  clean: true,
  shims: true,
  banner: "#!/usr/bin/env node",
  outExtensions: () => ({ js: ".js" }),
  onSuccess: async () => {
    // Create package.json in dist to mark it as ESM
    writeFileSync(
      "dist/package.json",
      JSON.stringify({ type: "module" }, null, 2)
    );
  },
});
