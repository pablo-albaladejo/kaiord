// Tests for packages/docs/scripts/check-privacy-policy.mjs

import { strict as assert } from "node:assert";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
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
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  BRIDGE_REGISTRY,
  checkBridgeCoverage,
  checkManifestPermissions,
  checkPolicy,
  checkSidebar,
  discoverBridgePackages,
  isDirectInvocation,
  REQUIRED_RULES,
  sectionBody,
} from "./check-privacy-policy.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..", "..");
const SCRIPT_NAME = "check-privacy-policy.mjs";
const SCRIPT = join(HERE, SCRIPT_NAME);
const POLICY_PATH = join(REPO_ROOT, "packages/docs/legal/privacy-policy.md");

// The fixture IS the shipped policy. A hand-written miniature policy drifts
// from the real one silently: it can satisfy every rule while the document
// users actually read no longer does, and it turns "does this rule fail
// alone?" into a statement about the fixture rather than about the policy.
const POLICY = readFileSync(POLICY_PATH, "utf8");

const GARMIN = "Kaiord Garmin Bridge Extension";
const TRAIN2GO = "Kaiord Train2Go Bridge Extension";
const TANITA = "Kaiord Tanita Bridge Extension";
const TRAININGPEAKS = "Kaiord TrainingPeaks Bridge Extension";
const WHOOP = "Kaiord WHOOP Bridge Extension";

// Delete a whole `## <heading>` section (heading line included) up to the
// next top-level heading. This is the mutation every section-anchored rule
// must detect: before anchoring, deleting an extension's entire section
// left the lint green because the intro sentence and the Communication
// Scope bullets still mentioned the extension and its host.
function dropSection(src, heading) {
  const lines = src.split("\n");
  const start = lines.findIndex((line) => line.trimEnd() === `## ${heading}`);
  if (start === -1) throw new Error(`fixture has no "## ${heading}" section`);
  const after = lines.slice(start + 1).findIndex((line) => /^## /.test(line));
  const end = after === -1 ? lines.length : start + 1 + after;
  return [...lines.slice(0, start), ...lines.slice(end)].join("\n");
}

// Rewrite ONE section's body, leaving the rest of the document — the intro
// sentence, the Communication Scope host list, the other sections —
// untouched. Mutating globally would knock out several rules at once and
// prove nothing about whether any one of them carries its own weight.
function mutateInSection(src, heading, find, replace) {
  const body = sectionBody(src, heading);
  assert.ok(body !== null, `policy has no "## ${heading}" section`);
  const mutated =
    find instanceof RegExp
      ? body.replace(find, replace)
      : body.replaceAll(find, replace);
  assert.notEqual(
    mutated,
    body,
    `mutation anchor "${find}" is absent from "## ${heading}" — the rule it targets may be pinned to text that no longer exists`
  );
  return src.replace(body, mutated);
}

test("the shipped policy passes every rule", () => {
  assert.deepEqual(checkPolicy(POLICY), []);
});

test("the shipped policy covers every bridge package on disk", () => {
  assert.deepEqual(
    checkBridgeCoverage(POLICY, discoverBridgePackages(REPO_ROOT)),
    []
  );
});

test("missing Last updated is flagged", () => {
  const src = POLICY.replace(/\*\*Last updated:\*\*\s+\d{4}-\d{2}-\d{2}/, "");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("Last updated")));
});

// ---------- every section rule must fail ALONE ----------
//
// A rule that only fires once three sibling rules have already fired adds
// no coverage. Four of the five bridge sections used to be anchored by one
// or two substrings each — Train2Go by exactly one, `app.train2go.com` — so
// a section reading "We take app.train2go.com privacy seriously." satisfied
// every rule about it. Each case below removes exactly the thing one rule
// claims to check, inside that section only, and asserts that rule and
// nothing else fires.

