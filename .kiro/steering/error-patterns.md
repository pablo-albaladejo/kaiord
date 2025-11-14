# Error Handling Patterns for Kaiord

This document defines error handling patterns for Kaiord, adapted from Clean Architecture principles.

## Core Principles

1. **Define errors in domain layer** - Custom Error classes co-located with related entities
2. **Transform at boundaries** - Convert external errors to domain errors in adapters
3. **Propagate upward** - Let errors bubble up to entry points (CLI/API)
4. **Log at entry points** - Structured logging only at application boundaries
5. **Never silence errors** - Always handle or propagate, never ignore

## Error Flow

```
Domain Layer (packages/core/src/domain)
  ↓ Define custom Error classes

Application Layer (packages/core/src/application)
  ↓ Propagate domain errors (add context if needed)

Adapters Layer (packages/core/src/adapters)
  ↓ Catch external errors, transform to domain errors

Entry Points (packages/cli/src)
  ↓ Catch all errors, log, format response
```

## Domain Error Classes

All domain errors extend `Error` and follow this pattern:

```typescript
export class DomainErrorName extends Error {
  public override readonly name = "DomainErrorName";

  constructor(
    message: string,
    public readonly additionalContext?: unknown
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DomainErrorName);
    }
  }
}
```

### Current Domain Errors

**FitParsingError** - FIT file parsing failures

```typescript
throw new FitParsingError("Failed to parse FIT file", originalError);
```

**KrdValidationError** - KRD schema validation failures

```typescript
throw new KrdValidationError("KRD validation failed", [
  { field: "version", message: "Required field missing" },
  { field: "type", message: "Invalid value" },
]);
```

**ToleranceExceededError** - Round-trip tolerance violations

```typescript
throw new ToleranceExceededError("Round-trip conversion exceeded tolerance", [
  {
    field: "power",
    expected: 250,
    actual: 252,
    deviation: 2,
    tolerance: 1,
  },
]);
```

## Factory Functions

Each error class has a factory function for functional programming style:

```typescript
export const createFitParsingError = (
  message: string,
  cause?: unknown
): FitParsingError => new FitParsingError(message, cause);
```

Use either pattern:

- `new FitParsingError(message)` - Direct instantiation
- `createFitParsingError(message)` - Factory function

Both are valid and provide the same benefits.

## Error Transformation in Adapters

Adapters catch external library errors and transform to domain errors:

```typescript
// adapters/fit/garmin-fitsdk.ts
export const createFitReader = (logger: Logger): FitReader => ({
  readToKRD: async (buffer: Uint8Array): Promise<KRD> => {
    try {
      const decoder = new Decoder(stream);
      return decoder.read(buffer);
    } catch (error) {
      // Transform external error to domain error
      throw new FitParsingError("Failed to parse FIT file", error);
    }
  },
});
```

### Type Guards for External Errors

Use type guards to identify specific external errors:

```typescript
type GarminFitError = {
  code: string;
  message: string;
};

const isGarminFitError = (error: unknown): error is GarminFitError => {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string'
  );
};

// Usage
catch (error) {
  if (isGarminFitError(error) && error.code === 'CORRUPTED_FILE') {
    throw new FitParsingError('FIT file is corrupted', error);
  }
  throw new FitParsingError('Failed to parse FIT file', error);
}
```

## Error Handling in Use Cases

Use cases generally **do not** catch errors - they propagate:

```typescript
// application/use-cases/convert-fit-to-krd.ts
export const createConvertFitToKrd = (
  fitReader: FitReader,
  validator: SchemaValidator,
  logger: Logger
) => ({
  execute: async (buffer: Uint8Array): Promise<KRD> => {
    // No try-catch - let errors propagate
    const krd = await fitReader.readToKRD(buffer);

    const errors = validator.validate(krd);
    if (errors.length > 0) {
      throw new KrdValidationError("KRD validation failed", errors);
    }

    return krd;
  },
});
```

## Error Handling at Entry Points (CLI)

