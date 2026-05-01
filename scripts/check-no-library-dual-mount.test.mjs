// Tests for scripts/check-no-library-dual-mount.mjs using node:test.
//
// Strategy: spin up a temp tree mirroring the SPA src layout and
// drive `runCheck` against it. Cover (a) clean tree, (b) regression
// importing the SUSPECT path from outside the allowlist, (c) the
// allowlist exemption, and (d) suffix matching for both the barrel
// path and the modal-wrapper path.

import { strict as assert } from "node:assert";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, test } from "node:test";

import { ALLOWLIST, runCheck } from "./check-no-library-dual-mount.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const REAL_SPA_SRC = join(REPO_ROOT, "packages", "workout-spa-editor", "src");

let sandbox;
let srcRoot;

function write(rel, body) {
  const abs = join(srcRoot, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body, "utf8");
}

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), "no-library-dual-mount-"));
  srcRoot = join(sandbox, "src");
  mkdirSync(srcRoot, { recursive: true });
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe("check-no-library-dual-mount", () => {
  test("real SPA tree passes (post-impl baseline)", () => {
    if (!existsSync(REAL_SPA_SRC)) return;
    const violations = runCheck();
    assert.deepEqual(violations, []);
  });

  test("flags an importer of the WorkoutLibrary modal wrapper", () => {
    // Arrange — a non-allowlisted file imports the WorkoutLibrary
    // content component (the path the deleted modal lived at).
    write(
      "components/templates/MainLayout/StealthLibrary.tsx",
      'import { WorkoutLibrary } from "../../organisms/WorkoutLibrary/WorkoutLibrary";\nexport const x = WorkoutLibrary;\n'
    );

    // Act
    const violations = runCheck({ srcRoot });

    // Assert
    assert.equal(violations.length, 1);
    assert.match(violations[0].file, /StealthLibrary\.tsx$/);
    assert.match(violations[0].spec, /organisms\/WorkoutLibrary\/WorkoutLibrary$/);
  });

  test("flags an importer of the WorkoutLibrary barrel", () => {
    // Arrange
    write(
      "components/foo/foo.tsx",
      'import { WorkoutLibrary } from "../../organisms/WorkoutLibrary";\nexport const x = WorkoutLibrary;\n'
    );

    // Act
    const violations = runCheck({ srcRoot });

    // Assert
    assert.equal(violations.length, 1);
    assert.match(violations[0].spec, /organisms\/WorkoutLibrary$/);
  });

  test("ignores imports of unrelated WorkoutLibrary subpaths", () => {
    // Arrange — components and hooks are reusable atoms; importing
    // them is not a regression. The guard only flags the wrapper /
    // barrel / canonical content component.
    write(
      "components/pages/Whatever.tsx",
      'import { CardBadges } from "../organisms/WorkoutLibrary/components/CardBadges";\nimport { useLibraryFilters } from "../organisms/WorkoutLibrary/hooks/useLibraryFilters";\nexport const x = CardBadges;\n'
    );

    // Act
    const violations = runCheck({ srcRoot });

    // Assert
    assert.deepEqual(violations, []);
  });

  test("dynamic import() of a SUSPECT path is also flagged", () => {
    // Arrange
    write(
      "components/foo/lazy-bad.tsx",
      'export const x = () => import("../../organisms/WorkoutLibrary/WorkoutLibrary");\n'
    );

    // Act
    const violations = runCheck({ srcRoot });

    // Assert
    assert.equal(violations.length, 1);
    assert.match(violations[0].spec, /WorkoutLibrary$/);
  });

  test("allowlisted file may import the SUSPECT path (sandbox)", () => {
    // Arrange — exercise the allowlist mechanism inside a sandbox so
    // we don't write into the real SPA src tree (which would race
    // against other guard tests' real-tree scans under parallel
    // node:test execution).
    write(
      "components/pages/library-page-fixture.tsx",
      'import { WorkoutLibrary } from "../../organisms/WorkoutLibrary/WorkoutLibrary";\nexport const x = WorkoutLibrary;\n'
    );
    const sandboxRel = relative(REPO_ROOT, srcRoot).replaceAll("\\", "/");
    const allowlistKey = `${sandboxRel}/components/pages/library-page-fixture.tsx`;
    ALLOWLIST.add(allowlistKey);
    try {
      // Act
      const violations = runCheck({ srcRoot });

      // Assert — the fixture file MUST NOT be reported.
      const hit = violations.find((v) => v.file === allowlistKey);
      assert.equal(hit, undefined);
    } finally {
      ALLOWLIST.delete(allowlistKey);
    }
  });
});
