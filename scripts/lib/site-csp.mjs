import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, sep } from "node:path";

import { SITE_CSP, serializePolicy } from "./site-csp-policy.mjs";

export { SITE_CSP };

// Puts the policy in each page as a <meta http-equiv>: GitHub Pages sets no
// response headers. A <meta> policy governs only what is parsed after it, so
// it goes first in <head>, after the charset, ahead of every script.

const CSP_META =
  /\s*<meta\b[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/gi;
const CHARSET_META = /\s*<meta\s+charset=[^>]*>/i;
const INLINE_SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const DATA_BLOCK_TYPE =
  /\btype\s*=\s*["']?(?!text\/javascript|application\/javascript|module)[^"'\s>]/i;

const sha256 = (text) =>
  `'sha256-${createHash("sha256").update(text).digest("base64")}'`;

export function inlineScriptHashes(html) {
  return [...html.matchAll(INLINE_SCRIPT)]
    .filter(([, attrs]) => !/\bsrc\s*=/i.test(attrs))
    .filter(([, attrs]) => !DATA_BLOCK_TYPE.test(attrs))
    .map(([, , text]) => sha256(text));
}

export function withCsp(html, directives) {
  const bare = html.replace(CSP_META, "");
  const head = /<head\b[^>]*>/i.exec(bare);
  if (!head) throw new Error("withCsp: the page has no <head>");
  const end = head.index + head[0].length;
  const charset = CHARSET_META.exec(bare.slice(end))?.[0].trim();
  const rest = bare.slice(end).replace(CHARSET_META, "");
  const hashes = [...new Set(inlineScriptHashes(rest))];
  const policy = serializePolicy(directives, hashes);
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}" />`;
  const lead = charset ? `\n    ${charset}\n    ${meta}` : `\n    ${meta}`;
  return bare.slice(0, end) + lead + rest;
}

const surfaceOf = (file) =>
  file.startsWith("app/") ? SITE_CSP.app : SITE_CSP.landing;

/** Applies the policy to every landing and App page; the docs are left alone. */
export function applySiteCsp(siteDir) {
  const pages = readdirSync(siteDir, { recursive: true })
    .map((entry) => String(entry).split(sep).join("/"))
    .filter((file) => file.endsWith(".html") && !file.startsWith("docs/"));
  for (const file of pages) {
    const path = join(siteDir, file);
    writeFileSync(path, withCsp(readFileSync(path, "utf8"), surfaceOf(file)));
  }
  return pages;
}
