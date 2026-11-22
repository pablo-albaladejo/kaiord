#!/usr/bin/env node
/**
 * Mechanical guard: every bridge answers the exact Kaiord App origin only.
 *
 * Chrome reads `externally_connectable.matches` to decide which pages may
 * message an extension, and the announce content script hands the
 * extension id to every page it is injected into. A host wildcard in
 * either (`https://*.kaiord.com/*`, `<all_urls>`) lets any subdomain borrow
 * the athlete's Session. So each pattern must be one of a closed set:
 * `https://kaiord.com/*` everywhere, plus the Vite dev ports in the dev
 * `manifest.json` only, never in `manifest.prod.json`. A wildcard
 * `externally_connectable.ids` is refused too.
 *
 * Runtime code is scanned as well: the shipped `*.js` of each bridge and
 * the bridge-core masters must compare the origin as a string, so a
 * `*.kaiord.com` literal or a regex over `kaiord\.com` fails. Comments are
 * ignored. Finding no bridge, or a bridge without `manifest.json`, is a
 * fault, not a pass.
 *
 * Rule id: R-BridgeExactOrigin.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RULE = "R-BridgeExactOrigin";

const APP = "https://kaiord.com/*";
const DEV_PORTS = ["http://localhost:5173/*", "http://localhost:5174/*"];
const ALLOWED = {
  "manifest.json": {
    connect: [APP, ...DEV_PORTS],
    announce: [APP, ...DEV_PORTS, "http://localhost/*"],
  },
  "manifest.prod.json": { connect: [APP], announce: [APP] },
};
const ANNOUNCE_FILES = ["kaiord-announce.js", "bridge-identity.js"];
const RUNTIME_PATTERNS = [/\*\.kaiord\.com/, /kaiord\\\.com/];

const stripComments = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/.*$/gm, (_, lead) => lead);

const checkPatterns = (where, patterns, allowed) => {
  const found = (patterns ?? [])
    .filter((p) => !allowed.includes(p))
    .map((p) => `${where} has "${p}"`);
  if (!(patterns ?? []).includes(APP)) {
    found.push(`${where} does not declare ${APP}`);
  }
  return found;
};

const checkManifest = (json, allowed) => {
  const connect = json.externally_connectable ?? {};
  const found = checkPatterns(
    "externally_connectable.matches",
    connect.matches,
    allowed.connect
  );
  if ((connect.ids ?? []).includes("*")) {
    found.push('externally_connectable.ids has "*"');
  }
  for (const entry of json.content_scripts ?? []) {
    if (!(entry.js ?? []).some((f) => ANNOUNCE_FILES.includes(f))) continue;
    found.push(
      ...checkPatterns(
        "announce content_scripts.matches",
        entry.matches,
        allowed.announce
      )
    );
  }
  return found;
};

const topLevelJs = (dir) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith(".js"))
        .map((f) => join(dir, f))
    : [];

const checkRuntime = (repoRoot, files) =>
  files.flatMap((file) => {
    const code = stripComments(readFileSync(file, "utf8"));
    return RUNTIME_PATTERNS.filter((re) => re.test(code)).map((re) => ({
      file: file.slice(repoRoot.length + 1),
      detail: `matches the App origin by pattern (${re.source})`,
    }));
  });

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
  const found = [];
  for (const name of bridges) {
    for (const [file, allowed] of Object.entries(ALLOWED)) {
      const rel = `packages/${name}/${file}`;
      const path = join(repoRoot, rel);
      if (!existsSync(path)) {
        if (file === "manifest.json")
          found.push({ file: rel, detail: "missing" });
        continue;
      }
      const json = JSON.parse(readFileSync(path, "utf8"));
      found.push(
        ...checkManifest(json, allowed).map((detail) => ({ file: rel, detail }))
      );
    }
  }
  const runtime = [
    ...bridges.flatMap((name) => topLevelJs(join(packages, name))),
    ...topLevelJs(join(packages, "_shared", "bridge-core")),
  ];
  found.push(...checkRuntime(repoRoot, runtime));
  return found.map((v) => ({ rule: RULE, ...v }));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const found = runCheck();
  if (found.length === 0) {
    console.log("✅ Every bridge answers the exact Kaiord App origin only.");
  } else {
    console.error("❌ A bridge accepts more than the exact Kaiord App origin:");
    for (const v of found)
      console.error(`  [${v.rule}] ${v.file} — ${v.detail}`);
    console.error(
      `  Remediation: declare only ${APP} (plus the Vite dev ports in manifest.json) and compare sender.origin to "https://kaiord.com" as a string (spec: bridge-core).`
    );
    process.exit(1);
  }
}
