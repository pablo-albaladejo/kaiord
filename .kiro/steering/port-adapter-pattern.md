# Port-Adapter Pattern (Service Layer)

This document defines how to implement the Port-Adapter pattern for external services in Kaiord, following hexagonal architecture principles.

## Migration Status

✅ **Migration Complete**

The Kaiord codebase has been successfully migrated to use the functional Port-Adapter pattern described in this document. All ports now use direct function types, and all adapters return functions via currying. This migration improved:

- **Testability**: Simpler mocking with `vi.fn<PortType>()`
- **Composability**: Direct function calls without method indirection
- **Type Safety**: Cleaner type inference and contracts
- **Code Clarity**: Reduced boilerplate and more functional style

All code examples in this document reflect the current implementation.

## Overview

This pattern implements **Hexagonal Architecture** (Ports & Adapters) for clean separation between business logic and technical infrastructure. The key principle is **Dependency Inversion**: the application layer defines contracts (ports) that the infrastructure layer implements (adapters).

## Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Business Logic)                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │ use-cases/                                         │    │
│  │   convert-fit-to-krd.ts                            │    │
│  │   - Orchestrates business logic                    │    │
│  │   - Depends on INTERFACES (ports)                  │    │
│  │   - NO external libraries                          │    │
│  │   - NO infrastructure details                      │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓ depends on                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ports/ (PORTS - Interfaces)                        │    │
│  │   fit-reader.ts                                    │    │
│  │   - Defines the SERVICE CONTRACT                   │    │
│  │   - Only types, no implementation                  │    │
│  │   - Pure function signatures                       │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↑ implements
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Technical Details)                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │ adapters/ (ADAPTERS - Implementations)             │    │
│  │   fit/garmin-fitsdk.ts                             │    │
│  │   - Implements the contract                        │    │
│  │   - Technical details (parsing, encoding, logging) │    │
│  │   - External libraries (@garmin/fitsdk)            │    │
│  │   - HTTP, retry logic, error handling              │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Key Rules:**

- Application layer **NEVER** imports from adapters layer
- Application layer **ONLY** depends on ports (interfaces)
- Infrastructure layer **implements** ports defined by application
- Domain layer depends on **nothing** (pure business entities)

## Complete Anatomy

### A) Service Interface (PORT) - Application Layer

**Location:** `packages/core/src/ports/`

```typescript
// ============================================
// ports/fit-reader.ts
// ============================================
import type { KRD } from "../domain/schemas/krd";

// PORT: Defines WHAT the service does, not HOW
export type FitReader = (buffer: Uint8Array) => Promise<KRD>;
```

**Characteristics:**

- Only defines the function type
- No implementation
- Depends only on domain (pure entities)
- Is a contract that infrastructure must fulfill

**Key Difference from Current Pattern:**

- Use **function type** instead of object with methods
- Simpler: `FitReader = (input) => Promise<output>`
- Not: `FitReader = { readToKRD: (input) => Promise<output> }`

### B) Service Implementation (ADAPTER) - Infrastructure Layer

**Location:** `packages/core/src/adapters/`

```typescript
// ============================================
// adapters/fit/garmin-fitsdk.ts
// ============================================
import type { FitReader } from "../../ports/fit-reader";
import type { KRD } from "../../domain/schemas/krd";
import type { Logger } from "../../ports/logger";

// ADAPTER: Implements HOW it's done
export const createGarminFitSdkReader =
  (
    logger: Logger
  ): FitReader => // ← Returns the PORT type
  async (buffer: Uint8Array): Promise<KRD> => {
    // Technical details:
    // - Parsing with @garmin/fitsdk
    // - Error handling
    // - Logging
    // - Validation with Zod

    try {
      logger.debug("Parsing FIT file", { bufferSize: buffer.length });

      const stream = Stream.fromByteArray(Array.from(buffer));
      const decoder = new Decoder(stream);
      const { messages, errors } = decoder.read();

      if (errors.length > 0) {
        throw createFitParsingError(`FIT parsing errors: ${errors.join(", ")}`);
      }

      return mapMessagesToKRD(messages, logger);
    } catch (error) {
      logger.error("Failed to parse FIT file", { error });
      throw createFitParsingError("Failed to parse FIT file", error);
    }
  };
```

**Characteristics:**

