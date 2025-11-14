# Design Document

## Overview

The @kaiord/cli package provides a command-line interface for converting workout files between different formats (FIT, KRD, TCX, PWX). It wraps the @kaiord/core library with a user-friendly CLI that supports both interactive terminal usage and CI/CD automation.

The CLI follows hexagonal architecture principles, treating the terminal as an adapter that presents the core library's functionality to end users.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  CLI Layer (Entry Point)                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │ bin/kaiord.ts                                      │    │
│  │   - Entry point script                             │    │
│  │   - Parses CLI arguments                           │    │
│  │   - Routes to command handlers                     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Commands Layer                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ commands/                                          │    │
│  │   convert.ts    - File conversion command          │    │
│  │   validate.ts   - Round-trip validation command    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Utilities Layer                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │ utils/                                             │    │
│  │   file-handler.ts   - File I/O operations          │    │
│  │   format-detector.ts - Format detection            │    │
│  │   logger-factory.ts  - Logger creation             │    │
│  │   error-formatter.ts - Error message formatting    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  @kaiord/core (Business Logic)                              │
│  - convertFitToKrd                                          │
│  - convertKrdToFit                                          │
│  - validateRoundTrip                                        │
│  - Schema validation                                        │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. CLI Entry Point (`bin/kaiord.ts`)

**Responsibility:** Parse command-line arguments and route to appropriate command handlers.

**Dependencies:**

- `yargs` - CLI argument parsing
- Command handlers

**Interface:**

```typescript
#!/usr/bin/env node

type CliOptions = {
  _: Array<string>;
  [key: string]: unknown;
};

const main = async (): Promise<void> => {
  // Parse arguments with yargs
  // Route to command handler
  // Handle top-level errors
  // Set exit code
};
```

### 2. Convert Command (`commands/convert.ts`)

**Responsibility:** Handle file conversion between formats.

**Interface:**

```typescript
type ConvertOptions = {
  input: string;
  output: string;
  inputFormat?: "fit" | "krd" | "tcx" | "pwx";
  outputFormat?: "fit" | "krd" | "tcx" | "pwx";
  verbose?: boolean;
  quiet?: boolean;
  json?: boolean;
  logFormat?: "pretty" | "json";
};

export const convertCommand = async (
  options: ConvertOptions
): Promise<void> => {
  // 1. Detect or validate formats
  // 2. Read input file
  // 3. Convert using @kaiord/core
  // 4. Write output file
  // 5. Display success message
};
```

### 3. Validate Command (`commands/validate.ts`)

**Responsibility:** Perform round-trip validation to verify data integrity.

**Interface:**

```typescript
type ValidateOptions = {
  input: string;
  toleranceConfig?: string;
  verbose?: boolean;
  quiet?: boolean;
  json?: boolean;
  logFormat?: "pretty" | "json";
};

export const validateCommand = async (
  options: ValidateOptions
): Promise<void> => {
  // 1. Read input file
  // 2. Perform round-trip conversion
  // 3. Check tolerances
  // 4. Display validation results
};
```

### 4. File Handler (`utils/file-handler.ts`)

**Responsibility:** Handle file I/O operations with proper error handling.

**Interface:**

```typescript
export type FileFormat = "fit" | "krd" | "tcx" | "pwx";

export const readFile = async (
  path: string,
  format: FileFormat
): Promise<Uint8Array | string> => {
  // Read file based on format (binary for FIT, text for others)
  // Throw descriptive errors for missing/unreadable files
};

export const writeFile = async (
  path: string,
  data: Uint8Array | string,
  format: FileFormat
): Promise<void> => {
  // Write file based on format
  // Create directories if needed
  // Throw descriptive errors for permission issues
};

export const findFiles = async (pattern: string): Promise<Array<string>> => {
  // Expand glob patterns for batch processing
  // Return sorted list of matching files
};
```

### 5. Format Detector (`utils/format-detector.ts`)

**Responsibility:** Detect file format from extension or content.

**Interface:**

