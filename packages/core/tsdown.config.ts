import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
  },
  {
    entry: { "test-utils/index": "src/test-utils/index.ts" },
    format: ["esm"],
    dts: true,
    sourcemap: false,
    // tsdown cleans by default; keep the main build's output intact. The
    // build script passes --concurrency 1 so this build cannot start
    // before the first one's clean+write finishes (tsdown runs array
    // configs in parallel by default).
    clean: false,
    treeshake: true,
    outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
    // Factories are devDependencies consumers opt into; never inline them.
    deps: { neverBundle: ["@faker-js/faker", "rosie"] },
  },
]);
