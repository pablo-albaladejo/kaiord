// Mechanical guard: every bridge extension package and every published
// TypeScript library MUST be visible to CI.
//
// trainingpeaks-bridge and tanita-bridge landed with full vitest suites
// that never ran in CI because ci.yml enumerates packages in several
// separate places (detect-changes filters, docs-only skip chain, test
// matrix, coverage-threshold case) and nothing tied those lists to the
// packages on disk. The published libraries @kaiord/whoop, @kaiord/tanita
// and @kaiord/trainingpeaks then went the same way: published to npm, with
// 17 test files nobody ran, because this guard only scanned `*-bridge`. The
// roster is now derived from disk on both sides.
//
// codecov.yml has the same shape and went stale the same way. Its three
// bridge enumerations — the default patch exclusion, the informational
// `bridges` patch check, and the `bridges` flag — listed only garmin and
// train2go. That stayed invisible for as long as no PR touched another
// bridge; the first one that did failed `codecov/patch` on Chrome
// service-worker boilerplate the file itself declares untestable. A
// prose comment already sat above that list and did not prevent it, so
// the roster is asserted here instead.
//
// The skip chain is also replayed end to end: the real 'Analyze changes'
// bash runs against a list of changed files, so "a library change shipped
// with a doc still tests" is checked, not inferred from string presence.

import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { parse } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const CI_TEXT = readFileSync(
  join(REPO_ROOT, ".github", "workflows", "ci.yml"),
  "utf8"
);
const CODECOV_TEXT = readFileSync(join(REPO_ROOT, "codecov.yml"), "utf8");

const packageDirs = readdirSync(join(REPO_ROOT, "packages")).filter((name) =>
  statSync(join(REPO_ROOT, "packages", name)).isDirectory()
);

const BRIDGES = packageDirs.filter((name) => name.endsWith("-bridge"));

// A published TS library: a non-private package with a tsconfig and a
// `test` script. Private apps (SPA, docs, landing, mcp-worker, i18n) have
// their own jobs and are outside this roster.
const LIBS = packageDirs.filter((name) => {
  const dir = join(REPO_ROOT, "packages", name);
  const manifestPath = join(dir, "package.json");
  if (!existsSync(manifestPath)) return false;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  return (
    manifest.private !== true &&
    typeof manifest.scripts?.test === "string" &&
    existsSync(join(dir, "tsconfig.json"))
  );
});

const bridgeNames = (paths) =>
  paths
    .map((entry) => /packages\/([a-z0-9-]+-bridge)/.exec(entry))
    .filter(Boolean)
    .map((match) => match[1])
    .sort();

const readCi = (ciText) => {
  const workflow = parse(ciText);
  const steps = workflow.jobs["detect-changes"].steps;
  const filesYaml = parse(
    steps.find((step) => typeof step.with?.files_yaml === "string").with
      .files_yaml
  );
  const analyzeRun = steps.find(
    (step) => step.id === "changes" && typeof step.run === "string"
  ).run;
  const thresholdRun = workflow.jobs.test.steps.find(
    (step) => step.name === "Check coverage threshold"
  ).run;
  const arms = [
    ...thresholdRun.matchAll(/^\s*([\w|-]+)\)\s*THRESHOLD=(\d+)\s*;;/gm),
  ].map(([, names]) => names.split("|"));
  // A job other than `test` that runs the package's coverage suite and
  // checks its floor itself (the CLI has `test-cli`).
  const dedicatedJob = (pkg) =>
    Object.entries(workflow.jobs).some(([name, job]) => {
      const runs = (job.steps ?? []).map((step) => String(step.run ?? ""));
      return (
        name !== "test" &&
        runs.some((r) => r.includes(`--filter @kaiord/${pkg} test:coverage`)) &&
        runs.some((r) => r.includes(`check-coverage.js ./packages/${pkg}/`))
      );
    });
  return {
    filesYaml,
    analyzeRun,
    matrix: workflow.jobs.test.strategy.matrix.package,
    arms,
    dedicatedJob,
  };
};

