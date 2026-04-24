import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";

function conditionalBeacon(): Plugin {
  return {
    name: "conditional-beacon",
    transformIndexHtml(html, ctx) {
      const token = ctx.server
        ? process.env.VITE_CF_ANALYTICS_TOKEN
        : process.env.VITE_CF_ANALYTICS_TOKEN;
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

export default defineConfig({
  plugins: [tailwindcss(), conditionalBeacon()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
