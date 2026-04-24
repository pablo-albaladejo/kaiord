import { defineConfig } from "vitepress";
import { transformerTwoslash } from "@shikijs/vitepress-twoslash";
import llmstxt from "vitepress-plugin-llms";
import type { HeadConfig } from "vitepress";

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

export default defineConfig({
  lang: "en",
  title: "Kaiord",
  description:
    "Open-source health & fitness data framework for TypeScript. Convert FIT, TCX, ZWO, and GCN formats.",
  base: DOCS_BASE,

  head: buildStaticHead({ docsBase: DOCS_BASE, ogImage: OG_IMAGE }),

  sitemap: {
    hostname: SITE_URL,
  },

  appearance: "dark",

  themeConfig: {
    logo: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
    siteTitle: "Kaiord",

    nav: [
      { text: "Quick Start", link: "/guide/quick-start" },
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
    plugins: [llmstxt() as never],
  },

  transformHead({ pageData }) {
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
});