const SOLO_CASES = [
  [GARMIN, "connect.garmin.com", "redacted.example", "Garmin host disclosed"],
  [GARMIN, "sso.garmin.com", "redacted.example", "Garmin SSO host disclosed"],
  [
    GARMIN,
    "connectapi.garmin.com",
    "redacted.example",
    "Garmin API host disclosed",
  ],
  [
    GARMIN,
    "chrome.storage.local",
    "somewhere",
    "OAuth-token local-storage disclosure",
  ],
  [
    GARMIN,
    "reusing your existing Garmin single-sign-on session",
    "by other means",
    "Garmin capture path disclosed",
  ],
  [
    GARMIN,
    "never reads, stores, or transmits your Garmin Connect password",
    "is careful with your password",
    "Garmin no-password guarantee stated",
  ],
  [GARMIN, "`write:body`", "`some`", "Garmin write scope disclosed"],
  [
    GARMIN,
    "No data is shared with any third party",
    "Sharing happens sometimes",
    "Garmin no-third-party-sharing stated",
  ],
  [
    GARMIN,
    "does not include any analytics, error reporting, or telemetry",
    "reports a little",
    "Garmin no-telemetry stated",
  ],

  [TRAIN2GO, "app.train2go.com", "redacted.example", "Train2Go host disclosed"],
  [
    TRAIN2GO,
    "read on-demand from the Train2Go page DOM",
    "obtained somehow",
    "Train2Go capture path disclosed",
  ],
  [
    TRAIN2GO,
    "never reads, stores, or transmits your Train2Go password",
    "is careful with your password",
    "Train2Go no-credentials guarantee stated",
  ],
  [
    TRAIN2GO,
    "does not declare the `cookies` permission",
    "declares a few permissions",
    "Train2Go non-declaration of the `cookies` permission stated",
  ],
  [
    TRAIN2GO,
    "does not modify the page, submit forms",
    "may act on the page",
    "Train2Go read-only DOM access stated",
  ],
  [
    TRAIN2GO,
    "nothing is written to `chrome.storage`",
    "some things are stored",
    "Train2Go zero-persistence stated",
  ],
  [
    TRAIN2GO,
    "No data is shared with any third party",
    "Sharing happens sometimes",
    "Train2Go no-third-party-sharing stated",
  ],
  [
    TRAIN2GO,
    "does not include any analytics, error reporting, or telemetry",
    "reports a little",
    "Train2Go no-telemetry stated",
  ],

  [TANITA, "mytanita.eu", "redacted.example", "Tanita host disclosed"],
  [
    TANITA,
    "Only the `read:body` capability is declared",
    "Capabilities exist",
    "Tanita read scope disclosed",
  ],
  [
    TANITA,
    "body-composition",
    "measurement",
    "Tanita body-composition data class disclosed",
  ],
  [
    TANITA,
    "never asks for, reads, stores, or transmits your MyTANITA password",
    "is careful with your password",
    "Tanita no-password guarantee stated",
  ],
  [
    TANITA,
    'credentials:"include"',
    "some options",
    "Tanita capture path disclosed",
  ],
  [
    TANITA,
    "HttpOnly `TANITASESS` session cookie",
    "session cookie",
    "Tanita session cookie named and stated unreadable",
  ],
  [
    TANITA,
    "does not declare the `cookies` permission",
    "declares a few permissions",
    "Tanita non-declaration of the `cookies` permission stated",
  ],
  [
    TANITA,
    "injects no content script",
    "runs scripts",
    "Tanita no-DOM-access stated",
  ],
  [
    TANITA,
    "single, fixed, read-only `GET`",
    "request",
    "Tanita single fixed read-only GET disclosed",
  ],
  [
    TANITA,
    "No data is shared with any third party",
    "Sharing happens sometimes",
    "Tanita no-third-party-sharing stated",
  ],
  [
    TANITA,
    "does not include any analytics, error reporting, or telemetry",
    "reports a little",
    "Tanita no-telemetry stated",
  ],

  [
    TRAININGPEAKS,
    "tpapi.trainingpeaks.com",
    "redacted.example",
    "TrainingPeaks host disclosed",
  ],
  [
    TRAININGPEAKS,
    "cookie for a short-lived access token",
    "cookie for something",
    "TrainingPeaks no-password cookie→token nature disclosed",
  ],
  [
    TRAININGPEAKS,
    "never asks for, reads, stores, or transmits your TrainingPeaks password",
    "is careful with your password",
    "TrainingPeaks no-password guarantee stated",
  ],
  [
    TRAININGPEAKS,
    "users/v3/token",
    "some/endpoint",
    "TrainingPeaks token endpoint disclosed",
  ],
  [
    TRAININGPEAKS,
    "Production_tpAuth",
    "SomeCookie",
    "TrainingPeaks session cookie named",
  ],
  [
    TRAININGPEAKS,
    "does not declare the `cookies` permission",
    "declares a few permissions",
    "TrainingPeaks non-declaration of the `cookies` permission stated",
  ],
  [
    TRAININGPEAKS,
    "chrome.storage.local",
    "somewhere",
    "TrainingPeaks token storage location disclosed",
  ],
  [
    TRAININGPEAKS,
    "`read:body` and `write:body` capabilities",
    "some capabilities",
    "TrainingPeaks read+write body scopes disclosed",
  ],
  [
    TRAININGPEAKS,
    "writes a single weight measurement back",
    "writes things back",
    "TrainingPeaks write path disclosed",
  ],
  [
    TRAININGPEAKS,
    "metrics/v3",
    "some/path",
    "TrainingPeaks metrics read endpoint disclosed",
  ],
  [
    TRAININGPEAKS,
    "injects no content script",
    "runs scripts",
    "TrainingPeaks no-DOM-access stated",
  ],
  [
    TRAININGPEAKS,
    "No data is shared with any third party",
    "Sharing happens sometimes",
    "TrainingPeaks no-third-party-sharing stated",
  ],
  [
    TRAININGPEAKS,
    "does not include any analytics, error reporting, or telemetry",
    "reports a little",
    "TrainingPeaks no-telemetry stated",
  ],

  // WHOOP is the section the other four were modelled on; pinning it here
  // keeps that template from eroding.
  [WHOOP, "app.whoop.com", "redacted.example", "WHOOP host disclosed"],
  [
    WHOOP,
    /no OAuth/gi,
    "redacted",
    "WHOOP no-OAuth session-bearer nature disclosed",
  ],
  [WHOOP, "main-world script", "helper", "WHOOP capture path 1 disclosed"],
  [
    WHOOP,
    "chrome.webRequest.onBeforeSendHeaders",
    "some listener",
    "WHOOP capture path 2 disclosed",
  ],
  [
    WHOOP,
    "CognitoIdentityServiceProvider",
    "SomeOtherStore",
    "WHOOP capture path 3 disclosed",
  ],
  [
    WHOOP,
    "`scripting`",
    "`other`",
    "WHOOP declared permissions named in its own section",
  ],
  [
    WHOOP,
    "not** declare the `cookies` permission",
    "declares the `cookies` permission",
    "WHOOP non-declaration of the `cookies` permission stated",
  ],
  [
    WHOOP,
    "custom:user_id",
    "some-claim",
    "WHOOP account identifier egress disclosed",
  ],
];

