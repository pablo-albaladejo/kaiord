# Tasks: QA & Operational Excellence Round 1

## PR1 — Critical Fixes

### ZWO Schema Bug

- [x] Add `postbuild` script to `packages/zwo/package.json` that copies `src/schema/zwift-workout.xsd` to `schema/zwift-workout.xsd`
- [x] Verify `schema/` is in `.gitignore` (generated file) or committed (source of truth)
- [x] Add test: run build, then verify `schema/zwift-workout.xsd` exists at package root
- [x] Verify `node-modules-loader.ts` path resolution works with the new layout

### Security Workflow

- [x] Fix `.github/workflows/security.yml` jq expressions to parse `metadata.vulnerabilities.{critical,high,moderate,low,info}` from pnpm audit JSON
- [x] Test locally with `pnpm audit --json | jq '.metadata.vulnerabilities'`

### Infra Hardening

- [x] Add SNS topic with email subscription to CDK stack (email via context param `alarmEmail`)
- [x] Wire both alarms (`ApiGateway5xxAlarm`, `LambdaErrorsAlarm`) to the SNS topic
- [x] Replace `allowedOrigins` `|| ["*"]` fallback with fail-fast error
- [x] Add resource tags: `Project: kaiord`, `Owner: pablo-albaladejo`, `Environment: production`
- [x] Reduce Lambda memory from 512 MB to 256 MB
- [x] Change log retention from `ONE_WEEK` to `ONE_MONTH`
- [x] Change log group removal policy from `DESTROY` to `RETAIN`
- [x] Add `4xxAlarm` for API Gateway throttle visibility
- [x] Update infra tests to cover new alarm actions and CORS validation
- [ ] Run `cdk diff` to verify changes before deploy (requires AWS credentials)

### PR1 Verification

- [x] `pnpm -r build` — zero warnings for `@kaiord/zwo`
- [x] `pnpm -r test` — all 3,773 tests pass (5 new)
- [x] `pnpm lint` — zero warnings

---

## PR2 — DX & Config

### .nvmrc

- [x] Create `.nvmrc` at repo root with content `22`

### Shared tsconfig

- [x] Create `tsconfig.base.json` at repo root with shared compiler options
- [x] Update all 11 `packages/*/tsconfig.json` to extend `../../tsconfig.base.json`
- [x] Remove duplicated options from each package tsconfig (keep only overrides)
- [x] Verify `pnpm -r build` and `pnpm -r test` pass with no changes

### Engine Declarations

- [x] Add `"engines": { "node": ">=20.0.0" }` to all 11 `packages/*/package.json`

### Dependency Cleanup

- [x] Remove `autoprefixer` from `@kaiord/workout-spa-editor` devDependencies
- [x] Remove `autoprefixer` from `postcss.config.js`
- [x] Test removal of `@types/yargs` from `@kaiord/cli` — yargs v18 has no built-in types, kept
- [x] Check `@dnd-kit/utilities` imports — used in 3 files (CSS transform), kept
- [x] Run `pnpm dedupe` — removed 13 duplicate packages
- [x] Normalize `workspace:*` vs `workspace:^` in `@kaiord/workout-spa-editor`

### PR2 Verification

- [x] `pnpm -r build` — passes
- [ ] `pnpm -r test` — deferred to final verification
- [ ] `pnpm lint` — deferred to final verification
- [x] Verify tsconfig changes produce identical build output

---

## PR3 — CI/CD Improvements

### Shared Setup Action

- [x] Update `release.yml` to use `.github/actions/setup-pnpm` composite action
- [x] Update `deploy-spa-editor.yml` to use `.github/actions/setup-pnpm` composite action
- [x] Update `deploy-infra.yml` to use `.github/actions/setup-pnpm` composite action
- [x] Update `security.yml` to use `.github/actions/setup-pnpm` composite action
- [x] Verify node version consistency (`24.x`) across all workflows

### E2E Gating

- [x] Replace always-true `should-run` in `workout-spa-editor-e2e.yml` with actual frontend change detection
- [x] Remove dead `develop` branch reference from `workout-spa-editor-e2e.yml` trigger

### Infra CI Gate

- [ ] Add `workflow_run` dependency to `deploy-infra.yml` — deferred (requires testing with real CI)

### Dependabot

- [x] `.github/dependabot.yml` already exists — added minor/patch grouping
- [x] Configure weekly schedule, group minor/patch updates
- [x] SPA editor shares the root npm ecosystem entry (private, same cadence)

