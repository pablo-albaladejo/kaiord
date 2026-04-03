# Design: Batch Dependency Update

## Approach

Single branch with atomic commit per category (CI actions, then dev deps).
All changes validated together before merging.

## Decision: Batch vs Individual Merges

**Chosen**: Batch update in one PR.

**Why**: Dependencies interact (e.g., esbuild affects build, which affects CI
artifact upload). Validating together catches cross-cutting issues. Also reduces
PR noise and CI churn.

**Alternative rejected**: Merge Dependabot PRs individually. Risk of partial
breakage between merges and 7x CI runs.

## Decision: esbuild 0.25→0.27

**Risk**: esbuild uses 0.x semver where minor = breaking. Changes between 0.25
and 0.27 may affect the Lambda bundling in `@kaiord/infra`.

**Mitigation**: Build the infra package after update and verify the Lambda
bundle output. Check esbuild changelog for breaking changes affecting our usage
(primarily `external`, `platform: 'node'`, `bundle: true`).

## Decision: dependency-cruiser 16→17

**Risk**: Major version bump may introduce config schema changes.

**Mitigation**: Run `pnpm lint` after update. If `.dependency-cruiser.cjs` needs
changes, update it to match v17 schema.

## Decision: GH Actions Major Bumps

**Risk**: Breaking parameter changes in upload-artifact v7, checkout v6,
setup-node v6.

**Mitigation**: Most workflows are already on the new versions. Only update the
3 straggler files (`eval.yml`, `metrics-gate.yml`, one step in `ci.yml`).
Copy the exact usage pattern from already-migrated workflows.

## Verification Strategy

1. `pnpm install` — lockfile resolves cleanly
2. `pnpm -r build` — all packages build (especially infra Lambda)
3. `pnpm -r test` — all tests pass
4. `pnpm lint` — dependency-cruiser v17 config works
5. Push and verify CI passes on all workflows