for (const [heading, find, replace, label] of SOLO_CASES) {
  test(`"${label}" fails alone when its disclosure is removed`, () => {
    const src = mutateInSection(POLICY, heading, find, replace);
    const v = checkPolicy(src);

    assert.equal(
      v.filter((r) => r.includes(label)).length,
      1,
      `expected "${label}" to fire, got: ${v.join(" | ") || "(none)"}`
    );
    assert.equal(
      v.length,
      1,
      `"${label}" did not fail alone — it fired together with: ${v.join(" | ")}`
    );
  });
}

test("every section-anchored rule is exercised by a solo case", () => {
  // Without this, a rule can be added with no mutation proving it fires on
  // its own — which is how five decorative `/\S/` rules survived.
  const covered = SOLO_CASES.map(([, , , label]) => label);
  const uncovered = REQUIRED_RULES.filter(
    (rule) =>
      rule.section !== undefined &&
      !covered.some((label) => rule.label.startsWith(label))
  ).map((rule) => rule.label);

  assert.deepEqual(uncovered, []);
});

// ---------- a section body gutted to one line is flagged ----------

const GUTTED_CASES = [
  [
    TRAIN2GO,
    "\nNothing to declare. We take app.train2go.com privacy seriously.\n",
  ],
  [
    GARMIN,
    "\nNothing to declare. connect.garmin.com sso.garmin.com connectapi.garmin.com OAuth token chrome.storage.local write:body.\n",
  ],
  [
    TANITA,
    "\nNothing to declare. mytanita.eu body-composition, no password.\n",
  ],
  [
    TRAININGPEAKS,
    "\nNothing to declare. tpapi.trainingpeaks.com exchanges a cookie for a short-lived access token.\n",
  ],
];

