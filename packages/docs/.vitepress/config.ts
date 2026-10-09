import { transformerTwoslash } from "@shikijs/vitepress-twoslash";
import llmstxt from "vitepress-plugin-llms";
import type { HeadConfig, TransformContext } from "vitepress";

import { buildStaticHead } from "./head-config.mjs";
import {
  apiSourcePaths,
  gitLastmod,
  hasFullHistory,
  hreflangPair,
  isNoindexPath,
  isNoindexUrl,
} from "./indexing.mjs";

const SITE_URL = "https://kaiord.com";
const DOCS_BASE = "/docs/";
const OG_IMAGE = `${SITE_URL}${DOCS_BASE}og-image-docs.png`;

// One canonical URL per page, matching what cleanUrls actually serves
// (extensionless, directory-style for index pages). Every docs page renders
// under three reachable variants (clean, .html, and the .md mirror for LLMs);
// without a canonical, engines pick arbitrarily.
function pageCanonicalUrl(relativePath: string): string {
  const path = relativePath.replace(/\.md$/, "").replace(/(^|\/)index$/, "$1");
  return `${SITE_URL}${DOCS_BASE}${path}`;
}

const AUTHOR = {
  name: "Pablo Albaladejo",
  linkedin:
    "https://www.linkedin.com/in/pablo-albaladejo-aws-software-engineer-ai",
  github: "https://github.com/pablo-albaladejo",
};

// A crumb links the page that actually serves its path. A segment with no
// page of its own (`api/core/type-aliases/`) gets no crumb: its URL is a 404,
// and `scripts/check-site-links.mjs` rejects any link to one.
function breadcrumbItems(relativePath: string, pages: ReadonlySet<string>) {
  const segments = relativePath
    .replace(/\.md$/, "")
    .replace(/(^|\/)index$/, "")
    .split("/")
    .filter(Boolean);
  const crumbs = [{ name: "Docs", item: `${SITE_URL}${DOCS_BASE}` }];
  segments.forEach((seg, i) => {
    const prefix = segments.slice(0, i + 1).join("/");
    const page =
      i === segments.length - 1
        ? relativePath
        : [`${prefix}.md`, `${prefix}/index.md`, `${prefix}/README.md`].find(
            (candidate) => pages.has(candidate)
          );
    const item = page && pageCanonicalUrl(page);
    if (item && item !== crumbs[crumbs.length - 1].item) {
      const name =
        seg === "api" ? "API" : seg.charAt(0).toUpperCase() + seg.slice(1);
      crumbs.push({ name: name.replace(/-/g, " "), item });
    }
  });
  return crumbs.map((crumb, i) => ({
    "@type": "ListItem",
    position: i + 1,
    ...crumb,
  }));
}

