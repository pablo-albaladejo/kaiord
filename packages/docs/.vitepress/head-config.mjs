// Builds the static `head` array for the VitePress config. Extracted into
// a module (not inlined into config.ts) so that Node's test runner can
// import and assert on it without a TypeScript loader.
//
// Every entry here renders into every page; page-specific metadata stays
// in `transformHead` inside config.ts.

import { readBrandTokenColor } from "./brand-tokens.mjs";

/**
 * @param {{ docsBase: string; ogImage: string; umamiWebsiteId?: string }} options
 * @returns {Array<[string, Record<string, string>]>}
 */
export function buildStaticHead({ docsBase, ogImage, umamiWebsiteId }) {
  const themeColor = readBrandTokenColor("--brand-bg-primary");

  const head = [
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

  // Umami analytics — loaded only when a website id is provided at build time
  // (via the UMAMI_WEBSITE_ID env var in the deploy workflow). Auto-track is
  // left on: the docs site is server-rendered multi-page, so the tracker's
  // History-API page views are correct.
  if (umamiWebsiteId) {
    head.push([
      "script",
      {
        defer: "",
        src: "https://cloud.umami.is/script.js",
        "data-website-id": umamiWebsiteId,
      },
    ]);
  }

  return head;
}
