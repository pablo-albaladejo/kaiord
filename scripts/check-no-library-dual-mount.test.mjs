// Tests for scripts/check-no-library-dual-mount.mjs using node:test.
//
// Strategy: spin up a temp tree mirroring the SPA src layout (with the
// Library content component present) and drive `runCheck` against it.
// Cover the clean tree, relative / alias / dynamic / re-export
// importers outside the canonical mount, the mount and allowlist
// exemptions, and the inert-path failure when a watched path is missing.

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, test } from "node:test";

import {
  ALLOWLIST,
  CANONICAL_MOUNT,
  runCheck,
} from "./check-no-library-dual-mount.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const MOUNT_IN_SRC = CANONICAL_MOUNT.replace(
  "packages/workout-spa-editor/src/",
  ""
);

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
  write(
    "components/pages/Library/LibraryContent.tsx",
    "export const LibraryContent = () => null;\n"
  );
  write(
    MOUNT_IN_SRC,
    'import { LibraryContent } from "./Library/LibraryContent";\nexport const LibraryPage = LibraryContent;\n'
  );
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe("check-no-library-dual-mount", () => {
  test("should pass on the real SPA tree", () => {
    // Arrange — the real tree, where only LibraryPage mounts the content

    // Act
    const result = runCheck();

    // Assert
    assert.deepEqual(result, { missing: [], violations: [] });
  });

  test("should let the canonical mount import the content component", () => {
    // Arrange — beforeEach writes LibraryPage importing LibraryContent

    // Act
    const result = runCheck({ srcRoot });

    // Assert
    assert.deepEqual(result, { missing: [], violations: [] });
  });

  test("should flag a relative import from another component", () => {
    // Arrange
    write(
      "components/templates/MainLayout/StealthLibrary.tsx",
      'import { LibraryContent } from "../../pages/Library/LibraryContent";\nexport const x = LibraryContent;\n'
    );

    // Act
    const { violations } = runCheck({ srcRoot });

    // Assert
    assert.equal(violations.length, 1);
    assert.match(violations[0].file, /StealthLibrary\.tsx$/);
    assert.equal(violations[0].spec, "../../pages/Library/LibraryContent");
  });

  test("should flag an @/ alias import with an extension", () => {
    // Arrange
    write(
      "components/foo/foo.tsx",
      'import { LibraryContent } from "@/components/pages/Library/LibraryContent.tsx";\nexport const x = LibraryContent;\n'
    );

    // Act
    const { violations } = runCheck({ srcRoot });

    // Assert
    assert.equal(violations.length, 1);
  });

  test("should flag a dynamic import and a re-export", () => {
    // Arrange
    write(
      "components/foo/lazy-bad.tsx",
      'export const x = () => import("../pages/Library/LibraryContent");\n'
    );
    write(
      "components/pages/barrel.ts",
      'export { LibraryContent } from "./Library/LibraryContent";\n'
    );

    // Act
    const { violations } = runCheck({ srcRoot });

    // Assert
    assert.equal(violations.length, 2);
  });

  test("should ignore sibling Library modules", () => {
    // Arrange — only the content component is restricted
    write(
      "components/pages/Whatever.tsx",
      'import { LibraryEmpty } from "./Library/LibraryEmpty";\nexport const x = LibraryEmpty;\n'
    );

    // Act
    const result = runCheck({ srcRoot });

    // Assert
    assert.deepEqual(result, { missing: [], violations: [] });
  });

  test("should skip an allowlisted importer", () => {
    // Arrange — exercise the allowlist inside the sandbox so the real
    // tree is never written to.
    write(
      "components/pages/library-page-fixture.tsx",
      'import { LibraryContent } from "./Library/LibraryContent";\nexport const x = LibraryContent;\n'
    );
    const allowlistKey = `${relative(REPO_ROOT, srcRoot).replaceAll("\\", "/")}/components/pages/library-page-fixture.tsx`;
    ALLOWLIST.add(allowlistKey);
    try {
      // Act
      const { violations } = runCheck({ srcRoot });

      // Assert
      assert.deepEqual(violations, []);
    } finally {
      ALLOWLIST.delete(allowlistKey);
    }
  });

  test("should report a SUSPECT path that no longer exists", () => {
    // Arrange — the content component was moved without updating the guard
    const suspectPaths = ["components/pages/Library/MovedAway"];

    // Act
    const { missing } = runCheck({ srcRoot, suspectPaths });

    // Assert
    assert.deepEqual(missing, suspectPaths);
  });

  test("should report a canonical mount that no longer exists", () => {
    // Arrange — LibraryPage was moved without updating the guard
    rmSync(join(srcRoot, MOUNT_IN_SRC));

    // Act
    const { missing } = runCheck({ srcRoot });

    // Assert
    assert.deepEqual(missing, [MOUNT_IN_SRC]);
  });
});
