import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { APP_ORIGIN, DEV_ORIGINS, matchPattern } from "./app-origins.mjs";

// The manifest half of R-BridgeExactOrigin: the patterns Chrome reads to
// decide which pages may message a bridge or receive its announcement.
// Chrome match patterns carry a port, and one without a port matches every
// port, so the dev manifest names the two Vite dev ports exactly.

export const APP = matchPattern(APP_ORIGIN);
const DEV = [APP, ...DEV_ORIGINS.map(matchPattern)];
const ALLOWED = {
  "manifest.json": { connect: DEV, announce: DEV },
  "manifest.prod.json": { connect: [APP], announce: [APP] },
};
const ANNOUNCE_FILES = ["kaiord-announce.js", "bridge-identity.js"];

const checkPatterns = (where, patterns = [], allowed) => [
  ...patterns
    .filter((p) => !allowed.includes(p))
    .map((p) => `${where} has "${p}"`),
  ...(patterns.includes(APP) ? [] : [`${where} does not declare ${APP}`]),
];

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
  const announcers = (json.content_scripts ?? []).filter((entry) =>
    (entry.js ?? []).some((f) => ANNOUNCE_FILES.includes(f))
  );
  for (const entry of announcers) {
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

export const checkManifests = (repoRoot, name) =>
  Object.entries(ALLOWED).flatMap(([file, allowed]) => {
    const rel = `packages/${name}/${file}`;
    const path = join(repoRoot, rel);
    if (!existsSync(path)) {
      return file === "manifest.json" ? [{ file: rel, detail: "missing" }] : [];
    }
    const json = JSON.parse(readFileSync(path, "utf8"));
    return checkManifest(json, allowed).map((detail) => ({
      file: rel,
      detail,
    }));
  });
