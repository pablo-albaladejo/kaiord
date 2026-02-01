---
name: convert
description: Convert workout files between FIT, TCX, ZWO, KRD formats
allowed-tools: Bash
---

Convert workouts using the Kaiord CLI.

## Usage

```bash
# Build CLI first (if needed)
pnpm --filter @kaiord/cli build

# Simple conversion
pnpm --filter @kaiord/cli dev -- convert -i $0 -o $1

# Batch conversion
pnpm --filter @kaiord/cli dev -- convert -i 'workouts/*.fit' --output-dir converted/ --output-format krd
```

## Supported Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| FIT | .fit | Garmin binary format |
| TCX | .tcx | Training Center XML |
| ZWO | .zwo | Zwift Workout |
| KRD | .krd | Kaiord JSON (canonical) |

## Examples

```bash
# FIT to KRD
pnpm --filter @kaiord/cli dev -- convert -i workout.fit -o workout.krd

# KRD to TCX
pnpm --filter @kaiord/cli dev -- convert -i workout.krd -o workout.tcx
```
