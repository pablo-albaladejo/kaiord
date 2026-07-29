import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    providers: "src/providers/index.ts",
    prompts: "src/prompts/index.ts",
    agents: "src/agents/index.ts",
    observability: "src/observability/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  // Chunk splitting (always on in tsdown) hoists shared internal modules
  // into a common chunk, so a singleton is the same instance across
  // subpath exports.
  treeshake: true,
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
  // Markdown prompt templates are imported as raw strings.
  loader: { ".md": "text" },
});
