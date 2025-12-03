# Code Style

## General

- TS strict; ESLint + Prettier; **NO `any` types allowed** (implicit or explicit) without explicit justification
- **Files ≤ 100 lines** (excluding test files) - enforced by ESLint `max-lines` rule - split into smaller modules if needed
- Functions < 40 LOC; SRP; SOLID - enforced by ESLint `max-lines-per-function` rule
- No `console.log` in libraries (inject logger if needed)
- Naming: `toKRD`, `fromKRD`, `parseX`, `writeX`
- Prefer `Array<T>` for public types
- **Avoid redundant type annotations** - let TypeScript infer types when possible
- **Use Zod schemas for enumerations** - define enum schemas instead of constant objects (see Schema Naming Conventions below)

## ESLint Configuration

The project uses ESLint with the following key rules:

- **max-lines**: Maximum 100 lines per file (excluding blank lines and comments)
  - Automatically disabled for test files (`*.test.ts`, `*.spec.ts`, `tests/**/*.ts`)
  - Automatically disabled for public API entry points (`**/src/index.ts`, `**/index.ts`)
    - Reason: These files only contain exports with no logic
- **max-lines-per-function**: Maximum 40 lines per function (warning level)
- **@typescript-eslint/no-explicit-any**: Error on explicit `any` types
- **@typescript-eslint/consistent-type-definitions**: Enforce `type` over `interface`
- **@typescript-eslint/consistent-type-imports**: Enforce separate type imports

Run `pnpm lint` to check all files, or `pnpm lint:packages` to check each package individually.

## Schema Naming Conventions

All enumeration types MUST be defined as Zod schemas, not constant objects. This provides runtime validation and type inference.

### Naming Pattern

| Element                      | Pattern                  | Example                                            |
| ---------------------------- | ------------------------ | -------------------------------------------------- |
| Enum schema variable         | `{concept}Schema`        | `sportSchema`, `subSportSchema`, `intensitySchema` |
| Object/Union schema variable | `{concept}Schema`        | `durationSchema`, `targetSchema`, `workoutSchema`  |
| Inferred type                | `{Concept}` (PascalCase) | `Sport`, `SubSport`, `Duration`                    |
| FIT adapter enum             | `fit{Concept}Schema`     | `fitSportSchema`, `fitSubSportSchema`              |
| FIT adapter type             | `Fit{Concept}`           | `FitSport`, `FitSubSport`                          |

**Note**: All Zod schemas use the `Schema` suffix, regardless of whether they are enums, objects, or unions. This provides consistency and clarity.

### Domain vs Adapter Schemas

- **Domain schemas** (in `domain/schemas/`) use **snake_case** for multi-word enum values
- **Adapter schemas** (in `adapters/fit/schemas/`) use **camelCase** to match external SDKs

```typescript
// ✅ Preferred - Zod enum schemas
// domain/schemas/sub-sport.ts
export const subSportSchema = z.enum([
  "generic",
  "indoor_cycling", // snake_case for KRD
  "lap_swimming",
]);
export type SubSport = z.infer<typeof subSportSchema>;

// adapters/fit/schemas/fit-sub-sport.ts
export const fitSubSportSchema = z.enum([
  "generic",
  "indoorCycling", // camelCase for FIT SDK
  "lapSwimming",
]);
export type FitSubSport = z.infer<typeof fitSubSportSchema>;

// mapper.ts - Access enum values via .enum property
import { subSportSchema } from "../../domain/schemas/sub-sport";
import { fitSubSportSchema } from "./schemas/fit-sub-sport";

if (fitSubSport === fitSubSportSchema.enum.indoorCycling) {
  return subSportSchema.enum.indoor_cycling;
}

// ❌ Avoid - Constant objects (deprecated pattern)
export const FIT_TARGET_TYPE = {
  POWER: "power",
  HEART_RATE: "heartRate",
} as const;

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
  - Mappers → `*.mapper.ts` (simple data transformation, NO logic)
  - Converters → `*.converter.ts` (complex transformations WITH logic)
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
├── metadata.mapper.ts         // Simple metadata mapping (no logic)
├── duration/
│   ├── duration.mapper.ts    // Simple duration mapping (delegates to converter)
│   └── duration.converter.ts // Duration conversion logic (has tests)
├── target/
│   ├── target.mapper.ts      // Simple target mapping (delegates to converter)
│   └── target.converter.ts   // Target conversion logic (has tests)
└── workout.mapper.ts          // Workout mapping (no logic)
```

