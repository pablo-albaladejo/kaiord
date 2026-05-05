// Tests for scripts/check-overrides-stale.mjs using node:test.
//
// Each scenario from openspec/specs/scripts-folder-hygiene/spec.md
// (R-OverridesStale) is exercised against an isolated tmp-root harness:
// a fake repo with package.json, pnpm-lock.yaml, node_modules/.pnpm tree,
// and scripts/README.md. The harness drives the production script as a
// child process so we exercise the real CLI surface.

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

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_SRC = readFileSync(
  resolve(__dirname, "check-overrides-stale.mjs"),
  "utf8"
);

const ALLOW_HEADER = `# scripts\n\n<!-- overrides-allowlist:start -->\n\n`;
const ALLOW_FOOTER = `\n<!-- overrides-allowlist:end -->\n`;

function mkHarness({
  overrides,
  parents = [],
  lockSnapshots = [],
  allowlist = "",
}) {
  const root = realpathSync(
    mkdtempSync(join(tmpdir(), "kaiord-overrides-stale-test-"))
  );
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, "node_modules", ".pnpm"), { recursive: true });
  writeFileSync(join(root, "scripts", "check-overrides-stale.mjs"), SCRIPT_SRC);
  writeFileSync(
    join(root, "scripts", "README.md"),
    ALLOW_HEADER + allowlist + ALLOW_FOOTER
  );

  const pkg = {
    name: "test-fixture",
    version: "0.0.0",
    private: true,
    pnpm: { overrides },
  };
  writeFileSync(join(root, "package.json"), JSON.stringify(pkg, null, 2));

  // Fake pnpm-lock.yaml — only the snapshot lines `^  <name>@<version>:`
  // are read by the script.
  const lockBody = ["lockfileVersion: '9.0'", "", "packages:"];
  for (const { name, version } of lockSnapshots) {
    lockBody.push(`  ${name}@${version}:`);
    lockBody.push(`    resolution: {integrity: sha512-fake}`);
    lockBody.push("");
  }
  writeFileSync(join(root, "pnpm-lock.yaml"), lockBody.join("\n"));

  // Materialize parent specifiers into node_modules/.pnpm/<dir>/node_modules/
  // <name>/package.json — exactly what `pnpm install` would have produced.
  for (const p of parents) {
    const dirEntry = `${p.name.replace("/", "+")}@${p.version}`;
    const inner = join(
      root,
      "node_modules",
      ".pnpm",
      dirEntry,
      "node_modules",
      p.name
    );
    mkdirSync(inner, { recursive: true });
    const pkgJson = {
      name: p.name,
      version: p.version,
      dependencies: p.dependencies ?? {},
    };
    writeFileSync(
      join(inner, "package.json"),
      JSON.stringify(pkgJson, null, 2)
    );
  }

  return {
    root,
    run() {
      return spawnSync(
        process.execPath,
        [join(root, "scripts", "check-overrides-stale.mjs")],
        { cwd: root, encoding: "utf8" }
      );
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

test("required override (parent specifier intersects vuln range) passes", () => {
  // Arrange
  const h = mkHarness({
    overrides: { "qs@>=6.7.0 <=6.14.1": ">=6.14.2" },
    lockSnapshots: [{ name: "qs", version: "6.15.0" }],
    parents: [
      {
        name: "body-parser",
        version: "2.2.2",
        dependencies: { qs: "^6.14.1" },
      },
    ],
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /1 total — 1 required, 0 allowlisted, 0 stale/);
  } finally {
    h.cleanup();
  }
});

test("stale override without allowlist fails with R-OverridesStale", () => {
  // Arrange
  const h = mkHarness({
    overrides: { "some-pkg@<1.0.0": ">=1.0.1" },
    lockSnapshots: [{ name: "some-pkg", version: "1.2.0" }],
    parents: [
      {
        name: "consumer",
        version: "5.0.0",
        dependencies: { "some-pkg": "^1.2.0" },
      },
    ],
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /R-OverridesStale: 1 stale override/);
    assert.match(result.stderr, /some-pkg@<1\.0\.0/);
  } finally {
    h.cleanup();
  }
});

test("allowlisted stale override passes", () => {
  // Arrange
  const h = mkHarness({
    overrides: { "legacy-pkg@<2.0.0": ">=2.0.1" },
    lockSnapshots: [{ name: "legacy-pkg", version: "2.5.0" }],
    parents: [
      {
        name: "consumer",
        version: "1.0.0",
        dependencies: { "legacy-pkg": "^2.5.0" },
      },
    ],
    allowlist:
      "- `legacy-pkg@<2.0.0` — Why kept: defensive pin for CVE-XXXX-YYYY pending audit\n",
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /1 total — 0 required, 1 allowlisted, 0 stale/);
  } finally {
    h.cleanup();
  }
});

test("malformed allowlist row missing 'Why kept' fails with R-OverridesStale", () => {
  // Arrange
  const h = mkHarness({
    overrides: { "legacy-pkg@<2.0.0": ">=2.0.1" },
    lockSnapshots: [{ name: "legacy-pkg", version: "2.5.0" }],
    parents: [
      {
        name: "consumer",
        version: "1.0.0",
        dependencies: { "legacy-pkg": "^2.5.0" },
      },
    ],
    // No "Why kept" justification on the row.
    allowlist: "- `legacy-pkg@<2.0.0` — defensive pin pending audit\n",
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /missing "Why kept" annotation/);
  } finally {
    h.cleanup();
  }
});

test("absent pnpm.overrides field exits 0 silently", () => {
  // Arrange
  const root = realpathSync(
    mkdtempSync(join(tmpdir(), "kaiord-overrides-stale-test-"))
  );
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(join(root, "scripts", "check-overrides-stale.mjs"), SCRIPT_SRC);
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ name: "fixture", private: true }, null, 2)
  );

  // Act
  const result = spawnSync(
    process.execPath,
    [join(root, "scripts", "check-overrides-stale.mjs")],
    { cwd: root, encoding: "utf8" }
  );

  // Assert
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(result.stdout.trim(), "");
    assert.equal(result.stderr.trim(), "");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("empty pnpm.overrides object exits 0 silently", () => {
  // Arrange
  const root = realpathSync(
    mkdtempSync(join(tmpdir(), "kaiord-overrides-stale-test-"))
  );
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(join(root, "scripts", "check-overrides-stale.mjs"), SCRIPT_SRC);
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify(
      { name: "fixture", private: true, pnpm: { overrides: {} } },
      null,
      2
    )
  );

  // Act
  const result = spawnSync(
    process.execPath,
    [join(root, "scripts", "check-overrides-stale.mjs")],
    { cwd: root, encoding: "utf8" }
  );

  // Assert
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(result.stdout.trim(), "");
    assert.equal(result.stderr.trim(), "");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("missing node_modules/.pnpm tree fails closed with no-network diagnostic", () => {
  // Arrange — overrides present, lockfile present, but no install tree on disk.
  const root = realpathSync(
    mkdtempSync(join(tmpdir(), "kaiord-overrides-stale-test-"))
  );
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(join(root, "scripts", "check-overrides-stale.mjs"), SCRIPT_SRC);
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify(
      {
        name: "fixture",
        private: true,
        pnpm: { overrides: { "qs@<6.14.2": ">=6.14.2" } },
      },
      null,
      2
    )
  );
  writeFileSync(
    join(root, "pnpm-lock.yaml"),
    "lockfileVersion: '9.0'\n\npackages:\n  qs@6.15.0:\n    resolution: {integrity: sha512-fake}\n"
  );

  // Act
  const result = spawnSync(
    process.execPath,
    [join(root, "scripts", "check-overrides-stale.mjs")],
    { cwd: root, encoding: "utf8" }
  );

  // Assert
  try {
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /no-network fail-closed/);
    assert.match(result.stderr, /node_modules\/\.pnpm missing/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("missing pnpm-lock.yaml also fails closed with no-network diagnostic", () => {
  // Arrange
  const root = realpathSync(
    mkdtempSync(join(tmpdir(), "kaiord-overrides-stale-test-"))
  );
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, "node_modules", ".pnpm"), { recursive: true });
  writeFileSync(join(root, "scripts", "check-overrides-stale.mjs"), SCRIPT_SRC);
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify(
      {
        name: "fixture",
        private: true,
        pnpm: { overrides: { "qs@<6.14.2": ">=6.14.2" } },
      },
      null,
      2
    )
  );

  // Act
  const result = spawnSync(
    process.execPath,
    [join(root, "scripts", "check-overrides-stale.mjs")],
    { cwd: root, encoding: "utf8" }
  );

  // Assert
  try {
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /no-network fail-closed/);
    assert.match(result.stderr, /pnpm-lock\.yaml missing/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("orphan allowlist entry (override key absent) fails", () => {
  // Arrange — allowlist names a key that doesn't exist in overrides.
  const h = mkHarness({
    overrides: { "qs@<6.14.2": ">=6.14.2" },
    lockSnapshots: [{ name: "qs", version: "6.15.0" }],
    parents: [
      {
        name: "body-parser",
        version: "2.2.2",
        dependencies: { qs: "^6.14.0" },
      },
    ],
    allowlist:
      "- `nonexistent-pkg@<1.0.0` — Why kept: stale entry left after the override was removed\n",
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 1, result.stdout);
    assert.match(
      result.stderr,
      /allowlist entry `nonexistent-pkg@<1\.0\.0` does not match any current override key/
    );
  } finally {
    h.cleanup();
  }
});

test("override with no transitive parent is treated as stale", () => {
  // Arrange — override targets a package that no transitive dep pulls.
  const h = mkHarness({
    overrides: { "ghost-pkg@<1.0.0": ">=1.0.1" },
    lockSnapshots: [],
    parents: [],
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 1, result.stdout);
    assert.match(
      result.stderr,
      /no transitive dep on ghost-pkg — override is dead weight/
    );
  } finally {
    h.cleanup();
  }
});

test("scoped-package override key parses correctly", () => {
  // Arrange
  const h = mkHarness({
    overrides: { "@scope/pkg@<1.0.0": ">=1.0.1" },
    lockSnapshots: [{ name: "@scope/pkg", version: "1.2.0" }],
    parents: [
      {
        name: "consumer",
        version: "5.0.0",
        dependencies: { "@scope/pkg": "^0.9.0" },
      },
    ],
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /1 total — 1 required, 0 allowlisted, 0 stale/);
  } finally {
    h.cleanup();
  }
});
