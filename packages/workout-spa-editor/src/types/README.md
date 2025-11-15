# Types Module

This module provides type definitions, schemas, and validation utilities for the Workout SPA Editor.

## Structure

```
types/
├── krd.ts           # Core KRD types and type guards
├── schemas.ts       # Zod schemas for validation
├── validation.ts    # Validation helpers and error formatting
├── index.ts         # Public API exports
└── __tests__/       # Unit tests
```

## Usage

### Importing Types

```typescript
import type { Workout, WorkoutStep, RepetitionBlock } from "@/types";
```

### Type Guards

Use type guards to distinguish between WorkoutStep and RepetitionBlock:

```typescript
import { isWorkoutStep, isRepetitionBlock } from "@/types";

const item: WorkoutStep | RepetitionBlock = getItem();

if (isWorkoutStep(item)) {
  // TypeScript knows item is WorkoutStep
  console.log(item.stepIndex);
} else if (isRepetitionBlock(item)) {
  // TypeScript knows item is RepetitionBlock
  console.log(item.repeatCount);
}
```

### Validation

#### Validate Complete Workout

```typescript
import { validateWorkout } from "@/types";

const result = validateWorkout(data);

if (result.success) {
  // data is valid
  console.log(result.data);
} else {
  // data is invalid
  console.error(result.errors);
}
```

#### Validate Partial Data (Forms)

```typescript
import { validatePartialWorkoutStep } from "@/types";

const result = validatePartialWorkoutStep({
  stepIndex: 0,
  durationType: "time",
  // Other fields are optional
});
```

#### Real-time Validation

```typescript
import { createDebouncedValidator, validateWorkoutStep } from "@/types";

const debouncedValidate = createDebouncedValidator(validateWorkoutStep, 300);

// In your form handler
const handleChange = (data: unknown) => {
  debouncedValidate(data, (result) => {
    if (!result.success) {
      setErrors(result.errors);
    }
  });
};
```

### Error Formatting

```typescript
import { formatValidationErrors, getFieldError, hasFieldError } from "@/types";

// Format all errors as string
const errorMessage = formatValidationErrors(errors);

// Get error for specific field
const nameError = getFieldError(errors, ["name"]);

// Check if field has error
if (hasFieldError(errors, ["sport"])) {
  // Show error indicator
}
```

### Schemas

All schemas are re-exported from `@kaiord/core` with additional UI-specific schemas:

```typescript
import {
  workoutSchema,
  workoutStepSchema,
  partialWorkoutStepSchema,
  workoutMetadataFormSchema,
} from "@/types";

// Validate with Zod directly
const result = workoutSchema.safeParse(data);
```

## Type Definitions

### Core Types (from @kaiord/core)

- `Workout` - Complete workout definition
- `WorkoutStep` - Individual workout step
- `RepetitionBlock` - Repetition block with nested steps
- `Duration` - Duration specification
- `Target` - Target specification
- `Intensity` - Intensity level
- `Equipment` - Swimming equipment

### UI Helper Types

- `WorkoutStepWithId` - WorkoutStep with unique ID for React
- `RepetitionBlockWithId` - RepetitionBlock with unique ID
- `WorkoutEditorState` - Editor state management
- `StepFormData` - Form data for step editing
- `ValidationError` - Validation error with path
- `StepEditMode` - Edit mode state
- `DragState` - Drag and drop state

## Validation Schemas

### Complete Validation

- `workoutSchema` - Complete workout
- `workoutStepSchema` - Complete workout step
- `repetitionBlockSchema` - Complete repetition block

### Partial Validation (Forms)

- `partialWorkoutStepSchema` - Partial step (for forms)
- `partialRepetitionBlockSchema` - Partial block (for forms)
- `workoutMetadataFormSchema` - Workout metadata form

## Validation Helpers

### Core Validators

- `validateWorkout(data)` - Validate complete workout
- `validateWorkoutStep(data)` - Validate complete step
- `validateRepetitionBlock(data)` - Validate complete block
- `validatePartialWorkoutStep(data)` - Validate partial step
- `validatePartialRepetitionBlock(data)` - Validate partial block
- `validateWorkoutMetadata(data)` - Validate metadata form

### Error Utilities

- `formatZodError(error)` - Format Zod error to ValidationError[]
- `formatValidationErrors(errors)` - Format errors as string
- `getFieldError(errors, path)` - Get error for specific field
- `hasFieldError(errors, path)` - Check if field has error
- `getNestedErrors(errors, path)` - Get all nested errors
- `mergeValidationErrors(...arrays)` - Merge multiple error arrays

### Advanced Validation

- `createDebouncedValidator(validator, delay)` - Create debounced validator
- `validateField(schema, name, value)` - Validate single field

## Testing

Run tests:

```bash
pnpm test
```

Watch mode:

```bash
pnpm test:watch
```

## Design Principles

1. **Reuse Core Types** - Import types from `@kaiord/core` instead of duplicating
2. **Type Safety** - Use TypeScript type guards for runtime type checking
3. **Validation at Boundaries** - Validate data at form boundaries
4. **Real-time Feedback** - Support debounced validation for better UX
5. **Clear Error Messages** - Format errors for user-friendly display

## Dependencies

- `@kaiord/core` - Core KRD types and schemas
- `zod` - Schema validation library
