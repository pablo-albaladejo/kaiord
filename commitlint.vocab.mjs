// Single source-of-truth for commitlint type and scope vocabularies.
//
// The same arrays are reproduced verbatim, line-for-line and order-preserved,
// inside `<!-- commitlint-source-of-truth:start -->` ... `<!-- :end -->`
// markers in `.claude/skills/guidelines/git-strategy/SKILL.md`. The test in
// `scripts/check-commitlint-config.test.mjs` parses the SKILL.md block and
// asserts deepStrictEqual against the arrays here. Drift in either direction
// (insertion, deletion, OR reorder) fails CI.

export const TYPE_ENUM = [
  "feat",
  "fix",
  "chore",
  "test",
  "docs",
  "refactor",
  "perf",
];

export const SCOPE_ENUM = [
  "core",
  "fit",
  "tcx",
  "zwo",
  "tanita",
  "garmin",
  "garmin-connect",
  "ai",
  "cli",
  "mcp",
  "i18n",
  "spa-editor",
  "garmin-bridge",
  "train2go-bridge",
  "tanita-bridge",
  "whoop",
  "trainingpeaks",
  "whoop-bridge",
  "trainingpeaks-bridge",
  "bridge-core",
  "analytics",
  "landing",
  "docs-site",
  "openspec",
  "ci",
  "docs",
  "scripts",
  "deploy",
  "release",
  "deps",
  "deps-dev",
  "e2e",
];
