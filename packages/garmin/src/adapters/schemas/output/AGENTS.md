<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/schemas/output

## Purpose

Strict Zod validators for GCN workout payloads returned by Garmin Connect API. Enforce required fields, numeric types (no strings), and expanded type objects with server-assigned IDs.

## Key Files

| File                | Description                                                           |
| ------------------- | --------------------------------------------------------------------- |
| `index.ts`          | Public exports: all output schemas and types.                         |
| `types.ts`          | TypeScript types derived from output schemas.                         |
| `workout.schema.ts` | Top-level strict workout schema for API responses.                    |
| `segment.schema.ts` | Schema for API response segment (with metrics, server IDs).           |
| `step.schema.ts`    | Schema for strict API response step (required fields, numeric types). |
| `repeat.schema.ts`  | Schema for API response repeat block.                                 |
| `author.schema.ts`  | Schema for author object (creator metadata in API response).          |

## For AI Agents

### Working In This Directory

**Output Schema Philosophy:**

- Strict validation: enforce all required fields and numeric types.
- Reflect API contract: server-assigned IDs, timestamps, expanded type objects.
- Goal: guarantee type safety and completeness of API responses.

**Required Numeric Fields:**

```typescript
// Output: all numeric fields required (no strings)
const targetValueSchema = z.number();
```

**Expanded Type Objects:**

```typescript
// Output: expand with displayOrder, unitId, factor
const sportTypeOutputSchema = z.object({
  sportTypeId: z.number(),
  sportTypeKey: z.string(),
  displayOrder: z.number(), // new in output
  // ...
});
```

**Server-Assigned Fields:**

```typescript
// Output: workoutId, stepId, timestamps always present
const workoutOutputSchema = z.object({
  workoutId: z.number(), // server-assigned
  createdAt: z.string().datetime(), // server-assigned
  updatedAt: z.string().datetime(), // server-assigned
  workoutSegments: z.array(segmentOutputSchema),
  // ...
});
```

**Required Nested Objects:**

```typescript
// Output: all target structures required (not optional unions)
const trainingPowerZoneSchema = z.object({
  trainingPowerZoneHigh: z.number(), // required, not optional
  trainingPowerZoneLow: z.number(),
});
```

### Testing Requirements

**Schema Validation:**

- Output schemas are validated implicitly via round-trip tests (API responses parsed against output schema).
- No dedicated `output/output.schema.test.ts` (test coverage via integration tests).
- Coverage tracked as part of converter tests that use output schemas.

**Round-Trip Testing:**

- Real API responses in `test-fixtures/gcn/*Output.gcn` validate output schema conformance.
- Converters parse outputs via `workoutOutputSchema.parse()` (strict mode, throws on validation failure).

### Common Patterns

**Strict Numeric Types:**

```typescript
export const targetValueSchema = z.number(); // no union, no string fallback
```

**Required Nested Objects:**

```typescript
export const trainingPowerZoneSchema = z.object({
  trainingPowerZoneHigh: z.number(),
  trainingPowerZoneLow: z.number(),
}); // not optional, not union
```

**Server-Assigned Metadata:**

```typescript
export const workoutSchema = z.object({
  workoutId: z.number(), // from server
  createdAt: z.string().datetime(), // ISO 8601
  updatedAt: z.string().datetime(),
  author: authorSchema, // expanded object
  workoutSegments: z.array(segmentSchema),
  // ...
});
```

**Required Arrays:**

```typescript
// Output: workoutSegments is always present, non-empty
export const workoutSegmentsSchema = z.array(segmentSchema).min(1);
```

**Discriminated Union (Step Types):**

```typescript
// Output: discriminate by stepType, all variants required
const stepOutputUnion = z.discriminatedUnion("stepType", [
  activeStepOutputSchema,
  restStepOutputSchema,
  repeatStepOutputSchema,
  // ...
]);
```

## Dependencies

### Internal

- Common schemas: `../common/` enum validators.

### External

- `zod@^4.4.3`: Schema validation and parsing.

<!-- MANUAL: -->
