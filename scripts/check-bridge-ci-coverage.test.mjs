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
//
// The publish side enumerates the same libraries five more times: the
// release.yml trigger paths, changeset-bot's PUBLISHABLE, the GitHub
// release script's PUBLISHABLE_DIRS, the build job's verify loop and the
// consume-build-artifacts default. Each is parsed and compared to disk.

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
const readRepo = (...path) => readFileSync(join(REPO_ROOT, ...path), "utf8");
const REAL = {
  ci: readRepo(".github", "workflows", "ci.yml"),
  codecov: readRepo("codecov.yml"),
  release: readRepo(".github", "workflows", "release.yml"),
  changesetBot: readRepo(".github", "workflows", "changeset-bot.yml"),
  releasesJs: readRepo("scripts", "create-github-releases.js"),
  consumeAction: readRepo(
    ".github",
    "actions",
    "consume-build-artifacts",
    "action.yml"
  ),
};

const packageDirs = readdirSync(join(REPO_ROOT, "packages")).filter((name) =>
  statSync(join(REPO_ROOT, "packages", name)).isDirectory()
);

const BRIDGES = packageDirs.filter((name) => name.endsWith("-bridge"));

const MANIFESTS = Object.fromEntries(
  packageDirs
    .filter((name) =>
      existsSync(join(REPO_ROOT, "packages", name, "package.json"))
    )
    .map((name) => [
      name,
      JSON.parse(readRepo("packages", name, "package.json")),
    ])
);

// A published library is any non-private package. Private apps (SPA, docs,
// landing, mcp-worker, i18n) have their own jobs and are outside this roster.
const publishedOf = (manifests) =>
  Object.entries(manifests)
    .filter(([, manifest]) => manifest.private !== true)
    .map(([name]) => name);

/**
 * A published package with no `test` script ships tests nobody runs. With
 * `ciText`, every package CI runs `test:coverage` for (the `test` matrix and
 * each literal `--filter @kaiord/<pkg> test:coverage`) must define it too:
 * `pnpm --filter` exits 0 when the script is missing, so nothing runs.
 */
export const findUntested = (manifests, ciText) => {
  const problems = publishedOf(manifests)
    .filter((name) => typeof manifests[name].scripts?.test !== "string")
    .map((name) => `roster: published ${name} has no 'test' script`);
  if (ciText === undefined) return problems;
  const literal = [
    ...ciText.matchAll(/--filter @kaiord\/([a-z0-9-]+) test:coverage/g),
  ].map((match) => match[1]);
  const runners = [...new Set([...readCi(ciText).matrix, ...literal])];
  for (const name of runners) {
    if (typeof manifests[name]?.scripts?.["test:coverage"] !== "string") {
      problems.push(
        `roster: CI runs test:coverage for ${name}, which has no 'test:coverage' script`
      );
    }
  }
  return problems;
};

const LIBS = publishedOf(MANIFESTS);

const bridgeNames = (paths) =>
  paths
    .map((entry) => /packages\/([a-z0-9-]+-bridge)/.exec(entry))
    .filter(Boolean)
    .map((match) => match[1])
    .sort();

const words = (text = "") => text.trim().split(/\s+/).filter(Boolean);

/** The five publish-side enumerations, as package directory names. */
const readPublishLists = ({
  release,
  changesetBot,
  releasesJs,
  consumeAction,
}) => {
  const releasePaths = parse(release).on.push.paths;
  const botRun = Object.values(parse(changesetBot).jobs)
    .flatMap((job) => job.steps ?? [])
    .map((step) => String(step.run ?? ""))
    .find((run) => run.includes("PUBLISHABLE="));
  const dirsArray = /PUBLISHABLE_DIRS = \[([^\]]*)\]/.exec(releasesJs)?.[1];
  return {
    "release.yml paths": releasePaths
      .map((path) => /^packages\/([^/]+)\/\*\*$/.exec(path)?.[1])
      .filter(Boolean),
    "changeset-bot PUBLISHABLE": words(
      /PUBLISHABLE="([^"]*)"/.exec(botRun ?? "")?.[1]
    ).map((dir) => dir.replace(/^packages\//, "")),
    "create-github-releases PUBLISHABLE_DIRS": [
      ...(dirsArray ?? "").matchAll(/"([^"]+)"/g),
    ].map((match) => match[1]),
    "consume-build-artifacts default": words(
      parse(consumeAction).inputs["expected-packages"].default
    ),
  };
};

