import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

// Resolution rules for kaiord.com, which is three builds merged into one
// GitHub Pages tree: the landing at `/`, the SPA at `/app/`, VitePress at
// `/docs/`. Pages serves `<path>` as a file, `<path>.html` (VitePress
// `cleanUrls`), or `<path>/index.html`; a directory requested without its
// trailing slash is redirected to it.

export const SITE_LINK_PATTERN =
  /https?:\/\/(?:www\.)?kaiord\.com(?![\w.-])[^\s"'<>()[\]`\\]*/g;

const isFile = (p) => existsSync(p) && statSync(p).isFile();
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

/** Mounts sorted longest prefix first; `{ prefix: "/", dir }` for a merged tree. */
export function mountFor(mounts, pathname) {
  return mounts.find(
    (m) => pathname.startsWith(m.prefix) || `${pathname}/` === m.prefix
  );
}

export function pathExists(mounts, pathname) {
  const mount = mountFor(mounts, pathname);
  if (!mount) return false;
  const rel = decodeURIComponent(pathname.slice(mount.prefix.length));
  const base = join(mount.dir, rel);
  if (rel === "" || pathname.endsWith("/")) {
    return isFile(join(base, "index.html"));
  }
  return (
    isFile(base) ||
    isFile(`${base}.html`) ||
    (isDir(base) && isFile(join(base, "index.html")))
  );
}

export const LEGACY_EDITOR_REASON =
  "links the legacy /editor/ path; link https://kaiord.com/app/ instead";

// Root-relative hrefs never carry the host, so the absolute-URL scan above
// cannot see them; in built HTML an `href="/editor…"` is the same 404.
const ROOT_RELATIVE_EDITOR_HREF = /\bhref=["'](\/editor(?:[/?#][^"']*)?)["']/g;

export function editorHrefsIn(html) {
  return [...html.matchAll(ROOT_RELATIVE_EDITOR_HREF)].map((m) => m[1]);
}

// VitePress's language switcher renders root-relative anchors carrying
// `hreflang` (`<a href="/docs/es/" rel="alternate" hreflang="es">`); the
// absolute-URL scan never sees them, and "/es/<same path>" is a 404 on any
// page that has no translation.
const SWITCHER_ANCHOR = /<a\b[^>]*\bhreflang=["'][^"']+["'][^>]*>/g;

export function switcherHrefsIn(html) {
  return [...html.matchAll(SWITCHER_ANCHOR)]
    .map((m) => m[0].match(/\bhref=["'](\/[^"']*)["']/)?.[1])
    .filter(Boolean);
}

const trimTrailingPunctuation = (url) => url.replace(/[.,;:!?]+$/, "");

export function linksIn(text) {
  return [...text.matchAll(SITE_LINK_PATTERN)].map((m) =>
    trimTrailingPunctuation(m[0].replace(/&amp;/g, "&"))
  );
}

const SPA_PATHS = new Set(["/app", "/app/", "/app/index.html"]);

/**
 * Returns the reason a kaiord.com link is broken, or null when it resolves.
 * `segments` is the SPA route registry (`route-segments.json`).
 */
export function brokenReason(mounts, segments, link) {
  const url = new URL(link);
  const { pathname, hash } = url;
  if (pathname === "/editor" || pathname.startsWith("/editor/")) {
    return LEGACY_EDITOR_REASON;
  }
  if (!pathExists(mounts, pathname)) {
    return `no page is served at ${pathname}`;
  }
  // Pages redirects /app to /app/ and keeps the fragment.
  if (SPA_PATHS.has(pathname) && hash.startsWith("#/")) {
    const segment = hash.slice(2).split(/[/?#]/)[0];
    if (segment !== "" && !segments.includes(segment)) {
      return `SPA route "/${segment}" is not in route-segments.json`;
    }
  }
  return null;
}