for (const [heading, oneLiner] of GUTTED_CASES) {
  test(`replacing the "${heading}" body with a one-liner that keeps the old anchors is flagged`, () => {
    const body = sectionBody(POLICY, heading);
    const v = checkPolicy(POLICY.replace(body, oneLiner));

    assert.ok(
      v.length >= 5,
      `a section stripped to one line produced only ${v.length} violation(s): ${v.join(" | ")}`
    );
    for (const violation of v) {
      assert.ok(
        violation.includes(heading),
        `unrelated violation leaked into a single-section mutation: ${violation}`
      );
    }
  });
}

// ---------- section anchoring (one negative case per bridge) ----------
//
// Each case deletes ONE extension's entire section while leaving the intro
// sentence and the Communication Scope host list intact. Every rule about
// that extension must fail. Before the rules were anchored to
// `^## Kaiord <Name> Bridge Extension$`, this mutation was invisible.

const SECTION_CASES = [
  { bridge: "Garmin", heading: GARMIN },
  { bridge: "Train2Go", heading: TRAIN2GO },
  { bridge: "Tanita", heading: TANITA },
  { bridge: "TrainingPeaks", heading: TRAININGPEAKS },
  { bridge: "WHOOP", heading: WHOOP },
];

for (const { bridge, heading } of SECTION_CASES) {
  test(`deleting the ${bridge} section is flagged even though the intro still names it`, () => {
    const src = dropSection(POLICY, heading);
    assert.match(src, new RegExp(`Kaiord ${bridge} Bridge`));

    const sectionRules = REQUIRED_RULES.filter((r) => r.section === heading);
    assert.ok(sectionRules.length > 0, `no rules anchored to ${heading}`);

    const v = checkPolicy(src);
    for (const rule of sectionRules) {
      assert.ok(
        v.some(
          (r) => r.includes(rule.label) && r.includes("is missing entirely")
        ),
        `expected "${rule.label}" to be flagged when the ${bridge} section is deleted, got: ${v.join(" | ")}`
      );
    }

    const coverage = checkBridgeCoverage(
      src,
      discoverBridgePackages(REPO_ROOT)
    );
    assert.ok(
      coverage.some(
        (r) =>
          r.includes("Bridge extension covered") &&
          r.includes("is missing entirely")
      ),
      `expected a coverage violation for ${bridge}, got: ${coverage.join(" | ")}`
    );
  });

  test(`emptying the ${bridge} section body is flagged`, () => {
    const src = dropSection(POLICY, heading).replace(
      /^## Communication Scope$/m,
      `## ${heading}\n\n## Communication Scope`
    );
    const v = checkPolicy(src);
    assert.ok(
      v.some((r) => r.includes(`not found inside "## ${heading}"`)),
      `expected an empty-section violation for ${bridge}, got: ${v.join(" | ")}`
    );
  });
}

// ---------- section scoping is real, not incidental ----------

test("a host named only in Communication Scope does not satisfy its section rule", () => {
  // The Tanita section loses its host; Communication Scope keeps
  // mytanita.eu. An unanchored /mytanita\.eu/ rule would still pass.
  const src = mutateInSection(
    POLICY,
    TANITA,
    "mytanita.eu",
    "redacted.example"
  );
  assert.match(src, /mytanita\.eu/);
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("Tanita host disclosed")));
});

test("sectionBody returns null for an absent heading and stops at the next heading", () => {
  assert.equal(
    sectionBody(POLICY, "Kaiord Nonexistent Bridge Extension"),
    null
  );
  const body = sectionBody(POLICY, TRAIN2GO);
  assert.match(body, /app\.train2go\.com/);
  assert.doesNotMatch(body, /mytanita\.eu/);
});

// ---------- whole-document rules ----------

test("missing GDPR/CCPA reference is flagged", () => {
  const src = POLICY.replace(/GDPR/g, "rights").replace(/CCPA/g, "rights");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("GDPR")));
  assert.ok(v.some((r) => r.includes("CCPA")));
});

