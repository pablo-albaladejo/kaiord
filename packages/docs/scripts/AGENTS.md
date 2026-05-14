<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# scripts

## Purpose

Build and lint utilities for the documentation site. Includes TypeDoc API generation, privacy policy enforcement, brand token validation, and content guards. Every script is accompanied by a co-located test file using node:test.

## Key Files

- `generate-api-docs.mjs` — TypeDoc runner: generates API reference from source packages into `api/` directories
- `generate-api-docs.test.mjs` — Test suite for API doc generation (covered by `pnpm test`)
- `check-privacy-policy.mjs` — Privacy policy lint guard: validates policy against spec and extension manifests
- `check-privacy-policy.test.mjs` — Test suite for privacy policy guard (covered by `pnpm test`)
- `brand-tokens.mjs` — CSS custom property definitions (design tokens)
- `brand-tokens.test.mjs` — Test suite for brand tokens (covered by `pnpm test`)
- `head-config.mjs` — Factory for static HTML head metadata
- `head-config.test.mjs` — Test suite for head config (covered by `pnpm test`)
- `build-output-meta.test.mjs` — Validates VitePress build output metadata (covered by `pnpm test`)
- `no-hex-literals.test.mjs` — Lints CSS for hardcoded hex colors; enforces use of CSS custom properties (covered by `pnpm test`)
- `generate-og-image.mjs` — (Legacy) Open Graph image generator

## Subdirectories

None. All scripts are in this directory.

## For AI Agents

### Working In This Directory

**Scripts are tools, not documentation to edit.** Modify scripts only when adding new generators, guards, or validators.

**Conventions for new scripts:**

1. **File naming**: Use kebab-case (e.g., `check-new-rule.mjs`)
2. **Co-located tests**: Create `check-new-rule.test.mjs` using `node:test` (no external test framework)
3. **Error reporting**: Use clear, actionable error messages
4. **Exit codes**: Exit 0 for success; non-zero for failure
5. **Logging**: Use `console.log()` for info; `console.warn()` for warnings; `console.error()` for errors

### Testing Requirements

- **Test suite**: `pnpm --filter @kaiord/docs test` runs all `*.test.mjs` files via `node --test`
- **Coverage**: Each script must have comprehensive tests covering success and failure paths
- **Script validation**: Run scripts manually to verify they work (e.g., `node scripts/generate-api-docs.mjs`)
- **Build integration**: Changes to generators must be tested with `pnpm --filter @kaiord/docs build`

### Common Patterns

- **Generators**: TypeDoc runner and OG image generator produce output files
- **Guards/linters**: Privacy policy, brand tokens, head config, hex literals enforce invariants
- **Error messaging**: Guards print actionable errors (e.g., "privacy-policy.md missing disclosure: X") so users can fix quickly
- **Optional logging**: Scripts can log progress without being verbose; use `console.log()` for info, suppress when quiet

## Dependencies

### Internal

- `../api/` — Output directory for `generate-api-docs.mjs`
- `../legal/privacy-policy.md` — Input to `check-privacy-policy.mjs`
- `openspec/specs/privacy-policy/spec.md` — Privacy spec (referenced by guard)
- `packages/train2go-bridge/manifest.json` — Extension manifest (checked by privacy guard)
- `packages/garmin-bridge/manifest.json` — Extension manifest (checked by privacy guard)
- `../src/**/*.css` — Linted by `no-hex-literals.test.mjs`

### External

- **TypeDoc** — API documentation extraction (used by `generate-api-docs.mjs`)
- **typedoc-plugin-markdown** — TypeDoc plugin (used by `generate-api-docs.mjs`)
- **node:test** — Built-in Node.js test framework (used by all \*.test.mjs)
- **node:fs, node:path** — File system utilities

<!-- MANUAL: -->

## Notes for Agents

1. **Every script needs a test**: The repo enforces co-located test files. Always add `{script-name}.test.mjs` when creating new scripts.
2. **TypeDoc generation is central**: `generate-api-docs.mjs` is the critical tool that updates all API docs. Test it carefully.
3. **Privacy guard is strict**: `check-privacy-policy.mjs` validates that the policy matches the spec and extension manifests. Failures block builds.
4. **Brand tokens prevent ad-hoc styling**: `brand-tokens.test.mjs` and `no-hex-literals.test.mjs` enforce consistent design. No hex colors should be hardcoded.
5. **Guards are fast**: All guards should complete in <1s to keep CI fast.
6. **Errors must be fixable**: When a guard fails, the error message should clearly state what to fix.
