import { transformerTwoslash } from "@shikijs/vitepress-twoslash";
import llmstxt from "vitepress-plugin-llms";
import type { HeadConfig, TransformContext } from "vitepress";

import { buildStaticHead } from "./head-config.mjs";

const SITE_URL = "https://kaiord.com";
const DOCS_BASE = "/docs/";
const OG_IMAGE = `${SITE_URL}${DOCS_BASE}og-image-docs.png`;

const AUTHOR = {
  name: "Pablo Albaladejo",
  linkedin:
    "https://www.linkedin.com/in/pablo-albaladejo-aws-software-engineer-ai/",
  github: "https://github.com/pablo-albaladejo",
};

function buildJsonLd(
  pageData: { relativePath: string; title: string; description: string },
  isHome: boolean
): string[] {
  const pageUrl = `${SITE_URL}${DOCS_BASE}${pageData.relativePath.replace(/\.md$/, ".html").replace(/index\.html$/, "")}`;
  const segments = pageData.relativePath
    .replace(/\.md$/, "")
    .replace(/\/index$/, "")
    .split("/")
    .filter(Boolean);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Docs",
        item: `${SITE_URL}${DOCS_BASE}`,
      },
      ...segments.map((seg, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
        item: `${SITE_URL}${DOCS_BASE}${segments.slice(0, i + 1).join("/")}/`,
      })),
    ],
  };

  const results = [JSON.stringify(breadcrumb)];

  if (isHome) {
    const website = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Kaiord Documentation",
      url: `${SITE_URL}${DOCS_BASE}`,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}${DOCS_BASE}?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    };
    results.push(JSON.stringify(website));
  } else {
    const article = {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: pageData.title,
      description: pageData.description,
      url: pageUrl,
      author: {
        "@type": "Person",
        name: AUTHOR.name,
        sameAs: [AUTHOR.linkedin, AUTHOR.github],
      },
    };
    results.push(JSON.stringify(article));
  }

  return results;
}

