#!/usr/bin/env node
/**
 * Copy the bridge-core masters byte-for-byte into each consuming bridge.
 * Source of truth: packages/_shared/bridge-core/. The mechanical guard at
 * scripts/check-bridge-core-parity.test.mjs fails the lint job if any
 * vendored copy drifts from its master (spec: bridge-core).
 *
 * Runtime masters land as top-level files (package-extension.sh globs
 * only the package root); test masters land under each bridge's test/,
 * which is never packaged.
 */

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));

const ALL_BRIDGES = [
  "garmin-bridge",
  "train2go-bridge",
  "whoop-bridge",
  "tanita-bridge",
];
const SNAPSHOT_BRIDGES = ["garmin-bridge", "train2go-bridge"];

export const BRIDGE_CORE_MASTERS = [
  {
    master: "bridge-envelope.js",
    dest: "bridge-envelope.js",
    bridges: ALL_BRIDGES,
  },
  // Identity-free cookie transport for SW-direct bridges. Consumed by every
  // cookie-session bridge; each supplies its own origin + path allowlist.
  {
    master: "session-fetch.js",
    dest: "session-fetch.js",
    bridges: ["tanita-bridge", "train2go-bridge"],
  },
  // Identity-free Bearer transport for token-based SW-direct bridges. Single
  // consumer for now; whoop-bridge appends once it moves onto the OAuth
  // template.
  {
    master: "bearer-fetch.js",
    dest: "bearer-fetch.js",
    bridges: ["garmin-bridge"],
  },
  {
    master: "kaiord-announce.js",
    dest: "kaiord-announce.js",
    bridges: ALL_BRIDGES,
  },
  {
    master: "bridge-popup-utils.js",
    dest: "bridge-popup-utils.js",
    bridges: ALL_BRIDGES,
  },
  { master: "popup.css", dest: "popup.css", bridges: SNAPSHOT_BRIDGES },
  {
    master: "bridge-popup-snapshot.js",
    dest: "bridge-popup-snapshot.js",
    bridges: SNAPSHOT_BRIDGES,
  },
  {
    master: "profile-snapshot.js",
    dest: "profile-snapshot.js",
    bridges: SNAPSHOT_BRIDGES,
  },
  {
    master: "test/chrome-mock.js",
    dest: "test/chrome-mock.js",
    bridges: ALL_BRIDGES,
  },
  {
    master: "test/bridge-envelope.test.js",
    dest: "test/bridge-envelope.test.js",
    bridges: ALL_BRIDGES,
  },
  {
    master: "test/bearer-fetch.test.js",
    dest: "test/bearer-fetch.test.js",
    bridges: ["garmin-bridge"],
  },
];

export const DEFAULT_MASTERS_DIR = join(REPO, "packages/_shared/bridge-core");
export const DEFAULT_PACKAGES_DIR = join(REPO, "packages");

export const syncBridgeCore = ({
  mastersDir = DEFAULT_MASTERS_DIR,
  packagesDir = DEFAULT_PACKAGES_DIR,
  masters = BRIDGE_CORE_MASTERS,
} = {}) => {
  const copied = [];
  for (const { master, dest, bridges } of masters) {
    const source = join(mastersDir, master);
    if (!existsSync(source)) {
      throw new Error(`bridge-core master missing: ${master} (${source})`);
    }
    for (const bridge of bridges) {
      const target = join(packagesDir, bridge, dest);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(source, target);
      copied.push(target);
    }
  }
  return copied;
};

const isCliEntry =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCliEntry) {
  const copied = syncBridgeCore();
  for (const target of copied) {
    console.log(`  ✓ ${target.replace(`${REPO}/`, "")}`);
  }
  console.log("Done.");
}