test("missing LLM provider disclosure is flagged", () => {
  const src = POLICY.replace(/\(Anthropic, OpenAI, or Google\)/, "");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("LLM provider data flow")));
});

test("missing chat assistant data-flow disclosure is flagged", () => {
  const src = POLICY.replace(/chat assistant/g, "some-feature");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("Chat assistant data flow")));
});

test("missing chat transcript storage disclosure is flagged", () => {
  const src = POLICY.replace(/chat transcripts/g, "some-records");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("Chat transcripts")));
});

test("missing IndexedDB clarifier is flagged", () => {
  const src = POLICY.replace(/IndexedDB/g, "some-database");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("IndexedDB")));
});

test("missing localhost dev disclosure is flagged", () => {
  const src = POLICY.replace(/localhost:5173/g, "");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("Localhost")));
});

test("missing announce-only content-script disclosure is flagged", () => {
  const src = POLICY.replace(/announce-only/gi, "different-wording");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("Announce-only")));
});

// ---------- bridge coverage comes from disk ----------

test("discoverBridgePackages finds every packages/*-bridge and matches the registry", () => {
  const bridges = discoverBridgePackages(REPO_ROOT);

  assert.ok(bridges.length >= 5, bridges.join(", "));
  assert.deepEqual(bridges, Object.keys(BRIDGE_REGISTRY).sort());
});

