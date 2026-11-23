// Tests for scripts/check-capability-surfaces.mjs using node:test.
//
// Strategy: a temp tree with a one-Capability catalogue, one owned module,
// the read API and one registry, driven through `runCheck` with a vocab that
// points at it. Each case adds the one file that breaks (or keeps) a rule.

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import { runCheck } from "./check-capability-surfaces.mjs";

const CATALOGUE = `export const CAPABILITY_CATALOGUE = [
  {
    id: "templates",
    owns: { nav: ["library"], routes: ["/library"], settings: [], commands: [], shortcuts: [], tools: [] },
    modules: ["pages/LibraryPage.tsx", "pages/Library/"],
  },
] as const satisfies readonly unknown[];
`;

const VOCAB = {
  CATALOGUE: "lib/catalogue.ts",
  READ_API: ["contexts/capabilities.tsx"],
  ROUTE_TABLE: { file: "lazy.ts", mountedBy: "Routes.tsx", gate: "Gate" },
  REGISTRIES: [
    {
      name: "navigation destinations",
      symbol: "NAV_DESTINATIONS",
      definedIn: ["routing/nav.ts"],
      readers: ["hooks/use-nav.ts"],
    },
  ],
};

let sandbox;
let srcRoot;

function write(rel, body) {
  const abs = join(srcRoot, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body, "utf8");
}

const check = () => runCheck({ srcRoot, vocab: VOCAB });
const rules = () => check().map((v) => `${v.rule} ${v.file}`);

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), "capability-surfaces-"));
  srcRoot = join(sandbox, "src");
  write("lib/catalogue.ts", CATALOGUE);
  write(
    "pages/LibraryPage.tsx",
    'import { Row } from "./Library/Row";\nexport default Row;\n'
  );
  write("pages/Library/Row.tsx", "export const Row = () => null;\n");
  write(
    "contexts/capabilities.tsx",
    "export const useCapabilities = () => null;\n"
  );
  write("routing/nav.ts", "export const NAV_DESTINATIONS = [];\n");
  write(
    "hooks/use-nav.ts",
    'import { useCapabilities } from "../contexts/capabilities";\nimport { NAV_DESTINATIONS } from "../routing/nav";\nexport const useNav = () => [useCapabilities, NAV_DESTINATIONS];\n'
  );
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe("check-capability-surfaces", () => {
  test("should pass on the real Kaiord App tree", () => {
    // Arrange — the real tree and vocab

    // Act
    const violations = runCheck();

    // Assert
    assert.deepEqual(violations, []);
  });

  test("should pass on a tree where every surface goes through the read API", () => {
    // Arrange — the sandbox as built

    // Act
    const violations = check();

    // Assert
    assert.deepEqual(violations, []);
  });

  test("should fail a screen that imports a Capability's module without the read API", () => {
    // Arrange
    write(
      "pages/Editor.tsx",
      'import { Row } from "./Library/Row";\nexport const E = Row;\n'
    );

    // Act
    const found = rules();

    // Assert
    assert.deepEqual(found, [
      "R-CapabilityModuleThroughReadApi pages/Editor.tsx",
    ]);
  });

  test("should pass a screen that imports a Capability's module through the read API", () => {
    // Arrange
    write(
      "pages/Editor.tsx",
      'import { useCapabilities } from "../contexts/capabilities";\nimport { Row } from "@/pages/Library/Row";\nexport const E = [Row, useCapabilities];\n'
    );

    // Act
    const found = rules();

    // Assert
    assert.deepEqual(found, []);
  });

  test("should count a dynamic import of a Capability's page", () => {
    // Arrange
    write("lazy.ts", 'export const P = () => import("./pages/LibraryPage");\n');

    // Act
    const found = rules();

    // Assert
    assert.deepEqual(found, ["R-CapabilityModuleThroughReadApi lazy.ts"]);
  });

  test("should exempt the route table while the route switch is inside the gate", () => {
    // Arrange
    write("lazy.ts", 'export const P = () => import("./pages/LibraryPage");\n');
    write("Routes.tsx", "export const R = () => <Gate><Switch /></Gate>;\n");

    // Act
    const found = rules();

    // Assert
    assert.deepEqual(found, []);
  });

  test("should fail a link that spells a Capability's route", () => {
    // Arrange
    write(
      "lib/checklist.ts",
      'export const href = "/library";\nexport const q = `/library?date=${1}`;\n'
    );

    // Act
    const found = rules();

    // Assert
    assert.deepEqual(found, [
      "R-CapabilityRouteLiteral lib/checklist.ts",
      "R-CapabilityRouteLiteral lib/checklist.ts",
    ]);
  });

  test("should not mistake a path that only shares the prefix, or a comment, for the route", () => {
    // Arrange
    write(
      "lib/other.ts",
      '// see "/library"\nexport const a = "/library-old";\n'
    );

    // Act
    const found = rules();

    // Assert
    assert.deepEqual(found, []);
  });

  test("should fail a registry read outside its gate", () => {
    // Arrange
    write(
      "components/Bar.tsx",
      'import { NAV_DESTINATIONS } from "../routing/nav";\nexport const B = NAV_DESTINATIONS;\n'
    );

    // Act
    const found = rules();

    // Assert
    assert.deepEqual(found, ["R-CapabilityRegistryGate components/Bar.tsx"]);
  });

  test("should fail a gate reader that does not import the read API", () => {
    // Arrange
    write(
      "hooks/use-nav.ts",
      'import { NAV_DESTINATIONS } from "../routing/nav";\nexport const useNav = () => NAV_DESTINATIONS;\n'
    );

    // Act
    const found = rules();

    // Assert
    assert.deepEqual(found, ["R-CapabilityRegistryGate hooks/use-nav.ts"]);
  });

  test("should fail a declared reader that no longer names its registry", () => {
    // Arrange
    write(
      "hooks/use-nav.ts",
      'import { useCapabilities } from "../contexts/capabilities";\nexport const useNav = useCapabilities;\n'
    );

    // Act
    const found = rules();

    // Assert
    assert.deepEqual(found, ["R-CapabilityRegistryGate hooks/use-nav.ts"]);
  });

  test("should fail a declared module that is missing from disk", () => {
    // Arrange
    rmSync(join(srcRoot, "pages", "LibraryPage.tsx"));

    // Act
    const found = rules();

    // Assert
    assert.deepEqual(found, [
      "R-CapabilityModuleThroughReadApi pages/LibraryPage.tsx",
    ]);
  });

  test("should fail a catalogue that parses to no Capability", () => {
    // Arrange
    write("lib/catalogue.ts", "export const CAPABILITY_CATALOGUE = [];\n");

    // Act
    const found = rules();

    // Assert
    assert.deepEqual(found, ["R-CapabilityCatalogue lib/catalogue.ts"]);
  });
});
