import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    providers: "src/providers/index.ts",
    prompts: "src/prompts/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  // Shared internal modules are hoisted into a common chunk both entries
  // import, so a singleton is the same instance across subpath exports.
  splitting: true,
  treeshake: true,
  esbuildOptions(options) {
    options.loader = { ...options.loader, ".md": "text" };
  },
});
