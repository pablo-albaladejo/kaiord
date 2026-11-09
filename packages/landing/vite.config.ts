import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";

import { expandIncludes } from "./scripts/expand-includes.mjs";

function htmlIncludes(root: string): Plugin {
  return {
    name: "html-includes",
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
      htmlIncludes(process.cwd()),
      tailwindcss(),
      conditionalUmami(env.VITE_UMAMI_WEBSITE_ID),
    ],
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
