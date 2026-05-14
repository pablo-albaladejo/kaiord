<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/schemas/

## Purpose

Zod schema definitions for ZWO domain types. Defines valid values and types for ZWO sport, interval types, and target types. Used for runtime validation and type safety.

## Key Files

| File                | Description                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `zwift-sport.ts`    | Zwift sport enum (bike, run) with mappings to KRD sports                                    |
| `zwift-target.ts`   | Zwift target type definitions (power, pace, HR, cadence)                                    |
| `zwift-interval.ts` | Zwift interval type definitions (SteadyState, Warmup, Ramp, Cooldown, IntervalsT, FreeRide) |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Schema definitions**: Each file exports a Zod schema defining valid ZWO domain values.
- **Sport mapping**: `zwift-sport.ts` defines bidirectional mapping between ZWO sport types (bike, run) and KRD sports (cycling, running).
- **Target types**: `zwift-target.ts` defines all valid target types (power, pace, HR, cadence) for validation.
- **Interval types**: `zwift-interval.ts` enumerates ZWO interval element types.

### Testing Requirements

- No tests for schema files (they are pure definitions). Validation tested in converter tests.

### Common Patterns

- **Sport mapping**:

  ```typescript
  export const zwiftSportSchema = z.enum(["bike", "run"]);
  export const ZWIFT_TO_KRD_SPORT: Record<ZwiftSport, Sport> = { ... };
  export const KRD_TO_ZWIFT_SPORT: Record<Sport, ZwiftSport | undefined> = { ... };
  ```

- **Inferred types**:

  ```typescript
  export type ZwiftSport = z.infer<typeof zwiftSportSchema>;
  ```

- **File structure limits**: Keep each schema file ≤100 lines.

## Dependencies

### Internal

- `@kaiord/core` (Sport, Target, Logger)

### External

- `zod@^4.4.3` (schema validation)

<!-- MANUAL: -->
