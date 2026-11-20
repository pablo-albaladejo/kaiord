# Types Module

Type definitions, Zod schemas and type guards for the Workout SPA Editor.
See `AGENTS.md` for the file inventory.

## Usage

Import each module directly; there is no barrel.

### Types

```typescript
import type { RepetitionBlock, Workout, WorkoutStep } from "../types/krd";
```

### Type Guards

Use type guards to distinguish between WorkoutStep and RepetitionBlock:

```typescript
import { isRepetitionBlock, isWorkoutStep } from "../types/krd-guards";

if (isWorkoutStep(item)) {
  // item is WorkoutStep
} else if (isRepetitionBlock(item)) {
  // item is RepetitionBlock
}
```

### Schemas

`schemas.ts` re-exports the core schemas from `@kaiord/core`:

```typescript
import { krdSchema } from "../types/schemas";

const result = krdSchema.safeParse(data);
```

### Error Formatting

```typescript
import { formatZodError } from "../types/validation/formatters";

const errors = formatZodError(result.error); // ValidationError[]
```

## Design Principles

1. **Reuse Core Types** - Import types from `@kaiord/core` instead of duplicating
2. **Type Safety** - Use TypeScript type guards for runtime type checking
3. **Validation at Boundaries** - Validate data where it enters the app

## Dependencies

- `@kaiord/core` - Core KRD types and schemas
- `zod` - Schema validation library
