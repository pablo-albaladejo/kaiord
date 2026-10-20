// Tests for scripts/check-coverage-floors-ratchet.mjs using node:test.
//
// Each case builds a throwaway git repository: the committed tree on `main`
// is the baseline, the working tree is the head the guard reads.

import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { gitEnv, runCheck } from "./check-coverage-floors-ratchet.mjs";

const CI_YML = `jobs:
  test:
    steps:
      - name: Check coverage threshold
        run: |
          case "\${{ matrix.package }}" in
            garmin-bridge|whoop-bridge) THRESHOLD=60 ;;
            *) THRESHOLD=80 ;;
          esac
          node .github/scripts/check-coverage.js ./packages/\${{ matrix.package }}/coverage/coverage-final.json $THRESHOLD
`;
const CHECKER = `const threshold = parseInt(process.argv[3] || "80", 10);\n`;
const CODECOV = `coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 2%
    patch:
      bridges:
        informational: true
`;
const VITEST = `export default {
  test: {
    coverage: {
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
};
`;
const BASELINE = {
  ".github/workflows/ci.yml": CI_YML,
  ".github/scripts/check-coverage.js": CHECKER,
  "codecov.yml": CODECOV,
  "packages/core/vitest.config.ts": VITEST,
};

let repo;

const git = (...args) =>
  execFileSync(
    "git",
    ["-c", "user.email=test@example.com", "-c", "user.name=test"].concat(
      ["-c", "commit.gpgsign=false"],
      args
    ),
    { cwd: repo, encoding: "utf8", stdio: "pipe", env: gitEnv() }
  );

const write = (path, body) => {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), body, "utf8");
};

const edit = (path, from, to) => {
  const text = readFileSync(join(repo, path), "utf8");
  assert.ok(text.includes(from), `fixture ${path} lacks ${from}`);
  write(path, text.replace(from, to));
};

const check = (baseRef = "main") => runCheck({ root: repo, baseRef });

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), "check-coverage-floors-ratchet-"));
  git("init", "-q", "-b", "main");
  for (const [path, body] of Object.entries(BASELINE)) write(path, body);
  git("add", "-A");
  git("commit", "-q", "-m", "baseline");
});

afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
});

describe("PASS — floors held or raised", () => {
  it("should pass when every floor equals the base", () => {
    // Arrange
    // (the working tree is the committed baseline)

    // Act
    const violations = check();

    // Assert
    assert.deepEqual(violations, []);
  });

  it("should pass when floors are raised and a new one is added", () => {
    // Arrange
    edit(".github/workflows/ci.yml", "THRESHOLD=60", "THRESHOLD=70");
    edit("packages/core/vitest.config.ts", "branches: 70", "branches: 85");
    edit("codecov.yml", "target: 80%", "target: 90%");
    write("packages/tcx/vitest.config.ts", VITEST);

    // Act
    const violations = check();

    // Assert
    assert.deepEqual(violations, []);
  });

  it("should pass when a bridge moves from the 60 arm to the default arm", () => {
    // Arrange
    edit(
      ".github/workflows/ci.yml",
      "garmin-bridge|whoop-bridge)",
      "whoop-bridge)"
    );

    // Act
    const violations = check();

    // Assert
    assert.deepEqual(violations, []);
  });
});

