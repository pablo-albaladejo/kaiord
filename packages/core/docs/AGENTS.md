<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# docs

## Purpose

Package-specific Markdown documentation for `@kaiord/core` consumers. Cross-cutting docs (architecture, getting started, KRD format spec) live at the monorepo root in `/docs/`; this directory only contains documentation that is specific to the `@kaiord/core` package surface.

## Key Files

| File                         | Description                                                                                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `api-examples.md`            | Comprehensive code examples for `fromBinary`/`fromText`/`toBinary`/`toText`, schema validation, error handling.                               |
| `tree-shaking.md`            | Guide for minimising bundle size — recommends `import type`, named imports, and the `./test-utils` subpath separation.                        |
| `krd-fixtures-generation.md` | How `scripts/generate-krd-fixtures.ts` produces `.krd` fixtures from FIT files and how downstream packages consume them via `loadKrdFixture`. |
| `zwift-format-extensions.md` | Maps kaiord/KRD concepts onto Zwift ZWO XML extensions used by the `@kaiord/zwo` adapter.                                                     |
| `zwift-kaiord-attributes.md` | Currently empty (0 bytes) — placeholder for documenting custom `kaiord:*` XML attributes injected into ZWO output.                            |

## For AI Agents

### Working In This Directory

- These are pure Markdown files; no code lives here. When the README at the package root references a doc here, KEEP the relative link working (`./docs/api-examples.md`).
- All examples in `api-examples.md` MUST stay compilable against the current `src/index.ts` public surface. If you rename or remove an export, update or remove the example.

<!-- MANUAL: -->