function buildJsonLd(
  pageData: {
    relativePath: string;
    title: string;
    description: string;
    lastUpdated?: number;
  },
  isHome: boolean,
  pages: ReadonlySet<string>
): string[] {
  const pageUrl = pageCanonicalUrl(pageData.relativePath);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems(pageData.relativePath, pages),
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
      ...(pageData.lastUpdated
        ? { dateModified: new Date(pageData.lastUpdated).toISOString() }
        : {}),
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

// A shallow clone answers HEAD's date for every file, so "last updated"
// would be the same wrong date everywhere: without full history, dates are
// left out (and REQUIRE_FULL_HISTORY=1 makes that an error instead).
const FULL_HISTORY = hasFullHistory();

// `siteConfig.pages` is the same array for every page of a build; build the
// lookup Set once per build instead of once per page.
const pageSets = new WeakMap<string[], ReadonlySet<string>>();
function pageSet(pages: string[]): ReadonlySet<string> {
  let set = pageSets.get(pages);
  if (!set) {
    set = new Set(pages);
    pageSets.set(pages, set);
  }
  return set;
}

type SitemapItem = { url: string; lastmod?: string | number };

// Only indexable pages are listed. VitePress dates tracked pages from git;
// the generated (gitignored) API entry pages are dated by their package
// sources instead.
function sitemapItems(items: SitemapItem[]): SitemapItem[] {
  const kept = items.filter((item) => !isNoindexUrl(item.url));
  const packages = kept
    .map((item) => item.url.match(/^api\/([^/]+)\//)?.[1])
    .filter((pkg): pkg is string => Boolean(pkg));
  return kept.map((item) => {
    if (!FULL_HISTORY) return { url: item.url };
    if (!/^api(\/|$)/.test(item.url)) return item;
    const lastmod = gitLastmod(apiSourcePaths(item.url, packages));
    return lastmod ? { ...item, lastmod } : { url: item.url };
  });
}

const ATHLETE_GUIDES = [
  ["ai-planning-byok", "AI planning with your key", "IA con tu propia clave"],
  ["whoop-recovery-in-plan", "WHOOP recovery", "Recuperación de WHOOP"],
  [
    "kaiord-vs-trainingpeaks-intervals-garmin",
    "Kaiord vs TrainingPeaks, intervals.icu, Garmin",
    "Kaiord frente a otras plataformas",
  ],
] as const;

const config = {
  lang: "en",

  // Only the four athlete guides are translated. `i18nRouting: false` makes
  // the language switcher link to each locale's root instead of "/es/<same
  // path>", which would be a 404 on every untranslated page.
  locales: {
    root: { label: "English", lang: "en" },
    es: {
      label: "Español",
      lang: "es",
      link: "/es/",
      themeConfig: {
        nav: [
          { text: "Guías", link: "/es/" },
          { text: "Convertir", link: "/convert/" },
        ],
        sidebar: [
          {
            text: "Guías",
            items: [
              { text: "Inicio", link: "/es/" },
              ...ATHLETE_GUIDES.map(([slug, , es]) => ({
                text: es,
                link: `/es/guide/${slug}`,
              })),
            ],
          },
        ],
        outline: { level: [2, 3], label: "En esta página" },
        lastUpdated: { text: "Última actualización" },
        editLink: {
          pattern:
            "https://github.com/pablo-albaladejo/kaiord/edit/main/packages/docs/:path",
          text: "Editar esta página en GitHub",
        },
      },
    },
  },
  title: "Kaiord",
  description:
    "Open-source health & fitness data framework for TypeScript. Convert FIT, TCX, ZWO, and GCN formats.",
  base: DOCS_BASE,

  // AGENTS.md files are agent-facing documentation, not part of the public
  // docs site. Exclude them from the VitePress build (dead-link checking,
  // sitemap, llmstxt) but keep them on disk for AI agents to read.
  // README.md and CHANGELOG.md at the docs root are package files, not docs
  // pages; root-anchored so the generated `api/<pkg>/README.md` indexes stay.
  srcExclude: ["**/AGENTS.md", "README.md", "CHANGELOG.md"],

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
    transformItems: sitemapItems,
  },

  lastUpdated: FULL_HISTORY,

  // Extensionless URLs (GitHub Pages resolves /page to page.html). Cleaner
  // canonical URLs for search engines and AI-agent citations; the .html
  // files are still emitted, so old links keep working.
  cleanUrls: true,

  appearance: "dark",

  themeConfig: {
    logo: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
    siteTitle: "Kaiord",
    i18nRouting: false,

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
        text: "For athletes",
        collapsed: false,
        items: ATHLETE_GUIDES.map(([slug, en]) => ({
          text: en,
          link: `/guide/${slug}`,
        })),
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
        'Built by <a href="https://pabloalbaladejo.com" target="_blank" rel="noopener">Pablo Albaladejo</a>',
      copyright:
        '<a href="https://github.com/pablo-albaladejo/kaiord/releases" target="_blank" rel="noopener">GitHub Releases</a>',
    },

    search: {
      provider: "local",
    },

    lastUpdated: { text: "Last updated" },

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

  transformHead({ pageData, siteConfig }: TransformContext) {
    const head: HeadConfig[] = [];
    const isHome = pageData.relativePath === "index.md";

    head.push([
      "link",
      { rel: "canonical", href: pageCanonicalUrl(pageData.relativePath) },
    ]);

    const pair = hreflangPair(pageData.relativePath);
    if (pair) {
      for (const [hreflang, path] of [
        ["en", pair.en],
        ["es", pair.es],
        ["x-default", pair.en],
      ]) {
        head.push([
          "link",
          { rel: "alternate", hreflang, href: pageCanonicalUrl(path) },
        ]);
      }
    }

    if (isNoindexPath(pageData.relativePath)) {
      head.push(["meta", { name: "robots", content: "noindex,follow" }]);
    }

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
        lastUpdated: pageData.lastUpdated,
      },
      isHome,
      pageSet(siteConfig.pages)
    );

    for (const block of jsonLdBlocks) {
      head.push(["script", { type: "application/ld+json" }, block]);
    }

    return head;
  },
};

export default config;
