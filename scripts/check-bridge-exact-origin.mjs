#!/usr/bin/env node
/**
 * Mechanical guard: every bridge answers the exact Kaiord App origin only.
 *
 * Chrome reads `externally_connectable.matches` to decide which pages may
 * message an extension, and the announce content script hands the
 * extension id to every page it is injected into. A host wildcard in
 * either (`https://*.kaiord.com/*`, `<all_urls>`, `http://localhost/*`,
 * which matches every port) lends the athlete's Session to another page.
 * So each pattern must be one of a closed set: `https://kaiord.com/*`
 * everywhere, plus the two Vite dev ports in the dev `manifest.json` only,
 * never in `manifest.prod.json`. A wildcard `externally_connectable.ids` is
 * refused too.
 *
 * Every shipped source file of each bridge and of the bridge-core masters
 * is scanned as well (lib/bridge-origin-scan.mjs). Finding no bridge, or a
 * bridge without `manifest.json`, is a fault, not a pass.
 *
 * Rule id: R-BridgeExactOrigin.
 */

import { readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { APP_ORIGIN } from "./lib/app-origins.mjs";
import { APP, checkManifests } from "./lib/bridge-manifest-origins.mjs";
import {
  GATE_FILE,
  scanSource,
  shippedSources,
} from "./lib/bridge-origin-scan.mjs";
import { failIfAny } from "./lib/guard-failure.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RULE = "R-BridgeExactOrigin";

const checkSources = (repoRoot, dirs) =>
  dirs.flatMap(shippedSources).flatMap((file) =>
    scanSource(file).map((detail) => ({
      file: file.slice(repoRoot.length + 1),
      detail,
    }))
  );

export function runCheck({ repoRoot = REPO } = {}) {
  const packages = join(repoRoot, "packages");
  const bridges = readdirSync(packages)
    .filter(
      (n) => n.endsWith("-bridge") && statSync(join(packages, n)).isDirectory()
    )
    .sort();
  if (bridges.length === 0) {
    return [
      { rule: RULE, file: "packages", detail: "found no bridge to check" },
    ];
  }
  const dirs = [
    ...bridges.map((name) => join(packages, name)),
    join(packages, "_shared", "bridge-core"),
  ];
  return [
    ...bridges.flatMap((name) => checkManifests(repoRoot, name)),
    ...checkSources(repoRoot, dirs),
  ].map((v) => ({ rule: RULE, ...v }));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  failIfAny(
    "place(s) where a bridge accepts more than the exact Kaiord App origin",
    runCheck().map((v) => `[${v.rule}] ${v.file} — ${v.detail}`),
    `Remediation: declare only ${APP} (plus the two Vite dev ports in manifest.json) and compare sender.origin to "${APP_ORIGIN}" as a whole string in ${GATE_FILE} (spec: bridge-core).`
  );
  console.log("✅ Every bridge answers the exact Kaiord App origin only.");
}