CLI commands catch all errors, log them, and format user-friendly messages:

```typescript
// packages/cli/src/commands/convert.ts
export const convertCommand = async (args: ConvertArgs) => {
  try {
    const providers = createDefaultProviders();
    const result = await providers.convertFitToKrd.execute(buffer);

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

    if (error instanceof ToleranceExceededError) {
      console.error(`Error: Round-trip conversion failed`);
      console.error(`Tolerance violations:`);
      for (const v of error.violations) {
        console.error(
          `  - ${v.field}: expected ${v.expected}, got ${v.actual}`
        );
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

## Logging Patterns

### Structured Logging

Always use structured logging with context:

```typescript
logger.error("Operation failed", {
  operation: "convertFitToKrd",
  input: filename,
  error: {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause: error.cause,
  },
});
```

### Log Levels by Error Type

| Error Type                    | Level   | Reason                            |
| ----------------------------- | ------- | --------------------------------- |
| Validation errors (Zod)       | `warn`  | Expected user input errors        |
| Domain errors                 | `warn`  | Expected business rule violations |
| External errors (transformed) | `error` | Unexpected external failures      |
| Unknown errors                | `error` | Completely unexpected             |

## Testing Error Handling

### Test Error Instantiation

```typescript
it("should create error with correct properties", () => {
  // Arrange
  const message = "Test error";
  const cause = new Error("Original");

  // Act
  const error = new FitParsingError(message, cause);

  // Assert
  expect(error).toBeInstanceOf(Error);
  expect(error).toBeInstanceOf(FitParsingError);
  expect(error.message).toBe("Test error");
  expect(error.cause).toBe(cause);
  expect(error.stack).toBeDefined();
});
```

### Test Error Catching

```typescript
it("should throw FitParsingError on invalid buffer", async () => {
  // Arrange
  const invalidBuffer = new Uint8Array([0, 0, 0]);

  // Act & Assert
  await expect(fitReader.readToKRD(invalidBuffer)).rejects.toThrow(
    FitParsingError
  );
});
```

### Test Error Transformation

```typescript
it("should transform external error to domain error", async () => {
  // Arrange
  const mockDecoder = {
    read: vi.fn().mockRejectedValue(new Error("External error")),
  };

  // Act & Assert
  try {
    await fitReader.readToKRD(buffer);
    expect.fail("Should have thrown");
  } catch (error) {
    expect(error).toBeInstanceOf(FitParsingError);
    expect(error.cause).toBeDefined();
  }
});
```

## Best Practices

### ✅ DO

1. **Extend Error class** for all domain errors
2. **Use descriptive names** ending in "Error"
3. **Add context properties** for debugging
4. **Preserve stack traces** with `Error.captureStackTrace`
5. **Transform at boundaries** (adapters)
6. **Log at entry points** only
7. **Use instanceof** for error type checking

### ❌ DON'T

1. **Don't use plain objects** for errors
2. **Don't catch without re-throwing** in use cases
3. **Don't log multiple times** for same error
4. **Don't silence errors** with empty catch blocks
5. **Don't use string error codes** instead of classes
6. **Don't lose stack traces** when wrapping errors

## Error Class Naming Conventions

- Suffix: `Error` (not `Exception`)
- Location: Co-located with related domain entities
- Examples:
  - `FitParsingError` - in `domain/types/errors.ts`
  - `KrdValidationError` - in `domain/types/errors.ts`
  - `ToleranceExceededError` - in `domain/types/errors.ts`

## Benefits of This Approach

1. **Stack traces** - Automatic stack trace preservation
2. **Type safety** - `instanceof` checks work naturally
3. **Debugging** - Rich context in error properties
4. **Tooling** - Works with Sentry, logging libraries, etc.
5. **Standards** - Follows JavaScript/TypeScript conventions
6. **Functional style** - Factory functions available for FP style

## References

- [Error Handling in Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Node.js Error Handling Best Practices](https://nodejs.org/en/docs/guides/error-handling/)
- [MDN: Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
