# Architecture

This document explains how Kaiord is built and organized. It covers the core library architecture and the frontend SPA editor.

## Table of Contents

- [Core Library Architecture](#core-library-architecture)
- [Hexagonal Architecture](#hexagonal-architecture)
- [Use Case Pattern](#use-case-pattern)
- [Schema-First Development](#schema-first-development)
- [Error Handling](#error-handling)
- [SPA Editor Architecture](#spa-editor-architecture)

## Core Library Architecture

Kaiord uses **Hexagonal Architecture** (also called Ports and Adapters) to keep business logic separate from technical details.

### Layer Structure

```
packages/core/src/
├── domain/           # Business rules and data types
│   ├── schemas/      # Zod schemas for KRD format
│   ├── validation/   # Business validators
│   └── types/        # Error types
├── application/      # Use cases (business operations)
├── ports/            # Contracts for external services
├── adapters/         # Implementations for external services
│   ├── fit/          # FIT file format adapter
│   ├── tcx/          # TCX file format adapter
│   └── zwift/        # Zwift file format adapter
└── cli/              # Command-line interface
```

### Dependency Rules

- **domain** depends on nothing (pure business logic)
- **application** depends only on **domain** and **ports**
- **adapters** implement **ports** and can use external libraries
- **cli** depends on **application** (not adapters directly)

This means you can change how files are read/written without touching business logic.

## Hexagonal Architecture

### What is Hexagonal Architecture?

Hexagonal Architecture separates your code into layers:

1. **Domain Layer** - Your business rules (what makes your app unique)
2. **Application Layer** - Your use cases (what your app does)
3. **Ports** - Contracts for external services (what you need from outside)
4. **Adapters** - Implementations of ports (how you connect to outside)

### Why Use It?

- **Testable**: Test business logic without external dependencies
- **Flexible**: Change file formats without changing business logic
- **Clear**: Each layer has a specific purpose
- **Maintainable**: Easy to understand and modify

### Example: FIT File Reading

**Port (Contract)**:

```typescript
// ports/fit-reader.ts
import type { KRD } from "../domain/schemas/krd";

export type FitReader = (buffer: Uint8Array) => Promise<KRD>;
```

**Adapter (Implementation)**:

```typescript
// adapters/fit/garmin-fitsdk.ts
import type { FitReader } from "../../ports/fit-reader";
import { Decoder } from "@garmin/fitsdk";

export const createGarminFitSdkReader =
  (logger: Logger): FitReader =>
  async (buffer: Uint8Array): Promise<KRD> => {
    const decoder = new Decoder(stream);
    const { messages } = decoder.read(buffer);
    return convertMessagesToKRD(messages);
  };
```

**Use Case**:

```typescript
// application/use-cases/convert-fit-to-krd.ts
export const convertFitToKrd =
  (fitReader: FitReader, validator: SchemaValidator) =>
  async (params: { fitBuffer: Uint8Array }): Promise<KRD> => {
    const krd = await fitReader(params.fitBuffer);
    const errors = validator.validate(krd);
    if (errors.length > 0) {
      throw new KrdValidationError("Validation failed", errors);
    }
    return krd;
  };
```

### Schema Organization

#### Domain Schemas (KRD Format)

Domain schemas define the canonical KRD format using **snake_case** for multi-word values:

```
domain/schemas/
├── sport.ts              # sportSchema + Sport type
├── sub-sport.ts          # subSportSchema + SubSport type (snake_case)
├── duration.ts           # durationSchema + Duration type
├── target.ts             # targetSchema + Target type
└── krd.ts                # krdSchema + KRD type
```

Example:

```typescript
// domain/schemas/sub-sport.ts
export const subSportSchema = z.enum([
  "generic",
  "indoor_cycling", // snake_case
  "lap_swimming",
]);
```

#### Adapter Schemas (External Formats)

Adapter schemas represent external formats using **camelCase** to match external SDKs:

```
adapters/fit/schemas/
├── fit-sport.ts          # fitSportSchema + FitSport type
├── fit-sub-sport.ts      # fitSubSportSchema + FitSubSport type (camelCase)
└── fit-duration.ts       # fitDurationTypeSchema + FitDurationType type
```

Example:

```typescript
// adapters/fit/schemas/fit-sub-sport.ts
export const fitSubSportSchema = z.enum([
  "generic",
  "indoorCycling", // camelCase
  "lapSwimming",
]);
```

### Why Separate Schemas?

- **Domain schemas** define the canonical KRD format (single source of truth)
- **Adapter schemas** define external format-specific concepts
- **Clear boundaries** prevent domain contamination
- **Bidirectional mapping** happens in mappers
- **Domain never imports adapters** - maintains architecture integrity

## Use Case Pattern

Use cases are business operations that your application performs. Kaiord uses a functional pattern with currying for dependency injection.

### Structure

```typescript
// Input parameters type
type UseCaseParams = {
  // Parameters for this operation
};

// Exported type (automatically inferred)
export type UseCaseName = ReturnType<typeof useCaseName>;

// Main function with currying for dependency injection
export const useCaseName =
  (dependency1: Dependency1, dependency2: Dependency2) =>
  async (params: UseCaseParams): Promise<ReturnType> => {
    // Business logic here
  };
```

### Key Principles

**Currying for Dependency Injection**:

- First function receives dependencies (services, ports)
- Second function receives operation parameters
- No dependency injection framework needed

**Layer Separation**:

- Use cases depend only on ports (interfaces)
- They don't know about concrete implementations
- Respects Clean Architecture rules

**Type Safety**:

- `ReturnType<typeof useCaseName>` infers the type automatically
- Easy to test with typed mocks
- No duplicate type definitions

### Complete Example

```typescript
// application/use-cases/convert-fit-to-krd.ts
import type { KRD } from "../../domain/schemas/krd";
import type { FitReader } from "../../ports/fit-reader";
import type { SchemaValidator } from "../../domain/validation/schema-validator";

type ConvertFitToKrdParams = {
  fitBuffer: Uint8Array;
};

export type ConvertFitToKrd = ReturnType<typeof convertFitToKrd>;

export const convertFitToKrd =
  (fitReader: FitReader, validator: SchemaValidator) =>
  async (params: ConvertFitToKrdParams): Promise<KRD> => {
    const krd = await fitReader(params.fitBuffer);

    const errors = validator.validate(krd);
    if (errors.length > 0) {
      throw new KrdValidationError("Validation failed", errors);
    }

    return krd;
  };
```

### Testing Use Cases

```typescript
import { describe, expect, it, vi } from "vitest";
import type { FitReader } from "../../ports/fit-reader";
import { convertFitToKrd } from "./convert-fit-to-krd";

describe("convertFitToKrd", () => {
  it("should convert FIT buffer to KRD", async () => {
    // Arrange
    const fitBuffer = new Uint8Array([1, 2, 3, 4]);
    const expectedKrd = buildKRD.build();

    const mockFitReader = vi.fn<FitReader>().mockResolvedValue(expectedKrd);
    const mockValidator = { validate: vi.fn().mockReturnValue([]) };

    // Act
    const result = await convertFitToKrd(
      mockFitReader,
      mockValidator
    )({
      fitBuffer,
    });

    // Assert
    expect(result).toStrictEqual(expectedKrd);
    expect(mockFitReader).toHaveBeenCalledWith(fitBuffer);
  });
});
```

### Composition at Entry Points

```typescript
// CLI or API handlers
import { convertFitToKrd } from "../application/use-cases/convert-fit-to-krd";
import { createFitReader } from "../adapters/fit/garmin-fitsdk";
import { createSchemaValidator } from "../domain/validation/schema-validator";

// Create concrete implementations
const fitReader = createFitReader(logger);
const validator = createSchemaValidator();

// Create use case with dependencies
const convertFitToKrdUseCase = convertFitToKrd(fitReader, validator);

// Execute
const krd = await convertFitToKrdUseCase({ fitBuffer });
```

### Benefits

1. **Testability**: Easy to mock dependencies
2. **Type Safety**: TypeScript infers types automatically
3. **Composition**: Composable and reusable
4. **Clean Architecture**: Respects dependency inversion
5. **No Frameworks**: No decorators or DI containers needed
6. **Immutability**: Pure functions without shared state

## Schema-First Development

Kaiord uses **Zod as the single source of truth** for schemas and TypeScript types.

### Core Principles

1. **Schema → Type**: Define Zod schemas first, infer types after
2. **Validation at boundaries**: Validate at entry points (CLI, adapters)
3. **Reusable domain schemas**: Shared schemas in `domain/schemas/`
4. **No internal validation**: Use cases receive already-validated types

### Naming Conventions

```typescript
// ✅ Correct: camelCase + "Schema" suffix
export const krdMetadataSchema = z.object({ ... });
export const workoutStepSchema = z.object({ ... });
export const sportSchema = z.enum(["cycling", "running", "swimming"]);

// ✅ Infer types with z.infer
export type KRDMetadata = z.infer<typeof krdMetadataSchema>;
export type WorkoutStep = z.infer<typeof workoutStepSchema>;
export type Sport = z.infer<typeof sportSchema>;

// ❌ Incorrect
export type KRDMetadata = { ... };  // Don't define types manually
const KRDMetadata = z.object({ ... }); // Wrong case
export const sportEnum = z.enum([...]); // Wrong suffix
```

### Schema → Type Pattern

```typescript
// domain/schemas/duration.ts
import { z } from "zod";

// 1. Define Zod schema
export const durationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("time"),
    seconds: z.number().positive(),
  }),
  z.object({
    type: z.literal("distance"),
    meters: z.number().positive(),
  }),
  z.object({
    type: z.literal("open"),
  }),
]);

// 2. Infer TypeScript type
export type Duration = z.infer<typeof durationSchema>;
```

### Enum Schemas

Use `z.enum()` for enumeration types:

```typescript
// ✅ Correct: Enum schema with runtime validation
export const sportSchema = z.enum([
  "cycling",
  "running",
  "swimming",
  "generic",
]);
export type Sport = z.infer<typeof sportSchema>;

// Access enum values via .enum property
sportSchema.enum.cycling; // "cycling"
sportSchema.enum.running; // "running"

// Validate at runtime
const result = sportSchema.safeParse("cycling");
if (result.success) {
  console.log(result.data); // "cycling"
}

// ❌ Incorrect: Constant object (deprecated)
export const SPORT_TYPE = {
  CYCLING: "cycling",
  RUNNING: "running",
} as const;
```

### Validation at Boundaries

**CLI Commands**:

```typescript
// packages/cli/src/commands/convert.ts
import { z } from "zod";

const cliArgsSchema = z.object({
  input: z.string(),
  output: z.string(),
  format: z.enum(["fit", "tcx", "zwo"]),
});

export const convertCommand = async (args: unknown) => {
  // Validate at boundary
  const validated = cliArgsSchema.parse(args);

  // Pass validated types to use case
  return await convertFileUseCase(validated);
};
```

**Adapters**:

```typescript
// adapters/fit/garmin-fitsdk.ts
import { krdSchema } from "../../domain/schemas/krd";

export const createFitReader =
  (logger: Logger): FitReader =>
  async (buffer: Uint8Array): Promise<KRD> => {
    const decoder = new Decoder(stream);
    const rawData = decoder.read(buffer);

    // Convert to KRD
    const krd = convertFitMessagesToKRD(rawData.messages);

    // Validate result before returning
    return krdSchema.parse(krd);
  };
```

### Best Practices

**✅ Do**:

1. Define Zod schemas first, types after
2. Use `z.enum()` for enumeration types
3. Use `z.discriminatedUnion` for variants
4. Validate at boundaries (CLI, adapters)
5. Access enum values via `.enum` property
6. Use `.safeParse()` for validation
7. Separate domain and adapter schemas

**❌ Don't**:

1. Don't define TypeScript types manually
2. Don't use constant objects for enums
3. Don't use TypeScript `enum` keyword
4. Don't validate in use cases
5. Don't duplicate schemas
6. Don't use `z.any()` without justification
7. Don't maintain JSON Schema manually

## Error Handling

Kaiord uses custom Error classes that follow Clean Architecture principles.

### Core Principles

1. **Define errors in domain layer** - Custom Error classes with domain entities
2. **Transform at boundaries** - Convert external errors to domain errors in adapters
3. **Propagate upward** - Let errors bubble up to entry points
4. **Log at entry points** - Structured logging only at application boundaries
5. **Never silence errors** - Always handle or propagate, never ignore

### Error Flow

```
Domain Layer
  ↓ Define custom Error classes

Application Layer
  ↓ Propagate domain errors (add context if needed)

Adapters Layer
  ↓ Catch external errors, transform to domain errors

Entry Points (CLI)
  ↓ Catch all errors, log, format response
```

### Domain Error Classes

All domain errors extend `Error`:

```typescript
export class FitParsingError extends Error {
  public override readonly name = "FitParsingError";

  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FitParsingError);
    }
  }
}
```

### Current Domain Errors

**FitParsingError** - FIT file parsing failures:

```typescript
throw new FitParsingError("Failed to parse FIT file", originalError);
```

**KrdValidationError** - KRD schema validation failures:

```typescript
throw new KrdValidationError("KRD validation failed", [
  { field: "version", message: "Required field missing" },
]);
```

**ToleranceExceededError** - Round-trip tolerance violations:

```typescript
throw new ToleranceExceededError("Round-trip conversion exceeded tolerance", [
  { field: "power", expected: 250, actual: 252, deviation: 2, tolerance: 1 },
]);
```

### Error Transformation in Adapters

Adapters catch external library errors and transform to domain errors:

```typescript
// adapters/fit/garmin-fitsdk.ts
export const createFitReader =
  (logger: Logger): FitReader =>
  async (buffer: Uint8Array): Promise<KRD> => {
    try {
      const decoder = new Decoder(stream);
      return decoder.read(buffer);
    } catch (error) {
      // Transform external error to domain error
      throw new FitParsingError("Failed to parse FIT file", error);
    }
  };
```

### Error Handling in Use Cases

Use cases generally **do not** catch errors - they propagate:

```typescript
// application/use-cases/convert-fit-to-krd.ts
export const convertFitToKrd =
  (fitReader: FitReader, validator: SchemaValidator) =>
  async (params: { fitBuffer: Uint8Array }): Promise<KRD> => {
    // No try-catch - let errors propagate
    const krd = await fitReader(params.fitBuffer);

    const errors = validator.validate(krd);
    if (errors.length > 0) {
      throw new KrdValidationError("KRD validation failed", errors);
    }

    return krd;
  };
```

### Error Handling at Entry Points

CLI commands catch all errors, log them, and format user-friendly messages:

```typescript
// packages/cli/src/commands/convert.ts
export const convertCommand = async (args: ConvertArgs) => {
  try {
    const result = await convertFitToKrd({ fitBuffer: buffer });
    console.log("✓ Conversion successful");
    return result;
  } catch (error) {
    // Log with structure
    logger.error("Conversion failed", {
      command: "convert",
      input: args.input,
      error: serializeError(error),
    });

    // User-friendly messages
    if (error instanceof FitParsingError) {
      console.error(`Error: Failed to parse FIT file`);
      console.error(`Details: ${error.message}`);
      process.exit(1);
    }

    if (error instanceof KrdValidationError) {
      console.error(`Error: Invalid KRD format`);
      console.error(`Validation errors:`);
      for (const err of error.errors) {
        console.error(`  - ${err.field}: ${err.message}`);
      }
      process.exit(1);
    }

    // Unknown error
    console.error(`Error: An unexpected error occurred`);
    console.error(error);
    process.exit(1);
  }
};
```

### Best Practices

**✅ Do**:

1. Extend Error class for all domain errors
2. Use descriptive names ending in "Error"
3. Add context properties for debugging
4. Preserve stack traces
5. Transform at boundaries (adapters)
6. Log at entry points only
7. Use instanceof for error type checking

**❌ Don't**:

1. Don't use plain objects for errors
2. Don't catch without re-throwing in use cases
3. Don't log multiple times for same error
4. Don't silence errors with empty catch blocks
5. Don't use string error codes instead of classes
6. Don't lose stack traces when wrapping errors

## SPA Editor Architecture

The Workout SPA Editor is a mobile-first React application for creating and editing KRD workout files.

### Key Technologies

- **React 19** - UI framework
- **TypeScript 5** - Type safety
- **Vite 7** - Build tool
- **Zustand 5** - State management
- **Zod 3** - Schema validation
- **Radix UI** - Accessible components
- **Tailwind CSS 4** - Styling

### Architecture Principles

**1. Mobile-First Design**:

- Touch-friendly interactions (44x44px minimum)
- Responsive layouts
- Optimized for small screens

**2. Atomic Design**:

Components organized by complexity:

```
Atoms → Molecules → Organisms → Templates → Pages
```

**3. Separation of Concerns**:

- **Components** - Presentation logic
- **Store** - State management
- **Utils** - Data transformation
- **Types** - Type definitions

**4. Type Safety**:

- TypeScript strict mode
- No `any` types
- Zod schemas for validation
- Type inference from schemas

**5. Accessibility First**:

- WCAG 2.1 AA compliance
- Semantic HTML
- ARIA attributes
- Keyboard navigation
- Screen reader support

### Component Hierarchy

**Atoms** (Basic Building Blocks):

- `Button` - UI button with variants
- `Input` - Form input with validation
- `Badge` - Status indicator
- `Icon` - Icon wrapper

**Molecules** (Simple Combinations):

- `StepCard` - Workout step display
- `DurationPicker` - Duration input
- `TargetPicker` - Target input
- `FileUpload` - File upload with validation

**Organisms** (Complex Components):

- `WorkoutList` - List of workout steps
- `StepEditor` - Step editing form
- `WorkoutStats` - Statistics display

**Templates** (Page Layouts):

- `MainLayout` - Main application layout

**Pages** (Route Components):

- `WelcomeSection` - File upload page
- `WorkoutSection` - Main editor page

### State Management

The application uses Zustand for global state:

```typescript
interface WorkoutStore {
  // State
  currentWorkout: KRD | null;
  workoutHistory: KRD[];
  historyIndex: number;
  selectedStepId: string | null;
  isEditing: boolean;

  // Actions
  loadWorkout: (krd: KRD) => void;
  updateWorkout: (krd: KRD) => void;
  selectStep: (id: string | null) => void;
  setEditing: (editing: boolean) => void;
  undo: () => void;
  redo: () => void;
}
```

**Features**:

- Undo/Redo history (max 50 states)
- Optimized selectors with memoization
- Pure action functions
- Type-safe with TypeScript

### Data Flow

Unidirectional data flow:

```
User Action
    ↓
Component Event Handler
    ↓
Store Action
    ↓
State Update
    ↓
Component Re-render
```

### Validation Strategy

All validation uses Zod schemas from `@kaiord/core`:

**Validation Points**:

1. **File Upload** - Validate file format and schema
2. **User Input** - Real-time validation during editing
3. **Before Save** - Final validation before file save

**Error Messages**:

User-friendly and actionable:

```typescript
// Good: "Duration must be a positive number"
// Good: "Power zone must be between 1 and 7"
```

### Performance Optimizations

- **Code Splitting**: Automatic by Vite
- **Memoization**: `useMemo` and `useCallback`
- **Optimized Re-renders**: `React.memo` and selective subscriptions
- **Build Optimizations**: Minification, tree shaking, code splitting

### Accessibility

**WCAG 2.1 AA Compliance**:

- Semantic HTML
- Color contrast ratios (4.5:1 minimum)
- Keyboard navigation
- Focus indicators
- Screen reader support
- ARIA attributes

**Keyboard Shortcuts**:

- **Tab** - Navigate between elements
- **Enter/Space** - Activate buttons
- **Escape** - Close dialogs
- **Ctrl+Z** - Undo
- **Ctrl+Y** - Redo
- **Ctrl+S** - Save

### Testing Strategy

**Test Pyramid**:

```
       E2E Tests (Playwright)
      /                    \
     /  Integration Tests   \
    /                        \
   /      Unit Tests          \
  /__________________________ \
```

- **Unit Tests**: Component rendering, interactions, state updates
- **Integration Tests**: Component interactions, form submissions
- **E2E Tests**: Complete user flows, mobile responsiveness

## References

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Zod Documentation](https://zod.dev)
- [React Documentation](https://react.dev/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
