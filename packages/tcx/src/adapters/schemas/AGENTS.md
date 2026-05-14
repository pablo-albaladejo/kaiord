<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 -->

# schemas

## Purpose

Zod schemas and enum mappings for TCX domain types (sport, duration, target). Provides bidirectional mapping between TCX camelCase and KRD snake_case enums. Pure module: no side effects, zero imports beyond zod and @kaiord/core types.

## Key Files

| File              | Description                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `tcx-sport.ts`    | Sport enum mapping: TCX (Running, Biking, Other) ↔ KRD (running, cycling, swimming, generic). Zod schema validation. |
| `tcx-duration.ts` | Duration type enum. Zod schema for time/distance validation.                                                         |
| `tcx-target.ts`   | Target type enum. Zod schema for zone/range targets.                                                                 |

## Subdirectories

None. Pure schemas only.

## For AI Agents

### Working In This Directory

**Schema Files Are Pure:**

- No imports except `zod` and `@kaiord/core` type-only imports.
- No side effects, no function calls, no state.
- Safe to import anywhere without circular dependencies.

**Sport Mapping (Canonical Example):**

```typescript
// TCX sport enum (Garmin standard)
export const tcxSportSchema = z.enum(["Running", "Biking", "Other"]);
export type TcxSport = z.infer<typeof tcxSportSchema>;

// Bidirectional mappings
export const TCX_TO_KRD_SPORT: Record<TcxSport, Sport> = {
  Running: "running",
  Biking: "cycling",
  Other: "generic", // fallback for unknown sports
};

export const KRD_TO_TCX_SPORT: Record<Sport, TcxSport> = {
  running: "Running",
  cycling: "Biking",
  swimming: "Other", // swimming not in TCX; map to Other
  generic: "Other",
};
```

**Usage Pattern (Converters):**

```typescript
// In a converter, validate then map:
import { tcxSportSchema, TCX_TO_KRD_SPORT } from "../schemas/tcx-sport";

const tcxSportRaw = tcxWorkout.Sport;
const tcxSport = tcxSportSchema.parse(tcxSportRaw); // throws on invalid
const krdSport = TCX_TO_KRD_SPORT[tcxSport];
```

**Enum Access:**

- Converters use `.enum` property to list allowed values:
  ```typescript
  tcxSportSchema.enum.Running; // type-safe access
  Object.values(tcxSportSchema.enum); // iterate all values
  ```

**Duration Type Schema:**

- Defines allowed TCX duration element types (time vs. distance).
- Used in converters to validate extracted duration structure.

**Target Type Schema:**

- Defines allowed TCX target elements (zone vs. range).
- Maps to KRD target types (zone, custom_range).

### Testing Requirements

**Coverage:** Not typically tested (pure schemas, no logic).

- Schemas are validated at import time by TypeScript strict mode.
- Converter tests validate mappings indirectly (e.g., round-trip tests).

**If Tests Exist:**

- Validate Zod schema parsing (both valid and invalid inputs).
- Verify bidirectional mappings are consistent (no gaps or overlaps).

### Common Patterns

**Exporting Mappings:**

```typescript
// Always export both directions
export const TCX_TO_KRD_MAPPING: Record<TcxEnum, KrdEnum> = { /* ... */ };
export const KRD_TO_TCX_MAPPING: Record<KrdEnum, TcxEnum> = { /* ... */ };

// Export schema for validation
export const tcxEnumSchema = z.enum([...]);
export type TcxEnum = z.infer<typeof tcxEnumSchema>;
```

**Accessing Enum Values (Type-Safe):**

```typescript
// DO: Use schema.enum property
const val = tcxSportSchema.enum.Running;

// DON'T: String literals (no type checking)
const val = "Running"; // not type-safe
```

**Handling Unknown Values:**

- Converters should use `.parse()` and catch validation errors.
- Fallback to `generic` or `Other` for unmapped values (log warning).

**Bidirectional Consistency:**

- Every TCX value must map to a KRD value (no gaps).
- Every KRD value should ideally map to a TCX value (may be collapsing if lossy conversion).
- Document lossy mappings (e.g., swimming → Other) in comments.

## Dependencies

### Internal

- `@kaiord/core`: Sport, DurationType, Target types (type-only imports).

### External

- `zod@^4.4.3`: Schema definitions and type inference.
