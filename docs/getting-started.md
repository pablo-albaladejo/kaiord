# Getting Started with Kaiord

This guide helps you start using Kaiord to work with workout files.

## What is Kaiord?

Kaiord is an open-source framework for health & fitness data. It helps you:

- Convert files between different formats (FIT, TCX, ZWO, GCN, KRD)
- Read and write health & fitness data in your programs
- Validate and compare files across formats

## What You Need

Before you start, install these tools:

- **Node.js** version 20 or newer (Node.js 24 recommended) ([download here](https://nodejs.org/))
- **pnpm** package manager ([install guide](https://pnpm.io/installation))

Check your versions:

```bash
node --version  # Should show v20.0.0 or higher (v24.x recommended)
pnpm --version  # Should show 9.15.0 or higher
```

## Installation

### Using the Library

Install the core library in your project:

```bash
pnpm add @kaiord/core
```

### Using the CLI Tool

Install the command-line tool globally:

```bash
pnpm add -g @kaiord/cli
```

Or use it directly without installing:

```bash
pnpx @kaiord/cli --help
```

## Quick Start: Library

Here's how to use Kaiord in your TypeScript or JavaScript code.

### Convert a FIT File to KRD

```typescript
import { fromBinary } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";
import { readFile } from "fs/promises";

// Read a FIT file and convert to KRD
const buffer = await readFile("workout.fit");
const krd = await fromBinary(buffer, fitReader);

console.log(krd.metadata.sport); // "cycling"
```

### Convert KRD to TCX

```typescript
import { toText } from "@kaiord/core";
import { tcxWriter } from "@kaiord/tcx";
import { writeFile } from "fs/promises";

// Convert KRD to TCX format
const tcxString = await toText(krd, tcxWriter);
await writeFile("workout.tcx", tcxString);
```

### Read a Zwift Workout

```typescript
import { fromText } from "@kaiord/core";
import { zwiftReader } from "@kaiord/zwo";
import { readFile } from "fs/promises";

// Read a ZWO file and convert to KRD
const zwoContent = await readFile("workout.zwo", "utf-8");
const krd = await fromText(zwoContent, zwiftReader);

console.log(krd.metadata.sport); // "cycling"
```

## Quick Start: CLI

The command-line tool lets you convert files without writing code.

### Show Help

```bash
kaiord --help
```

### Convert a File

```bash
# Convert FIT to KRD
kaiord convert --input workout.fit --output workout.krd

# Convert KRD to TCX
kaiord convert --input workout.krd --output workout.tcx

# Convert ZWO to FIT
kaiord convert --input workout.zwo --output workout.fit
```

The tool detects file types from the file extension.

### Validate a File

```bash
# Check if a KRD file is valid
kaiord validate --input workout.krd
```

## Understanding KRD Format

KRD (Kaiord Representation Definition) is a JSON format for workout data.

### Example KRD File

```json
{
  "version": "1.0",
  "type": "workout",
  "metadata": {
    "created": "2025-01-15T10:30:00Z",
    "sport": "running"
  },
  "extensions": {
    "workout": {
      "name": "Morning Run",
      "sport": "running",
      "steps": [
        {
          "stepIndex": 0,
          "durationType": "time",
          "duration": {
            "type": "time",
            "seconds": 600
          },
          "targetType": "heart_rate",
          "target": {
            "type": "heart_rate",
            "value": {
              "unit": "zone",
              "value": 2
            }
          },
          "intensity": "warmup"
        }
      ]
    }
  }
}
```

### Why Use KRD?

- **Easy to read**: JSON format is simple to understand
- **Easy to edit**: Change workout data with any text editor
- **Complete**: Keeps all workout information
- **Safe**: Converting back and forth doesn't lose data

## Common Tasks

### Convert Multiple Files

```bash
# Convert all FIT files in a folder
for file in *.fit; do
  kaiord convert --input "$file" --output "${file%.fit}.krd"
done
```

### Use in a Build Script

```json
{
  "scripts": {
    "convert": "kaiord convert --input workouts/source.fit --output workouts/output.krd"
  }
}
```

### Handle Errors

```typescript
import { fromBinary } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";

try {
  const krd = await fromBinary(buffer, fitReader);
  console.log("Success!");
} catch (error) {
  console.error("Conversion failed:", error.message);
}
```

## Next Steps

Now that you know the basics, learn more:

- **[Architecture Guide](./architecture.md)** - How Kaiord is built
- **[KRD Format Specification](./krd-format.md)** - Complete format details
- **[Testing Guide](./testing.md)** - How to test your code
- **[Contributing Guide](../CONTRIBUTING.md)** - Help improve Kaiord

## Need Help?

- **Issues**: [Report bugs on GitHub](https://github.com/pablo-albaladejo/kaiord/issues)
- **Documentation**: [Read more in /docs](./README.md)

## Examples

Find more examples in the repository:

- **Core library examples**: `packages/core/src/tests/fixtures/`
- **CLI examples**: `packages/cli/src/tests/fixtures/`
- **Real workout files**: Test files in each package

---

**Ready to start?** Install Kaiord and try converting your first workout file!
