# API Examples

This document provides comprehensive examples for using @kaiord/core in your applications.

## Table of Contents

- [Basic Conversions](#basic-conversions)
- [Custom Loggers](#custom-loggers)
- [Round-trip Validation](#round-trip-validation)
- [Schema Validation](#schema-validation)
- [Error Handling](#error-handling)
- [Dependency Injection](#dependency-injection)

## Basic Conversions

### Example 1: FIT to KRD Conversion with File Reading

Convert a FIT workout file to KRD format by reading from the filesystem.

```typescript
import { createDefaultProviders } from "@kaiord/core";
import { readFile } from "fs/promises";

async function convertFitFile() {
  // Read FIT file from disk
  const fitBuffer = await readFile("workout.fit");

  // Create providers with default configuration
  const providers = createDefaultProviders();

  // Convert FIT to KRD
  const krd = await providers.convertFitToKrd({ fitBuffer });

  // Access KRD data
  console.log("Version:", krd.version);
  console.log("Type:", krd.type);
  console.log("Sport:", krd.metadata.sport);

  if (krd.extensions?.workout) {
    console.log("Workout name:", krd.extensions.workout.name);
    console.log("Steps:", krd.extensions.workout.steps.length);
  }

  return krd;
}

convertFitFile().catch(console.error);
```

### Example 2: KRD to FIT Conversion with File Writing

Convert KRD format back to a FIT workout file and save to disk.

```typescript
import { createDefaultProviders, type KRD } from "@kaiord/core";
import { writeFile } from "fs/promises";

async function convertToFitFile(krd: KRD) {
  // Create providers with default configuration
  const providers = createDefaultProviders();

  // Convert KRD to FIT
  const fitBuffer = await providers.convertKrdToFit({ krd });

  // Write FIT file to disk
  await writeFile("output.fit", fitBuffer);

  console.log("✓ FIT file written successfully");
  console.log("Size:", fitBuffer.length, "bytes");

  return fitBuffer;
}

// Example KRD data
const exampleKrd: KRD = {
  version: "1.0",
  type: "workout",
  metadata: {
    created: new Date().toISOString(),
    sport: "cycling",
  },
  extensions: {
    workout: {
      name: "Example Workout",
      sport: "cycling",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "watts", value: 200 },
          },
          intensity: "warmup",
        },
      ],
    },
  },
};

convertToFitFile(exampleKrd).catch(console.error);
```

## Custom Loggers

### Example 3: Custom Logger Implementation

Implement a custom logger to integrate with your application's logging infrastructure.

```typescript
import { createDefaultProviders, type Logger } from "@kaiord/core";

// Custom logger that formats messages with timestamps
const customLogger: Logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] DEBUG: ${message}`, context || "");
  },

  info: (message: string, context?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.info(`[${timestamp}] INFO: ${message}`, context || "");
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN: ${message}`, context || "");
  },

  error: (message: string, context?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`, context || "");
  },
};

// Use custom logger with providers
const providers = createDefaultProviders(customLogger);

// All conversion operations will use your custom logger
const krd = await providers.convertFitToKrd({ fitBuffer });
```

### Example 4: No-op Logger for Silent Operation

Create a silent logger that suppresses all log output.

```typescript
import { createDefaultProviders, type Logger } from "@kaiord/core";

// No-op logger that does nothing
const silentLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// Use silent logger for quiet operation
const providers = createDefaultProviders(silentLogger);

// No logs will be produced
const krd = await providers.convertFitToKrd({ fitBuffer });
```

### Example 5: Integration with Winston/Pino

Integrate @kaiord/core with popular logging libraries.

```typescript
import { createDefaultProviders, type Logger } from "@kaiord/core";
import winston from "winston";

// Create Winston logger
const winstonLogger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Adapt Winston logger to Kaiord Logger interface
const kaiordLogger: Logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    winstonLogger.debug(message, context);
  },

  info: (message: string, context?: Record<string, unknown>) => {
    winstonLogger.info(message, context);
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    winstonLogger.warn(message, context);
  },

  error: (message: string, context?: Record<string, unknown>) => {
    winstonLogger.error(message, context);
  },
};