## Mappers vs Converters

### Mappers (\*.mapper.ts)

**Purpose**: Simple, declarative data transformation with NO business logic

**Characteristics**:

- Direct field mapping (e.g., `fitField` → `krdField`)
- Enum lookups from static maps
- Simple validation with `.safeParse()` and default fallback
- Delegates complex logic to converters
- **NO tests** - coverage comes from integration/round-trip tests

```typescript
// ✅ Good mapper - Simple, no logic
export const mapSubSportToKrd = (fitSubSport: unknown): SubSport => {
  const result = fitSubSportSchema.safeParse(fitSubSport);
  if (!result.success) return subSportSchema.enum.generic;
  return FIT_TO_KRD_MAP[result.data] || subSportSchema.enum.generic;
};

// ❌ Bad mapper - Has logic, should be a converter
export const mapDuration = (step: FitWorkoutStep): Duration => {
  if (step.durationType === "time") {
    return { type: "time", seconds: step.durationValue * 1000 }; // Calculation!
  }
  if (step.durationType === "distance") {
    return { type: "distance", meters: step.durationValue / 100 }; // Calculation!
  }
  return { type: "open" };
};
```

### Converters (\*.converter.ts)

**Purpose**: Complex transformations with business logic, calculations, or conditional behavior

**Characteristics**:

- Mathematical calculations (unit conversions, offsets)
- Conditional logic based on multiple fields
- Data validation with error handling
- Complex object construction
- **MUST have tests** - coverage target ≥ 90%

```typescript
// ✅ Good converter - Has logic, needs tests
export const convertPowerTarget = (step: WorkoutStep): FitTarget => {
  if (step.target.value.unit === "watts") {
    // Garmin encoding: absolute watts need +1000 offset
    return { targetValue: step.target.value.value + 1000 };
  }
  if (step.target.value.unit === "percent_ftp") {
    // Garmin encoding: percentage FTP has no offset
    return { targetValue: step.target.value.value };
  }
  if (step.target.value.unit === "zone") {
    return { targetPowerZone: step.target.value.value };
  }
  throw new Error(`Unsupported power unit: ${step.target.value.unit}`);
};
```

**Rule of thumb**: If you're writing a test for a mapper, it has too much logic and should be refactored into a converter.

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

## React Component Prop Spreading

When creating React components that forward props to DOM elements, you must explicitly destructure all component-specific props to avoid React warnings about unrecognized DOM attributes.

### The Problem

React warns when component-specific props are spread onto DOM elements:

```typescript
// ❌ Avoid - Component props leak to DOM
export const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>(
  ({ customProp, onCustomEvent, className = "", ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        {/* Warning: React does not recognize `customProp` on a DOM element */}
      </div>
    );
  }
);
```

### The Solution

Explicitly destructure ALL component-specific props before spreading:

```typescript
// ✅ Preferred - Only HTML attributes spread to DOM
export const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>(
  (
    {
      // Component-specific props (explicitly destructured)
      customProp,
      onCustomEvent,
      anotherCustomProp,
      // HTML attributes (can be spread)
      className = "",
      ...htmlProps // Only contains valid HTML attributes
    },
    ref
  ) => {
    return (
      <div ref={ref} className={className} {...htmlProps}>
        {/* No warnings - only HTML attributes are spread */}
      </div>
    );
  }
);
```

### Type Definition Pattern

Define component props by extending HTML element attributes:

