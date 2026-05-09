import { codecovVitePlugin } from "@codecov/vite-plugin";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// The Cloudflare Web Analytics token is no longer baked at build time. It is
// injected at deploy time into the placeholder in index.html and read at
// runtime via window.__KAIORD_CONFIG__. See packages/workout-spa-editor/docs/
// analytics.md and src/lib/runtime-config.ts.
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    codecovVitePlugin({
      enableBundleAnalysis: !!process.env.CODECOV_TOKEN,
      bundleName: "workout-spa-editor",
      uploadToken: process.env.CODECOV_TOKEN ?? "",
    }),
    // Trim @garmin/fitsdk's profile.js: the SDK ships a 904K static dict
    // of every FIT message type. KAIORD touches 9 messages; we vendor a
    // 256K trim and intercept the SDK's internal `import "./profile.js"`
    // resolutions at resolveId time. See scripts/generate-fitsdk-minimal.mjs.
    {
      name: "kaiord-fitsdk-profile-trim",
      enforce: "pre",
      async resolveId(source, importer) {
        if (!source.endsWith("profile.js")) return null;
        if (!importer || !importer.includes("@garmin")) return null;
        if (!importer.includes("fitsdk/src/")) return null;
        return path.resolve(
          __dirname,
          "./src/lib/fitsdk-minimal/profile.js"
        );
      },
    },
  ],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      // Stub zod/v3 to prune the v3 module from the SPA bundle.
      // @ai-sdk/provider-utils statically imports `ZodFirstPartyTypeKind` from
      // `zod/v3` for its v3-to-json-schema parsers. Our schemas are zod v4 only,
      // so the v3 dispatcher is never executed at runtime — but rolldown bundles
      // it as statically reachable. The stub provides just the named export(s)
      // used at module-load time, allowing the rest of the v3 module to be
      // tree-shaken out of vendor-zod.
      {
        find: "zod/v3",
        replacement: path.resolve(__dirname, "./src/lib/zod-v3-stub.ts"),
      },
      // Stub @ai-sdk/gateway — the `ai` SDK statically imports `createGateway`,
      // `gateway`, and `GatewayAuthenticationError` for its
      // `globalThis.AI_SDK_DEFAULT_PROVIDER ?? gateway` fallback. We always pass
      // a concrete model from provider-factory.ts, so this fallback is
      // unreachable. The stub lets rolldown drop the full gateway package
      // (~60KB raw, includes a multi-thousand-string GatewayModelId catalog).
      {
        find: "@ai-sdk/gateway",
        replacement: path.resolve(__dirname, "./src/lib/ai-sdk-gateway-stub.ts"),
      },
    ],
  },
  // GitHub Pages deployment configuration
  base: process.env.VITE_BASE_PATH || "/",
  build: {
    outDir: "dist",
    sourcemap: true,
    // Optimize for production (Vite 8 default: oxc, 30-90x faster than terser)
    minify: "oxc",
    target: "es2020",
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor-ui",
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            },
            {
              name: "vendor-state",
              test: /[\\/]node_modules[\\/]zustand[\\/]/,
            },
            { name: "vendor-zod", test: /[\\/]node_modules[\\/]zod[\\/]/ },
            {
              name: "vendor-dnd",
              test: /[\\/]node_modules[\\/]@dnd-kit[\\/]/,
            },
            {
              name: "vendor-icons",
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            },
            { name: "kaiord-core", test: /[\\/]packages[\\/]core[\\/]/ },
            { name: "kaiord-fit", test: /[\\/]packages[\\/]fit[\\/]/ },
            { name: "kaiord-tcx", test: /[\\/]packages[\\/]tcx[\\/]/ },
            { name: "kaiord-zwo", test: /[\\/]packages[\\/]zwo[\\/]/ },
            { name: "kaiord-garmin", test: /[\\/]packages[\\/]garmin[\\/]/ },
          ],
        },
      },
    },
  },
});