```typescript
export const detectFormat = (filePath: string): FileFormat | null => {
  // Extract extension
  // Map to format
  // Return null if unknown
};

export const validateFormat = (format: string): format is FileFormat => {
  // Check if format is valid
};
```

### 6. Logger Factory (`utils/logger-factory.ts`)

**Responsibility:** Create appropriate logger based on environment and options.

**Interface:**

```typescript
type LoggerType = "pretty" | "structured";

type LoggerOptions = {
  type?: LoggerType;
  level?: "debug" | "info" | "warn" | "error";
  quiet?: boolean;
};

export const createLogger = (options: LoggerOptions): Logger => {
  // Detect environment (TTY, CI, NODE_ENV)
  // Create pretty logger (chalk + ora) or structured logger (winston/pino)
  // Return logger that implements Logger interface from @kaiord/core
};
```

**Pretty Logger Implementation:**

```typescript
// Uses chalk for colors, ora for spinners
const createPrettyLogger = (level: LogLevel): Logger => ({
  debug: (message, context) => {
    if (level === "debug") {
      console.log(chalk.gray(`[DEBUG] ${message}`), context);
    }
  },
  info: (message, context) => {
    console.log(chalk.blue(`ℹ ${message}`), context);
  },
  warn: (message, context) => {
    console.warn(chalk.yellow(`⚠ ${message}`), context);
  },
  error: (message, context) => {
    console.error(chalk.red(`✖ ${message}`), context);
  },
});
```

**Structured Logger Implementation:**

```typescript
// Uses winston or pino for structured JSON logs
const createStructuredLogger = (level: LogLevel): Logger => {
  const winstonLogger = winston.createLogger({
    level,
    format: winston.format.json(),
    transports: [new winston.transports.Console({ stream: process.stderr })],
  });

  return {
    debug: (message, context) => winstonLogger.debug(message, context),
    info: (message, context) => winstonLogger.info(message, context),
    warn: (message, context) => winstonLogger.warn(message, context),
    error: (message, context) => winstonLogger.error(message, context),
  };
};
```

### 7. Error Formatter (`utils/error-formatter.ts`)

**Responsibility:** Format errors for display in terminal or JSON output.

**Interface:**

```typescript
export const formatError = (
  error: unknown,
  options: { json?: boolean }
): string => {
  // Handle known error types (FitParsingError, KrdValidationError, etc.)
  // Format for pretty terminal or JSON output
  // Include helpful suggestions
};

export const formatValidationErrors = (
  errors: Array<ValidationError>
): string => {
  // Format validation errors with field paths
  // Group by error type
  // Add color coding for terminal
};

export const formatToleranceViolations = (
  violations: Array<ToleranceViolation>
): string => {
  // Format tolerance violations with expected/actual values
  // Calculate deviation percentages
  // Highlight fields that exceeded tolerance
};
```

## Data Models

### CLI Configuration

```typescript
type CliConfig = {
  // Global options
  verbose: boolean;
  quiet: boolean;
  json: boolean;
  logFormat: "pretty" | "json";

  // Command-specific options
  command: "convert" | "validate";
  options: ConvertOptions | ValidateOptions;
};
```

### Conversion Result

```typescript
type ConversionResult = {
  success: boolean;
  inputFile: string;
  outputFile: string;
  inputFormat: FileFormat;
  outputFormat: FileFormat;
  duration: number; // milliseconds
  error?: string;
};
```

### Validation Result

```typescript
type ValidationResult = {
  success: boolean;
  inputFile: string;
  format: FileFormat;
  violations: Array<ToleranceViolation>;
  duration: number; // milliseconds
};
```

## Error Handling

### Error Flow

1. **Command Layer**: Catch all errors from core library and utilities
2. **Error Formatter**: Transform errors into user-friendly messages
3. **Logger**: Display formatted errors
4. **Exit Handler**: Set appropriate exit code

### Error Types and Exit Codes

