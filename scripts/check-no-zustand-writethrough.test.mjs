// Tests for scripts/check-no-zustand-writethrough.mjs using node:test.
//
// Strategy: create temp store/ + application/ trees mirroring the SPA
// layout under packages/workout-spa-editor/src and exercise `runCheck`
// against them. The fixtures cover the four import shapes the script
// must normalise (relative, alias, barrel re-export, dynamic import)
// plus persistState detection, application-layer scope, and the
// allowlist exemption.

import { strict as assert } from "node:assert";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, test } from "node:test";

import { runCheck } from "./check-no-zustand-writethrough.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const REAL_SPA_SRC = join(REPO_ROOT, "packages", "workout-spa-editor", "src");

let sandbox;
let storeDir;
let applicationDir;
let dexieDir;

function write(rel, body) {
  const abs = join(sandbox, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body, "utf8");
}

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), "no-zustand-writethrough-"));
  storeDir = join(sandbox, "store");
  applicationDir = join(sandbox, "application");
  dexieDir = join(sandbox, "adapters", "dexie");
  mkdirSync(storeDir, { recursive: true });
  mkdirSync(applicationDir, { recursive: true });
  mkdirSync(dexieDir, { recursive: true });
  write("adapters/dexie/dexie-database.ts", "export const db = {} as const;\n");
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

const sandboxRun = () =>
  runCheck({ storeRoot: storeDir, applicationRoot: applicationDir });

