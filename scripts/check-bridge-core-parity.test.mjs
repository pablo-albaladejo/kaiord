import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BRIDGE_CORE_MASTERS,
  DEFAULT_MASTERS_DIR,
  DEFAULT_PACKAGES_DIR,
} from "./sync-bridge-core.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(HERE);

// Per-bridge identity values that must never appear inside a shared master
// (spec bridge-core, Requirement: Identity loads before its consumer).
const IDENTITY_TOKENS = [
  "garmin-bridge",
  "train2go-bridge",
  "whoop-bridge",
  "tanita-bridge",
  "trainingpeaks-bridge",
  "Garmin Connect",
  "Train2Go",
  "WHOOP",
  "Tanita",
  "TrainingPeaks",
  "connect.garmin.com",
  "app.train2go.com",
  "api.prod.whoop.com",
  "mytanita.eu",
  "tpapi.trainingpeaks.com",
  "write:workouts",
  "read:activities",
  "read:training-plan",
  "read:training-zones",
  "read:body",
  "write:body",
  "read:sleep",
];

const IDENTITY_BRIDGES = [
  "garmin-bridge",
  "train2go-bridge",
  "whoop-bridge",
  "tanita-bridge",
  "trainingpeaks-bridge",
];

const extractField = (src, field, file) => {
  const match = src.match(new RegExp(`${field}:\\s*"([^"]+)"`));
  assert.ok(match, `${file}: missing ${field}: "..." literal`);
  return match[1];
};

const extractCapabilities = (src, file) => {
  const match = src.match(/capabilities:\s*\[([^\]]*)\]/);
  assert.ok(match, `${file}: missing capabilities: [...] literal`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
};

describe("bridge-core parity", () => {
  it("each vendored copy is byte-identical to its master", () => {
    for (const { master, dest, bridges } of BRIDGE_CORE_MASTERS) {
      const masterBody = readFileSync(join(DEFAULT_MASTERS_DIR, master));
      for (const bridge of bridges) {
        const target = join(DEFAULT_PACKAGES_DIR, bridge, dest);
        const body = readFileSync(target);
        assert.deepEqual(
          body,
          masterBody,
          `${bridge}/${dest} drifts from master ${master} — run pnpm bridge:sync`
        );
      }
    }
  });

  it("masters contain no per-bridge identity values", () => {
    for (const { master } of BRIDGE_CORE_MASTERS) {
      const body = readFileSync(join(DEFAULT_MASTERS_DIR, master), "utf8");
      for (const token of IDENTITY_TOKENS) {
        assert.ok(
          !body.includes(token),
          `master ${master} contains per-bridge token "${token}"`
        );
      }
    }
  });

  it("bridge-identity.js agrees with BRIDGE_MANIFEST per bridge", () => {
    for (const bridge of IDENTITY_BRIDGES) {
      const identityPath = join(REPO, "packages", bridge, "bridge-identity.js");
      const backgroundPath = join(REPO, "packages", bridge, "background.js");
      const identity = readFileSync(identityPath, "utf8");
      const background = readFileSync(backgroundPath, "utf8");
      const manifestStart = background.indexOf("const BRIDGE_MANIFEST = {");
      assert.ok(manifestStart >= 0, `${bridge}: BRIDGE_MANIFEST literal gone`);
      const manifest = background.slice(
        manifestStart,
        background.indexOf("};", manifestStart)
      );

      for (const field of ["id", "name"]) {
        assert.equal(
          extractField(identity, field, `${bridge}/bridge-identity.js`),
          extractField(manifest, field, `${bridge}/background.js`),
          `${bridge}: ${field} diverges between bridge-identity.js and BRIDGE_MANIFEST`
        );
      }
      assert.deepEqual(
        extractCapabilities(identity, `${bridge}/bridge-identity.js`),
        extractCapabilities(manifest, `${bridge}/background.js`),
        `${bridge}: capabilities diverge between bridge-identity.js and BRIDGE_MANIFEST`
      );
    }
  });

  it("bridge-identity.js loads only on the announce entry, never the integration site", () => {
    // Spec bridge-core, Requirement: Identity loads before its consumer —
    // identity is announce-only; injecting it into the site-origin content
    // script would widen the site-page surface for no reason.
    for (const bridge of IDENTITY_BRIDGES) {
      const manifest = JSON.parse(
        readFileSync(join(REPO, "packages", bridge, "manifest.json"), "utf8")
      );
      for (const entry of manifest.content_scripts ?? []) {
        const isAnnounceEntry = entry.matches.some((m) =>
          m.includes("kaiord.com")
        );
        if (isAnnounceEntry) {
          assert.deepEqual(
            entry.js.slice(0, 2),
            ["bridge-identity.js", "kaiord-announce.js"],
            `${bridge}: announce entry must load identity before the core`
          );
        } else {
          assert.ok(
            !entry.js.includes("bridge-identity.js"),
            `${bridge}: bridge-identity.js injected into the integration-site entry`
          );
        }
      }
    }
  });
});