/** Every way ci.yml + codecov.yml fail to see the roster, as messages. */
export const findViolations = (
  ciText,
  codecovText,
  { bridges = BRIDGES, libs = LIBS } = {}
) => {
  const ci = readCi(ciText);
  const codecov = parse(codecovText);
  const patch = codecov.coverage.status.patch;
  const violations = [];
  const bridgeArm = ci.arms.find((names) => names.includes("garmin-bridge"));

  for (const key of Object.keys(ci.filesYaml)) {
    if (!ci.analyzeRun.includes(`${key}_any_changed`)) {
      violations.push(`skip chain: filter '${key}' is never consulted`);
    }
  }

  for (const pkg of [...bridges, ...libs]) {
    const key = pkg.replaceAll("-", "_");
    const isBridge = bridges.includes(pkg);
    if (!(ci.filesYaml[key] ?? []).includes(`packages/${pkg}/**`)) {
      violations.push(`filters: no '${key}' filter over packages/${pkg}/**`);
    }
    if (!ci.analyzeRun.includes(`${key}_any_changed`)) {
      violations.push(`skip chain: ${pkg} (${key}_any_changed) not consulted`);
    }
    if (ci.matrix.includes(pkg)) {
      const arm = ci.arms.find((names) => names.includes(pkg));
      if (!arm) {
        violations.push(`threshold: ${pkg} is not named in any THRESHOLD arm`);
      } else if ((arm === bridgeArm) !== isBridge) {
        violations.push(
          `threshold: ${pkg} ${isBridge ? "is not in" : "is in"} the bridge arm`
        );
      }
    } else if (isBridge || !ci.dedicatedJob(pkg)) {
      violations.push(`matrix: ${pkg} is in neither the test matrix nor a job`);
    }
    if (!isBridge) {
      if (!(codecov.flags[pkg]?.paths ?? []).includes(`packages/${pkg}/src/`)) {
        violations.push(`codecov: no '${pkg}' flag over packages/${pkg}/src/`);
      }
      if (patch.default.paths.some((p) => p.startsWith(`!packages/${pkg}/`))) {
        violations.push(`codecov: ${pkg} excluded from the default patch`);
      }
    }
  }

  const want = [...bridges].sort().join(",");
  const codecovLists = [
    ["default patch exclusion", patch.default.paths],
    ["'bridges' patch check", patch.bridges.paths],
    ["'bridges' flag", codecov.flags.bridges.paths],
  ];
  for (const [label, paths] of codecovLists) {
    if (bridgeNames(paths).join(",") !== want) {
      violations.push(`codecov: the ${label} drifted from packages/*-bridge`);
    }
  }
  return violations;
};

