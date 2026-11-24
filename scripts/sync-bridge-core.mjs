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
  "trainingpeaks-bridge",
];
const SNAPSHOT_BRIDGES = ["garmin-bridge", "train2go-bridge"];

export const BRIDGE_CORE_MASTERS = [
  {
    master: "bridge-envelope.js",
    dest: "bridge-envelope.js",
    bridges: ALL_BRIDGES,
  },
  // Identity-free cookie transport for SW-direct bridges. Consumed by every
  // cookie-session bridge; each supplies its own origin + path allowlist
  // (tanita-bridge: CSV export; train2go-bridge: workplan reads;
  // trainingpeaks-bridge: cookie-only token exchange via GET /users/v3/token).
  {
    master: "session-fetch.js",
    dest: "session-fetch.js",
    bridges: ["tanita-bridge", "train2go-bridge", "trainingpeaks-bridge"],
  },
  // Identity-free Bearer transport for token-based SW-direct bridges.
  // garmin-bridge calls connectapi with an OAuth Bearer; trainingpeaks-bridge
  // calls the metrics API with the Bearer minted from the cookie exchange.
  {
    master: "bearer-fetch.js",
    dest: "bearer-fetch.js",
    bridges: ["garmin-bridge", "trainingpeaks-bridge"],
  },
  // The thin Bridge's one `request` gate: closed list + declared body schema.
  {
    master: "bridge-request-gate.js",
    dest: "bridge-request-gate.js",
    bridges: ALL_BRIDGES,
  },
  // The `request` answer every thin Bridge hands the App, with the
  // Session-bound secrets (anti-forgery tokens, credential keys) removed.
  {
    master: "bridge-answer.js",
    dest: "bridge-answer.js",
    bridges: ALL_BRIDGES,
  },
  // The identity and contact fields every bridge's personal-fields.js
  // starts from: one list, removed from every answer.
  {
    master: "personal-identity.js",
    dest: "personal-identity.js",
    bridges: ALL_BRIDGES,
  },
  // Swallowed-error telemetry and the worker's script loader, for the two
  // service workers that keep an error log.
  {
    master: "bridge-telemetry.js",
    dest: "bridge-telemetry.js",
    bridges: SNAPSHOT_BRIDGES,
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
  // The popup shell — CSS + the status/chips/skeleton/CTA renderers — is one
  // design for all five bridges; only the header monogram glyph varies, set
  // per-bridge in popup.html.
  {
    master: "bridge-popup-shell.js",
    dest: "bridge-popup-shell.js",
    bridges: ALL_BRIDGES,
  },
  // Remembers when a bridge was first observed broken, so the popup can date
  // the outage instead of only reporting it.
  {
    master: "bridge-popup-health.js",
    dest: "bridge-popup-health.js",
    bridges: ALL_BRIDGES,
  },
  // The four Connection fixes and their one wording, read by every popup and,
  // through @kaiord/i18n, by the Kaiord App (scripts/check-connection-notices.mjs).
  {
    master: "connection-notices.js",
    dest: "connection-notices.js",
    bridges: ALL_BRIDGES,
  },
  { master: "popup.css", dest: "popup.css", bridges: ALL_BRIDGES },
  // The app's theme preference: stored by background.js on the external
  // `set-theme` action, applied by popup.html before first paint.
  {
    master: "bridge-theme.js",
    dest: "bridge-theme.js",
    bridges: ALL_BRIDGES,
  },
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
    master: "test/bridge-popup-shell.test.js",
    dest: "test/bridge-popup-shell.test.js",
    bridges: ALL_BRIDGES,
  },
  {
    master: "test/bridge-popup-health.test.js",
    dest: "test/bridge-popup-health.test.js",
    bridges: ALL_BRIDGES,
  },
  {
    master: "test/bridge-theme.test.js",
    dest: "test/bridge-theme.test.js",
    bridges: ALL_BRIDGES,
  },
  {
    master: "test/bearer-fetch.test.js",
    dest: "test/bearer-fetch.test.js",
    bridges: ["garmin-bridge", "trainingpeaks-bridge"],
  },
  {
    master: "test/bridge-answer.test.js",
    dest: "test/bridge-answer.test.js",
    bridges: ALL_BRIDGES,
  },
  {
    master: "test/bridge-request-gate.test.js",
    dest: "test/bridge-request-gate.test.js",
    bridges: ALL_BRIDGES,
  },
  {
    master: "test/session-fetch.test.js",
    dest: "test/session-fetch.test.js",
    bridges: ["tanita-bridge", "train2go-bridge", "trainingpeaks-bridge"],
  },
  {
    master: "test/bridge-popup-utils.test.js",
    dest: "test/bridge-popup-utils.test.js",
    bridges: ALL_BRIDGES,
  },
  {
    master: "test/kaiord-announce.test.js",
    dest: "test/kaiord-announce.test.js",
    bridges: ALL_BRIDGES,
  },
  // Each popup in English and Spanish, against its own markup and _locales.
  {
    master: "test/popup-locales.test.js",
    dest: "test/popup-locales.test.js",
    bridges: ALL_BRIDGES,
  },
];

// Masters a workspace package reads at runtime, copied into its source so it
// imports its own file instead of reaching into _shared/ by relative path
// (packages/_shared/AGENTS.md). `dest` is relative to packages/; the parity
// guard holds each copy byte-identical to its master.
export const PACKAGE_COPIES = [
  {
    master: "connection-notices.js",
    dest: "i18n/src/generated/connection-notices.js",
  },
  {
    master: "connection-notices.d.ts",
    dest: "i18n/src/generated/connection-notices.d.ts",
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

export const syncPackageCopies = ({
  mastersDir = DEFAULT_MASTERS_DIR,
  packagesDir = DEFAULT_PACKAGES_DIR,
  copies = PACKAGE_COPIES,
} = {}) =>
  copies.map(({ master, dest }) => {
    const target = join(packagesDir, dest);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(mastersDir, master), target);
    return target;
  });

const isCliEntry =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCliEntry) {
  const copied = [...syncBridgeCore(), ...syncPackageCopies()];
  for (const target of copied) {
    console.log(`  ✓ ${target.replace(`${REPO}/`, "")}`);
  }
  console.log("Done.");
}
