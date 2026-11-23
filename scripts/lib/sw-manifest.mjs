import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, sep } from "node:path";

// The emitter's half of the service worker: which files of the assembled
// `app/` tree it precaches, each with the SHA-256 of its shipped bytes and
// its Cache Storage key, and the version those name together (design D1).

// Never precached: the worker itself, what only devtools or crawlers read,
// the live deploy marker, and repo notes or dotfiles.
const EXCLUDED_NAMES = new Set([
  "sw.js",
  "version.json",
  "og-image-editor.png",
  "AGENTS.md",
  "CLAUDE.md",
]);
const isExcluded = (relPath) => {
  const name = basename(relPath);
  return (
    EXCLUDED_NAMES.has(name) || name.startsWith(".") || relPath.endsWith(".map")
  );
};

// Vite writes every content-hashed file under `assets/`; anything else keeps
// its name across deploys, so its cache key carries its revision.
const isHashed = (relPath) => relPath.startsWith("assets/");

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function shippedFiles(appDir) {
  return readdirSync(appDir, { recursive: true })
    .map((entry) => String(entry).split(sep).join("/"))
    .filter((rel) => statSync(join(appDir, rel)).isFile())
    .filter((rel) => !isExcluded(rel))
    .sort();
}

/** Every precached file of `appDir` as `{url, revision, key}`, sorted. */
export function buildManifest(appDir, scope) {
  return shippedFiles(appDir).map((rel) => {
    const url = `${scope}${rel}`;
    const revision = sha256(readFileSync(join(appDir, rel)));
    const key = isHashed(rel) ? url : `${url}?__rev=${revision}`;
    return { url, revision, key };
  });
}

/** Twelve hex characters naming every url and revision of the manifest. */
export const versionOf = (manifest) =>
  sha256(
    manifest.map(({ url, revision }) => `${url} ${revision}`).join("\n")
  ).slice(0, 12);