// Use Winston logger with Kaiord
const providers = createDefaultProviders(kaiordLogger);
```

**Pino Integration:**

```typescript
import { createDefaultProviders, type Logger } from "@kaiord/core";
import pino from "pino";

// Create Pino logger
const pinoLogger = pino({
  level: "info",
  transport: {
    target: "pino-pretty",
  },
});

// Adapt Pino logger to Kaiord Logger interface
const kaiordLogger: Logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.debug(context, message);
  },

  info: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.info(context, message);
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.warn(context, message);
  },

  error: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.error(context, message);
  },
};

// Use Pino logger with Kaiord
const providers = createDefaultProviders(kaiordLogger);
```

## Round-trip Validation

### Example 6: Basic Round-trip Validation

Validate that FIT → KRD → FIT conversion preserves data integrity.

```typescript
import {
  createDefaultProviders,
  validateRoundTrip,
  createSchemaValidator,
  createToleranceChecker,
  DEFAULT_TOLERANCES,
} from "@kaiord/core";
import { readFile } from "fs/promises";

async function validateWorkoutRoundTrip() {
  // Read original FIT file
  const fitBuffer = await readFile("workout.fit");

  // Create dependencies
  const providers = createDefaultProviders();
  const validator = createSchemaValidator();
  const toleranceChecker = createToleranceChecker(DEFAULT_TOLERANCES);

  try {
    // Validate round-trip conversion
    await validateRoundTrip(
      providers.fitReader,
      providers.fitWriter,
      validator,
      toleranceChecker,
      providers.logger
    )({ fitBuffer });

    console.log("✓ Round-trip validation passed");
    console.log("Data integrity verified within tolerances");
  } catch (error) {
    console.error("✗ Round-trip validation failed");
    throw error;
  }
}

validateWorkoutRoundTrip().catch(console.error);
```

### Example 7: Custom Tolerance Configuration

Configure custom tolerances for round-trip validation.

```typescript
import {
  createToleranceChecker,
  toleranceConfigSchema,
  validateRoundTrip,
  createDefaultProviders,
  createSchemaValidator,
  type ToleranceConfig,
} from "@kaiord/core";

// Define custom tolerances
const customTolerances: ToleranceConfig = toleranceConfigSchema.parse({
  time: {
    absolute: 2, // ±2 seconds
    percentage: 0, // No percentage tolerance
  },
  power: {
    absolute: 5, // ±5 watts
    percentage: 2, // ±2% of FTP
  },
  heartRate: {
    absolute: 2, // ±2 bpm
    percentage: 0,
  },
  cadence: {
    absolute: 2, // ±2 rpm
    percentage: 0,
  },
  distance: {
    absolute: 10, // ±10 meters
    percentage: 0,
  },
});

// Create tolerance checker with custom config
const toleranceChecker = createToleranceChecker(customTolerances);

// Use in round-trip validation
const providers = createDefaultProviders();
const validator = createSchemaValidator();

await validateRoundTrip(
  providers.fitReader,
  providers.fitWriter,
  validator,
  toleranceChecker,
  providers.logger
)({ fitBuffer });

console.log("✓ Round-trip validation passed with custom tolerances");
```

### Example 8: Handling Tolerance Violations

Handle and report tolerance violations when round-trip validation fails.

```typescript
import {
  validateRoundTrip,
  createDefaultProviders,
  createSchemaValidator,
  createToleranceChecker,
  DEFAULT_TOLERANCES,
  ToleranceExceededError,
} from "@kaiord/core";

