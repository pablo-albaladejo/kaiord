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

const trimTrailingPunctuation = (url) => url.replace(/[.,;:!?]+$/, "");

export function linksIn(text) {
  return [...text.matchAll(SITE_LINK_PATTERN)].map((m) =>
    trimTrailingPunctuation(m[0].replace(/&amp;/g, "&"))
  );
}

/**
 * Returns the reason a kaiord.com link is broken, or null when it resolves.
 * `segments` is the SPA route registry (`route-segments.json`).
 */
export function brokenReason(mounts, segments, link) {
  const url = new URL(link);
  const { pathname, hash } = url;
  if (pathname === "/editor" || pathname.startsWith("/editor/")) {
    return "links the legacy /editor/ path; link https://kaiord.com/app/ instead";
  }
  if (!pathExists(mounts, pathname)) {
    return `no page is served at ${pathname}`;
  }
  const isApp = pathname === "/app/" || pathname === "/app/index.html";
  if (isApp && hash.startsWith("#/")) {
    const segment = hash.slice(2).split(/[/?#]/)[0];
    if (segment !== "" && !segments.includes(segment)) {
      return `SPA route "/${segment}" is not in route-segments.json`;
    }
  }
  return null;
}
