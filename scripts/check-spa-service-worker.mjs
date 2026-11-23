#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";

import { failIfAny } from "./lib/guard-failure.mjs";
import { checkKill, checkManifest } from "./lib/sw-precache-audit.mjs";

// Reads the assembled `app/` tree exactly as Pages will serve it and fails
// when its service worker could install a cache that is not this deploy's
// bytes (design D6). It shares no code with the emitter on purpose: see
// `lib/sw-precache-audit.mjs`. Run it as the last step before upload.

const readConfig = (source) => {
  const line = /^const SW = (\{.*\});$/m.exec(source);
  return line ? JSON.parse(line[1]) : null;
};

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