async function validateWithErrorHandling(fitBuffer: Uint8Array) {
  const providers = createDefaultProviders();
  const validator = createSchemaValidator();
  const toleranceChecker = createToleranceChecker(DEFAULT_TOLERANCES);

  try {
    await validateRoundTrip(
      providers.fitReader,
      providers.fitWriter,
      validator,
      toleranceChecker,
      providers.logger
    )({ fitBuffer });

    console.log("✓ Round-trip validation passed");
  } catch (error) {
    if (error instanceof ToleranceExceededError) {
      console.error("✗ Tolerance violations detected:");
      console.error("Message:", error.message);

      // Report each violation
      for (const violation of error.violations) {
        console.error(`\nField: ${violation.field}`);
        console.error(`  Expected: ${violation.expected}`);
        console.error(`  Actual: ${violation.actual}`);
        console.error(`  Deviation: ${violation.deviation}`);
        console.error(`  Tolerance: ${violation.tolerance}`);
        console.error(`  Unit: ${violation.unit || "N/A"}`);
      }

      // Decide how to handle violations
      const maxDeviation = Math.max(
        ...error.violations.map((v) => v.deviation)
      );
      if (maxDeviation < 5) {
        console.warn("Deviations are small, may be acceptable");
      } else {
        console.error("Deviations are significant, data loss detected");
      }
    } else {
      // Other error types
      throw error;
    }
  }
}
```

## Schema Validation

### Example 9: Schema Validation with .parse()

Use Zod's `.parse()` method for strict validation that throws on errors.

```typescript
import { krdSchema, type KRD } from "@kaiord/core";

function validateKrdStrict(data: unknown): KRD {
  try {
    // Parse and validate - throws on error
    const krd = krdSchema.parse(data);

    console.log("✓ Validation passed");
    console.log("Version:", krd.version);
    console.log("Type:", krd.type);

    return krd;
  } catch (error) {
    console.error("✗ Validation failed");
    throw error;
  }
}

// Example usage
const data = {
  version: "1.0",
  type: "workout",
  metadata: {
    created: new Date().toISOString(),
    sport: "cycling",
  },
};

const krd = validateKrdStrict(data);
```

### Example 10: Schema Validation with .safeParse()

Use Zod's `.safeParse()` method for validation that returns a result object.

```typescript
import { krdSchema, type KRD } from "@kaiord/core";

function validateKrdSafe(data: unknown): KRD | null {
  // Safe parse - returns result object
  const result = krdSchema.safeParse(data);

  if (result.success) {
    console.log("✓ Validation passed");
    return result.data;
  } else {
    console.error("✗ Validation failed");
    console.error("Errors:");

    // Report all validation errors
    for (const error of result.error.errors) {
      console.error(`  - ${error.path.join(".")}: ${error.message}`);
    }

    return null;
  }
}

// Example usage with invalid data
const invalidData = {
  version: "1.0",
  // Missing required 'type' field
  metadata: {
    created: new Date().toISOString(),
    // Missing required 'sport' field
  },
};

const krd = validateKrdSafe(invalidData);
if (krd === null) {
  console.log("Validation failed, handle error appropriately");
}
```

### Example 11: Accessing Enum Values

Access enum values from Zod schemas for type-safe comparisons.

```typescript
import {
  sportSchema,
  subSportSchema,
  intensitySchema,
  equipmentSchema,
  durationTypeSchema,
  targetTypeSchema,
} from "@kaiord/core";

// Access sport enum values
console.log("Available sports:");
console.log("  -", sportSchema.enum.cycling);
console.log("  -", sportSchema.enum.running);
console.log("  -", sportSchema.enum.swimming);
console.log("  -", sportSchema.enum.generic);

// Access sub-sport enum values
console.log("\nAvailable sub-sports:");
console.log("  -", subSportSchema.enum.indoor_cycling);
console.log("  -", subSportSchema.enum.lap_swimming);
console.log("  -", subSportSchema.enum.trail);

// Access intensity enum values
console.log("\nAvailable intensities:");
console.log("  -", intensitySchema.enum.warmup);
console.log("  -", intensitySchema.enum.active);
console.log("  -", intensitySchema.enum.cooldown);
console.log("  -", intensitySchema.enum.rest);

