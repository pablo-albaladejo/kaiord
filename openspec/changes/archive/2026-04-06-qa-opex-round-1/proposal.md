# Proposal: QA & Operational Excellence Round 1

## Problem

A comprehensive audit of the monorepo revealed 27 issues across code quality, CI/CD, infrastructure, bundle hygiene, and dependency management. These range from a critical runtime bug (ZWO schema missing from published package) to a broken security workflow, silent CloudWatch alarms, and accumulated technical debt (files exceeding size limits, eslint-disable overrides, missing configs).

While the codebase is fundamentally healthy (0 lint errors, 3768 tests passing, clean architecture), these issues represent operational risk and slow erosion of quality standards.

## Solution

Address all 27 findings in 5 focused PRs, ordered by risk and dependency:

1. **PR1 — Critical Fixes**: ZWO schema bug, security workflow, infra hardening
2. **PR2 — DX & Config**: `.nvmrc`, `tsconfig.base.json`, `engines` field, dependency cleanup
3. **PR3 — CI/CD**: Shared setup action, E2E gating, infra CI gate, Dependabot
4. **PR4 — Build & Bundle**: Build warnings, treeshake config, source maps, sideEffects
5. **PR5 — Code Quality**: File splits (eslint-disable removal), file size reductions

## Affected Packages

| Package                      | PRs           | Changes                                                   |
| ---------------------------- | ------------- | --------------------------------------------------------- |
| `@kaiord/zwo`                | PR1, PR4      | Fix schema path bug, treeshake                            |
| `@kaiord/infra`              | PR1           | Alarms, CORS, tags, Lambda memory, log retention          |
| `@kaiord/core`               | PR2, PR5      | tsconfig base, split barrel `index.ts`, split schemas     |
| `@kaiord/fit`                | PR2, PR4      | tsconfig base, remove unused import                       |
| `@kaiord/tcx`                | PR2, PR4      | tsconfig base, remove unused imports                      |
| `@kaiord/garmin`             | PR2           | tsconfig base, engines                                    |
| `@kaiord/garmin-connect`     | PR2           | tsconfig base, engines                                    |
| `@kaiord/cli`                | PR2, PR4, PR5 | tsconfig base, engines, exports, sideEffects, file splits |
| `@kaiord/mcp`                | PR2, PR4      | tsconfig base, engines, sideEffects, treeshake            |
| `@kaiord/ai`                 | PR2, PR5      | tsconfig base, engines, split text-to-workout.ts          |
| `@kaiord/workout-spa-editor` | PR2, PR4, PR5 | tsconfig base, Vite chunk, eslint-disable removal         |
| CI/CD (`.github/`)           | PR1, PR3      | Security fix, shared action, E2E gating, Dependabot       |
| Root                         | PR2           | `.nvmrc`, `tsconfig.base.json`, `pnpm dedupe`             |

## Breaking Changes

None. All changes are internal quality improvements.

## Constraints

- Architecture layers: adapters (ZWO schema fix), infra (CDK stack), CI/CD
- Referenced specs: `openspec/specs/hexagonal-arch/spec.md`, `openspec/specs/adapter-contracts/spec.md`
- All changes MUST maintain zero ESLint warnings, zero TS errors, and all tests passing
- File splits MUST NOT change public API surface
- CDK changes require `cdk diff` verification before deploy