// These two lists drive publishing itself, so a private package in them
// is as wrong as a missing library.
const EXACT_LISTS = new Set([
  "changeset-bot PUBLISHABLE",
  "create-github-releases PUBLISHABLE_DIRS",
]);

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
  const verifyRun = workflow.jobs.build.steps.find(
    (step) => step.name === "Verify build outputs"
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
  // The `if` whose branch writes should-test=false: only a filter read
  // there can stop a docs-only skip; a per-package `*-changed` step cannot.
  const skipCondition =
    analyzeRun
      .split(/^\s*if /m)
      .find((block) => block.includes('echo "should-test=false"')) ?? "";
  return {
    filesYaml,
    analyzeRun,
    skipCondition,
    matrix: workflow.jobs.test.strategy.matrix.package,
    arms,
    dedicatedJob,
    verifyLoop: words(/for pkg in ([^;]+);/.exec(verifyRun)?.[1]),
  };
};

/** Every way the CI and publish files fail to see the roster, as messages. */
export const findViolations = (
  texts,
  { bridges = BRIDGES, libs = LIBS } = {}
) => {
  const ci = readCi(texts.ci);
  const codecov = parse(texts.codecov);
  const patch = codecov.coverage.status.patch;
  const violations = [];
  const bridgeArm = ci.arms.find((names) => names.includes("garmin-bridge"));

  for (const key of Object.keys(ci.filesYaml)) {
    if (!ci.skipCondition.includes(`${key}_any_changed`)) {
      violations.push(`skip chain: filter '${key}' is never consulted`);
    }
  }

  for (const pkg of [...bridges, ...libs]) {
    const key = pkg.replaceAll("-", "_");
    const isBridge = bridges.includes(pkg);
    if (!(ci.filesYaml[key] ?? []).includes(`packages/${pkg}/**`)) {
      violations.push(`filters: no '${key}' filter over packages/${pkg}/**`);
    }
    if (!ci.skipCondition.includes(`${key}_any_changed`)) {
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

  const publishLists = {
    ...readPublishLists(texts),
    "ci.yml verify-build loop": ci.verifyLoop,
  };
  for (const [label, list] of Object.entries(publishLists)) {
    for (const pkg of libs.filter((lib) => !list.includes(lib))) {
      violations.push(`${label}: missing published ${pkg}`);
    }
    if (EXACT_LISTS.has(label)) {
      for (const pkg of list.filter((dir) => !libs.includes(dir))) {
        violations.push(`${label}: lists ${pkg}, which is not published`);
      }
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

test("every published package on disk has a test script", () => {
  assert.deepEqual(findUntested(MANIFESTS), []);
});

test("plant: a published package without a test script is reported", () => {
  const manifests = {
    ...MANIFESTS,
    whoop: { ...MANIFESTS.whoop, scripts: { build: "tsdown" } },
  };
  assert.deepEqual(findUntested(manifests), [
    "roster: published whoop has no 'test' script",
  ]);
});

test("should give every package CI runs test:coverage for that script", () => {
  // Arrange
  const manifests = MANIFESTS;

  // Act
  const problems = findUntested(manifests, REAL.ci);

  // Assert
  assert.deepEqual(problems, []);
});

for (const pkg of ["whoop", "cli"]) {
  test(`should report ${pkg} when CI runs its test:coverage but the script is gone`, () => {
    // Arrange
    const { "test:coverage": _dropped, ...scripts } = MANIFESTS[pkg].scripts;
    const manifests = { ...MANIFESTS, [pkg]: { ...MANIFESTS[pkg], scripts } };

    // Act
    const problems = findUntested(manifests, REAL.ci);

    // Assert
    assert.deepEqual(problems, [
      `roster: CI runs test:coverage for ${pkg}, which has no 'test:coverage' script`,
    ]);
  });
}

test("the real CI and publish files see every bridge and library", () => {
  assert.deepEqual(findViolations(REAL), []);
});

test("skip-chain replay: a docs-only diff skips the tests", () => {
  assert.equal(replayShouldTest(REAL.ci, ["README.md", "docs/a.md"]), "false");
});

for (const pkg of [...BRIDGES, ...LIBS]) {
  test(`skip-chain replay: packages/${pkg}/src/x.ts + README.md tests`, () => {
    const files = [`packages/${pkg}/src/x.ts`, "README.md"];
    assert.equal(replayShouldTest(REAL.ci, files), "true");
  });
}

// Planted violations: each removes whoop from one enumeration of the real
// files and must be reported under that enumeration's label.
const plantIn = (file, from, to) => ({
  ...REAL,
  [file]: replaceOnce(REAL[file], from, to),
});

const WHOOP_PLANTS = [
  [
    "filters",
    () => plantIn("ci", "- 'packages/whoop/**'", "- 'packages/whoop-x/**'"),
  ],
  [
    "skip chain",
    () =>
      plantIn("ci", "outputs.whoop_any_changed", "outputs.docs_any_changed"),
  ],
  ["matrix", () => plantIn("ci", '"whoop",\n', "")],
  [
    "threshold",
    () => plantIn("ci", " whoop) THRESHOLD", " whoop-x) THRESHOLD"),
  ],
  ["codecov", () => plantIn("codecov", "  whoop:\n", "  whoop-x:\n")],
  [
    "release.yml paths",
    () => plantIn("release", '      - "packages/whoop/**"\n', ""),
  ],
  [
    "changeset-bot PUBLISHABLE",
    () => plantIn("changesetBot", " packages/whoop packages/", " packages/"),
  ],
  [
    "create-github-releases PUBLISHABLE_DIRS",
    () => plantIn("releasesJs", '  "whoop",\n', ""),
  ],
  [
    "ci.yml verify-build loop",
    () => plantIn("ci", " i18n whoop tanita", " i18n tanita"),
  ],
  [
    "consume-build-artifacts default",
    () => plantIn("consumeAction", " ai whoop tanita", " ai tanita"),
  ],
];

// Lazy: built inside each test, so a real-tree mutation still loads this file.
for (const [label, plant] of WHOOP_PLANTS) {
  test(`plant: whoop missing from the ${label} enumeration is reported`, () => {
    const violations = findViolations(plant());
    assert.ok(
      violations.some((v) => v.startsWith(`${label}:`) && v.includes("whoop")),
      `expected a '${label}' violation naming whoop, got: ${violations.join("; ")}`
    );
  });
}

test("plant: a private package in changeset-bot PUBLISHABLE is reported", () => {
  const texts = plantIn(
    "changesetBot",
    'PUBLISHABLE="packages/core ',
    'PUBLISHABLE="packages/landing packages/core '
  );
  assert.ok(
    findViolations(texts).includes(
      "changeset-bot PUBLISHABLE: lists landing, which is not published"
    )
  );
});

test("plant: a filter missing from the skip chain is reported", () => {
  const texts = plantIn(
    "ci",
    "            i18n:\n",
    "            planted_filter:\n              - 'planted/**'\n            i18n:\n"
  );
  assert.ok(
    findViolations(texts).includes(
      "skip chain: filter 'planted_filter' is never consulted"
    )
  );
  assert.equal(
    replayShouldTest(texts.ci, ["planted/x.ts", "README.md"]),
    "false"
  );
});

test("should test a frontend change plus README.md in the skip-chain replay", () => {
  // Arrange
  const files = ["packages/workout-spa-editor/src/x.ts", "README.md"];

  // Act
  const shouldTest = replayShouldTest(REAL.ci, files);

  // Assert
  assert.equal(shouldTest, "true");
});

test("should report a filter dropped from the docs-only skip condition even when another step reads it", () => {
  // Arrange
  const texts = plantIn(
    "ci",
    '             [[ "${{ steps.changed-files.outputs.frontend_any_changed }}" == "false" ]] && \\\n',
    ""
  );

  // Act
  const violations = findViolations(texts);

  // Assert
  assert.ok(
    violations.includes("skip chain: filter 'frontend' is never consulted"),
    `expected a skip-chain violation for frontend, got: ${violations.join("; ")}`
  );
  assert.equal(
    replayShouldTest(texts.ci, [
      "packages/workout-spa-editor/src/x.ts",
      "README.md",
    ]),
    "false"
  );
});

test("plant: a library in the relaxed bridge arm is reported", () => {
  const texts = plantIn(
    "ci",
    "tanita-bridge) THRESHOLD=60",
    "tanita-bridge|whoop) THRESHOLD=60"
  );
  assert.ok(
    findViolations(texts).includes("threshold: whoop is in the bridge arm")
  );
});