| Error Type         | Exit Code | Description                       |
| ------------------ | --------- | --------------------------------- |
| Success            | 0         | Operation completed successfully  |
| Invalid Arguments  | 1         | Missing or invalid CLI arguments  |
| File Not Found     | 2         | Input file does not exist         |
| Permission Error   | 3         | Cannot read input or write output |
| Parsing Error      | 4         | Failed to parse input file        |
| Validation Error   | 5         | Schema validation failed          |
| Tolerance Exceeded | 6         | Round-trip validation failed      |
| Unknown Error      | 99        | Unexpected error                  |

### Error Message Format

**Pretty Terminal:**

```
✖ Error: Failed to parse FIT file

Details:
  File: workout.fit
  Reason: Corrupted file header

Suggestion:
  Verify the file is a valid FIT workout file.
  Try opening it in Garmin Connect to confirm.
```

**JSON Output:**

```json
{
  "success": false,
  "error": {
    "type": "FitParsingError",
    "message": "Failed to parse FIT file",
    "details": {
      "file": "workout.fit",
      "reason": "Corrupted file header"
    },
    "suggestion": "Verify the file is a valid FIT workout file."
  }
}
```

## Testing Strategy

### 1. Unit Tests (Pure Functions)

Test individual utility functions without executing the CLI:

```typescript
// utils/format-detector.test.ts
describe("detectFormat", () => {
  it("should detect FIT format from .fit extension", () => {
    expect(detectFormat("workout.fit")).toBe("fit");
  });
});
```

**What to test:**

- Format detection logic
- Error formatting functions
- Logger factory environment detection
- File path manipulation

### 2. Integration Tests (Commands)

Execute CLI commands as child processes and verify output:

```typescript
// commands/convert-integration.test.ts
import { execa } from "execa";

describe("convert command", () => {
  it("should convert FIT to KRD", async () => {
    const { stdout, exitCode } = await execa("node", [
      "dist/bin/kaiord.js",
      "convert",
      "--input",
      "tests/fixtures/workout.fit",
      "--output",
      "/tmp/output.krd",
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Conversion complete");
  });
});
```

**What to test:**

- End-to-end file conversion
- Round-trip validation
- Batch processing with glob patterns
- Error handling and exit codes
- JSON output format

### 3. Smoke Tests (Basic Functionality)

Quick tests to verify CLI works at all:

```typescript
// tests/cli-smoke.test.ts
import { execa } from "execa";

describe("CLI smoke tests", () => {
  it("should display help", async () => {
    const { stdout } = await execa("node", ["dist/bin/kaiord.js", "--help"]);
    expect(stdout).toContain("kaiord");
  });

  it("should display version", async () => {
    const { stdout } = await execa("node", ["dist/bin/kaiord.js", "--version"]);
    expect(stdout).toMatch(/\d+\.\d+\.\d+/);
  });
});
```

**What to test:**

- `--help` displays usage
- `--version` displays version
- Unknown commands show error
- Missing arguments show help

### 4. Snapshot Tests (Output Format)

Verify output format remains consistent:

```typescript
// tests/output-snapshot.test.ts
import { execa } from "execa";

describe("convert command output", () => {
  it("should match expected JSON format", async () => {
    const { stdout } = await execa("node", [
      "dist/bin/kaiord.js",
      "convert",
      "--input",
      "tests/fixtures/workout.fit",
      "--output",
      "/tmp/output.krd",
      "--json",
    ]);

    expect(JSON.parse(stdout)).toMatchSnapshot();
  });
});
```

### Testing Tools

**Development Dependencies for Testing:**

- **execa** (^8.0.1) - Execute CLI as child process
- **tmp-promise** (^3.0.3) - Create temporary directories for test files
- **strip-ansi** (^7.1.0) - Remove ANSI color codes from output for assertions

### Test Naming Conventions

To clearly identify test types and enable easy filtering, use these patterns:

