<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src

## Purpose

Source tree of `@kaiord/garmin`. Implements the GCN (Garmin Connect Native
JSON) workout-format adapter — reader, writer, and round-trip checks. Pure
mapping/validation against `@kaiord/core`; no HTTP transport (that lives in
`@kaiord/garmin-connect`).

## Key Files

| File       | Description                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `index.ts` | Public surface — exports `gcnReader`, `gcnWriter`, factories, schema validators, and shared types. |

## Subdirectories

| Directory     | Purpose                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------- |
| `adapters/`   | GCN⇄KRD converters, mappers, input/output Zod schemas, round-trip checks (see `adapters/AGENTS.md`) |
| `test-utils/` | Shared GCN/KRD test fixtures and helpers (see `test-utils/AGENTS.md`)                               |

## For AI Agents

### Working In This Directory

- Adapter package — depends on `@kaiord/core` only.
- GCN payloads are asymmetric: the API accepts a permissive shape on write
  and returns a stricter, enriched shape on read. `adapters/schemas/input/`
  vs `adapters/schemas/output/` reflects that asymmetry — keep them in sync
  with paired `*Input`/`*Output` fixtures under `test-fixtures/gcn/`.
- Public exports MUST come through `index.ts`.

### Testing Requirements

Coverage target 80%. Round-trip GCN → KRD → GCN with canonical tolerances
(time ±1s, power ±1W/±1%FTP, HR ±1bpm, cadence ±1rpm). Title rule and AAA
rule apply.

### Common Patterns

- Converter modules contain logic and have co-located tests.
- Mapper modules (`*.mapper.ts`) are pure enum/domain translations and have
  NO co-located tests (enforced by `pnpm lint:mapper-no-tests`).
- Counter pattern for step ordering — converters carry an explicit index to
  preserve GCN's `stepOrder` semantics across nested repeats.

## Dependencies

### Internal

- `@kaiord/core` — KRD types/schemas, port contracts.

### External

- `zod` — input/output validation.

<!-- MANUAL: -->
