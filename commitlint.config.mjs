// Commitlint configuration for kaiord.
//
// Enforces conventional-commit format with project-pinned type and scope
// vocabularies. The single source of truth lives in `commitlint.vocab.mjs`
// and is asserted against the SKILL.md `<!-- commitlint-source-of-truth -->`
// block by `scripts/check-commitlint-config.test.mjs` (rule R-CommitFormat).
//
// Multi-scope subjects (e.g., `refactor(core,fit,tcx): foo`) are REJECTED
// by the custom `scope-no-comma` rule below — single-scope subjects are
// normative per design D2.

import { SCOPE_ENUM, TYPE_ENUM } from "./commitlint.vocab.mjs";

// changesets/action commits the generated version-bump with subject
// "Version Packages" (its built-in default). That commit is produced by
// automation we control end-to-end; the conventional-commit type/scope
// contract is for human authors. Allowlist that exact subject so the
// Release workflow can land its bump commit through the husky commit-msg
// hook.
const CHANGESET_BOT_SUBJECT = /^Version Packages(\s|$)/;

export default {
  extends: ["@commitlint/config-conventional"],
  ignores: [(message) => CHANGESET_BOT_SUBJECT.test(message)],
  plugins: [
    {
      rules: {
        "scope-no-comma": ({ scope }) => {
          if (typeof scope === "string" && scope.includes(",")) {
            return [
              false,
              "Multi-scope subjects are not allowed (single-scope is normative). Split into separate commits per scope.",
            ];
          }
          return [true];
        },
      },
    },
  ],
  rules: {
    "type-enum": [2, "always", TYPE_ENUM],
    "scope-enum": [2, "always", SCOPE_ENUM],
    "scope-no-comma": [2, "always"],
    "subject-case": [0],
  },
};
