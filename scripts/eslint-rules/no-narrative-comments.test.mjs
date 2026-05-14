import { RuleTester } from "eslint";
import tseslintParser from "@typescript-eslint/parser";
import { test } from "node:test";

import rule from "./no-narrative-comments.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslintParser,
    parserOptions: { ecmaVersion: 2024, sourceType: "module" },
  },
});

test("should enforce no-narrative-comments rule across valid and invalid cases", () => {
  // Arrange
  const cases = {
    valid: [
      // V1 — AAA marker.
      { code: "// Arrange\nconst x = 1;\n" },
      // V2 — eslint-disable directive.
      { code: "// eslint-disable-next-line no-console\nconsole.log(1);\n" },
      // V3 — @param JSDoc.
      { code: "/** @param x the value */\nfunction f(x) { return x; }\n" },
      // V4 — domain invariant JSDoc.
      {
        code: "/** Per-step duration MUST be > 0; see KRD spec. */\nconst MIN = 1;\n",
      },
      // V5 — Dexie changelog synthetic. The rule does NOT fire on bare
      // changelog text; the held-out per-glob override is asserted in
      // the integration test.
      { code: "// v8 — workouts.profile_id added\nconst x = 1;\n" },
      // V6 — CAT-D back-compat carve-out. Mentioning "backwards
      // compatibility" spares the comment per the negative-lookahead.
      {
        code: '// Re-export violation formatters for backwards compatibility\nexport * from "./formatters";\n',
      },
    ],
    invalid: [
      // I1 — CAT-A: PR/feature slug.
      {
        code: "// Feature: 08-pr25-fixes\nexport const x = 1;\n",
        errors: [{ messageId: "narrative" }],
        output: "export const x = 1;\n",
      },
      // I2 — CAT-B: "Extracted from".
      {
        code:
          "/** Extracted from foo.ts to keep that file under the per-file line cap. */\n" +
          "export const y = 2;\n",
        errors: [{ messageId: "narrative" }],
        output: "export const y = 2;\n",
      },
      // I3 — CAT-C strict whole-trim. The entire trimmed body must
      // match the temporal phrase; `// previously was async` would
      // NOT fire because " async" is outside the `[\s.]*` tail.
      {
        code: "// previously was\nexport const z = 3;\n",
        errors: [{ messageId: "narrative" }],
        output: "export const z = 3;\n",
      },
      // I4 — CAT-D: "Re-export" without back-compat carve-out.
      {
        code: '// Re-export from the modular structure\nexport * from "./foo";\n',
        errors: [{ messageId: "narrative" }],
        output: 'export * from "./foo";\n',
      },
    ],
  };

  // Act + Assert
  ruleTester.run("no-narrative-comments", rule, cases);
});
