#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

// Writes the Kaiord App's service worker, `sw.js`, into the assembled `app/`
// tree. It must run after every step that changes a byte of that tree: each
// revision is the SHA-256 of the file as it ships, and the worker refuses to
// install over a byte that differs (design D1). The first line is the config
// (`const SW = {...};`), so the guard can read it back without running it.

const SOURCE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../packages/workout-spa-editor/sw"
);
// One classic script, in this order: each part uses what the previous ones
// declared.
const NORMAL_PARTS = ["sw-precache.js", "sw-retention.js", "sw.js"];
const KILL_PARTS = ["sw-kill.js"];

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
    EXCLUDED_NAMES.has(name) ||
    name.startsWith(".") ||
    relPath.endsWith(".map")
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

export function buildManifest(appDir, scope) {
  return shippedFiles(appDir).map((rel) => {
    const url = `${scope}${rel}`;
    const revision = sha256(readFileSync(join(appDir, rel)));
    const key = isHashed(rel) ? url : `${url}?__rev=${revision}`;
    return { url, revision, key };
  });
}

const versionOf = (manifest) =>
  sha256(
    manifest.map(({ url, revision }) => `${url} ${revision}`).join("\n")
  ).slice(0, 12);

export function emitServiceWorker(appDir, { scope, kill = false }) {
  if (!/^\/(?:[^/]+\/)*$/.test(scope ?? "")) {
    throw new Error(`emitServiceWorker: scope must be like /app/, got ${scope}`);
  }
  const config = kill
    ? { mode: "kill", scope }
    : (() => {
        const manifest = buildManifest(appDir, scope);
        return { mode: "normal", scope, version: versionOf(manifest), manifest };
      })();
  const body = (kill ? KILL_PARTS : NORMAL_PARTS)
    .map((part) => readFileSync(join(SOURCE_DIR, part), "utf8"))
    .join("\n");
  const source = `const SW = ${JSON.stringify(config)};\n${body}`;
  writeFileSync(join(appDir, "sw.js"), source);
  return config;
}

/** The config line `emitServiceWorker` wrote, parsed back. */
export function readWorkerConfig(source) {
  const line = /^const SW = (\{.*\});$/m.exec(source);
  if (!line) throw new Error("sw.js has no `const SW = {...};` config line");
  return JSON.parse(line[1]);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({
    options: {
      app: { type: "string" },
      scope: { type: "string", default: "/app/" },
      kill: { type: "boolean", default: false },
    },
  });
  if (!values.app) throw new Error("Missing --app <dir>");
  const config = emitServiceWorker(resolve(values.app), values);
  console.log(`✅ sw.js emitted (${config.mode}) for scope ${config.scope}`);
}
