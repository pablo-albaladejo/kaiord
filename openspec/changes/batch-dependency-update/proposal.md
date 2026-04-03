# Proposal: Batch Dependency Update

## Problem

Seven Dependabot PRs have accumulated (#169–#176), covering CI actions and dev
dependencies. Merging them individually is noisy and risks partial incompatibility.
A single coordinated update ensures all changes are validated together.

## Solution

Create one branch that applies all dependency bumps, verifies CI and tests pass,
then closes the individual Dependabot PRs.

### CI Actions (workflow YAML)

| Action                  | From  | To  | PR   |
| ----------------------- | ----- | --- | ---- |
| actions/upload-artifact | v4/v6 | v7  | #169 |
| actions/checkout        | v4    | v6  | #170 |
| actions/setup-node      | v4    | v6  | #171 |

Most workflows are already migrated. Only stragglers remain:

- `eval.yml`: checkout@v4, setup-node@v4, upload-artifact@v4
- `metrics-gate.yml`: upload-artifact@v6
- `ci.yml`: one upload-artifact@v6

### Dev Dependencies (package.json)

| Package            | From    | To      | PR   | Location           |
| ------------------ | ------- | ------- | ---- | ------------------ |
| storybook          | 10.2.13 | 10.2.17 | #172 | workout-spa-editor |
| autoprefixer       | 10.4.24 | 10.4.27 | #173 | workout-spa-editor |
| esbuild            | 0.25.12 | 0.27.3  | #174 | infra              |
| @changesets/cli    | 2.29.8  | 2.30.0  | #175 | root               |
| dependency-cruiser | 16.10.4 | 17.3.8  | #176 | root               |

## Affected Packages

- **@kaiord/infra** — esbuild bump (build tooling)
- **@kaiord/workout-spa-editor** — storybook + autoprefixer bump
- **Root monorepo** — @changesets/cli + dependency-cruiser bump
- **CI workflows** — GitHub Actions version bumps

## Breaking Changes

- **esbuild 0.25→0.27**: Two major versions. Must verify Lambda bundle builds.
- **dependency-cruiser 16→17**: Major version. Must verify `.dependency-cruiser.cjs`
  config compatibility and `pnpm lint` still passes.
- **GH Actions v4→v6/v7**: Breaking API changes but most workflows already migrated.

## Constraints

- Architecture layer(s): **none** (tooling/CI only, no domain code)
- Referenced specs: none (infrastructure change)
- No changeset needed (no publishable package code changes)