const config = {
  lang: "en",
  title: "Kaiord",
  description:
    "Open-source health & fitness data framework for TypeScript. Convert FIT, TCX, ZWO, and GCN formats.",
  base: DOCS_BASE,

  // AGENTS.md files are agent-facing documentation, not part of the public
  // docs site. Exclude them from the VitePress build (dead-link checking,
  // sitemap, llmstxt) but keep them on disk for AI agents to read.
  srcExclude: ["**/AGENTS.md"],

  head: buildStaticHead({
    docsBase: DOCS_BASE,
    ogImage: OG_IMAGE,
    umamiWebsiteId: process.env.UMAMI_WEBSITE_ID,
  }),

  // VitePress does not prepend `base` to sitemap entries, so the base must
  // be part of the hostname or every URL points at the site root
  // (kaiord.com/CHANGELOG instead of kaiord.com/docs/CHANGELOG).
  sitemap: {
    hostname: `${SITE_URL}${DOCS_BASE}`,
  },

  // Extensionless URLs (GitHub Pages resolves /page to page.html). Cleaner
  // canonical URLs for search engines and AI-agent citations; the .html
  // files are still emitted, so old links keep working.
  cleanUrls: true,

  appearance: "dark",

  themeConfig: {
    logo: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
    siteTitle: "Kaiord",

    nav: [
      { text: "Quick Start", link: "/guide/quick-start" },
      { text: "Convert", link: "/convert/" },
      { text: "Formats", link: "/formats/krd" },
      { text: "API Reference", link: "/api/" },
    ],

    sidebar: [
      {
        text: "Getting Started",
        items: [
          { text: "Quick Start", link: "/guide/quick-start" },
          { text: "Why Kaiord?", link: "/guide/why-kaiord" },
          { text: "Installation", link: "/guide/getting-started" },
        ],
      },
      {
        text: "Guides",
        collapsed: false,
        items: [
          { text: "Architecture", link: "/guide/architecture" },
          { text: "Testing", link: "/guide/testing" },
          { text: "Contributing", link: "/guide/contributing" },
        ],
      },
      {
        text: "Convert",
        collapsed: false,
        items: [
          { text: "All converters", link: "/convert/" },
          { text: "FIT to ZWO", link: "/convert/fit-to-zwo" },
          { text: "ZWO to FIT", link: "/convert/zwo-to-fit" },
          { text: "FIT to TCX", link: "/convert/fit-to-tcx" },
          { text: "TCX to FIT", link: "/convert/tcx-to-fit" },
          { text: "ZWO to Garmin", link: "/convert/zwo-to-garmin" },
          { text: "Garmin to ZWO", link: "/convert/garmin-to-zwo" },
          { text: "FIT to Garmin", link: "/convert/fit-to-garmin" },
          { text: "Garmin to FIT", link: "/convert/garmin-to-fit" },
          { text: "TCX to ZWO", link: "/convert/tcx-to-zwo" },
          { text: "ZWO to TCX", link: "/convert/zwo-to-tcx" },
          { text: "TCX to Garmin", link: "/convert/tcx-to-garmin" },
          { text: "Garmin to TCX", link: "/convert/garmin-to-tcx" },
        ],
      },
      {
        text: "Formats",
        collapsed: false,
        items: [
          { text: "KRD (Canonical)", link: "/formats/krd" },
          { text: "FIT", link: "/formats/fit" },
          { text: "TCX", link: "/formats/tcx" },
          { text: "ZWO", link: "/formats/zwo" },
          { text: "GCN (Garmin Connect)", link: "/formats/gcn" },
        ],
      },
      {
        text: "CLI",
        collapsed: false,
        items: [{ text: "Commands", link: "/cli/commands" }],
      },
      {
        text: "MCP",
        collapsed: false,
        items: [{ text: "Tools", link: "/mcp/tools" }],
      },
      {
        text: "API Reference",
        collapsed: false,
        items: [{ text: "Overview", link: "/api/" }],
      },
      {
        text: "Legal",
        collapsed: true,
        items: [{ text: "Privacy Policy", link: "/legal/privacy-policy" }],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/pablo-albaladejo/kaiord",
      },
    ],

    footer: {
      message:
        'Built by <a href="https://www.linkedin.com/in/pablo-albaladejo-aws-software-engineer-ai/" target="_blank" rel="noopener">Pablo Albaladejo</a>',
      copyright:
        '<a href="https://github.com/pablo-albaladejo/kaiord/releases" target="_blank" rel="noopener">GitHub Releases</a>',
    },

    search: {
      provider: "local",
    },

    outline: {
      level: [2, 3],
      label: "On this page",
    },

    editLink: {
      pattern:
        "https://github.com/pablo-albaladejo/kaiord/edit/main/packages/docs/:path",
      text: "Edit this page on GitHub",
    },
  },

  markdown: {
    codeTransformers: [
      transformerTwoslash({
        twoslashOptions: {
          compilerOptions: {
            types: ["node"],
            lib: ["ES2022", "DOM"],
          },
        },
      }),
    ],
    languages: [
      "ts",
      "tsx",
      "js",
      "json",
      "bash",
      "sh",
      "yaml",
      "md",
      "css",
      "html",
    ],
  },

  vite: {
    build: { target: "esnext" },
    plugins: [...llmstxt()],
  },

  transformHead({ pageData }: TransformContext) {
    const head: HeadConfig[] = [];
    const isHome = pageData.relativePath === "index.md";

    if (pageData.frontmatter.title) {
      head.push([
        "meta",
        { property: "og:title", content: pageData.frontmatter.title },
      ]);
    }
    if (pageData.frontmatter.description) {
      head.push([
        "meta",
        {
          property: "og:description",
          content: pageData.frontmatter.description,
        },
      ]);
    }

    const jsonLdBlocks = buildJsonLd(
      {
        relativePath: pageData.relativePath,
        title: pageData.frontmatter.title || pageData.title,
        description: pageData.frontmatter.description || pageData.description,
      },
      isHome
    );

    for (const block of jsonLdBlocks) {
      head.push(["script", { type: "application/ld+json" }, block]);
    }

    return head;
  },
};

export default config;
