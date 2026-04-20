// Invariant: both bridge extension packages must be versioned via changesets
// alongside the rest of the monorepo. The cws-auto-publish spec requires
// `@kaiord/garmin-bridge` and `@kaiord/train2go-bridge` to participate in the
// primary `linked` group so they move in lockstep on every release.
//
// This mechanical check replaces reviewer-dependent drift.

import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, "..", ".changeset", "config.json");

function loadConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
}

test("linked[0] includes @kaiord/garmin-bridge", () => {
  const cfg = loadConfig();

  assert.ok(Array.isArray(cfg.linked), "linked must be an array");
  assert.ok(
    Array.isArray(cfg.linked[0]),
    "linked[0] must be an array (the primary linked group)"
  );
  assert.ok(
    cfg.linked[0].includes("@kaiord/garmin-bridge"),
    `linked[0] missing @kaiord/garmin-bridge; got ${JSON.stringify(cfg.linked[0])}`
  );
});

test("linked[0] includes @kaiord/train2go-bridge", () => {
  const cfg = loadConfig();

  assert.ok(
    cfg.linked[0].includes("@kaiord/train2go-bridge"),
    `linked[0] missing @kaiord/train2go-bridge; got ${JSON.stringify(cfg.linked[0])}`
  );
});

test("linked[0] still includes the existing core publishables", () => {
  const cfg = loadConfig();

  for (const required of [
    "@kaiord/core",
    "@kaiord/fit",
    "@kaiord/tcx",
    "@kaiord/zwo",
    "@kaiord/garmin",
    "@kaiord/garmin-connect",
    "@kaiord/cli",
    "@kaiord/mcp",
    "@kaiord/ai",
  ]) {
    assert.ok(
      cfg.linked[0].includes(required),
      `linked[0] regressed — missing ${required}`
    );
  }
});
