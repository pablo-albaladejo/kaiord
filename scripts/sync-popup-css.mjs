#!/usr/bin/env node
/**
 * Copy the shared popup CSS master byte-for-byte into both bridge
 * packages. Source of truth: packages/_shared/popup/popup.css.
 *
 * The mechanical guard at scripts/check-popup-css-parity.test.mjs
 * fails the lint job if either destination drifts from the master.
 */

import { copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const MASTER = join(REPO, "packages/_shared/popup/popup.css");
const TARGETS = [
  join(REPO, "packages/garmin-bridge/popup.css"),
  join(REPO, "packages/train2go-bridge/popup.css"),
];

for (const target of TARGETS) {
  copyFileSync(MASTER, target);
  console.log(`  ✓ ${target.replace(`${REPO}/`, "")}`);
}
console.log("Done.");
