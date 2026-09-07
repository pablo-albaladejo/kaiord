import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { runCheck, catalogIds, idsIn } from "./check-model-ids-fresh.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const CATALOG_STUB = `export const MODEL_CATALOG = {
  anthropic: [
    { id: "claude-sonnet-4-5-20250929", label: "x" },
    { id: "claude-opus-4-1-20250805", label: "y" },
  ],
};
`;

const sandbox = (files) => {
  const dir = mkdtempSync(join(tmpdir(), "modelids-"));
  for (const [name, body] of Object.entries(files)) {
    const full = join(dir, name);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
  }
  return dir;
};

test("the live tree passes", () => {
  assert.deepEqual(runCheck({ root: ROOT }), []);
});

test("it catches the id that actually shipped wrong", () => {
  // claude-sonnet-4-5-20241022 sat in four documents and never existed.
  const dir = sandbox({
    "catalog.ts": CATALOG_STUB,
    "README.md": "Default model: `claude-sonnet-4-5-20241022`.\n",
  });
  const violations = runCheck({
    root: dir,
    files: ["README.md"],
    catalog: "catalog.ts",
  });
  rmSync(dir, { recursive: true, force: true });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "unknown-model-id");
  assert.equal(violations[0].id, "claude-sonnet-4-5-20241022");
});

test("an id present in the catalog passes", () => {
  const dir = sandbox({
    "catalog.ts": CATALOG_STUB,
    "README.md": "Default: claude-sonnet-4-5-20250929\n",
  });
  const violations = runCheck({
    root: dir,
    files: ["README.md"],
    catalog: "catalog.ts",
  });
  rmSync(dir, { recursive: true, force: true });
  assert.deepEqual(violations, []);
});

test("a catalog that parses to zero ids is a fault, not a pass", () => {
  const dir = sandbox({
    "catalog.ts": "export const MODEL_CATALOG = {};\n",
    "README.md": "claude-sonnet-4-5-20241022\n",
  });
  const violations = runCheck({
    root: dir,
    files: ["README.md"],
    catalog: "catalog.ts",
  });
  rmSync(dir, { recursive: true, force: true });
  assert.equal(violations[0].kind, "catalog-empty");
});

test("an unreadable scanned file is a fault, not a pass", () => {
  const dir = sandbox({ "catalog.ts": CATALOG_STUB });
  const violations = runCheck({
    root: dir,
    files: ["nope.md"],
    catalog: "catalog.ts",
  });
  rmSync(dir, { recursive: true, force: true });
  assert.equal(violations[0].kind, "scan-failed");
});

test("an unreadable catalog is a fault, not a pass", () => {
  const violations = runCheck({ root: ROOT, catalog: "does-not-exist.ts" });
  assert.equal(violations[0].kind, "scan-failed");
});

test("scanning zero files is a fault, not a pass", () => {
  const violations = runCheck({ root: ROOT, files: [] });
  assert.equal(violations[0].kind, "scan-empty");
});

test("catalogIds reads the generated shape", () => {
  assert.deepEqual(
    [...catalogIds(CATALOG_STUB)],
    ["claude-sonnet-4-5-20250929", "claude-opus-4-1-20250805"]
  );
});

test("idsIn does not match ordinary prose", () => {
  assert.deepEqual([...idsIn("the model is fast and cheap to run")], []);
});
