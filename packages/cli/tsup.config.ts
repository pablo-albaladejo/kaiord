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
});
