<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/schemas/common

## Purpose

Shared Zod enum validators for GCN format types. Used by both input and output schemas.

## Key Files

| File                       | Description                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| `index.ts`                 | Public exports of all common enum schemas.                                                  |
| `sport-type.schema.ts`     | Sport types: `running`, `cycling`, `swimming`, `strength_training`, `multi_sport`.          |
| `condition-type.schema.ts` | Step conditions: `open`, `lap`, `rest`, `recover`.                                          |
| `equipment-type.schema.ts` | Swimming equipment: `goggles`, `kickboard`, `pull_buoy`, `hand_paddle`, `cap`, `wetsuit`.   |
| `step-type.schema.ts`      | Step type discriminators: `active`, `rest`, `repeat`, `warmup`, `cooldown`, `recovery`.     |
| `stroke-type.schema.ts`    | Swimming strokes: `freestyle`, `backstroke`, `breaststroke`, `butterfly`, `mixed`, `drill`. |
| `target-type.schema.ts`    | Target types: `speed`, `power`, `heart_rate`, `cadence`, `zone`.                            |
| `unit.schema.ts`           | Unit IDs: `meters` (1), `feet` (2), etc. for pool info.                                     |

## For AI Agents

### Working In This Directory

**Schema Purpose:**

- Single responsibility: define one enum validator per file.
- File naming: `<domain>-type.schema.ts` or `<domain>.schema.ts`.
- Keep ≤30 LOC; add mappings to mappers if needed (not here).

**Zod Enum Pattern:**

```typescript
// sport-type.schema.ts
export const sportTypeSchema = z.enum([
  "running",
  "cycling",
  "swimming",
  "strength_training",
  "multi_sport",
]);
export type SportType = z.infer<typeof sportTypeSchema>;
```

**Numeric ID Mapping:**

- Numeric IDs (1, 2, 5, etc.) map to enum strings.
- Mapping logic lives in `../mappers/` (e.g., `sport.mapper.ts`).
- Schemas here define the legal enum values only.

### Testing Requirements

**No dedicated tests.** Enums are validated implicitly via:

- Input/output schema tests (`../input/workout-input.schema.test.ts`, etc.).
- Converter tests that use these schemas.

### Common Patterns

**Simple Zod Enum:**

```typescript
export const strokeTypeSchema = z.enum([
  "freestyle",
  "backstroke",
  "breaststroke",
  "butterfly",
  "mixed",
  "drill",
]);
```

**Type Export:**

```typescript
export type StrokeType = z.infer<typeof strokeTypeSchema>;
```

**Re-export in Parent Index:**

```typescript
// common/index.ts
export { sportTypeSchema, type SportType } from "./sport-type.schema";
export { strokeTypeSchema, type StrokeType } from "./stroke-type.schema";
// ...
```

## Dependencies

### External

- `zod@^4.4.3`: Enum validation.

<!-- MANUAL: -->
