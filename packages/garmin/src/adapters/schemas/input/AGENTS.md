<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-11-09 -->

# src/adapters/schemas/input

## Purpose

Input-side step shapes for the GCN workout payloads the converters build before they are sent to Garmin Connect. Only the step schema and the types derived from it live here: the workout, segment and repeat-group runtime schemas were removed because nothing outside their own test parsed with them.

## Key Files

| File                   | Description                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `step-input.schema.ts` | Zod schema for an executable step (`ExecutableStepDTOInput` is inferred from it).  |
| `types.ts`             | `GarminWorkoutStepInput` and `RepeatGroupDTOInputType`, the recursive step unions. |

## For AI Agents

- There is no `index.ts`: converters import `./types` and `./step-input.schema` directly.
- Enum validators come from `../common/` (do not duplicate them here).
- Keep `RepeatGroupDTOInputType` in sync by hand with the repeat-group shape the converters emit; it is a plain type, not inferred.

## Dependencies

- Internal: `../common/` enum validators.
- External: `zod`.