### Misc CI Cleanup

- [x] Move `.github/CI_BYPASS_FIX.md` to `docs/ci-bypass-fix.md`
- [x] Update `eval.yml` default model to `claude-sonnet-4-6-20250514`
- [x] Add `permissions: contents: read` to `eval.yml`

### PR3 Verification

- [ ] All workflows pass on a test branch — verified by CI after push
- [ ] E2E skips correctly when only backend files change — verified by CI
- [x] Dependabot already configured with grouping

---

## PR4 — Build & Bundle Optimization

### Build Warnings

- [x] Fix `@kaiord/fit`: SWIM_STROKE_TO_FIT correctly tree-shaken (unused from public API) — warning is inherent to rollup external module treeshake
- [x] Fix `@kaiord/tcx`: same — targetTypeSchema/durationTypeSchema correctly tree-shaken from public API
- [x] Fix `@kaiord/workout-spa-editor`: removed empty `vendor-react` manual chunk from Vite config

### Tree-Shaking

- [x] Add `treeshake: true` to `packages/mcp/tsup.config.ts` (both entries)
- [x] Add `treeshake: true` to `packages/cli/tsup.config.ts`
- [ ] Evaluate `splitting: true` for `@kaiord/mcp` — deferred, needs runtime testing

### Package.json Fields

- [x] Add `"sideEffects": false` to `packages/cli/package.json`
- [x] Add `"sideEffects": false` to `packages/mcp/package.json`
- [x] CLI has no lib consumers (bin-only) — exports field not needed

### Source Maps (evaluate)

- [x] Source maps in published tarballs — kept for now (useful for stack trace debugging)

### PR4 Verification

- [x] `pnpm -r build` — zero new warnings (2 inherent rollup treeshake warnings for external modules remain)
- [ ] `pnpm -r test` — deferred to final verification
- [x] Bundle sizes remain within thresholds

---

## PR5 — Code Quality (File Splits)

### SPA Editor Component Splits (remove eslint-disable overrides)

- [x] Split `RepetitionBlockCard.tsx` (213 -> 88 lines) — extracted types + helpers
- [x] Split `RepetitionBlockSteps.tsx` (187 -> 77 lines) — extracted SortableStep component
- [x] Split `SortableRepetitionBlockCard.tsx` (148 -> 79 lines) — extracted types + helpers
- [x] Split `useKeyboardShortcuts.ts` (161 -> 35 lines) — extracted handler logic
- [x] Remove all file-level `/* eslint-disable */` comments from split files
- [x] Remove unused-vars eslint-disable comments by cleaning up destructuring

### Core Package Splits

- [x] Split `core/src/index.ts` (193 -> 87 lines) — created sub-barrels for domain, ports, application
- [x] Split `core/src/domain/schemas/duration.ts` (147 -> 86 lines) — extracted duration-type schema
- [x] Split `core/src/domain/schemas/workout.ts` (146 -> 48 lines) — extracted workout-step schema
- [x] Split `core/src/domain/schemas/target.ts` (110 -> 59 lines) — extracted target-type schema

### Adapter/CLI Splits

- [x] Split `cli/src/commands/convert/batch.ts` (148 -> 62 lines) — extracted helpers + output
- [x] Split `cli/src/commands/convert/index.ts` (121 -> 90 lines) — extracted error mapping
- [x] Split `cli/src/commands/diff/index.ts` (114 -> 48 lines) — extracted executor
- [x] Split `fit/src/adapters/lap/lap.mapper.ts` (125 lines) — split into two direction-specific mappers
- [x] Split `ai/src/adapters/text-to-workout.ts` (118 -> 61 lines) — extracted retry logic
- [x] Split `infra/src/stack/garmin-proxy-stack.ts` (146 -> 80 lines) — extracted Lambda + alarms + CORS

### Other Code Quality

- [x] Fix `as any` in `infra/src/lambda/proxy-fetch.ts:19` — replaced with `as unknown as Dispatcher`
- [x] Evaluate `@ts-expect-error` in `use-onboarding-tutorial.ts` — acceptable (Playwright runtime property)

### PR5 Verification

- [ ] `pnpm -r build` — pending final verification
- [ ] `pnpm -r test` — pending final verification
- [ ] `pnpm lint` — pending final verification
- [x] No file-level `eslint-disable` comments remain in production code
- [x] All non-test, non-type-only files are under 100 lines (or documented exceptions)
- [x] Public API surface unchanged (same exports from all packages)