| Test Type       | Pattern                | Example                       | Vitest Filter              |
| --------------- | ---------------------- | ----------------------------- | -------------------------- |
| **Unit**        | `.test.ts`             | `format-detector.test.ts`     | Default (all tests)        |
| **Integration** | `-integration.test.ts` | `convert-integration.test.ts` | `**/*-integration.test.ts` |
| **Smoke**       | `-smoke.test.ts`       | `cli-smoke.test.ts`           | `**/*-smoke.test.ts`       |
| **Snapshot**    | `-snapshot.test.ts`    | `output-snapshot.test.ts`     | `**/*-snapshot.test.ts`    |

**Rationale:** Using hyphens instead of dots (except for unit tests) makes it easier to filter tests with glob patterns and run specific test suites in CI/CD pipelines.

**Package.json scripts:**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run --exclude '**/*-{integration,smoke,snapshot}.test.ts'",
    "test:integration": "vitest run **/*-integration.test.ts",
    "test:smoke": "vitest run **/*-smoke.test.ts",
    "test:watch": "vitest"
  }
}
```

### Test Structure

```
packages/cli/
├── src/
│   ├── commands/
│   │   ├── convert.ts
│   │   ├── convert-integration.test.ts    # Integration tests
│   │   ├── validate.ts
│   │   └── validate-integration.test.ts
│   └── utils/
│       ├── format-detector.ts
│       ├── format-detector.test.ts        # Unit tests
│       ├── file-handler.ts
│       ├── file-handler.test.ts
│       ├── logger-factory.ts
│       ├── logger-factory.test.ts
│       ├── error-formatter.ts
│       └── error-formatter.test.ts
└── tests/
    ├── fixtures/                           # Test files
    │   ├── workout.fit
    │   ├── workout.krd
    │   └── WorkoutRepeatSteps.fit
    ├── helpers/
    │   └── cli-test-utils.ts              # Shared test utilities
    ├── cli-smoke.test.ts                  # Smoke tests
    └── output-snapshot.test.ts            # Snapshot tests
```

### Test Helpers

```typescript
// tests/helpers/cli-test-utils.ts
import { execa } from "execa";
import { dir } from "tmp-promise";

export const runCli = async (args: string[]) => {
  return await execa("node", ["dist/bin/kaiord.js", ...args]);
};

export const createTempDir = async () => {
  const { path, cleanup } = await dir({ unsafeCleanup: true });
  return { path, cleanup };
};
```

### Fixtures

Use small anonymized workout files (< 20KB) from @kaiord/core test fixtures:

- `WorkoutIndividualSteps.fit` - Simple workout with individual steps
- `WorkoutRepeatSteps.fit` - Workout with repetition blocks
- `WorkoutCustomTargetValues.fit` - Workout with custom target values

Copy these to `packages/cli/tests/fixtures/` for CLI-specific tests.

## Dependencies

### Production Dependencies

- **yargs** (^17.7.2) - CLI argument parsing with type safety
- **chalk** (^5.3.0) - Terminal colors (ESM-only)
- **ora** (^8.0.1) - Terminal spinners and progress indicators (ESM-only)
- **winston** (^3.11.0) - Structured logging for CI/CD
- **glob** (^10.3.10) - File pattern matching for batch processing
- **@kaiord/core** (workspace:\*) - Core conversion library

### Development Dependencies

- **@types/yargs** (^17.0.32) - TypeScript types for yargs
- **vitest** (^1.2.0) - Testing framework
- **tsx** (^4.7.0) - TypeScript execution for development
- **execa** (^8.0.1) - Execute CLI as child process for integration tests
- **tmp-promise** (^3.0.3) - Create temporary directories for test files
- **strip-ansi** (^7.1.0) - Remove ANSI color codes from output for assertions

## Package Configuration

### package.json

```json
{
  "name": "@kaiord/cli",
  "version": "0.1.0",
  "description": "Command-line interface for Kaiord workout file conversion",
  "type": "module",
  "bin": {
    "kaiord": "./dist/bin/kaiord.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "test": "vitest --run",
    "dev": "tsx bin/kaiord.ts"
  },
  "dependencies": {
    "@kaiord/core": "workspace:*",
    "yargs": "^17.7.2",
    "chalk": "^5.3.0",
    "ora": "^8.0.1",
    "winston": "^3.11.0",
    "glob": "^10.3.10"
  },
  "devDependencies": {
    "@types/yargs": "^17.0.32",
    "tsup": "^8.0.1",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"
  }
}
```

### tsup.config.ts

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["bin/kaiord.ts"],
  format: ["esm"],
  dts: false,
  clean: true,
  shims: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
```

