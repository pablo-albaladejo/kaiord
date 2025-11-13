---
inclusion: always
---

# Use-Case Pattern — Currying with Dependency Injection

This repository implements Clean Architecture with a Dependency Injection pattern using Currying (Higher-Order Functions).

## Use-Case Structure

Each use-case follows this structure:

```typescript
// Input parameters type
type UseCaseParams = {
  // Use-case specific parameters
};

// Exported use-case type (automatically inferred)
export type UseCaseName = ReturnType<typeof useCaseName>;

// Main function with currying for DI
export const useCaseName =
  (dependency1: Dependency1, dependency2: Dependency2) =>
  async (params: UseCaseParams): Promise<ReturnType> => {
    // Use-case logic
  };
```

## Key Principles

### Currying for Dependency Injection

- **First function**: receives dependencies (repositories, services, ports)
- **Second function**: receives use-case parameters
- Allows dependency injection without DI frameworks

### Layer Separation

- Use-cases only depend on interfaces (ports) in `ports/`
- They don't know concrete infrastructure implementations
- They respect Clean Architecture rules

### Type Safety

- `ReturnType<typeof useCaseName>` automatically infers the type
- Facilitates testing with typed mocks
- No need to duplicate type definitions

## Complete Example

```typescript
// ============================================
// application/use-cases/convert-fit-to-krd.ts
// ============================================
import type { KRD } from "../../domain/schemas/krd";
import type { FitReader } from "../../ports/fit-reader";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { Logger } from "../../ports/logger";

type ConvertFitToKrdParams = {
  fitBuffer: Uint8Array;
};

export type ConvertFitToKrd = ReturnType<typeof convertFitToKrd>;

export const convertFitToKrd =
  (fitReader: FitReader, validator: SchemaValidator, logger: Logger) =>
  async (params: ConvertFitToKrdParams): Promise<KRD> => {
    logger.info("Converting FIT to KRD");

    const krd = await fitReader.readToKRD(params.fitBuffer);

    const errors = validator.validate(krd);
    if (errors.length > 0) {
      throw createKrdValidationError("Validation failed", errors);
    }

    logger.info("Conversion successful");
    return krd;
  };
```

## Use-Case Testing

```typescript
// ============================================
// application/use-cases/convert-fit-to-krd.test.ts
// ============================================
import { describe, expect, it, vi } from "vitest";
import type { FitReader } from "../../ports/fit-reader";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import { convertFitToKrd } from "./convert-fit-to-krd";

describe("convertFitToKrd", () => {
  it("should convert FIT buffer to KRD when validation passes", async () => {
    // Arrange
    const fitBuffer = new Uint8Array([1, 2, 3, 4]);
    const expectedKrd = buildKRD.build();

    const mockFitReader: FitReader = {
      readToKRD: vi.fn().mockResolvedValue(expectedKrd),
    };
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
    expect(mockFitReader.readToKRD).toHaveBeenCalledWith(fitBuffer);
    expect(mockValidator.validate).toHaveBeenCalledWith(expectedKrd);
  });

  it("should throw error when validation fails", async () => {
    // Arrange
    const fitBuffer = new Uint8Array([1, 2, 3, 4]);
    const validationErrors = [{ field: "version", message: "Invalid version" }];

    const mockFitReader: FitReader = {
      readToKRD: vi.fn().mockResolvedValue(buildKRD.build()),
    };
    const mockValidator: SchemaValidator = {
      validate: vi.fn().mockReturnValue(validationErrors),
    };
    const logger = createMockLogger();

    // Act & Assert
    await expect(
      convertFitToKrd(mockFitReader, mockValidator, logger)({ fitBuffer })
    ).rejects.toThrow();
  });
});
```

## Composition at Entry-Points

```typescript
// ============================================
// CLI or API handlers
// ============================================
import { convertFitToKrd } from "../application/use-cases/convert-fit-to-krd";
import { createFitReader } from "../adapters/fit/garmin-fitsdk";
import { createSchemaValidator } from "../domain/validation/schema-validator";
import { createConsoleLogger } from "../adapters/logger/console-logger";

// Composition: inject concrete implementations
const fitReader = createFitReader(logger);
const validator = createSchemaValidator();
const logger = createConsoleLogger();

// Use-case ready to use
const convertFitToKrdUseCase = convertFitToKrd(fitReader, validator, logger);

// Execute
const krd = await convertFitToKrdUseCase({ fitBuffer });
```

## Pattern Benefits

1. **Testability**: Easy to mock dependencies without frameworks
2. **Type Safety**: TypeScript infers types automatically
3. **Composition**: Composable and reusable
4. **Clean Architecture**: Respects dependency inversion
5. **No Frameworks**: No need for decorators or DI containers
6. **Immutability**: Pure functions without shared state

## Implementation Rules

1. **One use-case per file** with verb-phrase name
2. **Export inferred type** with `ReturnType<typeof>`
3. **First function** receives dependencies (ports, services)
4. **Second function** receives use-case parameters
5. **Pure business logic** without direct side effects
6. **Throw domain errors** when necessary
7. **Co-located test** with same name + `.test.ts`
8. **Parameters in object** to facilitate extensibility

## Anti-Patterns to Avoid

### ❌ Avoid: Object pattern with execute method

```typescript
// DON'T DO THIS
export type ConvertFitToKrd = {
  execute: (fitBuffer: Uint8Array) => Promise<KRD>;
};

export const createConvertFitToKrd = (
  fitReader: FitReader
): ConvertFitToKrd => ({
  execute: async (fitBuffer: Uint8Array) => {
    // ...
  },
});
```

### ✅ Prefer: Direct currying

```typescript
// DO THIS
export type ConvertFitToKrd = ReturnType<typeof convertFitToKrd>;

export const convertFitToKrd =
  (fitReader: FitReader) =>
  async (params: { fitBuffer: Uint8Array }): Promise<KRD> => {
    // ...
  };
```

### ❌ Avoid: Multiple positional parameters

```typescript
// DON'T DO THIS
export const convertFitToKrd =
  (fitReader: FitReader) =>
  async (fitBuffer: Uint8Array, validate: boolean): Promise<KRD> => {
    // ...
  };
```

### ✅ Prefer: Parameters object

```typescript
// DO THIS
type ConvertFitToKrdParams = {
  fitBuffer: Uint8Array;
  validate?: boolean;
};

export const convertFitToKrd =
  (fitReader: FitReader) =>
  async (params: ConvertFitToKrdParams): Promise<KRD> => {
    // ...
  };
```

## Migrating Existing Use-Cases

If you find use-cases with the old pattern (object with `execute` method):

1. Remove the object type with `execute`
2. Change to function with currying
3. Use `ReturnType<typeof>` for the exported type
4. Wrap parameters in typed object
5. Update tests to use the new pattern
6. Update composition points (CLI, API)

This pattern is elegant, functional, and maintains clean architecture without the need for heavy DI frameworks.
