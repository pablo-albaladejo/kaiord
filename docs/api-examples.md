# API Examples

Practical examples for using the Kaiord core API with format adapters.

## Basic Conversion

All conversions go through KRD, the canonical JSON format. Use strategy injection to wire format-specific readers/writers.

### FIT to KRD

```typescript
import { fromBinary } from "@kaiord/core";
import { createFitReader } from "@kaiord/fit";
import { readFile } from "fs/promises";

const buffer = new Uint8Array(await readFile("workout.fit"));
const krd = await fromBinary(buffer, createFitReader());
```

### KRD to TCX

```typescript
import { toText } from "@kaiord/core";
import { createTcxWriter } from "@kaiord/tcx";

const tcxString = await toText(krd, createTcxWriter());
```

### FIT to TCX (via KRD)

```typescript
import { fromBinary, toText } from "@kaiord/core";
import { createFitReader } from "@kaiord/fit";
import { createTcxWriter } from "@kaiord/tcx";

const krd = await fromBinary(fitBuffer, createFitReader());
const tcx = await toText(krd, createTcxWriter());
```

## Pre-built vs Factory Adapters

Each adapter package exports two styles:

```typescript
// Pre-built (uses default console logger)
import { fitReader, fitWriter } from "@kaiord/fit";
const krd = await fromBinary(buffer, fitReader);

// Factory (inject your own logger)
import { createFitReader } from "@kaiord/fit";
const reader = createFitReader(myLogger);
const krd = await fromBinary(buffer, reader);
```

## Schema Validation

```typescript
import { krdSchema, validateKrd } from "@kaiord/core";

// Zod safeParse
const result = krdSchema.safeParse(data);
if (!result.success) {
  console.error(result.error.errors);
}

// Throws on invalid data
const krd = validateKrd(data);
```

## Workout Extraction

```typescript
import { extractWorkout } from "@kaiord/core";

const workout = extractWorkout(krd);
// { name, sport, subSport, steps: WorkoutStep[] }
```

## Error Handling

```typescript
import { fromBinary } from "@kaiord/core";
import {
  FitParsingError,
  KrdValidationError,
  ToleranceExceededError,
} from "@kaiord/core";

try {
  const krd = await fromBinary(buffer, fitReader);
} catch (error) {
  if (error instanceof FitParsingError) {
    // Invalid FIT file
  } else if (error instanceof KrdValidationError) {
    // KRD schema validation failed
  }
}
```

## Round-Trip Validation

```typescript
import { createToleranceChecker, validateRoundTrip } from "@kaiord/core";
import { createFitReader, createFitWriter } from "@kaiord/fit";

const checker = createToleranceChecker(); // default tolerances
const validator = validateRoundTrip(
  createFitReader(),
  createFitWriter(),
  checker,
  logger
);

const violations = await validator.validateFitToKrdToFit({
  originalFit: fitBuffer,
});
// violations: ToleranceViolation[] (empty = perfect round-trip)
```

## Custom Logger

```typescript
import type { Logger } from "@kaiord/core";

const myLogger: Logger = {
  debug: (msg, meta) => console.debug(msg, meta),
  info: (msg, meta) => console.info(msg, meta),
  warn: (msg, meta) => console.warn(msg, meta),
  error: (msg, meta) => console.error(msg, meta),
};

const krd = await fromBinary(buffer, createFitReader(myLogger), myLogger);
```