describe("FAIL — floors lowered", () => {
  it("should fail when a ci.yml arm is lowered", () => {
    // Arrange
    edit(".github/workflows/ci.yml", "*) THRESHOLD=80", "*) THRESHOLD=75");

    // Act
    const violations = check();

    // Assert
    assert.deepEqual(
      violations.map((v) => [v.kind, v.key, v.detail]),
      [["lowered", ".github/workflows/ci.yml arm *", "80 -> 75"]]
    );
  });

  it("should fail when a vitest threshold is lowered", () => {
    // Arrange
    edit("packages/core/vitest.config.ts", "branches: 70", "branches: 60");

    // Act
    const violations = check();

    // Assert
    assert.deepEqual(
      violations.map((v) => [v.kind, v.key]),
      [["lowered", "packages/core/vitest.config.ts thresholds.branches"]]
    );
  });

  it("should fail when a codecov target is lowered or its threshold raised", () => {
    // Arrange
    edit("codecov.yml", "target: 80%", "target: 70%");
    edit("codecov.yml", "threshold: 2%", "threshold: 5%");

    // Act
    const violations = check();

    // Assert
    assert.deepEqual(
      violations.map((v) => v.kind),
      ["lowered", "loosened"]
    );
  });

  it("should fail when the checker default is lowered", () => {
    // Arrange
    edit(".github/scripts/check-coverage.js", '"80"', '"50"');

    // Act
    const violations = check();

    // Assert
    assert.deepEqual(
      violations.map((v) => v.key),
      [".github/scripts/check-coverage.js default"]
    );
  });
});

describe("FAIL — floors removed", () => {
  it("should fail when a vitest config loses its thresholds block", () => {
    // Arrange
    edit(
      "packages/core/vitest.config.ts",
      "thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },",
      ""
    );

    // Act
    const violations = check();

    // Assert
    assert.equal(violations.length, 4);
    assert.ok(violations.every((v) => v.kind === "removed"));
  });

  it("should fail when a vitest config file is deleted", () => {
    // Arrange
    write("packages/tcx/vitest.config.ts", VITEST);
    git("add", "-A");
    git("commit", "-q", "-m", "second config");
    rmSync(join(repo, "packages/core/vitest.config.ts"));

    // Act
    const violations = check();

    // Assert
    assert.equal(violations.length, 4);
    assert.ok(violations.every((v) => v.key.startsWith("packages/core/")));
  });

  it("should fail when the ci.yml call stops passing $THRESHOLD", () => {
    // Arrange
    edit(
      ".github/workflows/ci.yml",
      "coverage-final.json $THRESHOLD",
      "coverage-final.json 10"
    );

    // Act
    const violations = check();

    // Assert
    assert.ok(violations.length > 0);
    assert.ok(violations.every((v) => v.kind === "removed"));
  });

  it("should fail when a codecov status becomes informational", () => {
    // Arrange
    edit(
      "codecov.yml",
      "threshold: 2%",
      "threshold: 2%\n        informational: true"
    );

    // Act
    const violations = check();

    // Assert
    assert.deepEqual(
      violations.map((v) => v.kind),
      ["removed", "removed"]
    );
  });
});

describe("HOOK ENVIRONMENT", () => {
  it("should read the root repository even when a hook exports GIT_DIR", () => {
    // Arrange
    const decoy = mkdtempSync(join(tmpdir(), "check-coverage-floors-decoy-"));
    execFileSync("git", ["init", "-q", "-b", "main"], {
      cwd: decoy,
      env: gitEnv(),
    });
    const saved = process.env.GIT_DIR;
    process.env.GIT_DIR = join(decoy, ".git");

    // Act
    let violations;
    try {
      violations = check();
    } finally {
      if (saved === undefined) delete process.env.GIT_DIR;
      else process.env.GIT_DIR = saved;
      rmSync(decoy, { recursive: true, force: true });
    }

    // Assert
    assert.deepEqual(violations, []);
  });
});

describe("FAIL CLOSED", () => {
  it("should fail closed when the base ref is unavailable", () => {
    // Arrange
    const missing = "origin/main";

    // Act
    const violations = check(missing);

    // Assert
    assert.equal(violations.length, 1);
    assert.equal(violations[0].kind, "base-unavailable");
    assert.match(violations[0].detail, /fetch-depth: 0/);
  });

  it("should fail closed when a source yields no floor on either side", () => {
    // Arrange
    write("codecov.yml", "coverage: {}\n");
    git("add", "-A");
    git("commit", "-q", "-m", "drop codecov floors");

    // Act
    const violations = check();

    // Assert
    assert.deepEqual(
      violations.map((v) => [v.kind, v.key]),
      [["scan-empty", "codecov.yml"]]
    );
  });
});
