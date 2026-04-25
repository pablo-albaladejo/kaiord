import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";

function conditionalBeacon(token: string | undefined): Plugin {
  return {
    name: "conditional-beacon",
    transformIndexHtml(html) {
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [tailwindcss(), conditionalBeacon(env.VITE_CF_ANALYTICS_TOKEN)],
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
