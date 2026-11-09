import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  ALLOWLIST_PACKAGE_ROOT,
  BOUNDARIES_ALLOWLIST,
  BOUNDARIES_ALLOWLIST_MAX,
  boundariesAllowlistPaths,
} from "./boundaries-allowlist.mjs";
import { baseAllowlistFiles } from "./boundaries-allowlist-base.mjs";
import { checkBoundariesAllowlist } from "./check-boundaries-allowlist.mjs";

const sandboxes = [];

/** Builds a throwaway repo root containing only the given files. */
function sandbox(files) {
  const root = mkdtempSync(join(tmpdir(), "boundaries-allowlist-"));
  sandboxes.push(root);
  for (const [rel, body] of Object.entries(files)) {
    const abs = join(root, ALLOWLIST_PACKAGE_ROOT, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, body);
  }
  return root;
}

after(() => {
  for (const root of sandboxes) rmSync(root, { recursive: true, force: true });
});

describe("boundaries allowlist", () => {
  it("should hold the shrink-only invariant against the real repo", () => {
    // Arrange
    const expected = [];

    // Act
    const problems = checkBoundariesAllowlist();

    // Assert
    assert.deepEqual(problems, expected);
  });

  it("should never exceed the pinned high-water mark", () => {
    // Arrange
    const max = BOUNDARIES_ALLOWLIST_MAX;

    // Act
    const actual = BOUNDARIES_ALLOWLIST.length;

    // Assert
    assert.ok(
      actual <= max,
      `allowlist has ${actual} entries but the ceiling is ${max}; it is shrink-only`
    );
  });

  it("should give every parked entry a substantive reason", () => {
    // Arrange
    const entries = BOUNDARIES_ALLOWLIST;

    // Act
    const missing = entries.filter(
      (e) => !e.reason || e.reason.trim().length < 40
    );

    // Assert
    assert.deepEqual(missing, []);
  });

  it("should expose repo-root-relative paths for eslint ignores", () => {
    // Arrange
    const prefix = `${ALLOWLIST_PACKAGE_ROOT}/`;

    // Act
    const paths = boundariesAllowlistPaths();

    // Assert
    assert.ok(paths.length === BOUNDARIES_ALLOWLIST.length);
    assert.ok(paths.every((p) => p.startsWith(prefix)));
  });

  it("should reject an entry whose file no longer imports adapters", () => {
    // Arrange
    const files = Object.fromEntries(
      BOUNDARIES_ALLOWLIST.map((e) => [
        e.file,
        e.file === BOUNDARIES_ALLOWLIST[0].file
          ? "export const clean = 1;\n"
          : 'import { db } from "../adapters/dexie/dexie-database";\n',
      ])
    );
    const root = sandbox(files);

    // Act
    const problems = checkBoundariesAllowlist(root);

    // Assert
    assert.equal(problems.length, 1);
    assert.match(problems[0], /no longer imports adapters/);
  });

  it("should reject an entry whose file was deleted", () => {
    // Arrange
    const files = Object.fromEntries(
      BOUNDARIES_ALLOWLIST.slice(1).map((e) => [
        e.file,
        'import { db } from "../adapters/dexie/dexie-database";\n',
      ])
    );
    const root = sandbox(files);

    // Act
    const problems = checkBoundariesAllowlist(root);

    // Assert
    assert.equal(problems.length, 1);
    assert.match(problems[0], /no longer exists/);
  });
});

/** Every real entry importing adapters/, with `override` replacing some bodies. */
const filesWith = (override) =>
  Object.fromEntries(
    BOUNDARIES_ALLOWLIST.map((e) => [
      e.file,
      override[e.file] ??
        'import { db } from "../adapters/dexie/dexie-database";\n',
    ])
  );

describe("boundaries allowlist import recognition", () => {
  const first = BOUNDARIES_ALLOWLIST[0].file;

  it("should accept an entry that reaches adapters only through a dynamic import", () => {
    // Arrange
    const root = sandbox(
      filesWith({
        [first]: 'const load = () => import("../adapters/dexie/db");\n',
      })
    );

    // Act
    const problems = checkBoundariesAllowlist(root);

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should accept an entry that reaches adapters only through a side-effect import", () => {
    // Arrange
    const root = sandbox(
      filesWith({ [first]: 'import "../adapters/setup";\n' })
    );

    // Act
    const problems = checkBoundariesAllowlist(root);

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should treat an entry whose only adapters import is commented out as stale", () => {
    // Arrange
    const root = sandbox(
      filesWith({
        [first]:
          '// import { db } from "../adapters/dexie/db";\n' +
          '/* import "../adapters/setup"; */\nexport const x = 1;\n',
      })
    );

    // Act
    const problems = checkBoundariesAllowlist(root);

    // Assert
    assert.equal(problems.length, 1);
    assert.match(problems[0], /no longer imports adapters/);
  });
});

