#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, sep } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";

import { failIfAny } from "./lib/guard-failure.mjs";

// Reads the assembled `app/` tree exactly as Pages will serve it and fails
// when its service worker could install a cache that is not this deploy's
// bytes (design D6). It shares no code with the emitter on purpose: the
// exclusions and the key rule are restated here, so an emitter that drifts
// is caught instead of agreed with. Run it as the last step before upload.

const EXCLUDED = new Set([
  "sw.js",
  "version.json",
  "og-image-editor.png",
  "AGENTS.md",
  "CLAUDE.md",
]);
const isExcluded = (rel) =>
  EXCLUDED.has(basename(rel)) ||
  basename(rel).startsWith(".") ||
  rel.endsWith(".map");

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const shipped = (app) =>
  readdirSync(app, { recursive: true })
    .map((entry) => String(entry).split(sep).join("/"))
    .filter((rel) => statSync(join(app, rel)).isFile() && !isExcluded(rel));

const readConfig = (source) => {
  const line = /^const SW = (\{.*\});$/m.exec(source);
  return line ? JSON.parse(line[1]) : null;
};

function checkKill(source) {
  const problems = [];
  if (/addEventListener\(\s*["']fetch["']/.test(source)) {
    problems.push("the kill worker has a fetch handler");
  }
  if (/\.claim\(/.test(source)) {
    problems.push("the kill worker calls clients.claim()");
  }
  if (/includeUncontrolled/.test(source)) {
    problems.push("the kill worker reaches windows it does not control");
  }
  return problems;
}

function checkManifest(app, base, manifest) {
  if (manifest.length === 0) return ["the manifest is empty"];
  const problems = [];
  const listed = new Set();
  for (const { url, revision, key } of manifest) {
    if (!url.startsWith(base)) {
      problems.push(`${url}: outside the scope ${base}`);
      continue;
    }
    const rel = url.slice(base.length);
    listed.add(rel);
    if (isExcluded(rel)) problems.push(`${rel}: excluded but listed`);
    else if (!existsSync(join(app, rel))) {
      problems.push(`${rel}: listed but not shipped`);
    } else if (sha256(readFileSync(join(app, rel))) !== revision) {
      problems.push(`${rel}: shipped bytes do not match its revision`);
    }
    const expected = rel.startsWith("assets/") ? url : `${url}?__rev=${revision}`;
    if (key !== expected) {
      problems.push(
        rel.startsWith("assets/")
          ? `${rel}: a hashed chunk keyed as ${key}`
          : `${rel}: not keyed by ?__rev=<revision>`
      );
    }
  }
  for (const rel of shipped(app)) {
    if (!listed.has(rel)) problems.push(`${rel}: shipped but not precached`);
  }
  return problems;
}

export function checkServiceWorker(app, { base, mode }) {
  const path = join(app, "sw.js");
  if (!existsSync(path)) return ["sw.js is missing"];
  const source = readFileSync(path, "utf8");
  const config = readConfig(source);
  if (!config) return ["sw.js has no config line"];
  const problems = [];
  if (config.scope !== base) {
    problems.push(`scope is ${config.scope} but the base is ${base}`);
  }
  if (config.mode !== mode) {
    return [...problems, `mode is ${config.mode} but the deploy asked for ${mode}`];
  }
  if (mode === "kill") return [...problems, ...checkKill(source)];
  return [...problems, ...checkManifest(app, base, config.manifest ?? [])];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({
    options: {
      app: { type: "string" },
      base: { type: "string", default: "/app/" },
      mode: { type: "string", default: "normal" },
    },
  });
  if (!values.app || !["normal", "kill"].includes(values.mode)) {
    console.error(
      "Usage: node scripts/check-spa-service-worker.mjs --app <dir> [--base /app/] [--mode normal|kill]"
    );
    process.exit(1);
  }
  failIfAny("service worker problem(s)", checkServiceWorker(values.app, values));
  console.log(
    values.mode === "kill"
      ? `✅ ${values.app}/sw.js is the kill worker`
      : `✅ ${values.app}/sw.js precaches exactly this deploy`
  );
}
