// Postbuild step: writes dist/sitemap-landing.xml with a real <lastmod> per
// URL, taken from the last commit touching the files that page is built
// from. Replaces the hand-written public/ copy, which carried no dates.
//
// A shallow clone (depth 1) answers HEAD's date for every path, so without
// full history the <lastmod> elements are left out; REQUIRE_FULL_HISTORY=1
// (CI `build` job and deploy, both at fetch-depth 0) makes that an error.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, "../../..");
const ORIGIN = "https://kaiord.com";
const LANDING = ["packages/landing/index.html", "packages/landing/src"];
const ALTERNATES = [
  ["en", `${ORIGIN}/`],
  ["es", `${ORIGIN}/es/`],
  ["x-default", `${ORIGIN}/`],
];

export const PAGES = [
  { loc: `${ORIGIN}/`, priority: "1.0", sources: LANDING, alternates: true },
  {
    loc: `${ORIGIN}/es/`,
    priority: "0.9",
    sources: [...LANDING, "packages/landing/i18n"],
    alternates: true,
  },
  {
    loc: `${ORIGIN}/app/`,
    priority: "0.9",
    sources: [
      "packages/workout-spa-editor/index.html",
      "packages/workout-spa-editor/src",
    ],
  },
];

const runGit = (args) => {
  const out = spawnSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" });
  return out.status === 0 ? out.stdout.trim() : null;
};

/** The git queries this script makes, over a `git(args) => stdout | null`. */
export function createGitProvider(git = runGit) {
  return {
    isShallow: () => git(["rev-parse", "--is-shallow-repository"]) !== "false",
    lastCommitDate(paths) {
      const seconds = Number.parseInt(
        git(["log", "-1", "--format=%at", "--", ...paths]) ?? "",
        10
      );
      return seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
    },
  };
}

const urlEntry = (page, lastmod) =>
  [
    "  <url>",
    `    <loc>${page.loc}</loc>`,
    ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
    "    <changefreq>monthly</changefreq>",
    `    <priority>${page.priority}</priority>`,
    ...(page.alternates
      ? ALTERNATES.map(
          ([lang, href]) =>
            `    <xhtml:link rel="alternate" hreflang="${lang}" href="${href}" />`
        )
      : []),
    "  </url>",
  ].join("\n");

export function buildSitemap({
  git = createGitProvider(),
  env = process.env,
} = {}) {
  const dated = !git.isShallow();
  if (!dated && env.REQUIRE_FULL_HISTORY === "1") {
    throw new Error(
      "build-sitemap: REQUIRE_FULL_HISTORY=1 but the checkout has no full git history; check out with fetch-depth: 0"
    );
  }
  const lastmods = PAGES.map((page) =>
    dated ? git.lastCommitDate(page.sources) : null
  );
  const undated = PAGES.filter((_, i) => dated && !lastmods[i]);
  if (undated.length > 0 && env.REQUIRE_FULL_HISTORY === "1") {
    throw new Error(
      `build-sitemap: no commit dates ${undated.map((p) => p.loc).join(", ")}`
    );
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...PAGES.map((page, i) => urlEntry(page, lastmods[i])),
    "</urlset>",
    "",
  ].join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = resolve(here, "..", "dist", "sitemap-landing.xml");
  writeFileSync(out, buildSitemap());
  console.log(`build-sitemap: wrote ${out}`);
}
