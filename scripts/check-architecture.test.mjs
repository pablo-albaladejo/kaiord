// Tests for scripts/check-architecture.mjs using node:test.

import { strict as assert } from "node:assert";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, test } from "node:test";

import { CORE_ADAPTER_ALLOWLIST } from "./architecture.vocab.mjs";
import { ALLOWLIST, runCheck } from "./check-architecture.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const REAL_PACKAGES_ROOT = join(REPO_ROOT, "packages");
const SKILL_MD_PATH = join(
  REPO_ROOT,
  ".claude",
  "skills",
  "guidelines",
  "architecture-hexagonal",
  "SKILL.md"
);

let sandbox;

function write(rel, body = "") {
  const abs = join(sandbox, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body, "utf8");
}

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), "check-architecture-"));
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe("R-ArchLeftward (cross-layer imports)", () => {
  test("domain → adapters is rejected", () => {
    write("core/src/domain/x.ts", "import { y } from '../adapters/foo';\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
    assert.equal(v[0].rule, "R-ArchLeftward");
  });

  test("domain → application is rejected", () => {
    write("core/src/domain/x.ts", "import { y } from '../application/foo';\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
    assert.equal(v[0].rule, "R-ArchLeftward");
  });

  test("ports → application is rejected", () => {
    write(
      "core/src/ports/x.ts",
      "import type { Y } from '../application/foo';\n"
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.ok(v.some((x) => x.rule === "R-ArchLeftward"));
  });

  test("application → adapters is rejected", () => {
    write(
      "core/src/application/x.ts",
      "import { y } from '../adapters/foo';\n"
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.ok(v.some((x) => x.rule === "R-ArchLeftward"));
  });

  test("domain → sibling file inside domain/ is allowed", () => {
    write("core/src/domain/x.ts", "import { y } from './y';\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });
});

describe("R-ArchDomainExt (external libs in domain)", () => {
  test("zod is allowed", () => {
    write("core/src/domain/x.ts", "import { z } from 'zod';\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("non-zod external lib is rejected", () => {
    write("core/src/domain/x.ts", "import { fitsdk } from '@garmin/fitsdk';\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
    assert.equal(v[0].rule, "R-ArchDomainExt");
  });

  test("node: builtin in domain is rejected", () => {
    write("core/src/domain/x.ts", "import { readFileSync } from 'node:fs';\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
    assert.equal(v[0].rule, "R-ArchDomainExt");
  });

  test("@noble/hashes subpath import in domain is allowed", () => {
    write(
      "core/src/domain/hash/x.ts",
      "import { sha256 } from '@noble/hashes/sha2';\n"
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("allowlist entries do not match prefix-sharing package names", () => {
    write(
      "core/src/domain/x.ts",
      "import { evil } from '@noble/hashes-evil';\n"
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
    assert.equal(v[0].rule, "R-ArchDomainExt");
  });
});

describe("protocol layer (governed like domain)", () => {
  test("zod in protocol/ is allowed", () => {
    write("core/src/protocol/x.ts", "import { z } from 'zod';\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("non-allowlisted external lib in protocol/ is rejected", () => {
    write("core/src/protocol/x.ts", "import { y } from 'fast-xml-parser';\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
    assert.equal(v[0].rule, "R-ArchDomainExt");
  });

  test("protocol → adapters is rejected", () => {
    write("core/src/protocol/x.ts", "import { y } from '../adapters/foo';\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
    assert.equal(v[0].rule, "R-ArchLeftward");
  });

  test("domain → protocol is rejected", () => {
    write("core/src/domain/x.ts", "import { y } from '../protocol/foo';\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
    assert.equal(v[0].rule, "R-ArchLeftward");
  });
});

describe("R-ArchCoreSrcDirs (undeclared core/src directories)", () => {
  test("undeclared top-level directory under core/src is rejected", () => {
    write("core/src/rogue/x.ts", "export type Foo = number;\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
    assert.equal(v[0].rule, "R-ArchCoreSrcDirs");
    assert.ok(v[0].file.includes("rogue"));
  });

  test("loose files directly under core/src are allowed", () => {
    write("core/src/index.ts", "export {};\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("freshness invariant: real packages/core/src/ matches CORE_SRC_ALLOWLIST", () => {
    const v = runCheck();
    const dirViolations = v.filter((x) => x.rule === "R-ArchCoreSrcDirs");
    assert.deepEqual(
      dirViolations,
      [],
      `Unexpected R-ArchCoreSrcDirs violations:\n${dirViolations
        .map((x) => `  - ${x.file}: ${x.detail}`)
        .join("\n")}`
    );
  });
});

describe("R-ArchAppPure (external libs in application)", () => {
  test("relative ../domain is allowed", () => {
    write(
      "core/src/application/x.ts",
      "import type { K } from '../domain/types';\n"
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("external lib import is rejected", () => {
    write("core/src/application/x.ts", "import { z } from 'zod';\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
    assert.equal(v[0].rule, "R-ArchAppPure");
  });

  test("@kaiord/* workspace dep is allowed (will be governed by R-ArchPackageDeps)", () => {
    write(
      "core/src/application/x.ts",
      "import type { Logger } from '@kaiord/core/ports';\n"
    );

    const v = runCheck({ packagesRoot: sandbox });

    // Layer-rule guard does not flag workspace deps inside application;
    // package-deps guard handles that separately.
    assert.equal(v.length, 0);
  });
});

describe("R-ArchPortPure (runtime code in ports)", () => {
  test("type-only ports/ file is allowed", () => {
    write(
      "core/src/ports/logger.ts",
      "export type Logger = { info: (msg: string) => void };\n"
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("ports/ file with runtime const is rejected", () => {
    write("core/src/ports/x.ts", "export const FOO = 1;\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.ok(v.some((x) => x.rule === "R-ArchPortPure"));
  });

  test("ports/ file with runtime function is rejected", () => {
    write("core/src/ports/x.ts", "export function bar() { return 1; }\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.ok(v.some((x) => x.rule === "R-ArchPortPure"));
  });

  test("ports/ file with re-export of types is allowed", () => {
    write("core/src/domain/types.ts", "export type Foo = { x: number };\n");
    write(
      "core/src/ports/index.ts",
      "export type { Foo } from '../domain/types';\n"
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });
});

describe("R-ArchAdapterCross (format adapters)", () => {
  test("fit importing tcx is rejected", () => {
    write("fit/src/x.ts", "import { tcxReader } from '@kaiord/tcx';\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
    assert.equal(v[0].rule, "R-ArchAdapterCross");
  });

  test("garmin-connect importing garmin is allowed", () => {
    write(
      "garmin-connect/src/x.ts",
      "import { gcnReader } from '@kaiord/garmin';\n"
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("fit importing @kaiord/core is allowed", () => {
    write("fit/src/x.ts", "import { type KRD } from '@kaiord/core';\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("fit importing itself (subpath) is allowed", () => {
    write("fit/src/x.ts", "import { y } from './y';\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });
});

describe("R-ArchCoreAdapterAllowlist", () => {
  // This rule depends on listing real subdirectories of
  // packages/core/src/adapters/, so the sandbox-based fixture path
  // requires us to mirror the layout exactly. The freshness test below
  // exercises the rule on the real repo.

  test("freshness invariant: real packages/core/src/adapters/ matches CORE_ADAPTER_ALLOWLIST", () => {
    const v = runCheck();
    const adapterViolations = v.filter(
      (x) => x.rule === "R-ArchCoreAdapterAllowlist"
    );
    assert.deepEqual(
      adapterViolations,
      [],
      `Unexpected R-ArchCoreAdapterAllowlist violations:\n${adapterViolations
        .map((x) => `  - ${x.file}: ${x.detail}`)
        .join("\n")}`
    );
  });
});

describe("R-ArchCoreAmbientTypes", () => {
  test("ambient declaration of vendor SDK in core/ is rejected", () => {
    write(
      "core/src/domain/x.d.ts",
      'declare module "@vendor/sdk" {\n  export class Foo {}\n}\n'
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 1);
    assert.equal(v[0].rule, "R-ArchCoreAmbientTypes");
  });

  test("ambient declaration of file glob (e.g., *.svg) is allowed", () => {
    write(
      "core/src/domain/svg.d.ts",
      'declare module "*.svg" {\n  const url: string;\n  export default url;\n}\n'
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("ambient declaration in adapter package is allowed", () => {
    write(
      "fit/src/types/sdk.d.ts",
      'declare module "@vendor/sdk" {\n  export class Foo {}\n}\n'
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });
});

describe("scope and exclusions", () => {
  test("test files MAY import vitest in domain/", () => {
    write(
      "core/src/domain/x.test.ts",
      "import { describe, test } from 'vitest';\n"
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("test files MAY import @kaiord/core/test-utils in application/", () => {
    write(
      "core/src/application/x.test.ts",
      "import { fixture } from '@kaiord/core/test-utils';\nimport { describe } from 'vitest';\n"
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("JSDoc-only references in non-test domain file do NOT trigger", () => {
    write(
      "core/src/domain/x.ts",
      "/**\n * @see @kaiord/fit\n * @example import { fitReader } from '@kaiord/fit';\n */\nexport type Foo = number;\n"
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("dist/ and node_modules/ are skipped", () => {
    write("core/dist/x.ts", "import { y } from '@bad/lib';\n");
    write("core/node_modules/x.ts", "import { y } from '@bad/lib';\n");

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });

  test("stories.ts files are skipped", () => {
    write(
      "core/src/domain/x.stories.ts",
      "import { Story } from '@storybook/react';\n"
    );

    const v = runCheck({ packagesRoot: sandbox });

    assert.equal(v.length, 0);
  });
});

describe("vocab drift", () => {
  test("CORE_ADAPTER_ALLOWLIST matches the SKILL.md arch-vocab block", () => {
    const skillSrc = readFileSync(SKILL_MD_PATH, "utf8");
    const startMarker = "<!-- arch-vocab:start -->";
    const endMarker = "<!-- arch-vocab:end -->";
    const startIdx = skillSrc.indexOf(startMarker);
    const endIdx = skillSrc.indexOf(endMarker);
    assert.ok(startIdx >= 0, "arch-vocab:start marker missing");
    assert.ok(endIdx > startIdx, "arch-vocab:end marker missing");
    const block = skillSrc.slice(startIdx + startMarker.length, endIdx);
    const fromDoc = block
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("#"));
    assert.deepEqual(
      fromDoc,
      CORE_ADAPTER_ALLOWLIST,
      "arch-vocab block in SKILL.md must equal CORE_ADAPTER_ALLOWLIST in scripts/architecture.vocab.mjs (array-equality, order-sensitive)"
    );
  });
});

describe("smoke", () => {
  test("real packages/ root passes with the seeded allowlist", () => {
    const v = runCheck();
    assert.equal(
      v.length,
      0,
      `Unexpected architecture violations:\n${v
        .map((x) => `  [${x.rule}] ${x.file}: ${x.detail}`)
        .join("\n")}`
    );
  });

  test("ALLOWLIST is empty (drained in PR2 of guidelines-compliance-harden)", () => {
    assert.equal(ALLOWLIST.size, 0);
  });
});
