#!/usr/bin/env node
//
// Rule R-BridgeLocalesEnglishOnly.
//
// Every browser-extension bridge (`packages/*-bridge`) SHALL ship an
// English-only UI: its `_locales/` directory SHALL contain no locale other
// than `en`. The bridges deliberately expose a single, auditable English
// surface (UI strings, store listing, comments) — a stray non-`en` locale
// reintroduces untranslated/unreviewed user-facing copy and drifts from the
// `default_locale: "en"` every bridge manifest declares.
//
// Runs under `pnpm test:scripts` (gates the `test` required check).

import { strict as assert } from "node:assert";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES_DIR = join(REPO_ROOT, "packages");
const ALLOWED_LOCALE = "en";

function bridgePackages() {
  if (!existsSync(PACKAGES_DIR)) return [];
  return readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith("-bridge"))
    .map((entry) => entry.name)
    .sort();
}

function nonEnglishLocales(bridge) {
  const localesDir = join(PACKAGES_DIR, bridge, "_locales");
  if (!existsSync(localesDir)) return [];
  return readdirSync(localesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== ALLOWED_LOCALE)
    .map((entry) => entry.name)
    .sort();
}

// Exported so a unit test (or a future full-tree runner) can reuse the scan.
export { bridgePackages, nonEnglishLocales };

test("every bridge _locales directory contains only English (en)", () => {
  const offenders = bridgePackages()
    .map((bridge) => ({ bridge, extra: nonEnglishLocales(bridge) }))
    .filter(({ extra }) => extra.length > 0)
    .map(({ bridge, extra }) => `${bridge}: ${extra.join(", ")}`);

  assert.deepEqual(
    offenders,
    [],
    `Bridge extensions are English-only. Remove these non-en _locales:\n  ${offenders.join(
      "\n  "
    )}`
  );
});

test("the guard actually discovers bridge packages (not a silent no-op)", () => {
  assert.ok(
    bridgePackages().length >= 1,
    "expected at least one packages/*-bridge package to exist"
  );
});
