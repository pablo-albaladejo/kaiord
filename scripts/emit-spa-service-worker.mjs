#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildManifest, versionOf } from "./lib/sw-manifest.mjs";

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