describe("boundaries allowlist merge-base ratchet", () => {
  it("should reject a swapped-in entry that keeps the count under the max", () => {
    // Arrange
    const added = "src/components/zz-new-violation.ts";
    const entries = [
      ...BOUNDARIES_ALLOWLIST.slice(1),
      { file: added, reason: BOUNDARIES_ALLOWLIST[0].reason },
    ];
    const root = sandbox({
      ...filesWith({}),
      [added]: 'import { db } from "../adapters/dexie/db";\n',
    });
    const baseFiles = new Set(BOUNDARIES_ALLOWLIST.map((e) => e.file));

    // Act
    const problems = checkBoundariesAllowlist(root, { entries, baseFiles });

    // Assert
    assert.equal(problems.length, 1);
    assert.match(
      problems[0],
      new RegExp(`"${added}" is not in the list at the merge base`)
    );
  });

  it("should accept an entry list that only shrank since the merge base", () => {
    // Arrange
    const entries = BOUNDARIES_ALLOWLIST.slice(1);
    const root = sandbox(filesWith({}));
    const baseFiles = new Set(BOUNDARIES_ALLOWLIST.map((e) => e.file));

    // Act
    const problems = checkBoundariesAllowlist(root, { entries, baseFiles });

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should fail closed when the merge base cannot be resolved", async () => {
    // Arrange
    const git = () => {
      throw Object.assign(new Error("boom"), { stderr: "fatal: no ref\n" });
    };

    // Act
    const base = await baseAllowlistFiles({ root: ".", baseRef: "nope", git });

    // Assert
    assert.equal(base.files, undefined);
    assert.match(base.error, /fatal: no ref.*fails closed/);
  });

  it("should refuse a merge base that is HEAD itself when HEAD is not on origin/main", async () => {
    // Arrange
    const git = (args) => {
      if (args[0] === "merge-base" && args[1] === "--is-ancestor") {
        throw Object.assign(new Error("not ancestor"), { stderr: "" });
      }
      return args[0] === "show"
        ? "export const BOUNDARIES_ALLOWLIST = [];"
        : "abc123\n";
    };

    // Act
    const base = await baseAllowlistFiles({ root: ".", baseRef: "HEAD", git });

    // Assert
    assert.equal(base.files, undefined);
    assert.match(base.error, /merge base with HEAD is HEAD itself/);
  });

  it("should accept a merge base equal to HEAD when HEAD is on origin/main", async () => {
    // Arrange
    const source =
      'export const BOUNDARIES_ALLOWLIST = [{ file: "src/a.ts", reason: "r" }];\n';
    const git = (args) => {
      if (args[1] === "--is-ancestor") return "";
      return args[0] === "show" ? source : "abc123\n";
    };

    // Act
    const base = await baseAllowlistFiles({
      root: ".",
      baseRef: "origin/main",
      git,
    });

    // Assert
    assert.deepEqual([...base.files], ["src/a.ts"]);
  });

  it("should read the parked files from the list at the merge base", async () => {
    // Arrange
    const source =
      'export const BOUNDARIES_ALLOWLIST = [{ file: "src/a.ts", reason: "r" }];\n';
    const git = (args) => (args[0] === "merge-base" ? "abc123\n" : source);

    // Act
    const base = await baseAllowlistFiles({
      root: ".",
      baseRef: "origin/main",
      git,
    });

    // Assert
    assert.deepEqual([...base.files], ["src/a.ts"]);
  });
});

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const CLI_DEPS = [
  "check-boundaries-allowlist.mjs",
  "boundaries-allowlist-base.mjs",
  "check-architecture.mjs",
  "architecture.vocab.mjs",
];
const PKG = "packages/workout-spa-editor";
const REASON_TEXT = "Parked fixture entry with a reason long enough to pass.";
const cleanEnv = () =>
  Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_"))
  );

/** A git repo under a path with spaces, holding a copy of the CLI and a 4-entry list. */
function cliFixture() {
  const root = mkdtempSync(join(tmpdir(), "boundaries cli fixture "));
  sandboxes.push(root);
  mkdirSync(join(root, "scripts"));
  for (const f of CLI_DEPS)
    copyFileSync(join(SCRIPTS, f), join(root, "scripts", f));
  const files = ["src/a.ts", "src/b.ts", "src/c.ts", "src/d.ts"];
  writeFileSync(
    join(root, "scripts/boundaries-allowlist.mjs"),
    `export const BOUNDARIES_ALLOWLIST = ${JSON.stringify(
      files.map((file) => ({ file, reason: REASON_TEXT }))
    )};\nexport const ALLOWLIST_PACKAGE_ROOT = "${PKG}";\n` +
      `export const BOUNDARIES_ALLOWLIST_MAX = 4;\n`
  );
  for (const f of files) {
    mkdirSync(dirname(join(root, PKG, f)), { recursive: true });
    writeFileSync(join(root, PKG, f), 'import { db } from "../adapters/db";\n');
  }
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, env: cleanEnv(), stdio: "pipe" });
  git("init", "-q");
  git("add", "-A");
  git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "base");
  git("update-ref", "refs/remotes/origin/main", "HEAD");
  return { root, files };
}

const runCli = (root, env = {}) =>
  spawnSync(
    process.execPath,
    [join(root, "scripts/check-boundaries-allowlist.mjs")],
    {
      cwd: root,
      encoding: "utf8",
      env: { ...cleanEnv(), ...env },
    }
  );

describe("boundaries allowlist CLI", () => {
  it("should pass from a fixture path with spaces when the ratchet holds", () => {
    // Arrange
    const { root } = cliFixture();

    // Act
    const result = runCli(root);

    // Assert
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /boundaries allowlist OK: 4\/4/);
  });

  it("should exit non-zero and show only the first 3 of 4 stale entries", () => {
    // Arrange
    const { root, files } = cliFixture();
    for (const f of files) writeFileSync(join(root, PKG, f), "export {};\n");

    // Act
    const result = runCli(root);

    // Assert
    assert.equal(result.status, 1);
    assert.match(result.stderr, /failed: 4 problem\(s\)/);
    assert.equal(result.stderr.match(/^ {2}- /gm).length, 3);
    assert.match(result.stderr, /\.\.\. and 1 more\./);
  });

  it("should fail closed when the base ref cannot be resolved", () => {
    // Arrange
    const { root } = cliFixture();

    // Act
    const result = runCli(root, {
      BOUNDARIES_ALLOWLIST_BASE_REF: "no-such-ref",
    });

    // Assert
    assert.equal(result.status, 1);
    assert.match(result.stderr, /merge base with no-such-ref.*fails closed/);
  });
});
