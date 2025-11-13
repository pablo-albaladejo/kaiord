# Code Style

## General

- TS strict; ESLint + Prettier; **NO `any` types allowed** (implicit or explicit) without explicit justification
- **Files ≤ 100 lines** (excluding test files) - enforced by ESLint `max-lines` rule - split into smaller modules if needed
- Functions < 40 LOC; SRP; SOLID - enforced by ESLint `max-lines-per-function` rule
- No `console.log` in libraries (inject logger if needed)
- Naming: `toKRD`, `fromKRD`, `parseX`, `writeX`
- Prefer `Array<T>` for public types
- **Avoid redundant type annotations** - let TypeScript infer types when possible
- **Use constants for magic strings** - define protocol/API constants in `constants.ts`

## ESLint Configuration

The project uses ESLint with the following key rules:

- **max-lines**: Maximum 100 lines per file (excluding blank lines and comments)
  - Automatically disabled for test files (`*.test.ts`, `*.spec.ts`, `tests/**/*.ts`)
- **max-lines-per-function**: Maximum 40 lines per function (warning level)
- **@typescript-eslint/no-explicit-any**: Error on explicit `any` types
- **@typescript-eslint/consistent-type-definitions**: Enforce `type` over `interface`
- **@typescript-eslint/consistent-type-imports**: Enforce separate type imports

Run `pnpm lint` to check all files, or `pnpm lint:packages` to check each package individually.

```typescript
// ✅ Preferred - Constants defined and used
// constants.ts
export const FIT_TARGET_TYPE = {
  POWER: "power",
  HEART_RATE: "heartRate",
  CADENCE: "cadence",
} as const;

export const KRD_TARGET_TYPE = {
  POWER: "power",
  HEART_RATE: "heart_rate",
  CADENCE: "cadence",
} as const;

// mapper.ts
if (targetType === FIT_TARGET_TYPE.POWER) {
  return { type: KRD_TARGET_TYPE.POWER };
}

// ❌ Avoid - Hardcoded strings
if (targetType === "power") {
  return { type: "power" };
}
```

```typescript
// ✅ Preferred - Type inference
const metadata = buildKRDMetadata.build({ created: "2025-01-15T10:30:00Z" });

// ❌ Avoid - Redundant annotation
const metadata: KRDMetadata = buildKRDMetadata.build({
  created: "2025-01-15T10:30:00Z",
});
```

## Type Definitions

- **Use `type` instead of `interface`** for all type definitions
- Prefer type aliases for better composition and union types

```typescript
// ✅ Preferred
export type KRD = {
  version: string;
  type: "workout" | "activity";
};

// ❌ Avoid
export interface KRD {
  version: string;
  type: "workout" | "activity";
}
```

## Implementation Style

- **Use functions instead of classes** (functional programming style)
- **Factory functions** (e.g., `createValidator()`) instead of constructors
- **Pure functions** where possible, avoiding mutable state
- **Composition over inheritance**

```typescript
// ✅ Preferred - Factory function
export type Validator = {
  validate: (data: unknown) => ValidationError[];
};

export const createValidator = (): Validator => ({
  validate: (data) => {
    /* ... */
  },
});

// ❌ Avoid - Class-based
export class Validator {
  validate(data: unknown) {
    /* ... */
  }
}
```

## Import Style

- **Separate type imports from value imports** using `import type`
- **Avoid barrel imports** (index.ts re-exports) - import directly from source files

```typescript
// ✅ Preferred - Separate type imports
import { readFile } from "./file-reader";
import type { FileOptions } from "./file-reader";

// ✅ Preferred - Direct imports
import { createValidator } from "./domain/validation/schema-validator";
import type { ValidationError } from "./domain/validation/schema-validator";

// ❌ Avoid - Mixed imports
import { readFile, FileOptions } from "./file-reader";

// ❌ Avoid - Barrel imports
import { createValidator } from "./domain"; // re-exported from index.ts
```

## Comments

- **Only comment complex logic or non-obvious decisions**
- **Never describe what the code does** - the code should be self-explanatory
- **Avoid obvious comments** - they add noise without value

