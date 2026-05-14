<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# schema

## Purpose

Published JSON Schema and XSD artifacts shipped with the `@kaiord/core` npm package (listed in `package.json`'s `files` array). Most JSON files are **generated** by `scripts/generate-schema.ts` from the Zod schemas in `src/domain/schemas/`; the XSDs are hand-maintained external specs vendored for offline validation by the `@kaiord/tcx` and `@kaiord/zwo` adapters.

## Key Files

| File                           | Description                                                                                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `krd.json`                     | GENERATED — JSON Schema for the full KRD envelope (`$id: https://kaiord.dev/schema/krd.json`), with `extensions.structured_workout` referencing `workout.json`. |
| `workout.json`                 | GENERATED — JSON Schema for the `Workout` shape that goes into `krd.extensions.structured_workout`.                                                             |
| `structured-workout-full.json` | GENERATED — self-contained inlined workout schema for LLM agents (sport/duration/target/intensity all expanded).                                                |
| `kaiord-extensions.xsd`        | Hand-maintained — XSD for custom `kaiord:*` extension elements injected into ZWO/TCX output.                                                                    |
| `TrainingCenterDatabasev2.xsd` | Vendored — official Garmin TCX v2 XSD used by the `@kaiord/tcx` validator.                                                                                      |
| `zwift-workout.xsd`            | Hand-maintained — XSD for Zwift's `.zwo` workout format used by the `@kaiord/zwo` validator.                                                                    |

## For AI Agents

### Working In This Directory

- Do NOT hand-edit `krd.json`, `workout.json`, or `structured-workout-full.json`. They are regenerated on every build via the `prebuild` script (`pnpm generate:schema` → `scripts/generate-schema.ts`). Any manual edit will be overwritten.
- To change the published JSON Schema, edit the corresponding Zod schema under `src/domain/schemas/` (typically `krd/index.ts` or `workout.ts`), then run `pnpm generate:schema`.
- The XSD files (`kaiord-extensions.xsd`, `TrainingCenterDatabasev2.xsd`, `zwift-workout.xsd`) ARE hand-maintained and may be edited directly; the TCX XSD should mirror the upstream Garmin spec verbatim.

<!-- MANUAL: -->
