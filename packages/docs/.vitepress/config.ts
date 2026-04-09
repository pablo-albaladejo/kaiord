import { defineConfig } from "vitepress";
import { transformerTwoslash } from "@shikijs/vitepress-twoslash";
import llmstxt from "vitepress-plugin-llms";
import type { HeadConfig } from "vitepress";

const SITE_URL = "https://kaiord.com";
const DOCS_BASE = "/docs/";
const OG_IMAGE = `${SITE_URL}${DOCS_BASE}og-image-docs.png`;

const AUTHOR = {
  name: "Pablo Albaladejo",
  linkedin: "https://www.linkedin.com/in/pabloalbaladejo/",
  github: "https://github.com/pablo-albaladejo",
};

function buildJsonLd(
  pageData: { relativePath: string; title: string; description: string },
  isHome: boolean,
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

  head: [
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:image", content: OG_IMAGE }],
    ["meta", { property: "og:image:width", content: "1200" }],
    ["meta", { property: "og:image:height", content: "630" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:image", content: OG_IMAGE }],
    [
      "link",
      {
        rel: "icon",
        type: "image/svg+xml",
        href: `${DOCS_BASE}logo.svg`,
      },
    ],
  ],

  sitemap: {
    hostname: SITE_URL,
  },

  appearance: "dark",

  themeConfig: {
    logo: "/logo.svg",
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
          { text: "Why Kaiord", link: "/guide/why-kaiord" },
        ],
      },
      {
        text: "Guides",
        collapsed: false,
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
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
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/pablo-albaladejo/kaiord",
      },
    ],

    footer: {
      message:
        'Built by <a href="https://www.linkedin.com/in/pabloalbaladejo/" target="_blank" rel="noopener">Pablo Albaladejo</a>',
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
    codeTransformers: [transformerTwoslash()],
  },

  vite: {
    build: { target: "esnext" },
    plugins: [llmstxt()],
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
      isHome,
    );

    for (const block of jsonLdBlocks) {
      head.push([
        "script",
        { type: "application/ld+json" },
        block,
      ]);
    }

    return head;
  },
});
