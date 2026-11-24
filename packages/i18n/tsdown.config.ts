import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "connection-notices": "src/connection-notices-entry.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
});
