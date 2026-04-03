# Spec: Batch Dependency Update

## REQ-01: All CI workflows use current action versions

All GitHub Actions workflows SHALL use actions/checkout@v6,
actions/setup-node@v6, and actions/upload-artifact@v7.

### Scenario: Straggler workflows updated

- **Given** `eval.yml` uses checkout@v4, setup-node@v4, upload-artifact@v4
- **When** the batch update is applied
- **Then** all workflow files use the target versions consistently

## REQ-02: Dev dependencies updated without regressions

All updated dev dependencies SHALL pass existing build, test, and lint checks.

### Scenario: esbuild major bump builds successfully

- **Given** `@kaiord/infra` uses esbuild ^0.25.0 for Lambda bundling
- **When** esbuild is updated to ^0.27.0
- **Then** `pnpm -r build` succeeds with no errors or warnings

### Scenario: dependency-cruiser major bump lints successfully

- **Given** the root uses dependency-cruiser ^16.0.0
- **When** dependency-cruiser is updated to ^17.0.0
- **Then** `pnpm lint` passes with zero warnings and zero errors

### Scenario: storybook patch bump is compatible

- **Given** `@kaiord/workout-spa-editor` uses storybook ^10.2.13
- **When** storybook is updated to ^10.2.17
- **Then** `pnpm -r build` and `pnpm -r test` succeed

## REQ-03: Dependabot PRs closed after merge

All 7 Dependabot PRs (#169–#176) SHALL be closed after the consolidated
update is merged to main.
