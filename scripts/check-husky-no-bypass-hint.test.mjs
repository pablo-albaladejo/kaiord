// Tests for scripts/check-husky-no-bypass-hint.mjs using node:test.

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import { runCheck } from "./check-husky-no-bypass-hint.mjs";

let sandbox;

function write(name, body) {
  const abs = join(sandbox, name);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body, "utf8");
}

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), "check-husky-no-bypass-"));
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe("check-husky-no-bypass-hint — REJECT (imperative-voice)", () => {
  test('rejects echo "use --no-verify"', () => {
    write("pre-commit", '#!/bin/sh\necho "use --no-verify to skip"\n');

    const v = runCheck({ huskyDir: sandbox });

    assert.equal(v.length, 1);
    assert.equal(v[0].rule, "R-NoBypassHint");
  });

  test('rejects printf "HUSKY=0 ..."', () => {
    write("pre-commit", '#!/bin/sh\nprintf "HUSKY=0 git commit\\n"\n');

    const v = runCheck({ huskyDir: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects : HUSKY=0 git commit ...", () => {
    write("pre-commit", "#!/bin/sh\n: HUSKY=0 git commit\n");

    const v = runCheck({ huskyDir: sandbox });

    assert.equal(v.length, 1);
  });

  test('rejects eval "HUSKY=0 git commit"', () => {
    write("pre-commit", '#!/bin/sh\neval "HUSKY=0 git commit"\n');

    const v = runCheck({ huskyDir: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects env HUSKY=0 git commit", () => {
    write("pre-commit", "#!/bin/sh\nenv HUSKY=0 git commit\n");

    const v = runCheck({ huskyDir: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects something && HUSKY=0 git commit", () => {
    write(
      "pre-commit",
      '#!/bin/sh\nif true; then true && HUSKY=0 git commit; fi\n'
    );

    const v = runCheck({ huskyDir: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects $(HUSKY=0 git commit)", () => {
    write("pre-commit", '#!/bin/sh\nout=$(HUSKY=0 git commit)\n');

    const v = runCheck({ huskyDir: sandbox });

    assert.equal(v.length, 1);
  });

  test("rejects bare-#-comment WITHOUT negation token (`# use --no-verify`)", () => {
    write("pre-commit", "#!/bin/sh\n# use --no-verify\n");

    const v = runCheck({ huskyDir: sandbox });

    assert.equal(v.length, 1);
  });
});

describe("check-husky-no-bypass-hint — ALLOW (defensive comments)", () => {
  test("allows # NEVER use --no-verify", () => {
    write("pre-commit", "#!/bin/sh\n# NEVER use --no-verify; CI re-runs all\n");

    const v = runCheck({ huskyDir: sandbox });

    assert.equal(v.length, 0);
  });

  test("allows # do not use HUSKY=0", () => {
    write("pre-commit", "#!/bin/sh\n# do not use HUSKY=0\n");

    const v = runCheck({ huskyDir: sandbox });

    assert.equal(v.length, 0);
  });

  test("allows # --no-verify is forbidden", () => {
    write("pre-commit", "#!/bin/sh\n# --no-verify is forbidden\n");

    const v = runCheck({ huskyDir: sandbox });

    assert.equal(v.length, 0);
  });

  test("allows # don't use --no-verify", () => {
    write("pre-commit", "#!/bin/sh\n# don't use --no-verify\n");

    const v = runCheck({ huskyDir: sandbox });

    assert.equal(v.length, 0);
  });

  test("allows # HUSKY=0 is prohibited", () => {
    write("pre-commit", "#!/bin/sh\n# HUSKY=0 is prohibited; the hook MUST run\n");

    const v = runCheck({ huskyDir: sandbox });

    assert.equal(v.length, 0);
  });
});

describe("check-husky-no-bypass-hint — scope", () => {
  test("ignores --no-gpg-sign (out of scope)", () => {
    write("pre-commit", "#!/bin/sh\necho 'use --no-gpg-sign for unsigned'\n");

    const v = runCheck({ huskyDir: sandbox });

    assert.equal(v.length, 0);
  });

  test("ignores files starting with .", () => {
    write(".gitignore", "echo 'use --no-verify'\n");

    const v = runCheck({ huskyDir: sandbox });

    assert.equal(v.length, 0);
  });

  test("ignores the husky internals directory _/", () => {
    write("_/somefile", "echo 'use --no-verify'\n");

    const v = runCheck({ huskyDir: sandbox });

    assert.equal(v.length, 0);
  });

  test("clean .husky/pre-commit produces no violations", () => {
    write(
      "pre-commit",
      "#!/bin/sh\npnpm test:scripts\npnpm test\npnpm -r build\n"
    );

    const v = runCheck({ huskyDir: sandbox });

    assert.equal(v.length, 0);
  });
});
