<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/schemas/input

## Purpose

Flexible Zod validators for GCN workout payloads sent to Garmin Connect API. Accept permissive input: strings OR numbers for targets, minimal type objects, optional fields.

## Key Files

| File                           | Description                                                           |
| ------------------------------ | --------------------------------------------------------------------- |
| `index.ts`                     | Public exports: `workoutInputSchema`, types.                          |
| `types.ts`                     | TypeScript types derived from input schemas.                          |
| `workout-input.schema.ts`      | Top-level flexible workout schema for API submission.                 |
| `workout-input.schema.test.ts` | Unit tests for input schema validation.                               |
| `segment-input.schema.ts`      | Schema for workout segment (multisport support).                      |
| `step-input.schema.ts`         | Schema for flexible workout step (discriminated union by `stepType`). |
| `repeat-input.schema.ts`       | Schema for repeat block with nested child steps.                      |

## For AI Agents

### Working In This Directory

**Input Schema Philosophy:**

- Permissive validation: accept multiple formats for the same data.
- Example: `workoutName` can be string, `sportType` can be object OR just ID, targets can be numbers OR strings.
- Goals: minimize required fields, accept flexible input from callers.

**Flexible Type Objects:**

```typescript
// Input: accept minimal or object form
const sportTypeInput = z.union([
  z.object({ sportTypeId: z.number() }), // minimal
  z.object({ sportTypeId: z.number(), sportTypeKey: z.string() }), // full
]);
```

**Flexible Target Values:**

```typescript
// Input: accept strings or numbers, coerce to number
const targetValueSchema = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v));
```

**Optional Fields:**

```typescript
// Input: many fields optional for sparse payloads
const stepInputSchema = z.object({
  stepType: stepTypeSchema, // required discriminator
  stepOrder: z.number(), // required
  name: z.string().optional(), // optional
  notes: z.string().optional(), // optional
  // ...
});
```

**Discriminated Union (Step Types):**

```typescript
// Discriminate by stepType field
const stepInputUnion = z.discriminatedUnion("stepType", [
  activeStepInputSchema,
  restStepInputSchema,
  repeatStepInputSchema,
  // ...
]);
```

### Testing Requirements

**Coverage:** 80%+ for input schema validation.

**Test File:** `workout-input.schema.test.ts`

**Test Conventions:**

- Every `it()` title starts with `"should "`.
- Every `it()` body has `// Arrange`, `// Act`, `// Assert` sections.

**Example Tests:**

```typescript
it("should accept numeric or string target values", () => {
  // Arrange
  const payload = {
    workoutName: "Run",
    sportType: { sportTypeId: 1 },
    workoutSegments: [
      {
        workoutSteps: [
          {
            stepType: "active",
            trainingPowerZone: { trainingPowerZoneHigh: 250 }, // number
          },
        ],
      },
    ],
  };

  // Act
  const result = workoutInputSchema.safeParse(payload);

  // Assert
  expect(result.success).toBe(true);
});

it("should accept minimal sportType object (ID only)", () => {
  // Arrange
  const payload = {
    workoutName: "Swim",
    sportType: { sportTypeId: 5 }, // minimal
    // ...
  };

  // Act
  const result = workoutInputSchema.safeParse(payload);

  // Assert
  expect(result.success).toBe(true);
});
```

### Common Patterns

**Union Types for Flexible Input:**

```typescript
export const sportTypeInputSchema = z.union([
  z.object({ sportTypeId: z.number() }),
  z.object({ sportTypeId: z.number(), sportTypeKey: z.string() }),
]);
```

**Transform to Coerce Types:**

```typescript
export const targetValueSchema = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v));
```

**Optional Nested Objects:**

```typescript
export const trainingPowerZoneSchema = z
  .object({
    trainingPowerZoneHigh: targetValueSchema.optional(),
    trainingPowerZoneLow: targetValueSchema.optional(),
  })
  .optional();
```

**Spread Discriminated Union:**

```typescript
const baseStep = z.object({ stepOrder: z.number() });
const activeStep = baseStep.extend({ stepType: z.literal("active"), /* active-specific */ });
const stepUnion = z.discriminatedUnion("stepType", [activeStep, restStep, ...]);
```

## Dependencies

### Internal

- Common schemas: `../common/` enum validators.

### External

- `zod@^4.4.3`: Schema validation and parsing.

<!-- MANUAL: -->
