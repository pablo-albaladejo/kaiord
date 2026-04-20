// Builds the static `head` array for the VitePress config. Extracted into
// a module (not inlined into config.ts) so that Node's test runner can
// import and assert on it without a TypeScript loader.
//
// Every entry here renders into every page; page-specific metadata stays
// in `transformHead` inside config.ts.

import { readBrandTokenColor } from "./brand-tokens.mjs";

/**
 * @param {{ docsBase: string; ogImage: string }} options
 * @returns {Array<[string, Record<string, string>]>}
 */
export function buildStaticHead({ docsBase, ogImage }) {
  const themeColor = readBrandTokenColor("--brand-bg-primary");

  return [
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:image", content: ogImage }],
    ["meta", { property: "og:image:width", content: "1200" }],
    ["meta", { property: "og:image:height", content: "630" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:image", content: ogImage }],
    ["meta", { name: "theme-color", content: themeColor }],
    [
      "link",
      {
        rel: "icon",
        type: "image/svg+xml",
        href: `${docsBase}logo.svg`,
      },
    ],
    [
      "link",
      {
        rel: "preload",
        href: `${docsBase}fonts/inter-var-latin.woff2`,
        as: "font",
        type: "font/woff2",
        crossorigin: "",
      },
    ],
  ];
}