- Uses currying to inject technical dependencies (logger, config)
- Returns a function that fulfills the PORT contract
- Contains all technical logic (parsing, retry, logging)
- Implements the `FitReader` type

### C) Usage in Use-Case

```typescript
// ============================================
// application/use-cases/convert-fit-to-krd.ts
// ============================================
import type { FitReader } from "../../ports/fit-reader";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { Logger } from "../../ports/logger";

type ConvertFitToKrdParams = {
  fitBuffer: Uint8Array;
};

export type ConvertFitToKrd = ReturnType<typeof convertFitToKrd>;

export const convertFitToKrd =
  (
    fitReader: FitReader, // ← Receives the PORT
    validator: SchemaValidator,
    logger: Logger
  ) =>
  async (params: ConvertFitToKrdParams): Promise<KRD> => {
    logger.info("Converting FIT to KRD");

    // Use the service without knowing implementation details
    const krd = await fitReader(params.fitBuffer);

    const errors = validator.validate(krd);
    if (errors.length > 0) {
      throw createKrdValidationError("Validation failed", errors);
    }

    logger.info("Conversion successful");
    return krd;
  };
```

## Testing

### A) Use-Case Test (Mock the PORT)

```typescript
// ============================================
// application/use-cases/convert-fit-to-krd.test.ts
// ============================================
import { describe, expect, it, vi } from "vitest";
import type { FitReader } from "../../ports/fit-reader";
import { convertFitToKrd } from "./convert-fit-to-krd";

describe("convertFitToKrd", () => {
  it("should convert FIT buffer to KRD when validation passes", async () => {
    // Arrange
    const fitBuffer = new Uint8Array([1, 2, 3, 4]);
    const expectedKrd = buildKRD.build();

    const mockFitReader = vi.fn<FitReader>().mockResolvedValue(expectedKrd);
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue([]),
    };
    const logger = createMockLogger();

    // Act
    const result = await convertFitToKrd(
      mockFitReader,
      mockValidator,
      logger
    )({ fitBuffer });

    // Assert
    expect(result).toStrictEqual(expectedKrd);
    expect(mockFitReader).toHaveBeenCalledWith(fitBuffer);
    expect(mockValidator.validate).toHaveBeenCalledWith(expectedKrd);
  });
});
```

### B) Service Test (Integration Test)

```typescript
// ============================================
// adapters/fit/garmin-fitsdk.test.ts
// ============================================
import { describe, expect, it } from "vitest";
import { createGarminFitSdkReader } from "./garmin-fitsdk";
import { readFileSync } from "fs";

describe("createGarminFitSdkReader", () => {
  it("should parse valid FIT file", async () => {
    // Arrange
    const buffer = readFileSync("tests/fixtures/fit-files/workout.fit");
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);

    // Act
    const result = await reader(buffer);

    // Assert
    expect(result.version).toBe("1.0");
    expect(result.type).toBe("workout");
    expect(result.workout).toBeDefined();
  });

  it("should throw FitParsingError on corrupted file", async () => {
    // Arrange
    const corruptedBuffer = new Uint8Array([0, 0, 0]);
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);

    // Act & Assert
    await expect(reader(corruptedBuffer)).rejects.toThrow("FitParsingError");
  });
});
```

## Composition at Entry-Points

```typescript
// ============================================
// application/providers.ts
// ============================================
import { createGarminFitSdkReader } from "../adapters/fit/garmin-fitsdk";
import { createConsoleLogger } from "../adapters/logger/console-logger";
import { convertFitToKrd } from "./use-cases/convert-fit-to-krd";

export const createDefaultProviders = (logger?: Logger) => {
  const log = logger || createConsoleLogger();

  // Create services with concrete dependencies
  const fitReader = createGarminFitSdkReader(log);
  const validator = createSchemaValidator();

  // Inject into use-cases
  const convertFitToKrdUseCase = convertFitToKrd(fitReader, validator, log);

  return {
    convertFitToKrd: convertFitToKrdUseCase,
    logger: log,
  };
};
```

## Pattern Benefits

1. **Dependency Inversion:**

   - Application doesn't depend on Infrastructure
   - Infrastructure implements Application contracts

2. **Testability:**

   - Use-cases tested with simple mocks
   - Services tested with real implementations
   - Independent and fast tests

3. **Flexibility:**

   - Change implementation without touching use-cases
   - Multiple implementations of same PORT (fake, real, mock)

