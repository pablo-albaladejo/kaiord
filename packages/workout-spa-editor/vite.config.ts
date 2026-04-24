import { codecovVitePlugin } from "@codecov/vite-plugin";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import type { Plugin } from "vite";

function conditionalBeacon(): Plugin {
  return {
    name: "conditional-beacon",
    transformIndexHtml(html) {
      const token = process.env.VITE_CF_ANALYTICS_TOKEN;
      if (!token) {
        return html.replace(
          /<!--\s*CF_BEACON_START\s*-->[\s\S]*?<!--\s*CF_BEACON_END\s*-->/g,
          ""
        );
      }
      return html
        .replace(/<!--\s*CF_BEACON_START\s*-->/g, "")
        .replace(/<!--\s*CF_BEACON_END\s*-->/g, "")
        .replace(/%VITE_CF_ANALYTICS_TOKEN%/g, token);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    conditionalBeacon(),
    codecovVitePlugin({
      enableBundleAnalysis: !!process.env.CODECOV_TOKEN,
      bundleName: "workout-spa-editor",
      uploadToken: process.env.CODECOV_TOKEN ?? "",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
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
            { name: "vendor-ui", test: /[\\/]node_modules[\\/]@radix-ui[\\/]/ },
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
