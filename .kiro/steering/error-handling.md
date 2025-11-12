# Error Handling & Logging

## Error Handling Philosophy

### Error Bubbling Principle

Errors are **created or propagated upward**, never swallowed:

1. **Create errors at the point of failure** - when something goes wrong, create a descriptive error
2. **Propagate errors up the call stack** - don't catch and handle errors in lower layers
3. **Handle errors at the outermost layer** - error handling logic lives in CLI/application boundary
4. **Preserve error context** - wrap errors with additional context as they bubble up
5. **No silent failures** - all errors must be either handled or propagated

### Error Handling by Layer

```
CLI/Application Layer
  ↑ Handle errors here (user-friendly messages, exit codes)
  |
Application Use Cases
  ↑ Propagate errors (add context if needed)
  |
Ports/Adapters
  ↑ Create errors (wrap external library errors)
  |
Domain Logic
  ↑ Create errors (validation failures, business rule violations)
```

### Example

```typescript
// ❌ Avoid - Catching and handling in adapter
export const readFitFile = async (buffer: Uint8Array): Promise<KRD> => {
  try {
    const decoder = new Decoder(stream);
    return decoder.read();
  } catch (error) {
    console.error("Failed to read FIT file"); // DON'T DO THIS
    return null; // DON'T SWALLOW ERRORS
  }
};

// ✅ Preferred - Create and propagate
export const readFitFile = async (buffer: Uint8Array): Promise<KRD> => {
  try {
    const decoder = new Decoder(stream);
    return decoder.read();
  } catch (error) {
    throw createFitParsingError("Failed to parse FIT file", error);
  }
};

// ✅ Handle at CLI boundary
const main = async () => {
  try {
    const krd = await convertFitToKrd(buffer);
    console.log("Success!");
  } catch (error) {
    if (error.name === "FitParsingError") {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
    throw error; // Unknown errors propagate
  }
};
```

## Logging

### Logger Interface

All logging must go through an injectable logger interface:

```typescript
export type Logger = {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
};
```

### Logging Rules

1. **Never use `console.log` directly** in library code
2. **Always inject logger** via dependency injection
3. **Default to console logger** for development
4. **Allow custom loggers** for production use
5. **Use structured logging** with context objects
6. **Use appropriate log levels**:
   - `debug`: Detailed diagnostic information
   - `info`: General informational messages
   - `warn`: Warning messages (e.g., unknown FIT message types)
   - `error`: Error messages (before throwing)

### Example

```typescript
// ❌ Avoid - Direct console usage
export const parseWorkout = (data: unknown) => {
  console.log("Parsing workout..."); // DON'T DO THIS
  if (!isValid(data)) {
    console.error("Invalid data"); // DON'T DO THIS
  }
};

// ✅ Preferred - Injected logger
export const createWorkoutParser = (logger: Logger) => ({
  parse: (data: unknown) => {
    logger.debug("Parsing workout", { dataType: typeof data });
    if (!isValid(data)) {
      logger.error("Invalid workout data", { data });
      throw createValidationError("Invalid workout data");
    }
    logger.info("Workout parsed successfully");
    return workout;
  },
});
```

### Default Logger Implementation

```typescript
// adapters/logger/console-logger.ts
export const createConsoleLogger = (): Logger => ({
  debug: (message, context) => console.debug(message, context),
  info: (message, context) => console.info(message, context),
  warn: (message, context) => console.warn(message, context),
  error: (message, context) => console.error(message, context),
});
```

### Logger Injection

```typescript
// application/providers.ts
export const createDefaultProviders = (logger?: Logger) => {
  const log = logger || createConsoleLogger();

  const fitReader = createFitReader(log);
  const fitWriter = createFitWriter(log);

  return {
    fitReader,
    fitWriter,
    logger: log,
  };
};
```

## Error Types

Define error types as plain objects with factory functions:

```typescript
// ✅ Preferred - Type + factory function
export type FitParsingError = {
  name: "FitParsingError";
  message: string;
  cause?: unknown;
};

export const createFitParsingError = (
  message: string,
  cause?: unknown
): FitParsingError => ({
  name: "FitParsingError",
  message,
  cause,
});

// ❌ Avoid - Class-based errors
export class FitParsingError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "FitParsingError";
    this.cause = cause;
  }
}
```

## Summary

- **Errors bubble up** - create at failure point, handle at boundary
- **Logger is injected** - never use console directly
- **Default console logger** - but allow custom implementations
- **Structured logging** - include context objects
- **Appropriate log levels** - debug, info, warn, error