test("discoverBridgePackages reads whatever is on disk, not a hardcoded list", () => {
  const root = mkdtempSync(join(tmpdir(), "kaiord-priv-discover-"));
  try {
    mkdirSync(join(root, "packages", "acme-bridge"), { recursive: true });
    mkdirSync(join(root, "packages", "shared-utils"), { recursive: true });
    // A FILE whose name ends in -bridge is not a package.
    writeFileSync(join(root, "packages", "decoy-bridge"), "");

    assert.deepEqual(discoverBridgePackages(root), ["acme-bridge"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a bridge package with no registry entry is flagged, and nothing else is", () => {
  // The manifest paths, host sets and section constants used to be five
  // hardcoded copies, so `packages/foo-bridge` shipped with no section, no
  // host allowlist and — the part that matters — no forbidden-permission
  // and no credential-permission check at all, entirely green.
  const bridges = [...discoverBridgePackages(REPO_ROOT), "acme-bridge"].sort();
  const v = checkBridgeCoverage(POLICY, bridges);

  assert.equal(v.length, 1, v.join(" | "));
  assert.match(v[0], /acme-bridge Bridge extension covered/);
  assert.match(v[0], /no BRIDGE_REGISTRY entry/);
  // The policy rules alone say nothing about it: the disk check is the only
  // thing between a new bridge and an unreviewed release.
  assert.deepEqual(checkPolicy(POLICY), []);
});

test("a registry entry whose package no longer exists is flagged as stale", () => {
  const bridges = discoverBridgePackages(REPO_ROOT).filter(
    (b) => b !== "tanita-bridge"
  );
  const v = checkBridgeCoverage(POLICY, bridges);

  assert.equal(v.length, 1, v.join(" | "));
  assert.match(v[0], /tanita-bridge Bridge extension covered/);
  assert.match(v[0], /the entry is stale/);
});

test("gutting the rule set for a section that still exists is flagged", () => {
  // "Covered" has to mean the rules actually constrain the section.
  // Deleting the Tanita rules leaves a section that still reads fine and a
  // guard that no longer checks a word of it.
  const gutted = REQUIRED_RULES.filter((r) => r.section !== TANITA);
  const v = checkBridgeCoverage(
    POLICY,
    discoverBridgePackages(REPO_ROOT),
    BRIDGE_REGISTRY,
    gutted
  );

  assert.equal(v.length, 1, v.join(" | "));
  assert.match(v[0], /tanita-bridge Bridge extension covered/);
  assert.match(v[0], /only 0 rule\(s\) constrain/);
});

test("the guard exits 1 when a new bridge package appears on disk", () => {
  // Staged in a throwaway repo root, never inside the real packages/ tree:
  // `node --test` runs test files concurrently and sibling suites enumerate
  // `packages/*-bridge` at load time, so a fixture package planted in place
  // would fail them at random.
  const root = mkdtempSync(join(tmpdir(), "kaiord-priv-repo-"));
  try {
    const script = join(root, "packages/docs/scripts", SCRIPT_NAME);
    mkdirSync(dirname(script), { recursive: true });
    writeFileSync(script, readFileSync(SCRIPT, "utf8"));
    mkdirSync(join(root, "packages/docs/legal"), { recursive: true });
    writeFileSync(join(root, "packages/docs/legal/privacy-policy.md"), POLICY);
    mkdirSync(join(root, "packages/acme-bridge"), { recursive: true });

    const result = spawnSync("node", [script], { encoding: "utf8" });

    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /acme-bridge Bridge extension covered/);
    assert.match(result.stderr, /no BRIDGE_REGISTRY entry/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ---------- the script must actually run when invoked ----------

test("the guard runs its checks when invoked through a symlinked path", () => {
  // `import.meta.url === pathToFileURL(process.argv[1]).href` is false
  // under a symlinked invocation path, because Node resolves module URLs to
  // the real path but leaves argv[1] as typed. The whole block was skipped
  // and the guard exited 0 having verified nothing. macOS `/tmp` is itself
  // a symlink to `/private/tmp`, so mkdtemp here reproduces it directly.
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-symlink-"));
  try {
    const link = join(dir, "repo");
    symlinkSync(REPO_ROOT, link);
    const result = spawnSync(
      "node",
      [join(link, "packages", "docs", "scripts", SCRIPT_NAME)],
      { encoding: "utf8" }
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(
      result.stdout,
      /in sync with the spec/,
      "guard produced no output — it exited without checking anything"
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("isDirectInvocation is false, not a throw, when there is no entry path", () => {
  // The old idiom called `pathToFileURL(process.argv[1])` unguarded, so
  // loading the module with no entry path threw instead of returning false.
  assert.equal(isDirectInvocation(import.meta.url, undefined), false);
  assert.equal(isDirectInvocation(import.meta.url, ""), false);
  assert.equal(
    isDirectInvocation(import.meta.url, join(tmpdir(), "does-not-exist.mjs")),
    false
  );
  assert.equal(
    isDirectInvocation(import.meta.url, fileURLToPath(import.meta.url)),
    true
  );
});

// ---------- checkManifestPermissions ----------

test("manifest with announce-only content script match on kaiord.com passes", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-announce-"));
  try {
    const path = join(dir, "manifest.json");
    writeFileSync(
      path,
      JSON.stringify(
        {
          permissions: ["tabs"],
          host_permissions: ["https://app.train2go.com/*"],
          content_scripts: [
            {
              matches: ["https://app.train2go.com/*"],
              js: ["content.js"],
            },
            {
              matches: ["https://*.kaiord.com/*", "http://localhost/*"],
              js: ["kaiord-announce.js"],
            },
          ],
        },
        null,
        2
      )
    );
    const v = checkManifestPermissions(
      path,
      "train2go-bridge",
      new Set(["https://app.train2go.com/*"])
    );
    assert.deepEqual(v, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("manifest with undisclosed content_scripts match is still rejected", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-undisclosed-"));
  try {
    const path = join(dir, "manifest.json");
    writeFileSync(
      path,
      JSON.stringify(
        {
          permissions: ["tabs"],
          host_permissions: ["https://app.train2go.com/*"],
          content_scripts: [
            { matches: ["https://evil.example.com/*"], js: ["x.js"] },
          ],
        },
        null,
        2
      )
    );
    const v = checkManifestPermissions(
      path,
      "train2go-bridge",
      new Set(["https://app.train2go.com/*"])
    );
    assert.ok(v.some((r) => r.includes("undisclosed content_scripts match")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

function writeManifest(dir, permissions, host_permissions) {
  const path = join(dir, "manifest.json");
  writeFileSync(
    path,
    JSON.stringify({ permissions, host_permissions }, null, 2)
  );
  return path;
}

test("manifest without cookies and with allowed host passes", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-ok-"));
  try {
    const m = writeManifest(dir, ["tabs"], ["https://app.train2go.com/*"]);
    const v = checkManifestPermissions(
      m,
      "train2go-bridge",
      new Set(["https://app.train2go.com/*"])
    );
    assert.deepEqual(v, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("manifest declaring `cookies` permission is rejected", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-cookies-"));
  try {
    const m = writeManifest(
      dir,
      ["tabs", "cookies"],
      ["https://app.train2go.com/*"]
    );
    const v = checkManifestPermissions(
      m,
      "train2go-bridge",
      new Set(["https://app.train2go.com/*"])
    );
    assert.ok(
      v.some((r) => r.includes('credential-access permission "cookies"'))
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("`cookies` is rejected even for whoop-bridge, whose only exemption is webRequest", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-whoop-cookies-"));
  try {
    const m = writeManifest(
      dir,
      ["tabs", "webRequest", "cookies"],
      ["https://app.whoop.com/*"]
    );
    const v = checkManifestPermissions(
      m,
      "whoop-bridge",
      new Set(["https://app.whoop.com/*"])
    );
    assert.ok(
      v.some((r) => r.includes('credential-access permission "cookies"'))
    );
    assert.ok(!v.some((r) => r.includes('permission "webRequest"')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// `webRequest` + `extraHeaders` reads Authorization headers — the same
// class of credential access the `cookies` ban exists to prevent. It is
// permitted only where an explicit, written exemption exists.

test("`webRequest` without a documented exemption is rejected", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-webrequest-"));
  try {
    const m = writeManifest(
      dir,
      ["storage", "webRequest"],
      ["https://app.train2go.com/*"]
    );
    const v = checkManifestPermissions(
      m,
      "train2go-bridge",
      new Set(["https://app.train2go.com/*"])
    );
    assert.ok(
      v.some(
        (r) =>
          r.includes('credential-access permission "webRequest"') &&
          r.includes("no documented exemption")
      )
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("`webRequest` on whoop-bridge passes via its documented exemption", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-whoop-ok-"));
  try {
    const m = writeManifest(
      dir,
      ["tabs", "webRequest", "scripting", "storage"],
      ["https://api.prod.whoop.com/*", "https://app.whoop.com/*"]
    );
    const v = checkManifestPermissions(
      m,
      "whoop-bridge",
      new Set(["https://api.prod.whoop.com/*", "https://app.whoop.com/*"])
    );
    assert.deepEqual(v, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("`webRequestBlocking` stays unconditionally forbidden, exemption or not", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-blocking-"));
  try {
    const m = writeManifest(
      dir,
      ["webRequest", "webRequestBlocking"],
      ["https://app.whoop.com/*"]
    );
    const v = checkManifestPermissions(
      m,
      "whoop-bridge",
      new Set(["https://app.whoop.com/*"])
    );
    assert.ok(
      v.some((r) => r.includes('forbidden permission "webRequestBlocking"'))
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("optional_permissions are checked for credential access too", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-optional-"));
  try {
    const path = join(dir, "manifest.json");
    writeFileSync(
      path,
      JSON.stringify({
        permissions: ["storage"],
        optional_permissions: ["cookies"],
        host_permissions: ["https://app.train2go.com/*"],
      })
    );
    const v = checkManifestPermissions(
      path,
      "train2go-bridge",
      new Set(["https://app.train2go.com/*"])
    );
    assert.ok(
      v.some((r) => r.includes('credential-access permission "cookies"'))
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("manifest with undisclosed host_permission is rejected", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-host-"));
  try {
    const m = writeManifest(
      dir,
      ["tabs"],
      ["https://app.train2go.com/*", "https://evil.example.com/*"]
    );
    const v = checkManifestPermissions(
      m,
      "train2go-bridge",
      new Set(["https://app.train2go.com/*"])
    );
    assert.ok(v.some((r) => r.includes("undisclosed host_permission")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---------- checkSidebar ----------

test("sidebar config referencing privacy-policy passes", () => {
  const config = `sidebar: [{ text: 'Legal', items: [{ link: '/legal/privacy-policy' }] }]`;
  assert.deepEqual(checkSidebar(config), []);
});

test("sidebar config missing privacy-policy is flagged", () => {
  const config = `sidebar: [{ text: 'Guide', items: [] }]`;
  const v = checkSidebar(config);
  assert.equal(v.length, 1);
  assert.match(v[0], /no sidebar link/);
});
