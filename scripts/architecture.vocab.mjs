// Single source-of-truth for architecture-vocabulary constants used by
// scripts/check-architecture.mjs and asserted against the
// `<!-- arch-vocab -->` block in `.claude/skills/guidelines/architecture-hexagonal/SKILL.md`
// by scripts/check-architecture.test.mjs (array-equality, order-sensitive).
//
// Drift between this file and the SKILL.md block fails CI.

// Allowed subfolders under `packages/core/src/adapters/`. Order is normative.
export const CORE_ADAPTER_ALLOWLIST = ["analytics", "logger"];

// Allowed top-level directories under `packages/core/src/`. Any other
// directory is rejected by R-ArchCoreSrcDirs — undeclared layers are
// invisible to the per-layer rules, so they are forbidden outright.
// `protocol/` holds cross-package protocol contracts (SPA ↔ bridge DTOs)
// and is governed by the same purity rules as `domain/`. Order is normative.
export const CORE_SRC_ALLOWLIST = [
  "adapters",
  "application",
  "domain",
  "ports",
  "protocol",
  "test-utils",
  "tests",
];

// External libraries `packages/core/src/{domain,protocol}/` may import.
// Every entry MUST be pure, isomorphic, and I/O-free. `@noble/hashes`
// backs `domain/hash/canonical-hash.ts` (sync SHA-256 that works in both
// Node and the browser; `node:crypto` broke browser bundles). Order is
// normative.
export const DOMAIN_EXTERNAL_ALLOWLIST = ["@noble/hashes", "zod"];

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
  whoop: ["@kaiord/core"],
  "garmin-connect": ["@kaiord/core", "@kaiord/garmin"],
  ai: ["@kaiord/core"],
  // Framework-agnostic i18n mechanism (translator factory, dictionary types,
  // parity checker). Private, wraps i18next only — zero @kaiord/* deps.
  i18n: [],
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
    "@kaiord/i18n",
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
    "@kaiord/i18n",
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
  // Bridges depend on @kaiord/core ONLY at devDependency time (parity
  // tests for the snapshot validator load shared fixtures from
  // @kaiord/core/test-utils). At runtime each bridge ships its own
  // hand-rolled plain-JS validator, so production bundles have zero
  // dependency on @kaiord/core.
  "garmin-bridge": ["@kaiord/core"],
  "train2go-bridge": ["@kaiord/core"],
  "whoop-bridge": ["@kaiord/core"],
  // Static-asset package — SVG icon master + popup CSS master shared
  // across both bridges. Private, never published, zero deps.
  _shared: [],
};
