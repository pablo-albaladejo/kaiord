// Tests for scripts/check-workflow-timeouts.mjs using node:test.

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

// The script resolves WORKFLOWS_DIR from its own location (REPO_ROOT/.github/
// workflows). To exercise the real CLI without touching the production
// .github/workflows tree, the harness materializes a self-contained tree
// (scripts/check-workflow-timeouts.mjs + .github/workflows/*.yml + a tiny
// node_modules/yaml shim that re-exports from the real workspace install)
// in a tmp dir and invokes the script there.

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = resolve(__dirname, "check-workflow-timeouts.mjs");
const SCRIPT_SRC = readFileSync(SCRIPT_PATH, "utf8");

// Resolve the real `yaml` package's main file so the harness can re-export
// it from the tmp-root's node_modules without copying the package.
const realYamlMain = (() => {
  // require.resolve via node CLI to avoid plumbing CommonJS into ESM.
  const out = spawnSync(
    process.execPath,
    ["-e", "process.stdout.write(require.resolve('yaml'))"],
    { cwd: resolve(__dirname, ".."), encoding: "utf8" }
  );
  if (out.status !== 0) {
    throw new Error(
      `Could not resolve real 'yaml' package: ${out.stderr || out.stdout}`
    );
  }
  return out.stdout.trim();
})();

function mkHarness(workflows) {
  // realpath the tmp dir so process.argv[1] and import.meta.url agree under
  // macOS's /var -> /private/var symlink.
  const root = realpathSync(
    mkdtempSync(join(tmpdir(), "kaiord-wf-timeouts-test-"))
  );
  const wfDir = join(root, ".github", "workflows");
  mkdirSync(wfDir, { recursive: true });
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(
    join(root, "scripts", "check-workflow-timeouts.mjs"),
    SCRIPT_SRC
  );

  // Shim node_modules/yaml so `import { parse } from "yaml"` resolves from
  // the tmp root. We re-export the real install's entry point.
  const yamlPkgDir = join(root, "node_modules", "yaml");
  mkdirSync(yamlPkgDir, { recursive: true });
  writeFileSync(
    join(yamlPkgDir, "package.json"),
    JSON.stringify({
      name: "yaml",
      version: "0.0.0-shim",
      main: "index.mjs",
      type: "module",
    })
  );
  writeFileSync(
    join(yamlPkgDir, "index.mjs"),
    `export * from ${JSON.stringify(realYamlMain)};\n`
  );

  for (const [name, body] of Object.entries(workflows)) {
    writeFileSync(join(wfDir, name), body);
  }

  return {
    root,
    run() {
      return spawnSync(
        process.execPath,
        [join(root, "scripts", "check-workflow-timeouts.mjs")],
        { cwd: root, encoding: "utf8" }
      );
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

test("should pass when every job declares timeout-minutes", () => {
  // Arrange
  const h = mkHarness({
    "ok.yml": [
      "name: OK",
      "on: [push]",
      "jobs:",
      "  build:",
      "    runs-on: ubuntu-latest",
      "    timeout-minutes: 5",
      "    steps:",
      "      - run: echo hi",
      "  test:",
      "    runs-on: ubuntu-latest",
      "    timeout-minutes: 10",
      "    steps:",
      "      - run: echo hi",
      "",
    ].join("\n"),
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /every job declares `timeout-minutes`/);
  } finally {
    h.cleanup();
  }
});

test("should fail when a job is missing timeout-minutes", () => {
  // Arrange
  const h = mkHarness({
    "missing.yml": [
      "name: Missing",
      "on: [push]",
      "jobs:",
      "  good:",
      "    runs-on: ubuntu-latest",
      "    timeout-minutes: 5",
      "    steps:",
      "      - run: echo hi",
      "  bad:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - run: echo hi",
      "",
    ].join("\n"),
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 1);
    assert.match(result.stderr, /job "bad" is missing `timeout-minutes`/);
    // The "good" job must NOT be reported.
    assert.doesNotMatch(result.stderr, /job "good"/);
  } finally {
    h.cleanup();
  }
});

test("should fail when a workflow file is malformed YAML", () => {
  // Arrange
  const h = mkHarness({
    "broken.yml": [
      "name: Broken",
      "on: [push]",
      "jobs:",
      "  bad:",
      "    runs-on: ubuntu-latest",
      "    timeout-minutes: 5",
      "    steps: [",
      "      - run: echo hi", // unbalanced flow sequence
      "",
    ].join("\n"),
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 1);
    assert.match(result.stderr, /malformed YAML/);
  } finally {
    h.cleanup();
  }
});

test("should tolerate a workflow file with no jobs (matrix-only / template)", () => {
  // Arrange
  const h = mkHarness({
    "ok.yml": [
      "name: OK",
      "on: [push]",
      "jobs:",
      "  build:",
      "    runs-on: ubuntu-latest",
      "    timeout-minutes: 5",
      "    steps:",
      "      - run: echo hi",
      "",
    ].join("\n"),
    // Reusable-workflow fragment with no top-level jobs:.
    "fragment.yml": [
      "name: Fragment",
      "on:",
      "  workflow_call:",
      "    inputs:",
      "      whatever:",
      "        type: string",
      "",
    ].join("\n"),
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /every job declares `timeout-minutes`/);
  } finally {
    h.cleanup();
  }
});
