<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/schemas

## Purpose

Zod runtime validators for GCN JSON payloads. Defines schemas for input (flexible, as sent to Garmin API) and output (strict, as received from API), plus shared enum validators used by both.

## Key Files

| File                                 | Description                                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `garmin-workout-parse.schema.ts`     | Top-level Zod schema for parsing incoming GCN JSON. Entry point for validation before conversion.                            |
| `index.ts`                           | Public exports: all input, output, and common schemas.                                                                       |
| `common/index.ts`                    | Exports all shared enum schemas.                                                                                             |
| `common/sport-type.schema.ts`        | Zod enum for sport types: `running` (1), `cycling` (2), `swimming` (5), `strength_training` (10), `multi_sport` (10).        |
| `common/condition-type.schema.ts`    | Zod enum for step condition types: `open` (1), `lap` (2), `rest` (3), `recover` (4).                                         |
| `common/equipment-type.schema.ts`    | Zod enum for equipment types: `goggles` (5), `kickboard` (6), `pull_buoy` (7), `hand_paddle` (8), `cap` (9), `wetsuit` (10). |
| `common/step-type.schema.ts`         | Zod enum for step types: `active`, `rest`, `repeat`, `warmup`, `cooldown`, `recovery`.                                       |
| `common/stroke-type.schema.ts`       | Zod enum for stroke types: `freestyle` (1), `backstroke` (2), `breaststroke` (3), `butterfly` (4), `mixed` (5), `drill` (6). |
| `common/target-type.schema.ts`       | Zod enum for target types: `speed`, `power`, `heart_rate`, `cadence`, `zone`.                                                |
| `common/unit.schema.ts`              | Zod enum for GCN unit IDs: `meters` (1), `feet` (2), etc.                                                                    |
| `input/index.ts`                     | Exports all input schemas.                                                                                                   |
| `input/types.ts`                     | TypeScript type exports derived from input schemas.                                                                          |
| `input/workout-input.schema.ts`      | Flexible GCN workout input schema (unions, optional fields, flexible target types).                                          |
| `input/workout-input.schema.test.ts` | Unit tests for input schema validation.                                                                                      |
| `input/segment-input.schema.ts`      | Schema for GCN workout segment (part of multisport).                                                                         |
| `input/step-input.schema.ts`         | Schema for GCN workout step (flexible types).                                                                                |
| `input/repeat-input.schema.ts`       | Schema for GCN repeat block structure.                                                                                       |
| `output/index.ts`                    | Exports all output schemas.                                                                                                  |
| `output/types.ts`                    | TypeScript type exports derived from output schemas.                                                                         |
| `output/workout.schema.ts`           | Strict GCN workout output schema (required fields, expanded type objects, server IDs).                                       |
| `output/segment.schema.ts`           | Schema for GCN output segment (with metrics).                                                                                |
| `output/step.schema.ts`              | Schema for GCN output step (strict types, required fields).                                                                  |
| `output/repeat.schema.ts`            | Schema for GCN output repeat block.                                                                                          |
| `output/author.schema.ts`            | Schema for GCN author object (creator metadata).                                                                             |

## Subdirectories

| Directory | Purpose                                                            |
| --------- | ------------------------------------------------------------------ |
| `common/` | Shared enum and type validators (see `common/AGENTS.md`).          |
| `input/`  | Flexible input schemas for API submission (see `input/AGENTS.md`). |
| `output/` | Strict output schemas for API responses (see `output/AGENTS.md`).  |

## For AI Agents

### Working In This Directory

**Schema Layer Organization:**

**Common** (`common/`):

- Enum validators shared by input and output.
- Examples: sport types, condition types, equipment, stroke, step type, unit, target type.
- No discriminated unions here; simple Zod enums.

**Input** (`input/`):

- Flexible schemas for GCN payloads **sent to** Garmin Connect API.
- Accept strings OR numbers for target values (union types).
- Minimal type objects (just ID and key, optional displayOrder).
- Optional fields for sparse payloads.
- Use `Zod.discriminatedUnion()` for step type discrimination.

**Output** (`output/`):

- Strict schemas for GCN payloads **received from** Garmin Connect API.
- Always return numbers (floats) for numeric fields.
- Expanded type objects with `displayOrder`, `unitId`, `factor` fields.
- Required server-assigned fields: `workoutId`, `stepId`, `childStepId`, `createdAt`, `updatedAt`.
- Global `stepOrder` across all segments.

**Input vs Output Asymmetry:**
This is by design and enforced at the schema level. The Garmin API has fundamentally different input and output contracts:

- Input: flexible, permissive, minimal.
- Output: strict, complete, server-expanded.

### Testing Requirements

**Schema Tests:**

- `input/workout-input.schema.test.ts` validates input schema against real payloads.
- Coverage: 80%+ for schema validation logic.

**Test Conventions:**

- Every `it()` title starts with `"should "`.
- Every `it()` body has `// Arrange`, `// Act`, `// Assert` sections.

**Example Test:**

```typescript
it("should parse input workout with flexible target types", () => {
  // Arrange
  const payload = { sportType: { sportTypeId: 1 }, workoutName: "Run", ... };

  // Act
  const result = workoutInputSchema.safeParse(payload);

  // Assert
  expect(result.success).toBe(true);
  expect(result.data.sportType.sportTypeId).toBe(1);
});
```

### Common Patterns

**Zod Union Types (Input):**

```typescript
// Flexible input: accept string OR number for targets
const targetValueSchema = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v));
```

**Zod Discriminated Union (Step Types):**

```typescript
// Discriminate by stepType field
const stepUnion = z.discriminatedUnion("stepType", [
  activeStepSchema,
  restStepSchema,
  repeatStepSchema,
]);
```

**Optional Server Fields (Output):**

```typescript
// Server-assigned IDs in output
const workoutOutputSchema = z.object({
  workoutId: z.number(), // server-assigned
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // ...
});
```

**Enum Re-exports:**

```typescript
// common/sport-type.schema.ts
export const sportTypeSchema = z.enum(["running", "cycling", "swimming", ...]);
export type SportType = z.infer<typeof sportTypeSchema>;

// input/workout-input.schema.ts
import { sportTypeSchema } from "../common/sport-type.schema";
```

### Error Handling

**Validation Failures:**

- Converters catch `safeParse()` failures and throw `createGarminParsingError()`.
- Include field path and detailed error message for debugging.
- Example: `"workoutSegments[0].workoutSteps[1].sportType: expected number, got string"`.

**Type Safety:**

- Derived types (`SportType`, `WorkoutInput`, etc.) ensure type safety downstream.
- Use `z.infer<typeof schema>` for automatic type inference.

## Dependencies

### Internal

- `@kaiord/core`: For reference (no direct imports; schemas are self-contained).

### External

- `zod@^4.4.3`: Schema validation and inference.

<!-- MANUAL: -->
