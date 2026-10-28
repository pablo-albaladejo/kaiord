---
name: kaiord-workout-files
description: Convert, validate and inspect structured workout files (FIT, TCX, ZWO, Garmin Connect JSON, KRD) with the Kaiord CLI or the Kaiord MCP server.
---

# Kaiord workout files

Kaiord converts structured workout files between FIT, TCX, ZWO (Zwift),
GCN (Garmin Connect JSON) and KRD, its canonical JSON format. Every
conversion goes through KRD and is round-trip safe within fixed tolerances
(time ±1 s, power ±1 W or ±1 %FTP, heart rate ±1 bpm, cadence ±1 rpm).

Use this skill when a user wants to move a workout between training
platforms, check that a file survives a conversion, or read what a workout
file contains.

## Option A: the MCP server (preferred for agents)

Add the stdio server to the client configuration:

```json
{
  "kaiord": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@kaiord/mcp"]
  }
}
```

Tools:

- `kaiord_list_formats` lists the supported formats and what each can do.
- `kaiord_convert` converts between FIT, TCX, ZWO, GCN and KRD.
- `kaiord_inspect` parses any supported file and summarizes it.
- `kaiord_validate` validates KRD JSON against the schema.
- `kaiord_diff` compares two workout files.
- `kaiord_extract_workout` extracts the structured workout definition.
- `kaiord_round_trip_validate` converts a file through KRD and back, and
  reports any drift beyond the tolerances.

Resources: `kaiord://schema/krd` (KRD JSON Schema), `kaiord://formats`,
`kaiord://docs/krd-format`.

## Option B: the CLI

```bash
npm install -g @kaiord/cli
kaiord convert --input workout.fit --output workout.krd
kaiord convert --input "workouts/*.fit" --output-dir converted/
kaiord validate --input workout.fit
```

The format is detected from the file extension; override it with
`--input-format`.

## Rules

- Convert through KRD; do not hand-edit FIT binaries.
- Run a round-trip validation before telling the user a converted file is
  safe to upload.
- Kaiord runs locally. Do not upload a user's workout files anywhere to
  convert them.

## References

- Documentation: https://kaiord.com/docs/
- MCP tools: https://kaiord.com/docs/mcp/tools
- KRD format: https://kaiord.com/docs/formats/krd
- Source (MIT): https://github.com/pablo-albaladejo/kaiord
