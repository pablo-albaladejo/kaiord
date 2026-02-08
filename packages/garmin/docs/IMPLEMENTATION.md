# Implementation Guide - @kaiord/garmin

**Package:** @kaiord/garmin
**Version:** 1.0.0
**Status:** ✅ Production Ready
**Architecture:** Hexagonal (Ports & Adapters)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Core Concepts](#core-concepts)
- [Usage Examples](#usage-examples)
- [Converter Details](#converter-details)
- [Testing](#testing)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

---

## Overview

The @kaiord/garmin package provides format conversion between Garmin Connect API JSON format (GCN files) and Kaiord Representation Definition (KRD) format. It follows the hexagonal architecture pattern used throughout the Kaiord project.

### What This Package Does

- ✅ **Read GCN files**: Parse Garmin Connect API JSON responses into KRD
- ✅ **Write GCN files**: Convert KRD workouts into Garmin Connect API payloads
- ✅ **Validate schemas**: Ensure data integrity with Zod schemas
- ✅ **Preserve round-trips**: GCN → KRD → GCN maintains data fidelity
- ✅ **Support all features**: All sports, targets, conditions, multisport workouts

### What This Package Does NOT Do

- ❌ **API client**: No OAuth or HTTP communication (future phase)
- ❌ **SubSports**: Garmin Connect structured workout API doesn't support subsports
- ❌ **File I/O**: Use CLI or web editor for file operations

---

## Architecture

### Hexagonal Architecture Pattern

This package follows the hexagonal (ports & adapters) architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                      @kaiord/garmin                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │   Schemas    │         │   Mappers    │                │
│  │  (adapters)  │────────▶│ (adapters)   │                │
│  └──────────────┘         └──────────────┘                │
│         │                         │                         │
│         ▼                         ▼                         │
│  ┌─────────────────────────────────────────────┐           │
│  │           Converters (adapters)             │           │
│  │  • garmin-to-krd.converter.ts               │           │
│  │  • krd-to-garmin.converter.ts               │           │
│  └─────────────────────────────────────────────┘           │
│         │                         │                         │
│         ▼                         ▼                         │
│  ┌──────────────┐         ┌──────────────┐                │
│  │ GarminReader │         │ GarminWriter │                │
│  │    (port)    │         │    (port)    │                │
│  └──────────────┘         └──────────────┘                │
│         │                         │                         │
│         └─────────┬───────────────┘                         │
│                   ▼                                         │
│           ┌──────────────┐                                 │
│           │  Providers   │                                 │
│           │   Factory    │                                 │
│           └──────────────┘                                 │
│                   │                                         │
└───────────────────┼─────────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │    @kaiord/core      │
         │  Application Layer   │
         │  • Use Cases         │
         │  • Domain Types      │
         └──────────────────────┘
```

### Key Components

**Ports (in @kaiord/core):**
- `GarminReader`: Interface for reading GCN format
- `GarminWriter`: Interface for writing GCN format

**Adapters (in @kaiord/garmin):**
- `garmin-reader.ts`: Implementation of GarminReader
- `garmin-writer.ts`: Implementation of GarminWriter
- `converters/`: Business logic for format conversion
- `mappers/`: Simple transformations (no tests needed)
- `schemas/`: Zod validation schemas

**Dependency Rule:**
```
Schemas → Mappers → Converters → Ports → Providers → Core
(inner layers don't know about outer layers)
```

---

## Getting Started

### Installation

```bash
# In your package
pnpm add @kaiord/garmin

# Or via workspace (if in Kaiord monorepo)
{
  "dependencies": {
    "@kaiord/garmin": "workspace:^"
  }
}
```

### Basic Usage

```typescript
import { createGarminProviders } from "@kaiord/garmin";
import { createConsoleLogger } from "@kaiord/core";

// 1. Create providers with optional logger
const logger = createConsoleLogger();
const providers = createGarminProviders(logger);

// 2. Read GCN file (convert to KRD)
const gcnString = '{"workoutName": "My Workout", ...}';
const krd = await providers.garminReader.readGcn(gcnString);

// 3. Write GCN file (convert from KRD)
const outputGcn = await providers.garminWriter.writeGcn(krd);

console.log(outputGcn); // JSON string ready for Garmin Connect API
```

### Integration with Core

```typescript
import { createDefaultProviders } from "@kaiord/core";
import { createGarminProviders } from "@kaiord/garmin";

// Wire all adapters together
const providers = createDefaultProviders({
  garmin: createGarminProviders(),
});

// Use high-level use cases
const krd = await providers.convertGarminToKrd!({ gcnString: "..." });
const gcn = await providers.convertKrdToGarmin!({ krd });
```

---

## Core Concepts

### GCN Format

GCN (Garmin CoNnect) is the JSON format used by the Garmin Connect API for structured workouts.

**File Extension:** `.gcn`
**MIME Type:** `application/json`

**Example GCN File:**

```json
{
  "workoutName": "Interval Training",
  "sportType": {
    "sportTypeId": 1,
    "sportTypeKey": "running"
  },
  "workoutSegments": [
    {
      "segmentOrder": 1,
      "sportType": { "sportTypeId": 1, "sportTypeKey": "running" },
      "workoutSteps": [
        {
          "type": "ExecutableStepDTO",
          "stepOrder": 1,
          "stepType": { "stepTypeId": 1, "stepTypeKey": "warmup" },
          "endCondition": { "conditionTypeId": 2, "conditionTypeKey": "time" },
          "endConditionValue": 600,
          "targetType": { "workoutTargetTypeId": 1, "workoutTargetTypeKey": "no.target" }
        }
      ]
    }
  ]
}
```

### Input vs Output Schemas

The Garmin API has **asymmetric** input/output schemas:

**Input (sending to API):**
```typescript
{
  targetValueOne: "200" | 200,  // Accepts string OR number
  zoneNumber: "3" | 3,          // Accepts string OR number
}
```

**Output (receiving from API):**
```typescript
{
  targetValueOne: 200.0,  // Always number (float)
  zoneNumber: 3,          // Always number (integer)
  workoutId: 1467223396,  // Server-assigned
  stepId: 12368371258,    // Server-assigned
}
```

See [INPUT-VS-OUTPUT.md](./INPUT-VS-OUTPUT.md) for complete details.

### Multisport Workouts

Multisport workouts (e.g., triathlon) have special requirements:

```typescript
{
  "sportType": {
    "sportTypeId": 10,
    "sportTypeKey": "multi_sport"
  },
  "workoutSegments": [
    {
      "segmentOrder": 1,
      "sportType": { "sportTypeKey": "cycling" },
      "workoutSteps": [
        { "stepOrder": 1, ... },  // Global sequence
        { "stepOrder": 2, ... }
      ]
    },
    {
      "segmentOrder": 2,
      "sportType": { "sportTypeKey": "running" },
      "workoutSteps": [
        { "stepOrder": 3, ... },  // Continues global sequence
        { "stepOrder": 4, ... }
      ]
    }
  ]
}
```

**Key Rule:** `stepOrder` must be globally sequential across ALL segments.

---

## Usage Examples

### Example 1: Convert GCN to KRD

```typescript
import { readFileSync } from "fs";
import { createGarminProviders } from "@kaiord/garmin";

// Read GCN file from disk
const gcnContent = readFileSync("workout.gcn", "utf-8");

// Create providers
const { garminReader } = createGarminProviders();

// Convert to KRD
const krd = await garminReader.readGcn(gcnContent);

console.log(krd);
// {
//   version: "1.0.0",
//   workout: {
//     name: "Interval Training",
//     sport: "running",
//     steps: [...]
//   }
// }
```

### Example 2: Convert KRD to GCN

```typescript
import { writeFileSync } from "fs";
import { createGarminProviders } from "@kaiord/garmin";
import type { KRD } from "@kaiord/core";

// Create KRD workout
const krd: KRD = {
  version: "1.0.0",
  workout: {
    name: "Easy Run",
    sport: "running",
    steps: [
      {
        type: "step",
        step_type: "warmup",
        duration_type: "time",
        duration_value: 600,
        target_type: "no_target",
      },
    ],
  },
};

// Create providers
const { garminWriter } = createGarminProviders();

// Convert to GCN
const gcnString = await garminWriter.writeGcn(krd);

// Save to file
writeFileSync("workout.gcn", gcnString, "utf-8");
```

### Example 3: Round-Trip Conversion

```typescript
import { createGarminProviders } from "@kaiord/garmin";

const { garminReader, garminWriter } = createGarminProviders();

// Original GCN
const originalGcn = '{"workoutName": "Test", ...}';

// Convert GCN → KRD → GCN
const krd = await garminReader.readGcn(originalGcn);
const convertedGcn = await garminWriter.writeGcn(krd);

// Verify structure preserved
console.log(JSON.parse(convertedGcn).workoutName); // "Test"
```

### Example 4: Using with CLI

```bash
# Convert GCN to KRD
kaiord convert --in workout.gcn --out workout.krd

# Convert KRD to GCN
kaiord convert --in workout.krd --out workout.gcn

# Specify format explicitly
kaiord convert --in workout.json --out workout.gcn --format gcn
```

### Example 5: Custom Logger

```typescript
import { createGarminProviders } from "@kaiord/garmin";
import type { Logger } from "@kaiord/core";

// Custom logger implementation
const customLogger: Logger = {
  debug: (message: string) => console.log(`[DEBUG] ${message}`),
  info: (message: string) => console.log(`[INFO] ${message}`),
  warn: (message: string) => console.warn(`[WARN] ${message}`),
  error: (message: string, error?: Error) =>
    console.error(`[ERROR] ${message}`, error),
};

// Use custom logger
const providers = createGarminProviders(customLogger);
```

### Example 6: Error Handling

```typescript
import { createGarminProviders } from "@kaiord/garmin";

const { garminReader } = createGarminProviders();

try {
  const krd = await garminReader.readGcn(invalidGcnString);
} catch (error) {
  if (error instanceof Error) {
    console.error("Conversion failed:", error.message);

    // Check for specific errors
    if (error.message.includes("JSON")) {
      console.error("Invalid JSON format");
    } else if (error.message.includes("schema")) {
      console.error("Schema validation failed");
    }
  }
}
```

---

## Converter Details

### garmin-to-krd.converter.ts

Converts Garmin Connect API JSON to KRD format.

**Process:**
1. Parse JSON string
2. Validate with output schema
3. Map workout metadata
4. Map segments (handle multisport)
5. Map steps recursively (handle nested repeats)
6. Return KRD

**Key Transformations:**
- `workoutName` → `workout.name`
- `sportType.sportTypeKey` → `workout.sport`
- `workoutSteps` → `workout.steps` (flatten for single sport)
- `workoutSegments` → `workout.steps` (preserve order for multisport)
- Server IDs preserved in `extensions.garmin`

### krd-to-garmin.converter.ts

Converts KRD format to Garmin Connect API JSON payload.

**Process:**
1. Validate KRD
2. Map to Garmin input structure
3. Generate stepOrder sequentially
4. Validate with input schema
5. Serialize to JSON
6. Return GCN string

**Key Transformations:**
- `workout.name` → `workoutName`
- `workout.sport` → `sportType`
- `workout.steps` → `workoutSteps` (single sport) or `workoutSegments` (multisport)
- Target zones → `targetType` + `zoneNumber`
- Target ranges → `targetType` + `targetValueOne/Two`

### Mappers

Mappers are simple transformation functions without business logic:

- `sport.mapper.ts`: KRD sport ↔ Garmin sportTypeKey
- `target.mapper.ts`: KRD targets ↔ Garmin target structures
- `condition.mapper.ts`: KRD duration ↔ Garmin endCondition
- `stroke.mapper.ts`: KRD swimming ↔ Garmin strokeType
- `equipment.mapper.ts`: KRD equipment ↔ Garmin equipmentType
- `intensity.mapper.ts`: KRD intensity ↔ Garmin stepType

---

## Testing

### Unit Tests

```bash
# Run all tests
cd packages/garmin
pnpm test

# Run with coverage
pnpm test --coverage

# Watch mode
pnpm test --watch
```

### Round-Trip Tests

```bash
# Test GCN → KRD → GCN preservation
pnpm test round-trip
```

**Coverage Target:** 80%+ (lines, functions, branches, statements)

### Test Fixtures

All tests use fixtures from `test-fixtures/gcn/`:

- `WorkoutRunningNestedRepeatsOutput.gcn` - Nested repeats
- `WorkoutCyclingPowerCadenceOutput.gcn` - Power + Cadence
- `WorkoutSwimmingAllStrokesOutput.gcn` - All strokes + equipment
- `WorkoutStrengthRepsOutput.gcn` - Reps condition
- `WorkoutEdgeCasesOutput.gcn` - Edge cases
- `WorkoutMultisportTriathlonOutput.gcn` - Multisport

---

## Common Patterns

### Pattern 1: Dependency Injection

```typescript
// ✅ GOOD: Inject logger
const providers = createGarminProviders(customLogger);

// ❌ BAD: Don't access converters directly
import { convertGarminToKRD } from "@kaiord/garmin/adapters/converters";
```

### Pattern 2: Use Cases Over Direct Calls

```typescript
// ✅ GOOD: Use high-level use cases
const providers = createDefaultProviders({ garmin: createGarminProviders() });
const krd = await providers.convertGarminToKrd!({ gcnString });

// ⚠️ OK: Use ports directly (lower level)
const { garminReader } = createGarminProviders();
const krd = await garminReader.readGcn(gcnString);

// ❌ BAD: Don't bypass providers
import { convertGarminToKRD } from "@kaiord/garmin/adapters/converters";
```

### Pattern 3: Schema Validation

```typescript
// Schemas are used internally by converters
// You don't need to validate manually
const krd = await garminReader.readGcn(gcnString); // ✅ Auto-validated
```

---

## Troubleshooting

### Issue: "Invalid JSON"

**Error:** `SyntaxError: Unexpected token`

**Cause:** GCN file contains invalid JSON

**Solution:**
```bash
# Validate JSON syntax
jq . workout.gcn

# Pretty-print to find errors
cat workout.gcn | python -m json.tool
```

### Issue: "Schema validation failed"

**Error:** `ZodError: [...]`

**Cause:** GCN structure doesn't match schema

**Solutions:**
1. Check GCN came from Garmin Connect API (not manually created)
2. Verify all required fields present
3. Check field types (numbers vs strings)

### Issue: "SubSport not supported"

**Error:** Workout fails to convert

**Cause:** Garmin structured workout API doesn't support subsports

**Solution:** Use main sport instead:
```typescript
// ❌ DON'T USE: subsports
workout.sport = "indoor_cycling";  // Not supported

// ✅ USE: main sports
workout.sport = "cycling";  // Supported
```

### Issue: "Workout name truncated"

**Behavior:** Long workout names get cut off

**Cause:** Garmin API truncates names to 255 characters

**Solution:** Keep workout names under 255 characters

### Issue: "Round-trip doesn't match exactly"

**Behavior:** GCN → KRD → GCN produces slightly different output

**Expected:** This is normal due to:
- Server-assigned IDs removed (workoutId, stepId)
- Type objects simplified (displayOrder removed)
- Float precision differences (600.0 → 600)

**What's preserved:**
- Workout structure
- Step sequence
- Target values (within tolerance)
- Duration values (within tolerance)

---

## Additional Resources

### Related Documentation

- **[CLAUDE.md](/CLAUDE.md)** - Project conventions and code style
- **[AGENTS.md](/AGENTS.md)** - AI development guidelines (strict rules)
- **[docs/architecture.md](/docs/architecture.md)** - Hexagonal architecture guide
- **[docs/krd-format.md](/docs/krd-format.md)** - KRD format specification

### Package Documentation

- **[API-FINDINGS.md](./API-FINDINGS.md)** - Garmin Connect API research
- **[INPUT-VS-OUTPUT.md](./INPUT-VS-OUTPUT.md)** - Schema asymmetry details
- **[TESTING-GUIDE.md](./TESTING-GUIDE.md)** - Live API testing guide
- **[SCHEMA-VALIDATION.md](./SCHEMA-VALIDATION.md)** - Schema validation report

### External Resources

- [Garmin Connect API Projects](https://github.com/topics/garmin-connect-api)
- [garth Library](https://github.com/matin/garth) - Python OAuth for Garmin

---

**Last Updated:** 2026-02-08
**Maintainer:** Kaiord Contributors
**Questions?** See [TEST-RESULTS.md](./TEST-RESULTS.md) for real API examples