// Access equipment enum values
console.log("\nAvailable equipment:");
console.log("  -", equipmentSchema.enum.swim_fins);
console.log("  -", equipmentSchema.enum.swim_kickboard);
console.log("  -", equipmentSchema.enum.swim_paddles);
console.log("  -", equipmentSchema.enum.swim_pull_buoy);
console.log("  -", equipmentSchema.enum.swim_snorkel);

// Use enum values in comparisons
function checkWorkoutType(sport: string) {
  if (sport === sportSchema.enum.cycling) {
    console.log("This is a cycling workout");
  } else if (sport === sportSchema.enum.running) {
    console.log("This is a running workout");
  } else if (sport === sportSchema.enum.swimming) {
    console.log("This is a swimming workout");
  }
}

// Validate enum values
const sportResult = sportSchema.safeParse("cycling");
if (sportResult.success) {
  console.log("Valid sport:", sportResult.data);
}

const invalidSportResult = sportSchema.safeParse("invalid");
if (!invalidSportResult.success) {
  console.log("Invalid sport value");
}
```

## Error Handling

### Example 12: Handling FitParsingError

Handle errors that occur when parsing FIT files.

```typescript
import { createDefaultProviders, FitParsingError } from "@kaiord/core";
import { readFile } from "fs/promises";

async function convertWithFitErrorHandling(filename: string) {
  try {
    const fitBuffer = await readFile(filename);
    const providers = createDefaultProviders();
    const krd = await providers.convertFitToKrd({ fitBuffer });

    console.log("✓ Conversion successful");
    return krd;
  } catch (error) {
    if (error instanceof FitParsingError) {
      console.error("✗ Failed to parse FIT file");
      console.error("Error:", error.message);

      // Access the original error if available
      if (error.cause) {
        console.error("Cause:", error.cause);
      }

      // Provide user-friendly guidance
      console.error("\nPossible causes:");
      console.error("  - File is corrupted or incomplete");
      console.error("  - File is not a valid FIT workout file");
      console.error("  - File uses unsupported FIT features");
      console.error("\nTry:");
      console.error("  - Re-exporting the workout from your device");
      console.error("  - Checking the file is not truncated");
      console.error("  - Using a different FIT file");

      return null;
    }

    // Re-throw unknown errors
    throw error;
  }
}

convertWithFitErrorHandling("workout.fit").catch(console.error);
```

### Example 13: Handling KrdValidationError

Handle errors that occur when KRD data fails schema validation.

```typescript
import { createDefaultProviders, KrdValidationError } from "@kaiord/core";

async function convertWithValidationErrorHandling(fitBuffer: Uint8Array) {
  try {
    const providers = createDefaultProviders();
    const krd = await providers.convertFitToKrd({ fitBuffer });

    console.log("✓ Conversion and validation successful");
    return krd;
  } catch (error) {
    if (error instanceof KrdValidationError) {
      console.error("✗ KRD validation failed");
      console.error("Message:", error.message);

      // Report all validation errors
      console.error("\nValidation errors:");
      for (const validationError of error.errors) {
        console.error(
          `  - ${validationError.field}: ${validationError.message}`
        );
      }

      // Provide guidance
      console.error("\nThis indicates a bug in the conversion logic.");
      console.error(
        "Please report this issue with the FIT file that caused it."
      );

      return null;
    }

    // Re-throw unknown errors
    throw error;
  }
}
```

### Example 14: Handling ToleranceExceededError

Handle errors that occur when round-trip validation detects data loss.

```typescript
import {
  validateRoundTrip,
  createDefaultProviders,
  createSchemaValidator,
  createToleranceChecker,
  DEFAULT_TOLERANCES,
  ToleranceExceededError,
} from "@kaiord/core";

