<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/utils/AGENTS.md

Shared utilities for file I/O, configuration, error handling, format detection, and logging.

## Purpose

**What lives here:** Pure functions and utilities shared across all commands. No side effects except logging and filesystem operations.

**Pattern:** Each utility is a focused module (one concern per file, under 100 lines). Tests colocated as `.test.ts`.

## Utility Modules

### Config & Environment

- **`config-loader.ts`** — Load `.kaiordrc.json` from cwd or home, merge CLI args with config defaults, validate with Zod
- **`is-tty.ts`** — Detect if stdout is a TTY (terminal) for auto-format detection
- **`directory-handler.ts`** — Recursively create output directories, validate paths
- **`path-security.ts`** — Prevent directory traversal attacks (`../` in paths)

### File I/O

- **`file-handler.ts`** — Read/write files safely, handle encoding, abstract filesystem operations
- **`fs-errors.ts`** — Map filesystem errors (ENOENT, EACCES, EISDIR) to user-friendly messages
- **`format-detector.ts`** — Infer format from file extension (`.fit`, `.tcx`, `.zwo`, `.krd`), override with explicit flag

### Conversion Pipeline

- **`krd-converter.ts`** — Load any input format file and convert to KRD using injected readers from adapters
- **`krd-loaders.ts`** — Helper to load KRD files with format detection

### Error Handling

- **`error-formatter.ts`** — Format errors for human output (pretty or JSON). Wrapper around pretty/JSON formatters
- **`error-formatter-pretty.ts`** — Pretty-print errors with context, suggestions, stack traces (terminal output)
- **`error-formatter-json.ts`** — Format errors as JSON (for `--json` flag)
- **`error-exit-code.ts`** — Map error types to exit codes
- **`error-suggestions.ts`** — Generate helpful suggestions based on error type (file not found → check path, etc.)
- **`format-violations.ts`** — Format validation tolerance violations for human readability
- **`exit-codes.ts`** — Constants for exit codes (0=success, 1=error, 2=tolerance exceeded, 3=diff found)

### Logging

- **`logger-factory.ts`** — Factory to create Logger instances (auto-detect pretty vs. structured based on environment)

### Pretty Formatters

Nested `pretty-formatters/` directory with specialized error formatters for different error types:

- **`fit-error.ts`** — FIT-specific error messages and suggestions
- **`krd-error.ts`** — KRD-specific error messages
- **`tolerance-error.ts`** — Validation tolerance violation formatting
- **`generic-error.ts`** — Fallback formatter for unknown errors
- **`index.ts`** — Dispatcher to pick the right formatter

## For AI Agents: Working in This Directory

### Utility Pattern

Pure function with optional `.test.ts` colocated:

```typescript
// utils/my-util.ts
import { z } from "zod";

// Export types
export type MyUtilResult = { success: boolean; value?: string; error?: string };

// Define schema
export const myInputSchema = z.object({ input: z.string() });

// Pure function
export const myUtil = (input: string): MyUtilResult => {
  try {
    // Work
    return { success: true, value: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};
```

```typescript
// utils/my-util.test.ts
import { describe, expect, it } from "vitest";
import { myUtil } from "./my-util";

describe("myUtil", () => {
  it("should handle valid input", () => {
    // Arrange
    const input = "test";

    // Act
    const result = myUtil(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.value).toBe("expected");
  });

  it("should handle error", () => {
    // Arrange
    const input = "";

    // Act
    const result = myUtil(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
```

### Adding a New Utility

1. Create `new-util.ts` as pure function with clear responsibility
2. Add `new-util.test.ts` with `// Arrange`, `// Act`, `// Assert` comments
3. Export from main module if it's widely used
4. Keep under 100 lines
5. Use Zod for input validation if accepting options

### Common Patterns

**Schema validation:**

```typescript
export const myOptionsSchema = z.object({
  input: z.string(),
  verbose: z.boolean().optional(),
});
export type MyOptions = z.infer<typeof myOptionsSchema>;
```

**Error mapping:**

```typescript
export const handleError = (
  error: unknown
): { code: number; message: string } => {
  if (error instanceof ZodError) return { code: 1, message: "Invalid input" };
  if (error instanceof FileNotFoundError)
    return { code: 1, message: "File not found" };
  return { code: 1, message: String(error) };
};
```

**File safety:**

```typescript
import { validatePath } from "./path-security.js";
const safePath = validatePath(userInput); // Throws if unsafe
```

### Testing Requirements

- Pure function tests only (no mocking unless necessary)
- Test both success and error cases
- Verify error messages are user-friendly
- Use fixtures for format detection tests
- Mock filesystem only when testing error conditions

## Dependencies

- `zod` — Schema validation
- `chalk` — (via pretty formatter) Terminal colors
- `fs`, `path`, `os` — Node built-ins for file/path operations
- `@kaiord/core` — KRD types, validation errors

## Code Limits

- Per file: Under 100 lines
- Per function: Under 40 lines
- Pure functions only (no side effects except logging/I/O)