describe("check-no-zustand-writethrough", () => {
  test("post-Phase-3 codebase passes (no violations under real src/store + src/application)", () => {
    if (!existsSync(REAL_SPA_SRC)) return; // Only meaningful inside the monorepo.
    const violations = runCheck();
    assert.deepEqual(violations, []);
  });

  test("R-DexieImport: relative path import flags the file", () => {
    // Arrange
    write(
      "store/leak-store.ts",
      'import { db } from "../adapters/dexie/dexie-database";\nexport const x = db;\n'
    );

    // Act
    const violations = sandboxRun();

    // Assert
    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, "R-DexieImport");
    assert.match(violations[0].file, /leak-store\.ts$/);
  });

  test("R-DexieImport: alias path (@/...) flags the file via tsconfig paths", () => {
    // Arrange — the alias map is loaded from the production tsconfig,
    // so drop a synthetic file under the real SPA src tree.
    const aliasFile = join(REAL_SPA_SRC, "store", "__alias-fixture-leak.ts");
    mkdirSync(dirname(aliasFile), { recursive: true });
    writeFileSync(
      aliasFile,
      'import { db } from "@/adapters/dexie/dexie-database";\nexport const x = db;\n',
      "utf8"
    );

    try {
      // Act
      const violations = runCheck();

      // Assert
      const hit = violations.find((v) =>
        v.file.endsWith("__alias-fixture-leak.ts")
      );
      assert.ok(hit, "expected the alias fixture to be flagged");
      assert.equal(hit.rule, "R-DexieImport");
    } finally {
      rmSync(aliasFile, { force: true });
    }
  });

  test("R-DexieImport: barrel re-export flags the file", () => {
    // Arrange
    write(
      "adapters/dexie/index.ts",
      'export { db } from "./dexie-database";\n'
    );
    write(
      "store/barrel-leak-store.ts",
      'import { db } from "../adapters/dexie";\nexport const x = db;\n'
    );

    // Act
    const violations = sandboxRun();

    // Assert
    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, "R-DexieImport");
    assert.match(violations[0].file, /barrel-leak-store\.ts$/);
  });

  test("R-DexieImport: dynamic import() flags the file", () => {
    // Arrange
    write(
      "store/dynamic-leak-store.ts",
      'export const load = async () => {\n  const m = await import("../adapters/dexie/dexie-database");\n  return m.db;\n};\n'
    );

    // Act
    const violations = sandboxRun();

    // Assert
    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, "R-DexieImport");
    assert.match(violations[0].file, /dynamic-leak-store\.ts$/);
  });

  test("R-PersistStateImport: named-import import detects persistState", () => {
    // Arrange
    write(
      "store/persist-state-store.ts",
      'import { persistState } from "./persist-helpers";\nexport const init = () => persistState();\n'
    );
    write(
      "store/persist-helpers.ts",
      "export const persistState = () => {};\n"
    );

    // Act
    const violations = sandboxRun();

    // Assert
    const hit = violations.find((v) => v.rule === "R-PersistStateImport");
    assert.ok(hit, "expected R-PersistStateImport violation");
    assert.match(hit.file, /persist-state-store\.ts$/);
  });

  test("R-PersistStateImport: default-import import is also caught", () => {
    // Arrange
    write(
      "store/default-persist-store.ts",
      'import persistState from "./persist-helpers";\nexport const init = () => persistState();\n'
    );

    // Act
    const violations = sandboxRun();

    // Assert
    const hit = violations.find((v) => v.rule === "R-PersistStateImport");
    assert.ok(hit, "default-import bypass must be caught");
    assert.match(hit.file, /default-persist-store\.ts$/);
  });

  test("R-PersistStateImport: namespace-import import is also caught", () => {
    // Arrange
    write(
      "store/namespace-persist-store.ts",
      'import * as persistState from "./persist-helpers";\nexport const init = () => persistState.run();\n'
    );

    // Act
    const violations = sandboxRun();

    // Assert
    const hit = violations.find((v) => v.rule === "R-PersistStateImport");
    assert.ok(hit, "namespace-import bypass must be caught");
    assert.match(hit.file, /namespace-persist-store\.ts$/);
  });

  test("allowlist exemption: an allowlisted store file with a dexie-database import passes", async () => {
    const ALLOWLIST_FILE = "store/workout-store-actions.ts";
    write(
      ALLOWLIST_FILE,
      'import { db } from "../adapters/dexie/dexie-database";\nexport const noop = () => db;\n'
    );

    // The production allowlist key is `packages/workout-spa-editor/src/store/...`.
    // Mirror the fixture under that exact path so the allowlist matches.
    const realAllowlistFile = join(
      REAL_SPA_SRC,
      "store",
      "__allowlist-fixture-actions.ts"
    );
    mkdirSync(dirname(realAllowlistFile), { recursive: true });
    writeFileSync(
      realAllowlistFile,
      'import { db } from "../adapters/dexie/dexie-database";\nexport const noop = () => db;\n',
      "utf8"
    );

    // Patch the allowlist for the duration of this assertion so the
    // synthetic fixture sits under the entry we control.
    const { ALLOWLIST } = await import(
      // Re-import to grab the live Set; ESM caches by URL so the same Set is shared.
      "./check-no-zustand-writethrough.mjs"
    );
    const allowlistKey = relative(REPO_ROOT, realAllowlistFile).replaceAll(
      "\\",
      "/"
    );
    ALLOWLIST.add(allowlistKey);
    try {
      const violations = runCheck();
      const hit = violations.find((v) => v.file === allowlistKey);
      assert.equal(hit, undefined, "allowlisted file must not be flagged");
    } finally {
      ALLOWLIST.delete(allowlistKey);
      rmSync(realAllowlistFile, { force: true });
    }
  });

  test("R-AppDexieImport: an application-layer file importing dexie-database is flagged", () => {
    // Arrange
    write(
      "application/foo/bar.ts",
      'import { db } from "../../adapters/dexie/dexie-database";\nexport const x = db;\n'
    );

    // Act
    const violations = sandboxRun();

    // Assert
    const hit = violations.find((v) => v.rule === "R-AppDexieImport");
    assert.ok(hit, "expected R-AppDexieImport violation");
    assert.match(hit.file, /application\/foo\/bar\.ts$/);
  });

  test("R-AppDexieImport: no allowlist exemption applies to application files", () => {
    // Arrange — the same name used in the store-rule allowlist must NOT
    // exempt a file living under application/, because that allowlist
    // is store-scoped.
    write(
      "application/workout-store-actions.ts",
      'import { db } from "../adapters/dexie/dexie-database";\nexport const x = db;\n'
    );

    // Act
    const violations = sandboxRun();

    // Assert
    const hit = violations.find(
      (v) =>
        v.rule === "R-AppDexieImport" &&
        v.file.endsWith("application/workout-store-actions.ts")
    );
    assert.ok(hit, "application allowlist must NOT apply");
  });
});
