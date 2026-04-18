// Smoke tests for sync-extension-version.mjs.
// Spawns the script against tmpdir fixtures to exercise the
// fail-loud branch (missing BRIDGE_MANIFEST literal) and the
// happy path (full sync of manifests + background.js).

import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_SRC = readFileSync(
  resolve(__dirname, "sync-extension-version.mjs"),
  "utf8"
);

function mkHarness(extName, prep) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "kaiord-sync-test-")));
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(
    join(root, "scripts", "sync-extension-version.mjs"),
    SCRIPT_SRC
  );
  const pkgDir = join(root, "packages", extName);
  mkdirSync(pkgDir, { recursive: true });
  prep(pkgDir);
  return {
    root,
    run() {
      return spawnSync(
        process.execPath,
        [join(root, "scripts", "sync-extension-version.mjs"), extName],
        { cwd: root, encoding: "utf8" }
      );
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
    read(path) {
      return readFileSync(join(pkgDir, path), "utf8");
    },
  };
}

const PKG_010 = JSON.stringify({ version: "0.1.0" });
const MANIFEST_010 = JSON.stringify({ name: "x", version: "0.1.0" });
const BG_010 = `const BRIDGE_MANIFEST = {
  id: "x",
  version: "0.1.0",
  protocolVersion: 1,
  capabilities: ["write:workouts"],
};
`;

test("happy path: package bumped → manifests + background.js all updated", () => {
  const h = mkHarness("garmin-bridge", (pkgDir) => {
    writeFileSync(
      join(pkgDir, "package.json"),
      JSON.stringify({ version: "0.2.0" })
    );
    writeFileSync(join(pkgDir, "manifest.json"), MANIFEST_010);
    writeFileSync(join(pkgDir, "manifest.prod.json"), MANIFEST_010);
    writeFileSync(join(pkgDir, "background.js"), BG_010);
  });
  try {
    const r = h.run();
    assert.equal(r.status, 0, r.stderr || r.stdout);
    assert.match(h.read("manifest.json"), /"version":\s*"0\.2\.0"/);
    assert.match(h.read("manifest.prod.json"), /"version":\s*"0\.2\.0"/);
    assert.match(h.read("background.js"), /version:\s*"0\.2\.0"/);
  } finally {
    h.cleanup();
  }
});

test("idempotent: re-running with all versions matching produces no edits", () => {
  const h = mkHarness("garmin-bridge", (pkgDir) => {
    writeFileSync(join(pkgDir, "package.json"), PKG_010);
    writeFileSync(join(pkgDir, "manifest.json"), MANIFEST_010);
    writeFileSync(join(pkgDir, "manifest.prod.json"), MANIFEST_010);
    writeFileSync(join(pkgDir, "background.js"), BG_010);
  });
  try {
    const r1 = h.run();
    const after1 = h.read("background.js");
    assert.equal(r1.status, 0);
    const r2 = h.run();
    assert.equal(r2.status, 0);
    assert.equal(h.read("background.js"), after1);
  } finally {
    h.cleanup();
  }
});

test("fail-loud: background.js exists but BRIDGE_MANIFEST literal missing", () => {
  const h = mkHarness("garmin-bridge", (pkgDir) => {
    writeFileSync(
      join(pkgDir, "package.json"),
      JSON.stringify({ version: "0.2.0" })
    );
    writeFileSync(join(pkgDir, "manifest.json"), MANIFEST_010);
    writeFileSync(join(pkgDir, "manifest.prod.json"), MANIFEST_010);
    // Renamed constant — sync cannot find it; must error, not no-op.
    writeFileSync(
      join(pkgDir, "background.js"),
      "const RENAMED_MANIFEST = { id: 'x', version: '0.1.0' };\n"
    );
  });
  try {
    const r = h.run();
    assert.equal(r.status, 1);
    assert.match(r.stderr, /does not contain a "BRIDGE_MANIFEST/);
  } finally {
    h.cleanup();
  }
});

test("missing background.js is OK (script proceeds with manifests only)", () => {
  const h = mkHarness("garmin-bridge", (pkgDir) => {
    writeFileSync(
      join(pkgDir, "package.json"),
      JSON.stringify({ version: "0.2.0" })
    );
    writeFileSync(join(pkgDir, "manifest.json"), MANIFEST_010);
    writeFileSync(join(pkgDir, "manifest.prod.json"), MANIFEST_010);
    // No background.js at all.
  });
  try {
    const r = h.run();
    assert.equal(r.status, 0);
    assert.match(h.read("manifest.json"), /"version":\s*"0\.2\.0"/);
  } finally {
    h.cleanup();
  }
});
