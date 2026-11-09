# API Examples

Examples for using `@kaiord/core` in your applications.

Core converts through four functions — `fromBinary`, `toBinary`, `fromText`
and `toText`. The format knowledge lives in a reader or writer you inject from
an adapter package (`@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`,
`@kaiord/garmin`). Core never imports an adapter.

## Table of Contents

- [Basic Conversions](#basic-conversions)
- [Custom Loggers](#custom-loggers)
- [Round-trip Validation](#round-trip-validation)
- [Schema Validation](#schema-validation)
- [Error Handling](#error-handling)
- [Dependency Injection](#dependency-injection)

## Basic Conversions

### Example 1: FIT to KRD with file reading

```typescript
import { fromBinary } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";
import { readFile } from "node:fs/promises";

const buffer = new Uint8Array(await readFile("workout.fit"));
const krd = await fromBinary(buffer, fitReader);

console.log(krd.type); // "structured_workout"
console.log(krd.metadata.sport); // "cycling"
```

### Example 2: KRD to FIT with file writing

```typescript
import { toBinary } from "@kaiord/core";
import type { KRD } from "@kaiord/core";
import { fitWriter } from "@kaiord/fit";
import { writeFile } from "node:fs/promises";

declare const krd: KRD;

const fitBuffer = await toBinary(krd, fitWriter);
await writeFile("output.fit", fitBuffer);
```

### Example 3: Text formats

TCX and ZWO are text formats, so they use `fromText` and `toText`.

```typescript
import { fromText, toText } from "@kaiord/core";
import { tcxReader, tcxWriter } from "@kaiord/tcx";
import { zwiftWriter } from "@kaiord/zwo";
import { readFile } from "node:fs/promises";

const tcxString = await readFile("workout.tcx", "utf8");

const krd = await fromText(tcxString, tcxReader);
const tcxAgain: string = await toText(krd, tcxWriter);
const zwo: string = await toText(krd, zwiftWriter);
```

## Custom Loggers

All four conversion functions take an optional `Logger` as their last
argument. A `Logger` is an object with `debug`, `info`, `warn` and `error`
methods, each taking a message and an optional context record.

### Example 4: Custom logger

```typescript
import { fromBinary } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";

declare const buffer: Uint8Array;

const logger: Logger = {
  debug: (message, context) => console.debug(`[debug] ${message}`, context),
  info: (message, context) => console.info(`[info] ${message}`, context),
  warn: (message, context) => console.warn(`[warn] ${message}`, context),
  error: (message, context) => console.error(`[error] ${message}`, context),
};

const krd = await fromBinary(buffer, fitReader, logger);
```

### Example 5: Console logger and silent logger

```typescript
import { createConsoleLogger, fromBinary } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";

declare const buffer: Uint8Array;

// Built-in console logger
await fromBinary(buffer, fitReader, createConsoleLogger());

// Silent logger: every method is a no-op
const silent: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};
await fromBinary(buffer, fitReader, silent);
```

### Example 6: Adapting a logging library

Any logger that can be wrapped into the four methods works. This example
uses a structural stand-in for a pino/winston-style logger.

```typescript
import type { Logger } from "@kaiord/core";

type LibraryLogger = {
  debug: (obj: object, msg: string) => void;
  info: (obj: object, msg: string) => void;
  warn: (obj: object, msg: string) => void;
  error: (obj: object, msg: string) => void;
};

declare const pinoLike: LibraryLogger;

export const kaiordLogger: Logger = {
  debug: (message, context) => pinoLike.debug(context ?? {}, message),
  info: (message, context) => pinoLike.info(context ?? {}, message),
  warn: (message, context) => pinoLike.warn(context ?? {}, message),
  error: (message, context) => pinoLike.error(context ?? {}, message),
};
```

## Round-trip Validation

`validateRoundTrip` takes a binary reader and writer, a tolerance checker and
a logger. It returns the violations found; an empty array means the
round-trip is lossless within the tolerances.

### Example 7: Binary round-trip

```typescript
import {
  createConsoleLogger,
  createToleranceChecker,
  validateRoundTrip,
} from "@kaiord/core";
import { fitReader, fitWriter } from "@kaiord/fit";

declare const originalBinary: Uint8Array;

const roundTrip = validateRoundTrip(
  fitReader,
  fitWriter,
  createToleranceChecker(),
  createConsoleLogger()
);

const violations = await roundTrip.validateBinaryRoundTrip({ originalBinary });
console.log(violations.length === 0 ? "lossless" : violations);
```

### Example 8: Custom tolerances

`createToleranceChecker` accepts a full `ToleranceConfig`. Start from
`DEFAULT_TOLERANCES` and override what you need.

```typescript
import {
  createConsoleLogger,
  createToleranceChecker,
  DEFAULT_TOLERANCES,
  validateRoundTrip,
} from "@kaiord/core";
import { fitReader, fitWriter } from "@kaiord/fit";

declare const originalBinary: Uint8Array;

const checker = createToleranceChecker({
  ...DEFAULT_TOLERANCES,
  powerTolerance: 2, // watts
  hrTolerance: 2, // bpm
});

const violations = await validateRoundTrip(
  fitReader,
  fitWriter,
  checker,
  createConsoleLogger()
).validateBinaryRoundTrip({ originalBinary });
```

### Example 9: Reading the violations

```typescript
import type { ToleranceViolation } from "@kaiord/core";

export const describeViolations = (
  violations: ReadonlyArray<ToleranceViolation>
): Array<string> =>
  violations.map((v) =>
    v.expectedValue !== undefined
      ? `${v.field}: expected ${v.expectedValue}, got ${v.actualValue}`
      : `${v.field}: expected ${v.expected}, got ${v.actual} (tolerance ${v.tolerance})`
  );
```

### Example 10: Comparing two KRDs

For a text format, round-trip with `toText`/`fromText` and compare the two
KRDs with `compareKRDs`.

```typescript
import {
  compareKRDs,
  createConsoleLogger,
  createToleranceChecker,
  fromText,
  toText,
} from "@kaiord/core";
import type { KRD } from "@kaiord/core";
import { tcxReader, tcxWriter } from "@kaiord/tcx";

declare const original: KRD;

const text = await toText(original, tcxWriter);
const roundTripped = await fromText(text, tcxReader);

const violations = compareKRDs(
  original,
  roundTripped,
  createToleranceChecker(),
  createConsoleLogger()
);
```

## Schema Validation

### Example 11: `validateKrd` and `.parse()`

```typescript
import { krdSchema, validateKrd } from "@kaiord/core";

declare const data: unknown;

// Throws KrdValidationError on failure
const krd = validateKrd(data);

// Throws a ZodError on failure
const parsed = krdSchema.parse(data);
```

### Example 12: `.safeParse()`

```typescript
import { krdSchema } from "@kaiord/core";

declare const data: unknown;

const result = krdSchema.safeParse(data);

if (result.success) {
  console.log("Valid KRD:", result.data.type);
} else {
  for (const issue of result.error.issues) {
    console.error(`${issue.path.join(".")}: ${issue.message}`);
  }
}
```

### Example 13: Enum values and narrowing

```typescript
import { intensitySchema, sportSchema } from "@kaiord/core";
import type { Duration, Target, Workout } from "@kaiord/core";

declare const workout: Workout;
declare const duration: Duration;
declare const target: Target;

const cycling = sportSchema.enum.cycling; // "cycling"
const warmup = intensitySchema.enum.warmup; // "warmup"

if (workout.sport === sportSchema.enum.running) {
  console.log("Running workout");
}

if (duration.type === "time") {
  console.log(duration.seconds);
}

if (target.type === "power") {
  console.log(target.value.unit);
}
```

## Error Handling

### Example 14: Reader failures

A reader signals a bad input with its own error. FIT readers throw
`FitParsingError`; the original error is on `cause`.

```typescript
import { fromBinary, FitParsingError } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";

declare const corruptedBuffer: Uint8Array;

try {
  await fromBinary(corruptedBuffer, fitReader);
} catch (error) {
  if (error instanceof FitParsingError) {
    console.error("FIT parsing failed:", error.message);
    console.error("Cause:", error.cause);
  }
}
```

### Example 15: Validation failures

```typescript
import { toBinary, KrdValidationError } from "@kaiord/core";
import type { KRD } from "@kaiord/core";
import { fitWriter } from "@kaiord/fit";

// Typed as KRD but fails schema validation at runtime
declare const invalidKrd: KRD;

try {
  await toBinary(invalidKrd, fitWriter);
} catch (error) {
  if (error instanceof KrdValidationError) {
    for (const err of error.errors) {
      console.error(`${err.field}: ${err.message}`);
    }
  }
}
```

### Example 16: Throwing on tolerance violations

`validateRoundTrip` returns its violations. A caller that wants to fail
throws `ToleranceExceededError` itself:

```typescript
import { ToleranceExceededError } from "@kaiord/core";
import type { ToleranceViolation } from "@kaiord/core";

export const assertLossless = (violations: Array<ToleranceViolation>): void => {
  if (violations.length > 0) {
    throw new ToleranceExceededError(
      `Round-trip exceeded tolerances (${violations.length} violations)`,
      violations
    );
  }
};
```

## Dependency Injection

A reader or writer is a plain function, so supplying your own needs no
registration. The ports are:

```typescript
import type {
  BinaryReader, // (buffer: Uint8Array) => Promise<KRD>
  BinaryWriter, // (krd: KRD) => Promise<Uint8Array>
  TextReader, // (text: string) => Promise<KRD>
  TextWriter, // (krd: KRD) => Promise<string>
} from "@kaiord/core";
```

### Example 17: A custom reader and writer

```typescript
import { fromBinary, toBinary } from "@kaiord/core";
import type { BinaryReader, BinaryWriter } from "@kaiord/core";

declare const buffer: Uint8Array;
declare const parseMyFormat: BinaryReader;
declare const encodeMyFormat: BinaryWriter;

// Core validates what your reader returns and what your writer receives
const krd = await fromBinary(buffer, parseMyFormat);
const encoded = await toBinary(krd, encodeMyFormat);
```

### Example 18: Composing your own pipeline

Because the ports are functions, composing a conversion is plain function
composition:

```typescript
import { fromBinary, toText } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";
import { zwiftWriter } from "@kaiord/zwo";

export const fitToZwo = async (
  fitBuffer: Uint8Array,
  logger?: Logger
): Promise<string> => {
  const krd = await fromBinary(fitBuffer, fitReader, logger);
  return toText(krd, zwiftWriter, logger);
};
```

## Additional Resources

- [Main README](../README.md) - Package overview and quick start
- [Architecture Documentation](../../../docs/architecture.md) - System design and patterns
- [Contributing Guidelines](../../../CONTRIBUTING.md) - How to contribute to the project

## Support

- [Issue Tracker](https://github.com/pablo-albaladejo/kaiord/issues) - Report bugs or request features
- [Discussions](https://github.com/pablo-albaladejo/kaiord/discussions) - Ask questions and share ideas
