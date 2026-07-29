// Tests for scripts/check-discovery-clock-reset.mjs using node:test.
//
// Strategy: build a temp tree mirroring the SPA src layout and drive
// `runCheck` against it. The cases that matter are the ones that pin the
// guard's OWN discriminants: it must fire on the shape that shipped broken
// (a page test reaching the reader transitively with no reset), and it must
// NOT fire on a suite that only reaches the clock's WRITER — that false
// positive is what would make the guard get worked around instead of obeyed.

import { strict as assert } from "node:assert";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, test } from "node:test";

import { runCheck } from "./check-discovery-clock-reset.mjs";

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

/** The real chain: clock ← reader ← hook ← page, plus the writer branch. */
function scaffold() {
  write(
    "hooks/discovery-clock.ts",
    "const loadedAt = Date.now();\nexport const discoveryStartedAt = () => loadedAt;\nexport const markDiscoveryStarted = () => {};\nexport const resetDiscoveryClock = () => {};\n"
  );
  write(
    "hooks/connections/use-discovery-settled.ts",
    'import { discoveryStartedAt } from "../discovery-clock";\nexport const useDiscoverySettled = () => discoveryStartedAt() > 0;\n'
  );
  write(
    "components/pages/SettingsPage/use-connections-value.ts",
    'import { useDiscoverySettled } from "../../../hooks/connections/use-discovery-settled";\nexport const useConnectionsValue = () => useDiscoverySettled();\n'
  );
  write(
    "components/pages/SettingsPage/SettingsPage.tsx",
    'import { useConnectionsValue } from "./use-connections-value";\nexport const SettingsPage = () => useConnectionsValue();\n'
  );
  // The writer branch — reaches the clock, never measures against it.
  write(
    "hooks/use-bridge-discovery-bootstrap.ts",
    'import { markDiscoveryStarted } from "./discovery-clock";\nexport const useBootstrap = () => markDiscoveryStarted();\n'
  );
  write(
    "App.tsx",
    'import { useBootstrap } from "./hooks/use-bridge-discovery-bootstrap";\nexport const App = () => useBootstrap();\n'
  );
}

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), "discovery-clock-reset-"));
  srcRoot = join(sandbox, "src");
  mkdirSync(srcRoot, { recursive: true });
  scaffold();
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe("check-discovery-clock-reset", () => {
  test("real SPA tree passes (post-impl baseline)", () => {
    if (!existsSync(REAL_SPA_SRC)) return;
    assert.deepEqual(runCheck(), []);
  });

  test("flags a page test that reaches the reader without resetting", () => {
    // The exact shape of the instance this guard exists for: the test imports
    // a page, three static hops from the reader, and never places the clock.
    write(
      "components/pages/SettingsPage/SettingsPage.test.tsx",
      'import { SettingsPage } from "./SettingsPage";\nit("x", () => SettingsPage());\n'
    );

    const violations = runCheck({ srcRoot });

    assert.equal(violations.length, 1);
    assert.match(violations[0].file, /SettingsPage\.test\.tsx$/);
  });

  test("passes once that same test places the clock", () => {
    // The mutation's other half: the guard must fail for the MISSING RESET and
    // for nothing else, so adding only the reset must clear it.
    write(
      "components/pages/SettingsPage/SettingsPage.test.tsx",
      'import { SettingsPage } from "./SettingsPage";\nimport { resetDiscoveryClock } from "../../../hooks/discovery-clock";\nafterEach(() => resetDiscoveryClock());\nit("x", () => SettingsPage());\n'
    );

    assert.deepEqual(runCheck({ srcRoot }), []);
  });

  test("ignores a test that only reaches the clock's writer", () => {
    // `App` stamps the clock but never measures against it. Rooting this guard
    // at discovery-clock.ts instead of at the reader would flag this file and
    // demand a reset that protects nothing.
    write(
      "App.test.tsx",
      'import { App } from "./App";\nit("x", () => App());\n'
    );

    assert.deepEqual(runCheck({ srcRoot }), []);
  });

  test("ignores a test that replaces the reader outright", () => {
    write(
      "components/pages/SettingsPage/SettingsPage.test.tsx",
      'import { SettingsPage } from "./SettingsPage";\nvi.mock("../../../hooks/connections/use-discovery-settled", () => ({ useDiscoverySettled: () => true }));\nit("x", () => SettingsPage());\n'
    );

    assert.deepEqual(runCheck({ srcRoot }), []);
  });

  test("ignores a test that cannot reach the reader at all", () => {
    write("lib/format.ts", "export const format = (s) => s;\n");
    write(
      "lib/format.test.ts",
      'import { format } from "./format";\nit("x", () => format("a"));\n'
    );

    assert.deepEqual(runCheck({ srcRoot }), []);
  });

  test("flags a test importing the reader directly", () => {
    write(
      "hooks/connections/use-discovery-settled.test.ts",
      'import { useDiscoverySettled } from "./use-discovery-settled";\nit("x", () => useDiscoverySettled());\n'
    );

    const violations = runCheck({ srcRoot });

    assert.equal(violations.length, 1);
    assert.match(violations[0].file, /use-discovery-settled\.test\.ts$/);
  });
});
