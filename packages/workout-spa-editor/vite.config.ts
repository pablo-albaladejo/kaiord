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
          // Core React dependencies
          "vendor-react": ["react", "react-dom"],
          // UI components library (Radix)
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
          ],
          // State management
          "vendor-state": ["zustand"],
          // Validation and schemas
          "vendor-zod": ["zod"],
          // Core conversion library (large)
          "kaiord-core": ["@kaiord/core"],
        },
      },
    },
  },
});
