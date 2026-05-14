<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# scripts

## Purpose

Build-time TypeScript generators executed via `tsx` from `package.json` scripts. They translate the canonical Zod schemas into published JSON Schema artifacts and produce binary fixture pairs (FIT → KRD, FIT → ZWO) for round-trip tests in this and downstream packages.

## Key Files

| File                         | Description                                                                                                                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate-schema.ts`         | Reads `krdSchema` and `workoutSchema`, runs `z.toJSONSchema()`, and writes `schema/krd.json`, `schema/workout.json`, `schema/structured-workout-full.json`. Wired to `prebuild` and `build`.                                |
| `generate-krd-fixtures.ts`   | Reads every `*.fit` file under `src/tests/fixtures/fit-files/`, converts it via `createGarminFitSdkReader` (from `@kaiord/fit`), and writes pretty-printed `*.krd` JSON next to it.                                         |
| `generate-zwift-fixtures.ts` | Pipeline for the four canonical workout fixtures (`WorkoutIndividualSteps`, `WorkoutRepeatSteps`, `WorkoutRepeatGreaterThanStep`, `WorkoutCustomTargetValues`): FIT → KRD → ZWO XML, validated against `zwift-workout.xsd`. |

## For AI Agents

### Working In This Directory

- These scripts import adapters from sibling workspace packages (`@kaiord/fit`, `@kaiord/zwift`) via relative `../src/adapters/...` paths. That is a **build-tool-only escape**; it is NOT a runtime dependency of the published `@kaiord/core` bundle and MUST stay confined to the `scripts/` folder.
- Run via `pnpm generate:schema`, `pnpm generate:krd-fixtures` (manual — not run on every build). The schema script is auto-invoked via `prebuild`.
- All file I/O uses Node's `fs` and `path`; `__dirname` is derived via `fileURLToPath(import.meta.url)` because the package is ESM (`"type": "module"`).
- Keep scripts side-effect-only at module scope; `process.exit(1)` on fatal errors.

<!-- MANUAL: -->
