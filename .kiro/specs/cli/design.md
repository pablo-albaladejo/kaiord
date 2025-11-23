# Design Document

## Overview

The @kaiord/cli package provides a command-line interface for converting workout files between different formats (FIT, KRD, TCX, ZWO). It wraps the @kaiord/core library with a user-friendly CLI that supports both interactive terminal usage and CI/CD automation.

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
  output?: string; // Optional for batch mode
  outputDir?: string; // For batch conversion (Requirement 8.1)
  inputFormat?: "fit" | "krd" | "tcx" | "zwo";
  outputFormat?: "fit" | "krd" | "tcx" | "zwo";
  verbose?: boolean;
  quiet?: boolean;
  json?: boolean;
  logFormat?: "pretty" | "json";
};

export const convertCommand = async (
  options: ConvertOptions
): Promise<void> => {
  // 1. Detect or validate formats
  // 2. Check for glob patterns (batch mode - Requirement 8)
  // 3. Read input file(s)
  // 4. Convert using @kaiord/core
  // 5. Write output file(s)
  // 6. Display success message or batch summary
};
```

### 3. Validate Command (`commands/validate.ts`)

**Responsibility:** Perform round-trip validation to verify data integrity (Requirement 7).

**Interface:**

```typescript
type ValidateOptions = {
  input: string;
  toleranceConfig?: string; // Path to custom tolerance JSON (Requirement 7.4)
  verbose?: boolean;
  quiet?: boolean;
  json?: boolean;
  logFormat?: "pretty" | "json";
};

export const validateCommand = async (
  options: ValidateOptions
): Promise<void> => {
  // 1. Read input file
  // 2. Detect format from extension
  // 3. Perform round-trip conversion (e.g., FIT → KRD → FIT) (Requirement 7.1)
  // 4. Load custom tolerances if provided (Requirement 7.4)
  // 5. Check tolerances using @kaiord/core validation
  // 6. Display validation results:
  //    - Success message if within tolerances (Requirement 7.2)
  //    - Detailed violations with field names, expected, actual, deviations (Requirement 7.3)
  // 7. Exit with code 0 on success, 1 on failure
};
```

**Tolerance Configuration Format:**

```typescript
// tolerance.json
{
  "time": { "absolute": 1, "unit": "seconds" },
  "power": { "absolute": 1, "percentage": 1, "unit": "watts" },
  "heartRate": { "absolute": 1, "unit": "bpm" },
  "cadence": { "absolute": 1, "unit": "rpm" }
}
```

### 4. File Handler (`utils/file-handler.ts`)

**Responsibility:** Handle file I/O operations with proper error handling.

**Interface:**

```typescript
export type FileFormat = "fit" | "krd" | "tcx" | "zwo";

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
  // Expand glob patterns for batch processing (Requirement 8.1)
  // Return sorted list of matching files
  // Example: "workouts/*.fit" → ["workouts/workout1.fit", "workouts/workout2.fit"]
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
  // Format validation errors with field paths (Requirement 9.3)
  // Group by error type
  // Add color coding for terminal
  // Example output:
  //   Validation errors:
  //     - metadata.sport: Required field missing
  //     - steps[0].duration: Invalid duration type
};

