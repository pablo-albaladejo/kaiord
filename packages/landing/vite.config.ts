import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";

import { expandIncludes } from "./scripts/expand-includes.mjs";

const ROOT = fileURLToPath(new URL(".", import.meta.url));

function htmlIncludes(root: string): Plugin {
  return {
    name: "html-includes",
    configureServer(server) {
      server.watcher.add(`${root}partials`);
    },
    handleHotUpdate({ file, server }) {
      if (!file.startsWith(`${root}partials`)) return;
      server.ws.send({ type: "full-reload" });
      return [];
    },
    transformIndexHtml: {
      order: "pre",
      handler: (html) => expandIncludes(html, root),
    },
  };
}

function conditionalUmami(websiteId: string | undefined): Plugin {
  return {
    name: "conditional-umami",
    transformIndexHtml(html) {
      if (!websiteId) {
        return html.replace(
          /<!--\s*UMAMI_START\s*-->[\s\S]*?<!--\s*UMAMI_END\s*-->/g,
          ""
        );
      }
      return html
        .replace(/<!--\s*UMAMI_START\s*-->/g, "")
        .replace(/<!--\s*UMAMI_END\s*-->/g, "")
        .replace(/%VITE_UMAMI_WEBSITE_ID%/g, websiteId);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      htmlIncludes(ROOT),
      tailwindcss(),
      conditionalUmami(env.VITE_UMAMI_WEBSITE_ID),
    ],
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