async function validateWithToleranceErrorHandling(fitBuffer: Uint8Array) {
  const providers = createDefaultProviders();
  const validator = createSchemaValidator();
  const toleranceChecker = createToleranceChecker(DEFAULT_TOLERANCES);

  try {
    await validateRoundTrip(
      providers.fitReader,
      providers.fitWriter,
      validator,
      toleranceChecker,
      providers.logger
    )({ fitBuffer });

    console.log("✓ Round-trip validation passed");
    return true;
  } catch (error) {
    if (error instanceof ToleranceExceededError) {
      console.error("✗ Round-trip validation failed");
      console.error("Message:", error.message);

      // Analyze violations
      console.error("\nTolerance violations:");
      for (const violation of error.violations) {
        const percentDiff = (violation.deviation / violation.tolerance) * 100;
        console.error(`\n  Field: ${violation.field}`);
        console.error(
          `    Expected: ${violation.expected} ${violation.unit || ""}`
        );
        console.error(
          `    Actual: ${violation.actual} ${violation.unit || ""}`
        );
        console.error(
          `    Deviation: ${violation.deviation} (${percentDiff.toFixed(1)}% over tolerance)`
        );
      }

      // Categorize severity
      const maxDeviation = Math.max(
        ...error.violations.map((v) => v.deviation)
      );
      if (maxDeviation < 2) {
        console.warn("\n⚠ Minor deviations detected (< 2 units)");
        console.warn("May be acceptable for most use cases");
      } else if (maxDeviation < 5) {
        console.warn("\n⚠ Moderate deviations detected (2-5 units)");
        console.warn("Review if acceptable for your use case");
      } else {
        console.error("\n✗ Significant deviations detected (> 5 units)");
        console.error("Data loss is significant, not recommended for use");
      }

      return false;
    }

    // Re-throw unknown errors
    throw error;
  }
}
```

## Dependency Injection

### Example 15: Custom FIT Reader Implementation

Implement a custom FIT reader for testing or alternative FIT SDK integration.

```typescript
import {
  type FitReader,
  type KRD,
  type Logger,
  convertFitToKrd,
  createSchemaValidator,
} from "@kaiord/core";

// Custom FIT reader implementation
const createCustomFitReader =
  (logger: Logger): FitReader =>
  async (buffer: Uint8Array): Promise<KRD> => {
    logger.info("Using custom FIT reader");

    // Your custom FIT parsing logic here
    // This could use a different FIT SDK or custom parser

    const krd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "cycling",
      },
      // ... parse FIT data into KRD format
    };

    logger.info("Custom FIT parsing complete");
    return krd;
  };

// Use custom FIT reader
const logger = console;
const customFitReader = createCustomFitReader(logger);
const validator = createSchemaValidator();

const convertWithCustomReader = convertFitToKrd(
  customFitReader,
  validator,
  logger
);

// Convert using custom reader
const krd = await convertWithCustomReader({ fitBuffer });
```

### Example 16: Custom FIT Writer Implementation

Implement a custom FIT writer for testing or alternative FIT SDK integration.

```typescript
import {
  type FitWriter,
  type KRD,
  type Logger,
  convertKrdToFit,
  createSchemaValidator,
} from "@kaiord/core";

// Custom FIT writer implementation
const createCustomFitWriter =
  (logger: Logger): FitWriter =>
  async (krd: KRD): Promise<Uint8Array> => {
    logger.info("Using custom FIT writer");

    // Your custom FIT encoding logic here
    // This could use a different FIT SDK or custom encoder

    const fitBuffer = new Uint8Array([
      // ... encode KRD data into FIT format
    ]);

    logger.info("Custom FIT encoding complete", {
      size: fitBuffer.length,
    });

    return fitBuffer;
  };

// Use custom FIT writer
const logger = console;
const customFitWriter = createCustomFitWriter(logger);
const validator = createSchemaValidator();

const convertWithCustomWriter = convertKrdToFit(
  customFitWriter,
  validator,
  logger
);

