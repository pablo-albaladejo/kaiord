// node:test suite for check-ci-fanout-invariants.mjs.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCheck } from "./check-ci-fanout-invariants.mjs";

const POST_FANOUT_CI = `
on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    steps:
      - run: echo detect

  build:
    runs-on: ubuntu-latest
    needs: detect-changes
    steps:
      - run: pnpm -r build

  lint:
    runs-on: ubuntu-latest
    needs: [detect-changes, build]
    if: needs.detect-changes.outputs.should-test == 'true'
    steps:
      - uses: ./.github/actions/consume-build-artifacts
      - run: pnpm lint

  typecheck:
    runs-on: ubuntu-latest
    needs: [detect-changes, build]
    if: needs.detect-changes.outputs.should-test == 'true'
    steps:
      - uses: ./.github/actions/consume-build-artifacts

  test:
    runs-on: ubuntu-latest
    needs: [detect-changes, build]
    if: needs.detect-changes.outputs.should-test == 'true'
    steps:
      - uses: ./.github/actions/consume-build-artifacts

  test-cli:
    runs-on: ubuntu-latest
    needs: [detect-changes, build]
    if: needs.detect-changes.outputs.should-test == 'true'
    steps:
      - uses: ./.github/actions/consume-build-artifacts

  test-frontend:
    runs-on: ubuntu-latest
    needs: [detect-changes, build]
    if: needs.detect-changes.outputs.should-test == 'true'
    steps:
      - uses: ./.github/actions/consume-build-artifacts

  round-trip:
    runs-on: ubuntu-latest
    needs: [detect-changes, build]
    if: needs.detect-changes.outputs.should-test == 'true'
    steps:
      - uses: ./.github/actions/consume-build-artifacts

  e2e-frontend:
    runs-on: ubuntu-latest
    needs: [detect-changes, build]
    if: needs.detect-changes.outputs.should-test == 'true'
    steps:
      - uses: ./.github/actions/consume-build-artifacts

  e2e-prod-base:
    runs-on: ubuntu-latest
    needs: [detect-changes, build]
    if: needs.detect-changes.outputs.should-test == 'true'
    steps:
      - uses: ./.github/actions/consume-build-artifacts

  check-links:
    runs-on: ubuntu-latest
    steps:
      - run: lychee

  notify-failure:
    runs-on: ubuntu-latest
    needs: [build, lint, test]
    if: always()
    steps:
      - run: echo notify
`;

function withTmpYml(yml) {
  const dir = mkdtempSync(join(tmpdir(), "ci-fanout-"));
  const path = join(dir, "ci.yml");
  writeFileSync(path, yml);
  return {
    path,
    cleanup() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

test("(a) post-rollout ci.yml passes", () => {
  const t = withTmpYml(POST_FANOUT_CI);
  try {
    const violations = runCheck({ ciPath: t.path });
    assert.equal(violations.length, 0);
  } finally {
    t.cleanup();
  }
});

test("(b) injecting always() into lint's if: fails", () => {
  const broken = POST_FANOUT_CI.replace(
    "  lint:\n    runs-on: ubuntu-latest\n    needs: [detect-changes, build]\n    if: needs.detect-changes.outputs.should-test == 'true'",
    "  lint:\n    runs-on: ubuntu-latest\n    needs: [detect-changes, build]\n    if: always() && needs.detect-changes.outputs.should-test == 'true'"
  );
  const t = withTmpYml(broken);
  try {
    const violations = runCheck({ ciPath: t.path });
    assert.ok(
      violations.some((v) => /'lint'/.test(v.detail) && /always/.test(v.detail))
    );
  } finally {
    t.cleanup();
  }
});

test("(c) removing build from test's needs: fails", () => {
  const broken = POST_FANOUT_CI.replace(
    "  test:\n    runs-on: ubuntu-latest\n    needs: [detect-changes, build]",
    "  test:\n    runs-on: ubuntu-latest\n    needs: [detect-changes]"
  );
  const t = withTmpYml(broken);
  try {
    const violations = runCheck({ ciPath: t.path });
    assert.ok(
      violations.some(
        (v) => /'test'/.test(v.detail) && /'build' in needs/.test(v.detail)
      )
    );
  } finally {
    t.cleanup();
  }
});

test("(d) adding build to check-links fails", () => {
  const broken = POST_FANOUT_CI.replace(
    "  check-links:\n    runs-on: ubuntu-latest",
    "  check-links:\n    runs-on: ubuntu-latest\n    needs: [build]"
  );
  const t = withTmpYml(broken);
  try {
    const violations = runCheck({ ciPath: t.path });
    assert.ok(
      violations.some(
        (v) =>
          /'check-links'/.test(v.detail) &&
          /must NOT include 'build'/.test(v.detail)
      )
    );
  } finally {
    t.cleanup();
  }
});

test("(e) notify-failure with always() and build in needs passes (whitelist)", () => {
  const t = withTmpYml(POST_FANOUT_CI);
  try {
    const violations = runCheck({ ciPath: t.path });
    const notifyViolations = violations.filter((v) =>
      /notify-failure/.test(v.detail)
    );
    assert.equal(notifyViolations.length, 0);
  } finally {
    t.cleanup();
  }
});

test("(f) injecting pull_request_target into on: fails", () => {
  const broken = POST_FANOUT_CI.replace(
    "on:\n  pull_request:",
    "on:\n  pull_request_target:\n    types: [opened]\n  pull_request:"
  );
  const t = withTmpYml(broken);
  try {
    const violations = runCheck({ ciPath: t.path });
    assert.ok(violations.some((v) => /pull_request_target/.test(v.detail)));
  } finally {
    t.cleanup();
  }
});

test("(g) consumer with pnpm -r build step fails", () => {
  const broken = POST_FANOUT_CI.replace(
    "  lint:\n    runs-on: ubuntu-latest\n    needs: [detect-changes, build]\n    if: needs.detect-changes.outputs.should-test == 'true'\n    steps:\n      - uses: ./.github/actions/consume-build-artifacts\n      - run: pnpm lint",
    "  lint:\n    runs-on: ubuntu-latest\n    needs: [detect-changes, build]\n    if: needs.detect-changes.outputs.should-test == 'true'\n    steps:\n      - uses: ./.github/actions/consume-build-artifacts\n      - run: pnpm -r build\n      - run: pnpm lint"
  );
  const t = withTmpYml(broken);
  try {
    const violations = runCheck({ ciPath: t.path });
    assert.ok(
      violations.some(
        (v) => /'lint'/.test(v.detail) && /pnpm -r build/.test(v.detail)
      )
    );
  } finally {
    t.cleanup();
  }
});
