---
title: "CLI Commands"
description: "Complete reference for the Kaiord CLI: convert, validate, inspect, diff, extract-workout, and garmin commands with all options."
---

# CLI Commands

The `@kaiord/cli` package provides a command-line interface for converting, validating, and inspecting fitness files.

## Installation

```bash
pnpm add -g @kaiord/cli
```

Or use without installing:

```bash
pnpx @kaiord/cli --help
```

## convert

Convert workout files between formats. Detects formats from file extensions.

```bash
kaiord convert -i workout.fit -o workout.krd
kaiord convert -i workout.krd -o workout.tcx
kaiord convert -i "workouts/*.fit" --output-dir converted/
kaiord convert -i data.bin --input-format fit -o workout.krd
```

| Option | Alias | Description |
| --- | --- | --- |
| `--input` | `-i` | Input file path or glob pattern (required) |
| `--output` | `-o` | Output file path |
| `--output-dir` | | Output directory for batch conversion |
| `--input-format` | | Override input format: `fit`, `gcn`, `krd`, `tcx`, `zwo` |
| `--output-format` | | Override output format: `fit`, `gcn`, `krd`, `tcx`, `zwo` |

## validate

Validate round-trip conversion integrity of FIT files (FIT to KRD to FIT).

```bash
kaiord validate -i workout.fit
kaiord validate -i workout.fit --tolerance-config custom.json
```

| Option | Alias | Description |
| --- | --- | --- |
| `--input` | `-i` | Input file path (required) |
| `--tolerance-config` | | Path to custom tolerance configuration JSON |

Tolerance config example:

```json
{
  "time": { "absolute": 1, "unit": "seconds" },
  "power": { "absolute": 1, "percentage": 1, "unit": "watts" },
  "heartRate": { "absolute": 1, "unit": "bpm" },
  "cadence": { "absolute": 1, "unit": "rpm" }
}
```

## inspect

Parse a fitness file and display a summary or full KRD JSON.

```bash
kaiord inspect -i workout.fit
kaiord inspect -i workout.fit --json
kaiord inspect -i workout.fit --input-format fit
```

| Option | Alias | Description |
| --- | --- | --- |
| `--input` | `-i` | Input file path (required) |
| `--input-format` | | Override format detection: `fit`, `tcx`, `zwo`, `gcn`, `krd` |

## diff

Compare two workout files and show differences. Supports cross-format comparison.

```bash
kaiord diff --file1 workout1.fit --file2 workout2.fit
kaiord diff --file1 workout.fit --file2 workout.krd
kaiord diff --file1 a.krd --file2 b.krd --json
```

| Option | Alias | Description |
| --- | --- | --- |
| `--file1` | `-1` | First file to compare (required) |
| `--file2` | `-2` | Second file to compare (required) |
| `--format1` | | Override format detection for first file |
| `--format2` | | Override format detection for second file |

## extract-workout

Extract the structured workout definition from a fitness file as JSON.

```bash
kaiord extract-workout -i workout.fit
kaiord extract-workout -i workout.krd
```

| Option | Alias | Description |
| --- | --- | --- |
| `--input` | `-i` | Input file path (required) |
| `--input-format` | | Override format detection |

## garmin

Garmin Connect operations. Requires authentication via `garmin login`.

### garmin login

```bash
kaiord garmin login -e user@example.com -p password
```

| Option | Alias | Description |
| --- | --- | --- |
| `--email` | `-e` | Garmin Connect email (required) |
| `--password` | `-p` | Garmin Connect password (required) |

### garmin logout

```bash
kaiord garmin logout
```

### garmin list

```bash
kaiord garmin list
kaiord garmin list --limit 50 --offset 20
```

| Option | Alias | Description |
| --- | --- | --- |
| `--limit` | `-l` | Maximum workouts to list (default: 20) |
| `--offset` | | Number of workouts to skip (default: 0) |

### garmin push

```bash
kaiord garmin push -i workout.krd
kaiord garmin push -i workout.fit --input-format fit
```

| Option | Alias | Description |
| --- | --- | --- |
| `--input` | `-i` | Input workout file path (required) |
| `--input-format` | | Override format detection |

## Global options

| Option | Description |
| --- | --- |
| `--verbose` | Enable verbose logging |
| `--quiet` | Quiet mode (errors only) |
| `--json` | JSON output (machine-readable) |
| `--log-format` | Log format: `pretty` or `json` |
| `--help` | Show help |
| `--version` | Show version |

## Configuration file

Create `.kaiordrc.json` in your project or home directory for defaults:

```json
{
  "defaultInputFormat": "fit",
  "defaultOutputFormat": "krd",
  "defaultOutputDir": "./converted",
  "verbose": false,
  "quiet": false,
  "json": false,
  "logFormat": "pretty"
}
```

CLI options always override config file defaults.

## Supported formats

| Format | Extension | Type | Description |
| --- | --- | --- | --- |
| FIT | `.fit` | Binary | Garmin FIT protocol |
| KRD | `.krd` | Text | Kaiord canonical JSON |
| TCX | `.tcx` | Text | Training Center XML |
| ZWO | `.zwo` | Text | Zwift workout XML |
| GCN | `.gcn` | Text | Garmin Connect JSON |

## Exit codes

- **0**: Success
- **1**: Error (invalid arguments, file not found, parsing error)
