<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# target-values

## Purpose

The per-target-type value schemas referenced by `targetSchema` (in `../target.ts`). Each file defines one discriminated union over the shared `unit` discriminator from `unit.ts`. Splitting these per-file keeps each schema under the 100-line limit and lets adapters import only the units they support.

## Key Files

| File             | Description                                                                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| `index.ts`       | Barrel re-exporting all value schemas + `targetUnitSchema`.                                                                                                                |
| `unit.ts`        | `targetUnitSchema` — `z.enum(["watts","percent_ftp","zone","range","bpm","percent_max","rpm","mps","swim_stroke"])`. Shared discriminator across all target-value schemas. |
| `power.ts`       | `powerValueSchema` — discriminated union of `{unit:"watts"                                                                                                                 | "percent_ftp"   | "zone"                                             | "range", ...}`with`zone`constrained to int`[1,7]` (Coggan 7-band).   |
| `heart-rate.ts`  | `heartRateValueSchema` — discriminated union of `{unit:"bpm"                                                                                                               | "zone"          | "percent_max"                                      | "range", ...}`with`zone`constrained to int`[1,5]` (5-zone HR model). |
| `cadence.ts`     | `cadenceValueSchema` — discriminated union of `{unit:"rpm"                                                                                                                 | "range", ...}`. |
| `pace.ts`        | `paceValueSchema` — discriminated union of `{unit:"mps"                                                                                                                    | "zone"          | "range", ...}`with`zone`constrained to int`[1,5]`. |
| `stroke-type.ts` | `strokeTypeValueSchema` — non-union object: `{unit:"swim_stroke", value: int[0,5]}`. Numeric value matches FIT stroke codes (0=freestyle, …5=mixed/IM).                    |

## For AI Agents

### Working In This Directory

- All value schemas use `unit` as the discriminator and pull literals from `targetUnitSchema.enum.*`. NEVER inline string literals like `"watts"`; always `z.literal(targetUnitSchema.enum.watts)`.
- The `range` variant always has `{ unit: "range", min, max }` (NO `value` field). The non-range variants always have `{ unit, value }`. Adapters depend on this shape — don't merge them.
- Power zones go 1..7 (Coggan); HR and pace zones go 1..5. These ranges are baked into the schemas as `z.number().int().min(N).max(M)`. If you change them, update `../../zones/power-zones.ts` and every adapter's zone mapper.
- `stroke-type.ts` deliberately does NOT use `discriminatedUnion` because there's only one variant; it's a plain `z.object(...)`.

### Testing Requirements

- Coverage target: 80%. Most coverage is indirect via `../target.test.ts` and adapter round-trip tests. If you add a new unit, add direct schema tests. AAA + `should ` invariants apply.

### Common Patterns

- **Shared discriminator import**: every value schema imports `targetUnitSchema` from `./unit` and references `.enum.<unit>` literals. This is the single source of truth for legal target units.

## Dependencies

### Internal

- `./unit` — `targetUnitSchema` for the discriminator.

### External

- `zod`.

<!-- MANUAL: -->