4. **Clarity:**
   - PORT defines "what" the service does
   - ADAPTER defines "how" it does it
   - Use-case only knows the "what"

## Migration Checklist

To migrate existing code to this pattern:

1. **Simplify PORT to function type:**

   ```typescript
   // Before
   export type FitReader = {
     readToKRD: (buffer: Uint8Array) => Promise<KRD>;
   };

   // After
   export type FitReader = (buffer: Uint8Array) => Promise<KRD>;
   ```

2. **Update ADAPTER to return function:**

   ```typescript
   // Before
   export const createGarminFitSdkReader = (logger: Logger): FitReader => ({
     readToKRD: async (buffer) => {
       /* ... */
     },
   });

   // After
   export const createGarminFitSdkReader =
     (logger: Logger): FitReader =>
     async (buffer) => {
       /* ... */
     };
   ```

3. **Update use-case calls:**

   ```typescript
   // Before
   const krd = await fitReader.readToKRD(buffer);

   // After
   const krd = await fitReader(buffer);
   ```

4. **Update tests:**

   ```typescript
   // Before
   const mockFitReader: FitReader = {
     readToKRD: vi.fn().mockResolvedValue(expectedKrd),
   };

   // After
   const mockFitReader = vi.fn<FitReader>().mockResolvedValue(expectedKrd);

   // Note: vi.fn<FitReader>() provides type hints but may show type errors in some
   // TypeScript configurations. The mock will work correctly at runtime.
   ```

## Real-World Examples

### Example 1: FIT Reader Service

**PORT (Application Layer):**

```typescript
// ports/fit-reader.ts
import type { KRD } from "../domain/schemas/krd";

export type FitReader = (buffer: Uint8Array) => Promise<KRD>;
```

**ADAPTER (Infrastructure Layer):**

```typescript
// adapters/fit/garmin-fitsdk.ts
import type { FitReader } from "../../ports/fit-reader";
import type { Logger } from "../../ports/logger";
import { Decoder, Stream } from "@garmin/fitsdk";

export const createGarminFitSdkReader =
  (logger: Logger): FitReader =>
  async (buffer: Uint8Array): Promise<KRD> => {
    logger.debug("Parsing FIT file", { bufferSize: buffer.length });

    const stream = Stream.fromByteArray(Array.from(buffer));
    const decoder = new Decoder(stream);
    const { messages, errors } = decoder.read();

    if (errors.length > 0) {
      throw createFitParsingError(`FIT parsing errors: ${errors.join(", ")}`);
    }

    return mapMessagesToKRD(messages, logger);
  };
```

### Example 2: Schema Validator Service

**PORT (Application Layer):**

```typescript
// ports/schema-validator.ts
import type { KRD } from "../domain/schemas/krd";

export type ValidationError = {
  field: string;
  message: string;
};

export type SchemaValidator = (krd: KRD) => Array<ValidationError>;
```

**ADAPTER (Infrastructure Layer):**

```typescript
// adapters/validation/ajv-validator.ts
import type { SchemaValidator } from "../../ports/schema-validator";
import Ajv from "ajv";
import krdSchema from "../../domain/schemas/krd.json";

export const createAjvValidator = (): SchemaValidator => {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(krdSchema);

  return (krd: KRD): Array<ValidationError> => {
    const valid = validate(krd);

    if (valid) {
      return [];
    }

    return (validate.errors || []).map((err) => ({
      field: err.instancePath || "root",
      message: err.message || "Validation error",
    }));
  };
};
```

### Example 3: HTTP Service with Retry Logic

**PORT (Application Layer):**

```typescript
// ports/workout-api-client.ts
import type { Workout } from "../domain/schemas/workout";

export type WorkoutApiClient = (workoutId: string) => Promise<Workout>;
```

**ADAPTER (Infrastructure Layer):**