## Implementation Notes

### Environment Detection

```typescript
const isCI = (): boolean => {
  return (
    process.env.CI === "true" ||
    process.env.NODE_ENV === "production" ||
    !process.stdout.isTTY
  );
};
```

### Progress Indicators

Use `ora` for spinners in interactive mode:

```typescript
const spinner = ora("Converting workout.fit...").start();
try {
  await convertFile(input, output);
  spinner.succeed("Conversion complete");
} catch (error) {
  spinner.fail("Conversion failed");
  throw error;
}
```

### Batch Processing

Process files sequentially to avoid memory issues:

```typescript
const files = await findFiles(pattern);
const results: Array<ConversionResult> = [];

for (const [index, file] of files.entries()) {
  logger.info(`Converting ${index + 1}/${files.length}: ${file}`);
  try {
    const result = await convertFile(file, outputDir);
    results.push(result);
  } catch (error) {
    results.push({ success: false, error: error.message });
  }
}

// Display summary
const successful = results.filter((r) => r.success).length;
logger.info(`Completed: ${successful}/${files.length} successful`);
```

## Design Decisions

### Why yargs?

- Type-safe argument parsing
- Automatic help generation
- Command chaining support
- Wide adoption and stability

### Why chalk + ora for terminal?

- Lightweight and fast
- ESM-native (matches our module system)
- Excellent developer experience
- Automatic color detection

### Why winston for CI/CD?

- Industry standard for Node.js logging
- Structured JSON output
- Multiple transport support
- Configurable log levels

### Why not use a CLI framework like oclif?

- Overkill for our simple use case
- Adds unnecessary complexity
- yargs provides everything we need
- Keeps bundle size small

## Easter Egg Implementation

### Kiro/Kiroween Easter Egg

**Trigger:** `kaiord --kiro` or `kaiord --kiroween`

**Implementation:**

```typescript
// bin/kaiord.ts
const showKiroEasterEgg = () => {
  console.log(
    chalk.cyan(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   👻 Built with Kiro AI during Kiroween Hackathon 👻    ║
║                                                           ║
║   Kiro helped design, architect, and implement this      ║
║   entire CLI tool through spec-driven development.       ║
║                                                           ║
║   Learn more about Kiroween:                             ║
║   👉 http://kiroween.devpost.com/                        ║
║                                                           ║
║   Kiro: Your AI pair programmer for building better      ║
║   software, faster. 🚀                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `)
  );
  process.exit(0);
};

// In yargs configuration
yargs
  .option("kiro", {
    type: "boolean",
    hidden: true, // Don't show in --help
    description: "Show Kiro easter egg",
  })
  .option("kiroween", {
    type: "boolean",
    hidden: true,
    description: "Show Kiroween easter egg",
  })
  .middleware((argv) => {
    if (argv.kiro || argv.kiroween) {
      showKiroEasterEgg();
    }
  });
```

**Design Notes:**

- Hidden from `--help` output (users discover it organically)
- Uses chalk for colored output
- ASCII art box for visual appeal
- Links to Kiroween hackathon
- Credits Kiro for helping build the tool
- Exits cleanly with code 0

## Future Enhancements

- **Watch Mode**: `kaiord convert --watch` to monitor directory for changes
- **Config File**: `.kaiordrc.json` for default options
- **Plugin System**: Allow custom format converters
- **Interactive Mode**: Prompt for missing arguments
- **Diff Command**: Compare two workout files
- **Merge Command**: Combine multiple workouts
