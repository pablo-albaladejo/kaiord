// Tests for scripts/check-scripts-orphans.mjs using node:test.
//
// Strategy: a temp-root harness mirrors the expected repo layout
// (scripts/, .github/workflows/, .husky/, .claude/, packages/...)
// and we drive the production script as a child process against
// the harness. This guarantees the test exercises the real CLI and
// the production resolution code (REPO_ROOT relative to script
// location) is unchanged.

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
  resolve(__dirname, "check-scripts-orphans.mjs"),
  "utf8"
);

function mkHarness(prep) {
  const root = realpathSync(
    mkdtempSync(join(tmpdir(), "kaiord-orphans-test-"))
  );
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, ".github", "workflows"), { recursive: true });
  mkdirSync(join(root, ".husky"), { recursive: true });
  mkdirSync(join(root, ".claude"), { recursive: true });
  writeFileSync(join(root, "scripts", "check-scripts-orphans.mjs"), SCRIPT_SRC);
  // Seed package.json so the lint script itself is wired (otherwise it
  // self-detects as an orphan when scanning its own folder). Test cases
  // that set their own package.json must keep this entry too.
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify(
      {
        scripts: {
          "lint:scripts-orphans": "node scripts/check-scripts-orphans.mjs",
        },
      },
      null,
      2
    ) + "\n"
  );
  writeFileSync(
    join(root, "scripts", "README.md"),
    "# scripts\n\n<!-- manual-tools:start -->\n<!-- manual-tools:end -->\n"
  );
  prep(root);
  return {
    root,
    run() {
      return spawnSync(
        process.execPath,
        [join(root, "scripts", "check-scripts-orphans.mjs")],
        { cwd: root, encoding: "utf8" }
      );
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

function writeScript(root, name, body = "// noop\n") {
  writeFileSync(join(root, "scripts", name), body);
}

// setRootPackage merges with the self-wiring entry already seeded in
// mkHarness so the orphan lint never flags itself.
function setRootPackage(root, extraScripts) {
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify(
      {
        scripts: {
          "lint:scripts-orphans": "node scripts/check-scripts-orphans.mjs",
          ...extraScripts,
        },
      },
      null,
      2
    ) + "\n"
  );
}

test("script wired via root package.json passes", () => {
  // Arrange
  const h = mkHarness((root) => {
    writeScript(root, "foo.mjs");
    setRootPackage(root, { "lint:foo": "node scripts/foo.mjs" });
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /no orphan scripts/);
  } finally {
    h.cleanup();
  }
});

test("script wired via subpackage package.json passes", () => {
  // Arrange
  const h = mkHarness((root) => {
    writeScript(root, "bar.mjs");
    mkdirSync(join(root, "packages", "core"), { recursive: true });
    writeFileSync(
      join(root, "packages", "core", "package.json"),
      JSON.stringify({ scripts: { build: "node scripts/bar.mjs" } }, null, 2)
    );
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    h.cleanup();
  }
});

test("script wired via workflow yml passes", () => {
  // Arrange
  const h = mkHarness((root) => {
    writeScript(root, "baz.mjs");
    writeFileSync(
      join(root, ".github", "workflows", "release.yml"),
      "name: rel\non: push\njobs:\n  go:\n    steps:\n      - run: node scripts/baz.mjs\n"
    );
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    h.cleanup();
  }
});

test("script wired via composite action yml passes", () => {
  // Arrange
  const h = mkHarness((root) => {
    writeScript(root, "act.mjs");
    mkdirSync(join(root, ".github", "actions", "x"), { recursive: true });
    writeFileSync(
      join(root, ".github", "actions", "x", "action.yml"),
      "name: x\nruns:\n  using: composite\n  steps:\n    - run: node scripts/act.mjs\n      shell: bash\n"
    );
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    h.cleanup();
  }
});

test("script wired via husky hook passes", () => {
  // Arrange
  const h = mkHarness((root) => {
    writeScript(root, "qux.sh");
    writeFileSync(
      join(root, ".husky", "pre-commit"),
      "#!/usr/bin/env sh\nbash scripts/qux.sh\n"
    );
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    h.cleanup();
  }
});

test("script wired via claude settings passes", () => {
  // Arrange
  const h = mkHarness((root) => {
    writeScript(root, "claude.sh");
    writeFileSync(
      join(root, ".claude", "settings.json"),
      JSON.stringify(
        {
          hooks: {
            preCommit: {
              command: 'bash "$CLAUDE_PROJECT_DIR"/scripts/claude.sh',
            },
          },
        },
        null,
        2
      )
    );
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    h.cleanup();
  }
});

test("script reachable via transitive import from another scripts/* passes", () => {
  // Arrange
  const h = mkHarness((root) => {
    // helper.mjs is imported by wired.mjs which itself is wired in package.json
    writeScript(root, "helper.mjs", "export const X = 1;\n");
    writeScript(
      root,
      "wired.mjs",
      'import { X } from "./helper.mjs";\nconsole.log(X);\n'
    );
    setRootPackage(root, { "lint:wired": "node scripts/wired.mjs" });
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    h.cleanup();
  }
});

test("script with allowlist entry passes", () => {
  // Arrange
  const h = mkHarness((root) => {
    writeScript(root, "manual.sh");
    writeFileSync(
      join(root, "scripts", "README.md"),
      "# scripts\n\n<!-- manual-tools:start -->\n- `manual.sh` — When to run: before a manual hotfix release.\n<!-- manual-tools:end -->\n"
    );
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    h.cleanup();
  }
});

test("orphan script with no wiring fails", () => {
  // Arrange
  const h = mkHarness((root) => {
    writeScript(root, "orphan.mjs");
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 1);
    assert.match(result.stderr, /orphan\.mjs/);
    assert.match(result.stderr, /R-ScriptsNoOrphans/);
  } finally {
    h.cleanup();
  }
});

test("missing manual-tools markers in README fails", () => {
  // Arrange
  const h = mkHarness((root) => {
    writeFileSync(
      join(root, "scripts", "README.md"),
      "# scripts\nno markers\n"
    );
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 1);
    assert.match(result.stderr, /manual-tools:start/);
  } finally {
    h.cleanup();
  }
});

test("allowlist entry missing 'When to run' fails", () => {
  // Arrange
  const h = mkHarness((root) => {
    writeScript(root, "manual.sh");
    writeFileSync(
      join(root, "scripts", "README.md"),
      "# scripts\n\n<!-- manual-tools:start -->\n- `manual.sh` — runs sometimes\n<!-- manual-tools:end -->\n"
    );
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 1);
    assert.match(result.stderr, /manual\.sh/);
    assert.match(result.stderr, /When to run/);
  } finally {
    h.cleanup();
  }
});

test("excluded subfolders (lib/, cws-api/, fixtures/) are not scanned", () => {
  // Arrange
  const h = mkHarness((root) => {
    mkdirSync(join(root, "scripts", "lib"), { recursive: true });
    mkdirSync(join(root, "scripts", "cws-api"), { recursive: true });
    mkdirSync(join(root, "scripts", "fixtures"), { recursive: true });
    writeFileSync(join(root, "scripts", "lib", "helper.mjs"), "// noop\n");
    writeFileSync(join(root, "scripts", "cws-api", "auth.mjs"), "// noop\n");
    writeFileSync(join(root, "scripts", "fixtures", "data.json"), "{}\n");
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    h.cleanup();
  }
});

test("test-only invariant files (*.test.mjs without sibling .mjs) are skipped", () => {
  // Arrange
  const h = mkHarness((root) => {
    writeFileSync(
      join(root, "scripts", "check-foo.test.mjs"),
      "import { test } from 'node:test';\ntest('x', () => {});\n"
    );
  });

  // Act
  const result = h.run();

  // Assert
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    h.cleanup();
  }
});