```typescript
// adapters/http/workout-api-client.ts
import type { WorkoutApiClient } from "../../ports/workout-api-client";
import type { Logger } from "../../ports/logger";
import axios, { type AxiosInstance } from "axios";
import { retry } from "async-retry";
import { workoutSchema } from "../../domain/schemas/workout";

export const createWorkoutApiClient =
  (
    axiosInstance: AxiosInstance,
    logger: Logger,
    config: { retryCount: number; retryTimeout: number }
  ): WorkoutApiClient =>
  async (workoutId: string): Promise<Workout> => {
    logger.debug("Fetching workout", { workoutId });

    const response = await retry(
      async (bail) => {
        try {
          const res = await axiosInstance.get(`/workouts/${workoutId}`);
          return workoutSchema.parse(res.data);
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            bail(error); // Don't retry 404s
            return;
          }
          throw error;
        }
      },
      {
        retries: config.retryCount,
        minTimeout: config.retryTimeout,
        onRetry: (error, attempt) => {
          logger.warn("Retrying workout fetch", { workoutId, attempt, error });
        },
      }
    );

    logger.info("Workout fetched successfully", { workoutId });
    return response;
  };
```

## Advanced Patterns

### Multiple Implementations of Same PORT

You can have multiple adapters implementing the same port:

```typescript
// ports/fit-reader.ts
export type FitReader = (buffer: Uint8Array) => Promise<KRD>;

// adapters/fit/garmin-fitsdk.ts
export const createGarminFitSdkReader = (logger: Logger): FitReader => {
  /* ... */
};

// adapters/fit/custom-parser.ts
export const createCustomFitReader = (logger: Logger): FitReader => {
  /* ... */
};

// adapters/fit/mock-reader.ts (for testing)
export const createMockFitReader =
  (mockData: KRD): FitReader =>
  async () =>
    mockData;
```

Then choose at composition time:

```typescript
// application/providers.ts
export const createDefaultProviders = (config?: { useMock?: boolean }) => {
  const logger = createConsoleLogger();

  const fitReader = config?.useMock
    ? createMockFitReader(mockKRD)
    : createGarminFitSdkReader(logger);

  return {
    convertFitToKrd: convertFitToKrd(fitReader, logger),
  };
};
```

### Composing Multiple Services

Use-cases can depend on multiple ports:

```typescript
// application/use-cases/sync-workout.ts
import type { FitReader } from "../../ports/fit-reader";
import type { WorkoutApiClient } from "../../ports/workout-api-client";
import type { SchemaValidator } from "../../ports/schema-validator";
import type { Logger } from "../../ports/logger";

type SyncWorkoutParams = {
  fitBuffer: Uint8Array;
  workoutId: string;
};

export type SyncWorkout = ReturnType<typeof syncWorkout>;

export const syncWorkout =
  (
    fitReader: FitReader,
    apiClient: WorkoutApiClient,
    validator: SchemaValidator,
    logger: Logger
  ) =>
  async (params: SyncWorkoutParams): Promise<void> => {
    logger.info("Syncing workout", { workoutId: params.workoutId });

    // Use multiple services
    const [localKrd, remoteWorkout] = await Promise.all([
      fitReader(params.fitBuffer),
      apiClient(params.workoutId),
    ]);

    // Validate both
    const localErrors = validator(localKrd);
    const remoteErrors = validator(remoteWorkout);

    if (localErrors.length > 0 || remoteErrors.length > 0) {
      throw createValidationError("Sync validation failed", {
        localErrors,
        remoteErrors,
      });
    }

    // Business logic to merge/sync
    // ...

    logger.info("Workout synced successfully");
  };
```

## Testing Strategies

### Unit Tests (Use-Cases)

Test business logic with mocked ports:

```typescript
describe("syncWorkout", () => {
  it("should sync local and remote workouts", async () => {
    // Arrange
    const mockFitReader = vi.fn<FitReader>().mockResolvedValue(localKrd);
    const mockApiClient = vi
      .fn<WorkoutApiClient>()
      .mockResolvedValue(remoteWorkout);
    const mockValidator = vi.fn<SchemaValidator>().mockReturnValue([]);
    const logger = createMockLogger();

    // Act
    await syncWorkout(
      mockFitReader,
      mockApiClient,
      mockValidator,
      logger
    )({ fitBuffer, workoutId: "123" });

    // Assert
    expect(mockFitReader).toHaveBeenCalledWith(fitBuffer);
    expect(mockApiClient).toHaveBeenCalledWith("123");
    expect(mockValidator).toHaveBeenCalledTimes(2);
  });
});
```

### Integration Tests (Adapters)

Test technical implementation with real dependencies:

```typescript
describe("createWorkoutApiClient", () => {
  it("should fetch workout from API", async () => {
    // Arrange
    nock("http://api.example.com")
      .get("/workouts/123")
      .reply(200, { id: "123", name: "Test Workout" });

    const axiosInstance = axios.create({ baseURL: "http://api.example.com" });
    const logger = createMockLogger();
    const client = createWorkoutApiClient(axiosInstance, logger, {
      retryCount: 3,
      retryTimeout: 100,
    });

    // Act
    const result = await client("123");

    // Assert
    expect(result.id).toBe("123");
    expect(result.name).toBe("Test Workout");
  });

  it("should retry on 500 error", async () => {
    // Arrange
    nock("http://api.example.com")
      .get("/workouts/123")
      .reply(500)
      .get("/workouts/123")
      .reply(200, { id: "123", name: "Test Workout" });

    const client = createWorkoutApiClient(/* ... */);

    // Act
    const result = await client("123");

    // Assert
    expect(result).toBeDefined();
    expect(logger.warn).toHaveBeenCalledWith(
      "Retrying workout fetch",
      expect.any(Object)
    );
  });
});
```

## Best Practices

### ✅ DO

1. **Use function types for PORTs** - Simpler and more functional
2. **Use currying for dependency injection** - Clean and composable
3. **Keep PORTs in `ports/` directory** - Clear separation
4. **Keep ADAPTERs in `adapters/` directory** - Implementation details
5. **Test PORTs with mocks** - Fast unit tests
6. **Test ADAPTERs with real implementations** - Integration tests
7. **One PORT per file** - Single responsibility
8. **Name PORTs by capability** - `FitReader`, not `FitService`
9. **Return PORT type from adapter factory** - Explicit contract fulfillment
10. **Inject all technical dependencies** - Logger, HTTP client, config

### ❌ DON'T

1. **Don't use object with methods for PORTs** - Adds unnecessary complexity
2. **Don't import adapters in use-cases** - Breaks dependency inversion
3. **Don't test implementation details** - Test behavior, not internals
4. **Don't hardcode dependencies** - Always inject via currying
5. **Don't mix PORT and ADAPTER in same file** - Separate concerns
6. **Don't put business logic in adapters** - Keep it in use-cases
7. **Don't make PORTs depend on infrastructure** - Only domain types
8. **Don't create "god services"** - Keep PORTs focused and single-purpose

## Lessons Learned from Migration

### What Went Well

1. **Incremental Migration**: Breaking the refactor into phases (ports → adapters → use-cases → tests) allowed for safe, atomic commits
2. **Type Safety**: TypeScript caught all breaking changes immediately, making the refactor confidence-inspiring
3. **Test Coverage**: Existing comprehensive test suite validated that behavior remained unchanged
4. **Minimal Surface Area**: Only 2 ports (FitReader, FitWriter) meant the migration was focused and manageable

### Key Insights

1. **Function Types Are Simpler**: Direct function types (`type Port = (input) => Promise<output>`) are more intuitive than object-with-methods patterns
2. **Currying Enables Clean DI**: The pattern `(deps) => (params) => result` provides dependency injection without frameworks
3. **Mocking Is Easier**: `vi.fn<PortType>()` is simpler and more type-safe than creating object mocks
4. **No Runtime Impact**: This is purely a structural refactor with zero performance implications

### Recommendations for Future Migrations

1. **Start with Ports**: Update port definitions first to establish the target pattern
2. **Update Adapters Next**: Modify implementations to match new port signatures
3. **Fix Use-Cases**: Update all call sites to use direct function invocation
4. **Update Tests Last**: Modify test mocks to match the new pattern
5. **Run Tests Frequently**: Validate after each phase to catch issues early
6. **Keep Commits Atomic**: Each phase should be a working, committable state

### Pattern Applicability

This pattern works best for:

- **Single-operation services**: Services with one primary function (read, write, validate)
- **Stateless operations**: Pure functions without internal state
- **Composable services**: Services that can be easily combined in use-cases

Consider object-with-methods for:

- **Multi-operation services**: Services with multiple related operations (Logger with debug/info/warn/error)
- **Stateful services**: Services that maintain internal state between calls
- **Complex lifecycle**: Services requiring initialization/cleanup

## Summary

This pattern maintains clean architecture, testability, and flexibility without complex frameworks. It's a functional approach to dependency injection that leverages TypeScript's type system for compile-time safety.

The successful migration of Kaiord's FIT reader/writer ports demonstrates that this pattern scales well for real-world applications while improving code quality and developer experience.
