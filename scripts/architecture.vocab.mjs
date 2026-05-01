// Single source-of-truth for architecture-vocabulary constants used by
// scripts/check-architecture.mjs and asserted against the
// `<!-- arch-vocab -->` block in `.claude/skills/guidelines/architecture-hexagonal/SKILL.md`
// by scripts/check-architecture.test.mjs (array-equality, order-sensitive).
//
// Drift between this file and the SKILL.md block fails CI.

// Allowed subfolders under `packages/core/src/adapters/`. Order is normative.
export const CORE_ADAPTER_ALLOWLIST = ["analytics", "logger"];

// Format-adapter packages whose cross-imports (sibling-format → sibling-format)
// are forbidden by R-ArchAdapterCross. Order is normative.
export const FORMAT_ADAPTERS = ["fit", "garmin", "tcx", "zwo"];

// Workspace-dep allowlist for R-ArchPackageDeps. Each entry maps a package
// folder name to the set of allowed `@kaiord/*` workspace deps it may
// declare in its `dependencies` (or `devDependencies`).
//
// Mirrors the canonical `Package Dependencies` table in
// `openspec/specs/hexagonal-arch/spec.md`. Drift between this object and
// that table is a separate review concern (no automatic test, but tasks.md
// 5.7 mandates byte-equality after archive).
export const PACKAGE_DEPS = {
  core: [],
  fit: ["@kaiord/core"],
  tcx: ["@kaiord/core"],
  zwo: ["@kaiord/core"],
  garmin: ["@kaiord/core"],
  "garmin-connect": ["@kaiord/core", "@kaiord/garmin"],
  ai: ["@kaiord/core"],
  mcp: [
    "@kaiord/core",
    "@kaiord/fit",
    "@kaiord/tcx",
    "@kaiord/zwo",
    "@kaiord/garmin",
    "@kaiord/garmin-connect",
  ],
  cli: [
    "@kaiord/core",
    "@kaiord/fit",
    "@kaiord/tcx",
    "@kaiord/zwo",
    "@kaiord/garmin",
    "@kaiord/garmin-connect",
  ],
  "workout-spa-editor": [
    "@kaiord/core",
    "@kaiord/ai",
    "@kaiord/fit",
    "@kaiord/garmin",
    "@kaiord/tcx",
    "@kaiord/zwo",
  ],
  docs: [
    "@kaiord/core",
    "@kaiord/fit",
    "@kaiord/tcx",
    "@kaiord/zwo",
    "@kaiord/garmin",
    "@kaiord/garmin-connect",
    "@kaiord/cli",
    "@kaiord/mcp",
  ],
  landing: ["@kaiord/core"],
  "garmin-bridge": [],
  "train2go-bridge": [],
};