```typescript
// ✅ Preferred - Clear separation of concerns
export type MyComponentProps = HTMLAttributes<HTMLDivElement> & {
  customProp: string;
  onCustomEvent?: () => void;
  anotherCustomProp?: number;
};

// Alternative: Explicit separation with Omit (for complex cases)
type MyComponentOwnProps = {
  customProp: string;
  onCustomEvent?: () => void;
  anotherCustomProp?: number;
};

export type MyComponentProps = MyComponentOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MyComponentOwnProps>;
```

### Naming Convention

Use descriptive names for the spread variable:

```typescript
// ✅ Preferred - Clear intent
const MyComponent = ({ customProp, ...htmlProps }, ref) => (
  <div {...htmlProps} />
);

// ✅ Also acceptable
const MyComponent = ({ customProp, ...domProps }, ref) => (
  <div {...domProps} />
);

// ❌ Avoid - Generic names
const MyComponent = ({ customProp, ...rest }, ref) => <div {...rest} />;
const MyComponent = ({ customProp, ...props }, ref) => <div {...props} />;
```

### Complete Example

```typescript
import { forwardRef, type HTMLAttributes } from "react";

// Type definition
export type RepetitionBlockCardProps = HTMLAttributes<HTMLDivElement> & {
  block: RepetitionBlock;
  onEditRepeatCount?: (count: number) => void;
  onAddStep?: () => void;
  onRemoveStep?: (index: number) => void;
  onDelete?: () => void;
  selectedStepIds?: readonly string[];
  isDragging?: boolean;
};

// Component implementation
export const RepetitionBlockCard = forwardRef<
  HTMLDivElement,
  RepetitionBlockCardProps
>(
  (
    {
      // Component-specific props (ALL explicitly destructured)
      block,
      onEditRepeatCount,
      onAddStep,
      onRemoveStep,
      onDelete,
      selectedStepIds,
      isDragging = false,
      // HTML attributes
      className = "",
      ...htmlProps // Only HTML attributes remain
    },
    ref
  ) => {
    const classes = `base-classes ${isDragging ? "dragging" : ""} ${className}`;

    return (
      <div
        ref={ref}
        className={classes}
        data-testid="repetition-block-card"
        {...htmlProps} // Safe to spread - only HTML attributes
      >
        {/* Component content */}
      </div>
    );
  }
);

RepetitionBlockCard.displayName = "RepetitionBlockCard";
```

### Testing Prop Spreading

Verify components don't produce React warnings:

```typescript
import { expectNoReactWarnings } from "@/test-utils/console-spy";

describe("MyComponent prop handling", () => {
  it("should not produce React warnings", () => {
    // Arrange
    const warningChecker = expectNoReactWarnings();

    // Act
    render(
      <MyComponent
        customProp="value"
        onCustomEvent={vi.fn()}
        data-testid="test" // Valid HTML attribute
        aria-label="Test" // Valid HTML attribute
      />
    );

    // Assert
    warningChecker.verify();
  });

  it("should forward HTML attributes to DOM element", () => {
    // Arrange & Act
    render(
      <MyComponent
        customProp="value"
        data-testid="custom-attr"
        aria-label="Custom Label"
      />
    );

    // Assert
    const element = screen.getByTestId("custom-attr");
    expect(element).toHaveAttribute("aria-label", "Custom Label");
  });
});
```

### Best Practices

#### ✅ DO

1. **Explicitly destructure ALL component-specific props** before spreading
2. **Use descriptive names** like `htmlProps` or `domProps` for the spread
3. **Extend HTML element types** (`HTMLAttributes<HTMLDivElement>`)
4. **Test for absence of warnings** using console spy utilities
5. **Forward refs** when components wrap DOM elements
6. **Preserve HTML attributes** (data-\*, aria-\*, etc.)

#### ❌ DON'T

1. **Don't spread props without destructuring** component-specific ones
2. **Don't use generic names** like `...rest` or `...props` for DOM spreads
3. **Don't ignore React warnings** in the console
4. **Don't mix component and HTML props** in the same spread
5. **Don't forget to test** that HTML attributes are forwarded correctly

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