```typescript
// ❌ Avoid - Obvious comments
// Create a validator
const validator = createValidator();

// Loop through errors
for (const error of errors) {
  // Log the error
  logger.error(error.message);
}

// ✅ Preferred - Only comment non-obvious decisions
// Using FTP percentage instead of absolute watts because
// the user's FTP may change between workout creation and execution
const powerTarget = { unit: "percent_ftp", value: 85 };

// ✅ Preferred - Comment complex algorithms
// Binary search for optimal cadence zone (O(log n))
// Zones are pre-sorted by lower bound
const findZone = (cadence: number, zones: Array<Zone>): Zone => {
  // ... complex implementation
};
```

## File Organization

- **Maximum 100 lines per file** (excluding test files)
- **Split large files by responsibility**:
  - Types → `types.ts`
  - Mappers → `*.mapper.ts` (data transformation between formats)
  - Validators → `*.validator.ts`
  - Utilities → `*.utils.ts`
- **Co-locate related files** in the same directory
- **Use descriptive file names** that indicate purpose
- **Use dot notation** for file suffixes (e.g., `duration.mapper.ts` not `duration-mapper.ts`)

```typescript
// Example: FIT adapter split into focused modules
adapters/fit/
├── garmin-fitsdk.ts          // Main entry point (< 100 lines)
├── types.ts                   // Type definitions
├── metadata.mapper.ts         // Metadata mapping logic
├── duration.mapper.ts         // Duration mapping logic
├── target.mapper.ts           // Target mapping logic
├── step.mapper.ts             // Step mapping logic
└── workout.mapper.ts          // Workout mapping logic
```

## Type Guards

- **Use type guard functions instead of hardcoded property checks**
- **Never use `"propertyName" in object`** - create type-safe guard functions
- **Co-locate type guards** in a dedicated file (e.g., `type-guards.ts`)

```typescript
// ✅ Preferred - Type guard functions
// type-guards.ts
import type {
  RepetitionBlock,
  WorkoutStep,
} from "../../domain/schemas/workout";

export const isRepetitionBlock = (
  step: WorkoutStep | RepetitionBlock
): step is RepetitionBlock => {
  return "repeatCount" in step;
};

export const isWorkoutStep = (
  step: WorkoutStep | RepetitionBlock
): step is WorkoutStep => {
  return "stepIndex" in step;
};

// Usage in mapper
import { isRepetitionBlock } from "../type-guards";

for (const step of workout.steps) {
  if (isRepetitionBlock(step)) {
    // TypeScript knows step is RepetitionBlock here
    processRepetition(step.repeatCount);
  } else {
    // TypeScript knows step is WorkoutStep here
    processStep(step.stepIndex);
  }
}

// ❌ Avoid - Hardcoded property checks
if ("repeatCount" in step) {
  // No type safety, magic string
  processRepetition(step.repeatCount);
}

// ❌ Avoid - Constants for property names
const TYPE_GUARD_PROPERTY = {
  REPEAT_COUNT: "repeatCount",
} as const;

if (TYPE_GUARD_PROPERTY.REPEAT_COUNT in step) {
  // Still not type-safe, adds unnecessary indirection
  processRepetition(step.repeatCount);
}
```

## Testing

- **Follow AAA pattern** (Arrange, Act, Assert) for all tests
- Use blank lines to separate the three sections
- Keep each section focused and minimal
- **Test files are exempt from the 100-line limit**

```typescript
// ✅ Preferred - AAA pattern
test("should validate KRD against schema", () => {
  // Arrange
  const validator = createSchemaValidator(mockLogger);
  const invalidKrd = { version: "1.0" }; // missing required fields

  // Act
  const errors = validator.validate(invalidKrd);

  // Assert
  expect(errors).toHaveLength(2);
  expect(errors[0].field).toBe("type");
  expect(errors[1].field).toBe("metadata");
});

// ❌ Avoid - Mixed sections
test("should validate KRD against schema", () => {
  const validator = createSchemaValidator(mockLogger);
  expect(validator).toBeDefined();
  const invalidKrd = { version: "1.0" };
  const errors = validator.validate(invalidKrd);
  expect(errors).toHaveLength(2);
});
```
