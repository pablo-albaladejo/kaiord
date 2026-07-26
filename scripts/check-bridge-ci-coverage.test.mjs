// Mechanical guard: every bridge extension package MUST be visible to CI.
//
// trainingpeaks-bridge and tanita-bridge landed with full vitest suites
// that never ran in CI because ci.yml enumerates bridges in four separate
// places (detect-changes filters, docs-only skip chain, test matrix,
// coverage-threshold case) and nothing tied those lists to the packages
// on disk. This guard closes that gap: it derives the bridge list from
// packages/*-bridge and fails when any enumeration in ci.yml misses one.

import { strict as assert } from "node:assert";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { parse } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const CI_PATH = join(REPO_ROOT, ".github", "workflows", "ci.yml");

const bridgePackages = readdirSync(join(REPO_ROOT, "packages")).filter(
  (name) =>
    name.endsWith("-bridge") &&
    statSync(join(REPO_ROOT, "packages", name)).isDirectory()
);

const ciText = readFileSync(CI_PATH, "utf8");
const workflow = parse(ciText);

const detectChangesSteps = workflow.jobs["detect-changes"].steps;
const changedFilesStep = detectChangesSteps.find(
  (step) => step.with && typeof step.with.files_yaml === "string"
);
const filesYaml = parse(changedFilesStep.with.files_yaml);
const analyzeStep = detectChangesSteps.find(
  (step) => step.id === "changes" && typeof step.run === "string"
);

test("packages/*-bridge discovery finds the bridge extensions", () => {
  assert.ok(
    bridgePackages.length >= 5,
    `expected at least 5 bridge packages, found: ${bridgePackages.join(", ")}`
  );
});

for (const bridge of bridgePackages) {
  const filterKey = bridge.replaceAll("-", "_");

  test(`${bridge}: detect-changes has a '${filterKey}' filter watching the package`, () => {
    const patterns = filesYaml[filterKey];
    assert.ok(
      Array.isArray(patterns),
      `ci.yml detect-changes files_yaml is missing the '${filterKey}' key`
    );
    assert.ok(
      patterns.includes(`packages/${bridge}/**`),
      `'${filterKey}' filter does not watch packages/${bridge}/**`
    );
  });

  test(`${bridge}: docs-only skip chain consults ${filterKey}_any_changed`, () => {
    assert.ok(
      analyzeStep.run.includes(`${filterKey}_any_changed`),
      `the docs-only skip chain in the 'Analyze changes' step never reads ` +
        `${filterKey}_any_changed, so a ${bridge}-only PR would skip all tests`
    );
  });

  test(`${bridge}: test job matrix runs its suite`, () => {
    const packages = workflow.jobs.test.strategy.matrix.package;
    assert.ok(
      packages.includes(bridge),
      `ci.yml test matrix does not include '${bridge}' — its tests never run in CI`
    );
  });

  test(`${bridge}: coverage-threshold case applies the bridge threshold`, () => {
    const thresholdStep = workflow.jobs.test.steps.find(
      (step) => step.name === "Check coverage threshold"
    );
    assert.ok(
      thresholdStep.run.includes(bridge),
      `the 'Check coverage threshold' case does not list '${bridge}'; ` +
        `it would be held to the default threshold instead of the bridge one`
    );
  });
}
