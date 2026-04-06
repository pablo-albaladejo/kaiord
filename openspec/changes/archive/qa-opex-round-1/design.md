# Design: QA & Operational Excellence Round 1

## Decision 1: ZWO Schema Path Fix

**Layer**: Adapters (`@kaiord/zwo`)

**Approach**: Add a `postbuild` script in `packages/zwo/package.json` that copies `src/schema/zwift-workout.xsd` to `schema/zwift-workout.xsd` at the package root. This ensures the `files: ["dist", "schema"]` field in `package.json` includes the actual XSD file.

**Alternative considered**: Embedding the XSD as a string constant in TypeScript. Rejected because the XSD is maintained as a standalone file and used by `xsd-schema-validator` which expects a file path.

**Alternative considered**: Changing `node-modules-loader.ts` to resolve relative to `dist/`. Rejected because it would require embedding the schema inside the dist folder, mixing build output with source assets.

## Decision 2: Security Workflow Fix

**Layer**: CI/CD

**Approach**: Rewrite the `jq` expressions in `security.yml` to parse pnpm's actual JSON schema: `metadata.vulnerabilities.{critical,high,moderate,low}` instead of npm's `.advisories | to_entries | map(...)`.

## Decision 3: CloudWatch Alarm Actions

**Layer**: Infra (CDK stack)

**Approach**: Add an SNS topic with email subscription as a CDK context parameter (`alarmEmail`). Both alarms get this topic as an `alarmAction`. The email is provided via `--context alarmEmail=...` in the deploy workflow.

**Alternative considered**: Hardcoding the email in the stack. Rejected because it couples the stack to a specific recipient and would be visible in the CloudFormation template.

## Decision 4: CORS Fail-Closed

**Layer**: Infra (CDK stack)

**Approach**: Replace the `|| ["*"]` fallback with `node.tryGetContext("allowedOrigins")` and throw an error if undefined. This forces explicit CORS configuration.

## Decision 5: Shared tsconfig.base.json

**Layer**: All packages

**Approach**: Create `tsconfig.base.json` at the monorepo root with the shared `compilerOptions` (target, module, strict, lib, moduleResolution, etc.). Each package's `tsconfig.json` extends it with `"extends": "../../tsconfig.base.json"` and adds only package-specific overrides.

**Migration**: One-time bulk update of all 11 `tsconfig.json` files. No build behavior change expected since the options are identical.

## Decision 6: File Splitting Strategy

**Layer**: Multiple (domain schemas, adapters, CLI, SPA editor)

**Approach for each category**:

- **`core/src/index.ts` (193 lines)**: Split into sub-barrel files (`domain/index.ts`, `ports/index.ts`, `application/index.ts`) and re-export from the main barrel. Public API unchanged.
- **Domain schemas** (`duration.ts` 147, `workout.ts` 146, `target.ts` 110): Extract sub-schemas or helper functions into separate files within the same directory.
- **CLI commands** (`batch.ts` 148, `convert/index.ts` 121, `diff/index.ts` 114): Extract utility/helper functions into `utils/` files.
- **SPA editor components** (RepetitionBlockCard 213, RepetitionBlockSteps 187, SortableRepetitionBlockCard 148, useKeyboardShortcuts 161): Extract sub-components and helper hooks.
- **fit/lap.mapper.ts** (125): Split mapping logic into sub-mappers.
- **ai/text-to-workout.ts** (118): Extract prompt template and validation into separate files.

**Constraint**: All splits MUST maintain the same public API. No consumer-visible changes.

## Decision 7: Dependabot Configuration

**Layer**: CI/CD

**Approach**: Use GitHub Dependabot (native, zero-config) with `.github/dependabot.yml`. Configure for npm (pnpm-compatible) and GitHub Actions ecosystems. Group minor/patch updates. Weekly schedule.

**Alternative considered**: Renovate. Rejected for simplicity — Dependabot is built into GitHub and requires no app installation. Can migrate to Renovate later if grouping features are needed.

## Decision 8: E2E Gating Logic

**Layer**: CI/CD

**Approach**: Replace the always-true `should-run` in `workout-spa-editor-e2e.yml` with a check that reads the CI workflow's changed-files output. If no frontend files changed, skip the E2E matrix. This can use `tj-actions/changed-files` with a paths filter for `packages/workout-spa-editor/**`.

## Decision 9: Build Warning Elimination

**Layer**: Adapters (`@kaiord/fit`, `@kaiord/tcx`), SPA editor

**Approach**:

- `@kaiord/fit`: Remove or convert `SWIM_STROKE_TO_FIT` import to `import type` if only used for types.
- `@kaiord/tcx`: Remove or convert `targetTypeSchema` and `durationTypeSchema` imports if unused at runtime.
- `@kaiord/workout-spa-editor`: Investigate empty `vendor-react` chunk — likely a manual chunk config in `vite.config.ts` that is no longer needed after React externalization.

## Decision 10: Dependency Cleanup

**Layer**: Root, SPA editor, CLI

**Approach**:

- `autoprefixer`: Remove from `workout-spa-editor` devDependencies and `postcss.config.js`.
- `@types/yargs`: Test removal from CLI — if types resolve from yargs v18 built-in types, remove.
- `@dnd-kit/utilities`: Grep for actual imports — remove if unused.
- `license-checker`: Evaluate `license-checker-rspack` as replacement to eliminate 7 deprecated transitive deps. If migration is non-trivial, defer to a separate PR.
- `pnpm dedupe`: Run after all dependency changes.

## Decision 11: CDK Improvements

**Layer**: Infra

**Approach**:

- Tags: Add via `cdk.Tags.of(this).add()` in the stack constructor.
- Lambda memory: Reduce from 512 MB to 256 MB. Monitor after deploy; revert if cold starts increase.
- Log retention: Change from `ONE_WEEK` to `ONE_MONTH`.
- Removal policy: Change from `DESTROY` to `RETAIN` for the log group.
- Throttling alarm: Add a `4xxAlarm` on the API Gateway for visibility into throttled requests.
