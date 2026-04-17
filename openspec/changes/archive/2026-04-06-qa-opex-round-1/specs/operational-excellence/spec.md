# Operational Excellence — Round 1

## Requirements

### Requirement: ZWO Schema Available at Runtime

The `@kaiord/zwo` package SHALL include the XSD schema file in the published npm tarball at a path resolvable by `node-modules-loader.ts`. The `createXsdZwiftValidator` function MUST NOT throw `ENOENT` when invoked after `npm install`.

#### Scenario: XSD validation works after npm install

- **GIVEN** a consumer installs `@kaiord/zwo` from npm
- **WHEN** they call `createXsdZwiftValidator()` and validate a ZWO string
- **THEN** the validator loads the XSD schema and returns a validation result

#### Scenario: Build produces schema at expected path

- **GIVEN** the `pnpm -r build` command completes for `@kaiord/zwo`
- **WHEN** the `dist/` and `schema/` directories are inspected
- **THEN** `schema/zwift-workout.xsd` exists at the package root

### Requirement: Security Workflow Detects Vulnerabilities

The `security.yml` workflow SHALL correctly parse `pnpm audit --json` output using pnpm's schema (`metadata.vulnerabilities`) instead of npm v6's `.advisories` schema.

#### Scenario: Known vulnerability triggers alert

- **GIVEN** a dependency with a known critical vulnerability
- **WHEN** the security workflow runs
- **THEN** the summary reports the correct severity count (not always 0)

### Requirement: CloudWatch Alarms Notify

The CDK stack's `ApiGateway5xxAlarm` and `LambdaErrorsAlarm` SHALL have at least one `alarmAction` configured (SNS topic with email subscription).

#### Scenario: 5xx alarm fires

- **GIVEN** the API Gateway returns 5+ 5xx errors in 5 minutes
- **WHEN** the alarm enters ALARM state
- **THEN** an email notification is sent to the configured address

### Requirement: CORS Fails Closed

The CDK stack SHALL NOT default `allowedOrigins` to `["*"]`. If the `allowedOrigins` CDK context value is missing, the stack MUST throw an error during synthesis.

#### Scenario: Missing CORS origins fails deployment

- **GIVEN** a `cdk synth` command without `--context allowedOrigins`
- **WHEN** the stack synthesizes
- **THEN** synthesis fails with a descriptive error message

### Requirement: Node Version Pinned

The repository SHALL contain a `.nvmrc` file at the root specifying the primary Node.js version for local development.

### Requirement: Shared TypeScript Config

All packages SHALL extend a root `tsconfig.base.json` for shared compiler options (`target`, `module`, `strict`, `moduleResolution`, etc.). Package-specific overrides (e.g., `isolatedModules` for CLI/MCP) SHALL be declared in the package's own `tsconfig.json`.

### Requirement: Engine Declaration

All publishable packages SHALL declare `"engines": { "node": ">=20.0.0" }` in their `package.json`.

### Requirement: Dependency Automation

The repository SHALL have a Dependabot or Renovate configuration that automatically creates PRs for outdated dependencies.

### Requirement: CI Shared Setup Action

All CI/CD workflows that install pnpm and Node.js SHALL use the shared `.github/actions/setup-pnpm` composite action to avoid cache logic divergence.

### Requirement: E2E Gating

The `workout-spa-editor-e2e.yml` workflow SHALL only run when frontend-related files have changed, not unconditionally on every CI completion.

### Requirement: Infra CI Gate

The `deploy-infra.yml` workflow SHALL depend on CI passing before deploying. Infrastructure changes MUST NOT deploy when tests are failing.

### Requirement: Zero Build Warnings

All packages SHALL build with zero warnings. Unused imports in `@kaiord/fit` and `@kaiord/tcx` bundles SHALL be removed. The empty `vendor-react` Vite chunk SHALL be resolved.

### Requirement: Tree-Shaking Enabled

The `@kaiord/cli` and `@kaiord/mcp` tsup configs SHALL include `treeshake: true`.

### Requirement: sideEffects Declaration

All publishable packages SHALL declare `"sideEffects": false` in `package.json` where applicable.

### Requirement: Zero eslint-disable File Overrides

No production source file SHALL contain file-level `/* eslint-disable */` comments. Files currently exceeding `max-lines` or `max-lines-per-function` SHALL be refactored to comply.

### Requirement: File Size Compliance

Non-test, non-type-only source files SHALL be 100 lines or fewer, per project rules. Barrel files (`index.ts`) with only re-exports are exempt when they cannot be reasonably split further.

## Non-Functional Requirements

### Requirement: CDK Resource Tags

The CDK stack SHALL apply `Project`, `Owner`, and `Environment` tags to all resources for cost allocation.

### Requirement: CDK Cost Optimization

The Lambda function memory SHALL be reviewed and reduced to the minimum required for the proxy workload. Log retention SHALL be increased to at least `ONE_MONTH`.

### Requirement: Dependency Cleanup

- `autoprefixer` SHALL be removed from `@kaiord/workout-spa-editor` (unnecessary with Tailwind v4)
- `@types/yargs` SHALL be removed from `@kaiord/cli` if yargs v18 ships its own types
- `@dnd-kit/utilities` SHALL be removed if unused
- `pnpm dedupe` SHALL be run to consolidate transitive dependencies
