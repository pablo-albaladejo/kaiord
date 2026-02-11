import { codecovVitePlugin } from "@codecov/vite-plugin";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
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
    // Optimize for production
    minify: "terser",
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
          ],
          "vendor-state": ["zustand"],
          "vendor-zod": ["zod"],
          "vendor-dnd": [
            "@dnd-kit/core",
            "@dnd-kit/sortable",
            "@dnd-kit/utilities",
          ],
          "vendor-icons": ["lucide-react"],
          "kaiord-core": ["@kaiord/core"],
          "kaiord-fit": ["@kaiord/fit"],
          "kaiord-tcx": ["@kaiord/tcx"],
          "kaiord-zwo": ["@kaiord/zwo"],
          "kaiord-garmin": ["@kaiord/garmin"],
        },
      },
    },
  },
});
