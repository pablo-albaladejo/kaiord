import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
  },
  {
    entry: { "test-utils/index": "src/test-utils/index.ts" },
    format: ["esm"],
    dts: true,
    sourcemap: false,
    clean: false,
    splitting: false,
    treeshake: true,
    external: ["@faker-js/faker", "rosie"],
  },
]);