export const formatToleranceViolations = (
  violations: Array<ToleranceViolation>
): string => {
  // Format tolerance violations with expected/actual values (Requirement 7.3)
  // Calculate deviation percentages
  // Highlight fields that exceeded tolerance
  // Example output:
  //   Tolerance violations:
  //     - steps[0].duration.seconds: expected 300, got 301 (deviation: 1s, tolerance: ±1s)
  //     - steps[1].target.value: expected 250W, got 252W (deviation: 2W, tolerance: ±1W)
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

**Note:** Requirements specify exit code 1 for most errors (Requirements 2.4, 2.5, 3.3, 3.4, 4.5, 5.4). The table below provides more granular codes for internal implementation, but the CLI may simplify to 0 (success) and 1 (any error) for user-facing behavior.

| Error Type         | Exit Code | Description                       | Requirement          |
| ------------------ | --------- | --------------------------------- | -------------------- |
| Success            | 0         | Operation completed successfully  | 2.3, 7.2, 12.1, 13.5 |
| Invalid Arguments  | 1         | Missing or invalid CLI arguments  | 2.4, 4.5, 5.4        |
| File Not Found     | 1         | Input file does not exist         | 2.4                  |
| Permission Error   | 1         | Cannot read input or write output | 3.4                  |
| Parsing Error      | 1         | Failed to parse input file        | 2.5                  |
| Validation Error   | 1         | Schema validation failed          | 3.3                  |
| Tolerance Exceeded | 1         | Round-trip validation failed      | 7.3                  |
| Unknown Error      | 1         | Unexpected error                  | 12.2                 |

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

All production dependencies MUST use permissive licenses (MIT, Apache-2.0, BSD, ISC) per Requirement 14.1:

- **yargs** (^17.7.2) - CLI argument parsing with type safety (MIT)
- **chalk** (^5.3.0) - Terminal colors (ESM-only) (MIT)
- **ora** (^8.0.1) - Terminal spinners and progress indicators (ESM-only) (MIT)
- **winston** (^3.11.0) - Structured logging for CI/CD (MIT)
- **glob** (^10.3.10) - File pattern matching for batch processing (ISC)
- **zod** (^3.22.4) - Schema validation and type inference (MIT)
- **@kaiord/core** (workspace:\*) - Core conversion library (MIT)

### Development Dependencies

- **@types/yargs** (^17.0.32) - TypeScript types for yargs (MIT)
- **vitest** (^1.2.0) - Testing framework (MIT)
- **tsx** (^4.7.0) - TypeScript execution for development (MIT)
- **execa** (^8.0.1) - Execute CLI as child process for integration tests (MIT)
- **tmp-promise** (^3.0.3) - Create temporary directories for test files (MIT)
- **strip-ansi** (^7.1.0) - Remove ANSI color codes from output for assertions (MIT)

### License Compliance (Requirement 14)

**Automated License Checking:**

The project MUST enforce license compatibility through automated checks:

1. **Pre-commit Hook**: Run license checker before allowing commits
2. **CI/CD Pipeline**: Verify all dependencies have compatible licenses
3. **Dependency Updates**: Check new dependencies automatically

**License Checker Configuration:**

```json
// package.json
{
  "scripts": {
    "check-licenses": "license-checker --onlyAllow 'MIT;Apache-2.0;BSD;BSD-2-Clause;BSD-3-Clause;ISC' --production"
  },
  "devDependencies": {
    "license-checker": "^25.0.1"
  }
}
```

**Prohibited Licenses:**

- GPL (any version) - Copyleft license incompatible with MIT
- AGPL (any version) - Strong copyleft license
- Any proprietary or restrictive licenses

**Attribution Requirements:**

- LICENSE file MUST include MIT license (matching project license)
- NOTICE file MUST include attribution for third-party code
- THIRD-PARTY-LICENSES.md MUST list all dependency licenses

## Package Configuration

### package.json (Requirement 15)

```json
{
  "name": "@kaiord/cli",
  "version": "0.1.0",
  "description": "Command-line interface for Kaiord workout file conversion",
  "type": "module",
  "bin": {
    "kaiord": "./dist/bin/kaiord.js"
  },
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsup",
    "test": "vitest --run",
    "dev": "tsx bin/kaiord.ts",
    "prepublishOnly": "pnpm build && pnpm test",
    "check-licenses": "license-checker --onlyAllow 'MIT;Apache-2.0;BSD;BSD-2-Clause;BSD-3-Clause;ISC' --production"
  },
  "keywords": [
    "kaiord",
    "fit",
    "tcx",
    "zwo",
    "workout",
    "garmin",
    "zwift",
    "cli",
    "converter"
  ],
  "author": "Kaiord Contributors",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/pablo-albaladejo/kaiord.git",
    "directory": "packages/cli"
  },
  "homepage": "https://www.npmjs.com/package/@kaiord/cli",
  "bugs": {
    "url": "https://github.com/pablo-albaladejo/kaiord/issues"
  },
  "publishConfig": {
    "access": "public"
  },
  "dependencies": {
    "@kaiord/core": "workspace:^",
    "yargs": "^17.7.2",
    "chalk": "^5.3.0",
    "ora": "^8.0.1",
    "winston": "^3.11.0",
    "glob": "^10.3.10",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/yargs": "^17.0.32",
    "tsup": "^8.0.1",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0",
    "execa": "^8.0.1",
    "tmp-promise": "^3.0.3",
    "strip-ansi": "^7.1.0",
    "license-checker": "^25.0.1"
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

### Batch Processing (Requirement 8)

Process files sequentially to avoid memory issues:

```typescript
const files = await findFiles(pattern);
const results: Array<ConversionResult> = [];

for (const [index, file] of files.entries()) {
  // Requirement 8.2: Display progress for each file
  logger.info(`Converting ${index + 1}/${files.length}: ${file}`);

  try {
    const result = await convertFile(file, outputDir);
    results.push(result);
  } catch (error) {
    // Requirement 8.3: Continue processing on error
    results.push({ success: false, file, error: error.message });
  }
}

// Requirement 8.4: Display summary with counts and timing
const successful = results.filter((r) => r.success).length;
const failed = results.filter((r) => !r.success).length;
const totalTime = Date.now() - startTime;

logger.info(`Batch conversion complete:`);
logger.info(`  Successful: ${successful}/${files.length}`);
logger.info(`  Failed: ${failed}/${files.length}`);
logger.info(`  Total time: ${(totalTime / 1000).toFixed(2)}s`);

// Report all errors at the end (Requirement 8.3)
if (failed > 0) {
  logger.error(`Failed conversions:`);
  results
    .filter((r) => !r.success)
    .forEach((r) => logger.error(`  ${r.file}: ${r.error}`));
}
```

**Batch Mode Detection:**

```typescript
const isBatchMode = (input: string): boolean => {
  return input.includes("*") || input.includes("?");
};
```

**Output Directory Handling:**

```typescript
// For batch mode, require --output-dir instead of --output
if (isBatchMode(options.input)) {
  if (!options.outputDir) {
    throw new Error("Batch mode requires --output-dir flag");
  }
  // Create output directory if it doesn't exist
  await fs.mkdir(options.outputDir, { recursive: true });
}
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

### Why publish CLI separately from core?

- **Separation of concerns**: Core is a library, CLI is a tool
- **Independent versioning**: CLI can have breaking changes without affecting core users
- **Smaller install size**: Users who only need the library don't install CLI dependencies
- **Clear boundaries**: Library users vs CLI users have different needs
- **Follows npm best practices**: Scoped packages with clear purposes (@kaiord/core, @kaiord/cli)

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

## NPM Publishing Strategy (Requirement 15)

### Package Registry

The CLI package MUST be published to the public npm registry at:

**https://www.npmjs.com/package/@kaiord/cli**

This ensures users can install it globally with:

```bash
npm install -g @kaiord/cli
# or
pnpm add -g @kaiord/cli
```

### Publishing Workflow

**Manual Publishing:**

```bash
# 1. Ensure all tests pass
pnpm test

# 2. Build the package
pnpm build

# 3. Verify package contents
npm pack --dry-run

# 4. Publish to npm (requires authentication)
npm publish --access public

# 5. Verify publication
npm view @kaiord/cli
```

**Automated Publishing via CI/CD:**

The project uses GitHub Actions to automatically publish new versions:

1. **Version Bump**: Use changesets to manage versions

   ```bash
   pnpm changeset
   pnpm changeset version
   ```

2. **Create Release**: Push a git tag

   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

3. **CI/CD Pipeline**: GitHub Actions automatically:
   - Runs all tests
   - Builds the package
   - Checks licenses
   - Publishes to npm registry

**GitHub Actions Workflow:**

```yaml
# .github/workflows/publish-cli.yml
name: Publish CLI to NPM

on:
  push:
    tags:
      - "cli-v*"

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          registry-url: "https://registry.npmjs.org"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm -r build

      - name: Run tests
        run: pnpm -r test

      - name: Check licenses
        run: pnpm --filter @kaiord/cli check-licenses

      - name: Publish to NPM
        run: pnpm --filter @kaiord/cli publish --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Version Synchronization

The CLI version should be synchronized with @kaiord/core:

- **Major versions**: Breaking changes in core API
- **Minor versions**: New features in core or CLI
- **Patch versions**: Bug fixes

**Example:**

- `@kaiord/core@1.2.3` → `@kaiord/cli@1.2.3`
- Both packages share the same version number for consistency

### Pre-publish Checklist

Before publishing to https://www.npmjs.com/package/@kaiord/cli, ensure:

- [ ] All tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] License check passes (`pnpm check-licenses`)
- [ ] README.md is up to date
- [ ] CHANGELOG.md includes release notes
- [ ] Version number follows semver
- [ ] Git tag matches package version
- [ ] NPM authentication is configured (`npm whoami`)
- [ ] Package name is available or you have publish rights

### Post-publish Verification

After publishing, verify the package:

```bash
# 1. Check package page
open https://www.npmjs.com/package/@kaiord/cli

# 2. Verify package metadata
npm view @kaiord/cli

# 3. Test global installation
npm install -g @kaiord/cli

# 4. Verify CLI works
kaiord --version
kaiord --help

# 5. Test conversion
kaiord convert --input sample.fit --output sample.krd
```

### Package Distribution

**What gets published:**

- `dist/` - Compiled JavaScript with shebang
- `README.md` - Installation and usage instructions
- `LICENSE` - MIT license file
- `package.json` - Package metadata

**What does NOT get published:**

- `src/` - TypeScript source files
- `tests/` - Test files
- `node_modules/` - Dependencies (installed by npm)
- `.github/` - CI/CD configuration
- Development configuration files

## Future Enhancements

- **Watch Mode**: `kaiord convert --watch` to monitor directory for changes
- **Config File**: `.kaiordrc.json` for default options
- **Plugin System**: Allow custom format converters
- **Interactive Mode**: Prompt for missing arguments
- **Diff Command**: Compare two workout files
- **Merge Command**: Combine multiple workouts