// tj-actions/changed-files glob semantics: `**` crosses directories.
const globToRegex = (glob) =>
  new RegExp(
    "^" +
      glob
        .split(/(\*\*\/|\*\*|\*)/)
        .map((part) => {
          if (part === "**/") return "(?:.*/)?";
          if (part === "**") return ".*";
          if (part === "*") return "[^/]*";
          return part.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("") +
      "$"
  );

/** Runs the real 'Analyze changes' bash for a changed-file list. */
export const replayShouldTest = (ciText, changedFiles) => {
  const { filesYaml, analyzeRun } = readCi(ciText);
  const anyChanged = Object.fromEntries(
    Object.entries(filesYaml).map(([key, patterns]) => [
      `${key}_any_changed`,
      String(
        changedFiles.some((file) =>
          patterns.some((pattern) => globToRegex(pattern).test(file))
        )
      ),
    ])
  );
  const script = analyzeRun.replace(
    /\$\{\{\s*steps\.changed-files\.outputs\.(\w+)\s*\}\}/g,
    (_, name) => {
      assert.ok(name in anyChanged, `unknown changed-files output '${name}'`);
      return anyChanged[name];
    }
  );
  const dir = mkdtempSync(join(tmpdir(), "ci-skip-chain-"));
  try {
    const output = join(dir, "output");
    execFileSync("bash", ["-c", script], {
      env: { ...process.env, GITHUB_OUTPUT: output },
    });
    return /^should-test=(\w+)$/m.exec(readFileSync(output, "utf8"))?.[1];
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const replaceOnce = (text, from, to) => {
  assert.equal(text.split(from).length, 2, `plant anchor not unique: ${from}`);
  return text.replace(from, to);
};

test("roster discovery finds the bridges and the published libraries", () => {
  assert.ok(BRIDGES.length >= 5, `bridges found: ${BRIDGES.join(", ")}`);
  for (const lib of ["core", "whoop", "tanita", "trainingpeaks", "cli"]) {
    assert.ok(LIBS.includes(lib), `libraries found: ${LIBS.join(", ")}`);
  }
});

test("the real ci.yml and codecov.yml see every bridge and library", () => {
  assert.deepEqual(findViolations(CI_TEXT, CODECOV_TEXT), []);
});

test("skip-chain replay: a docs-only diff skips the tests", () => {
  assert.equal(replayShouldTest(CI_TEXT, ["README.md", "docs/a.md"]), "false");
});

for (const pkg of [...BRIDGES, ...LIBS]) {
  test(`skip-chain replay: packages/${pkg}/src/x.ts + README.md tests`, () => {
    const files = [`packages/${pkg}/src/x.ts`, "README.md"];
    assert.equal(replayShouldTest(CI_TEXT, files), "true");
  });
}

// Planted violations: each removes whoop from one enumeration of the real
// files and must be reported by name.
const WHOOP_PLANTS = [
  [
    "filters",
    () => [
      replaceOnce(CI_TEXT, "- 'packages/whoop/**'", "- 'packages/whoop-x/**'"),
      CODECOV_TEXT,
    ],
  ],
  [
    "skip chain",
    () => [
      replaceOnce(
        CI_TEXT,
        "outputs.whoop_any_changed",
        "outputs.docs_any_changed"
      ),
      CODECOV_TEXT,
    ],
  ],
  ["matrix", () => [replaceOnce(CI_TEXT, '"whoop",\n', ""), CODECOV_TEXT]],
  [
    "threshold",
    () => [
      replaceOnce(CI_TEXT, " whoop) THRESHOLD", " whoop-x) THRESHOLD"),
      CODECOV_TEXT,
    ],
  ],
  [
    "codecov",
    () => [CI_TEXT, replaceOnce(CODECOV_TEXT, "  whoop:\n", "  whoop-x:\n")],
  ],
];

for (const [label, plant] of WHOOP_PLANTS) {
  test(`plant: whoop missing from the ${label} enumeration is reported`, () => {
    const [ci, codecov] = plant();
    const violations = findViolations(ci, codecov);
    assert.ok(
      violations.some((v) => v.startsWith(`${label}:`) && v.includes("whoop")),
      `expected a '${label}' violation naming whoop, got: ${violations.join("; ")}`
    );
  });
}

test("plant: a filter missing from the skip chain is reported", () => {
  const ci = replaceOnce(
    CI_TEXT,
    "            i18n:\n",
    "            planted_filter:\n              - 'planted/**'\n            i18n:\n"
  );
  assert.ok(
    findViolations(ci, CODECOV_TEXT).includes(
      "skip chain: filter 'planted_filter' is never consulted"
    )
  );
  assert.equal(replayShouldTest(ci, ["planted/x.ts", "README.md"]), "false");
});

test("plant: a library in the relaxed bridge arm is reported", () => {
  const ci = replaceOnce(
    CI_TEXT,
    "tanita-bridge) THRESHOLD=60",
    "tanita-bridge|whoop) THRESHOLD=60"
  );
  assert.ok(
    findViolations(ci, CODECOV_TEXT).includes(
      "threshold: whoop is in the bridge arm"
    )
  );
});