// Convert using custom writer
const fitBuffer = await convertWithCustomWriter({ krd });
```

### Example 17: Composing Use Cases with Custom Providers

Compose use cases with custom providers for complete control over dependencies.

```typescript
import {
  type FitReader,
  type FitWriter,
  type Logger,
  type SchemaValidator,
  convertFitToKrd,
  convertKrdToFit,
  createSchemaValidator,
} from "@kaiord/core";

// Custom logger with file output
const createFileLogger = (logFile: string): Logger => {
  const fs = require("fs");
  const stream = fs.createWriteStream(logFile, { flags: "a" });

  return {
    debug: (msg, ctx) => stream.write(`DEBUG: ${msg} ${JSON.stringify(ctx)}\n`),
    info: (msg, ctx) => stream.write(`INFO: ${msg} ${JSON.stringify(ctx)}\n`),
    warn: (msg, ctx) => stream.write(`WARN: ${msg} ${JSON.stringify(ctx)}\n`),
    error: (msg, ctx) => stream.write(`ERROR: ${msg} ${JSON.stringify(ctx)}\n`),
  };
};

// Custom FIT reader with caching
const createCachingFitReader = (
  baseReader: FitReader,
  logger: Logger
): FitReader => {
  const cache = new Map<string, KRD>();

  return async (buffer: Uint8Array): Promise<KRD> => {
    // Create cache key from buffer hash
    const hash = buffer.reduce((acc, byte) => acc + byte, 0).toString();

    if (cache.has(hash)) {
      logger.info("Cache hit for FIT file", { hash });
      return cache.get(hash)!;
    }

    logger.info("Cache miss, parsing FIT file", { hash });
    const krd = await baseReader(buffer);
    cache.set(hash, krd);

    return krd;
  };
};

// Compose custom providers
const logger = createFileLogger("kaiord.log");
const validator = createSchemaValidator();

// Import default FIT reader
import { createGarminFitSdkReader } from "@kaiord/core/adapters/fit/garmin-fitsdk";
const baseFitReader = createGarminFitSdkReader(logger);

// Wrap with caching
const cachingFitReader = createCachingFitReader(baseFitReader, logger);

// Create use cases with custom providers
const convertFit = convertFitToKrd(cachingFitReader, validator, logger);

// Use composed use case
const krd = await convertFit({ fitBuffer });
logger.info("Conversion complete");
```

**Complete Custom Provider Setup:**

```typescript
import {
  type Providers,
  convertFitToKrd,
  convertKrdToFit,
  createSchemaValidator,
} from "@kaiord/core";

// Create custom providers object
function createCustomProviders(logger: Logger): Providers {
  const validator = createSchemaValidator();

  // Create custom readers/writers
  const fitReader = createCustomFitReader(logger);
  const fitWriter = createCustomFitWriter(logger);

  // Compose use cases
  return {
    convertFitToKrd: convertFitToKrd(fitReader, validator, logger),
    convertKrdToFit: convertKrdToFit(fitWriter, validator, logger),
    fitReader,
    fitWriter,
    validator,
    logger,
  };
}

// Use custom providers
const logger = createFileLogger("kaiord.log");
const providers = createCustomProviders(logger);

// All conversions use custom providers
const krd = await providers.convertFitToKrd({ fitBuffer });
const fitBuffer = await providers.convertKrdToFit({ krd });
```

## Additional Resources

- [Main README](../README.md) - Package overview and quick start
- [Architecture Documentation](../../docs/architecture.md) - System design and patterns
- [Error Handling Guide](../../docs/error-handling.md) - Comprehensive error handling patterns
- [TypeScript Guide](../../docs/typescript-guide.md) - TypeScript usage and best practices
- [Contributing Guidelines](../../CONTRIBUTING.md) - How to contribute to the project

## Support

- [Issue Tracker](https://github.com/pablo-albaladejo/kaiord/issues) - Report bugs or request features
- [Discussions](https://github.com/pablo-albaladejo/kaiord/discussions) - Ask questions and share ideas
