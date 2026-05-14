<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/tests/AGENTS.md

Test infrastructure, fixtures, and smoke tests for the CLI.

## Purpose

**What lives here:** Shared test utilities, fixture paths, helpers, and CLI smoke tests. (Command-specific integration tests live in their own directories, e.g., `src/commands/convert/convert-integration.test.ts`.)

## Subdirectories

### fixtures/

Test data files (sample workouts, config files, etc.).

**README.md** — Inventory of available fixtures and their purposes.

### helpers/

Reusable test utilities and fixture loaders.

**Files:**

- **`fixture-paths.ts`** — Constants for fixture file paths (helps tests find sample data)
- **`cli-test-utils.ts`** — Utilities for running CLI commands in tests, parsing output, verifying exit codes
- **`README.md`** — Documentation for test helpers

## Key Files

- **`cli-smoke.test.ts`** — End-to-end CLI smoke tests:
  - Verify CLI binary can start
  - Test each command with valid input
  - Test error cases (missing files, invalid formats)
  - Verify exit codes
  - Verify output format (pretty vs. JSON)

## For AI Agents: Working in This Directory

### Running Tests

```bash
# All tests
pnpm test

# Unit tests only (no integrations)
pnpm test:unit

# Integration tests (convert, validate, diff, inspect, extract)
pnpm test:integration

# Smoke tests (CLI binary behavior)
pnpm test:smoke

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### Test Organization

- **Unit tests:** Pure function utilities (format detector, config loader, error formatting)
  - File: `src/utils/my-util.test.ts`
  - Pattern: Small, focused tests

- **Integration tests:** Command end-to-end with real files
  - File: `src/commands/mycommand/mycommand-integration.test.ts`
  - Pattern: Load fixture → run command → verify output

- **Smoke tests:** CLI binary behavior
  - File: `src/tests/cli-smoke.test.ts`
  - Pattern: Run CLI subprocess, capture stdout/stderr, verify exit code

### Test Conventions (Enforced)

Every `it()` test must:

1. **Title rule:** Start with lowercase `"should "` (case-sensitive)

   ```typescript
   it("should convert FIT to KRD", () => {
     /* ... */
   });
   it("should reject invalid format", () => {
     /* ... */
   });
   ```

2. **AAA rule:** Body contains `// Arrange`, `// Act`, `// Assert` comments

   ```typescript
   it("should validate options", () => {
     // Arrange
     const input = { format: "invalid" };

     // Act
     const result = validateOptions(input);

     // Assert
     expect(result.error).toBeDefined();
   });
   ```

### Writing Integration Tests

```typescript
// src/commands/mycommand/mycommand-integration.test.ts
import { describe, expect, it } from "vitest";
import { myCommand } from "./index";
import { ExitCode } from "../../utils/exit-codes";
import { fixturePath } from "../../tests/helpers/fixture-paths";

describe("myCommand", () => {
  it("should handle valid input", async () => {
    // Arrange
    const input = fixturePath("sample.fit");
    const options = { input, output: "out.krd" };

    // Act
    const exitCode = await myCommand(options);

    // Assert
    expect(exitCode).toBe(ExitCode.SUCCESS);
    expect(fs.existsSync("out.krd")).toBe(true);
  });

  it("should fail with missing file", async () => {
    // Arrange
    const options = { input: "nonexistent.fit" };

    // Act
    const exitCode = await myCommand(options);

    // Assert
    expect(exitCode).not.toBe(ExitCode.SUCCESS);
  });
});
```

### Using Fixtures

```typescript
import { fixturePath } from "../../tests/helpers/fixture-paths";

const fit = fixturePath("sample.fit");
const tcx = fixturePath("sample.tcx");
const krd = fixturePath("sample.krd");
```

### Testing Error Paths

```typescript
it("should suggest close match for unknown format", () => {
  // Arrange
  const error = new Error("Unknown format: .ftx");

  // Act
  const suggestions = errorSuggestions(error);

  // Assert
  expect(suggestions).toContain("Did you mean .fit?");
});
```

### Testing CLI Output

```typescript
import { runCli } from "../../tests/helpers/cli-test-utils";

it("should output JSON when --json flag set", async () => {
  // Arrange
  const args = [
    "convert",
    "--input",
    "test.fit",
    "--output",
    "test.krd",
    "--json",
  ];

  // Act
  const { exitCode, stdout } = await runCli(args);

  // Assert
  expect(exitCode).toBe(0);
  const output = JSON.parse(stdout);
  expect(output).toHaveProperty("success");
});
```

### Test Coverage Thresholds

- **Core CLI package:** 70% coverage (frontend-like, user-facing)
- **Focus areas:** Command handlers, error formatting, config loading
- **Generate report:** `pnpm test:coverage`

### Common Test Patterns

**Schema validation:**

```typescript
it("should validate schema", () => {
  // Arrange
  const schema = myOptionsSchema;
  const invalid = { input: "" };

  // Act & Assert
  expect(() => schema.parse(invalid)).toThrow();
});
```

**Fixture loading:**

```typescript
it("should load and convert fixture", async () => {
  // Arrange
  const fixture = fixturePath("sample.fit");

  // Act
  const krd = await loadFileAsKrd(fixture);

  // Assert
  expect(krd.records).toHaveLength(100);
});
```

**Mocking loggers:**

```typescript
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
```

## Dependencies

- `vitest` — Test runner
- `@vitest/coverage-v8` — Coverage reporting
- `execa` — Run CLI subprocess
- `strip-ansi` — Strip ANSI color codes from CLI output
- `tmp-promise` — Temporary directories for test files

## CI/CD

- `pnpm test` runs all tests before release
- `pnpm lint` includes test type checking
- Coverage enforced at 70%+
