---
title: "MCP Tools"
description: "Kaiord MCP server reference: tools, resources, and prompts for AI/LLM integration via the Model Context Protocol."
---

# MCP Tools

The `@kaiord/mcp` package provides a Model Context Protocol (MCP) server that exposes fitness file conversion, validation, and inspection tools to AI agents.

## Installation

```bash
npm install -g @kaiord/mcp
```

## Configuration

### Claude Desktop / Claude Code

Add to your MCP configuration:

```json
{
  "kaiord": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@kaiord/mcp"]
  }
}
```

### Local development

```json
{
  "kaiord": {
    "type": "stdio",
    "command": "node",
    "args": ["./packages/mcp/dist/bin/kaiord-mcp.js"]
  }
}
```

### Remote endpoint

Kaiord also runs a hosted, stateless MCP endpoint at `https://kaiord.com/mcp`
(MCP over HTTP, no install, no account):

```json
{
  "kaiord": {
    "type": "http",
    "url": "https://kaiord.com/mcp"
  }
}
```

The remote server is a subset of the local one:

- **Eight tools**: `kaiord_get_format_spec`, `kaiord_list_formats`,
  `kaiord_convert`, `kaiord_validate`, `kaiord_round_trip_validate`,
  `kaiord_inspect`, `kaiord_extract_workout` and `kaiord_diff`. They take
  inline content only: text as is, FIT as base64. File path parameters are
  rejected, and FIT output comes back as base64.
- **Structured workouts only**: recorded activities, courses and health files
  are rejected.
- **Size limit**: a request body may be at most 65,536 bytes, and carries one
  call. JSON-RPC batches are rejected.
- **ZWO without XSD**: ZWO input is checked for well-formedness only. It is not
  validated against the ZWO XSD, which needs Java.
- **Local-only tools**: the Garmin Connect tools (`kaiord_garmin_*`) and the
  health tools need your own machine and accounts, so they exist only in the
  local `@kaiord/mcp` server. The remote server has no prompts.

The endpoint stores and logs nothing; see the
[privacy policy](/legal/privacy-policy#remote-mcp-endpoint).

## Tools

### kaiord_convert

Convert between FIT, TCX, ZWO, GCN, and KRD formats.

- **Input**: source format, target format, file content (base64 for binary),
  optional `ftp` (athlete FTP in watts)
- **Output**: converted file content

GCN output stores power in watts, so a workout with % FTP power targets needs
`ftp`; without it the tool fails with the `missing-ftp` error type.
Heart-rate targets given as % max HR fail with the `missing-max-hr` type until
the tools accept a max heart rate (#1554); rewrite them as bpm.

### kaiord_garmin_push

Push a KRD workout to Garmin Connect (after `kaiord_garmin_login`).

- **Input**: KRD JSON (file or inline), optional `ftp` (athlete FTP in watts,
  required when the workout has % FTP power targets)
- **Output**: the created Garmin Connect workout id, name, and URL

### kaiord_validate

Validate KRD JSON against the schema.

- **Input**: KRD JSON content
- **Output**: validation result with errors if any

### kaiord_inspect

Parse and summarize any fitness file.

- **Input**: file content and format
- **Output**: structured metadata, sport, steps summary

### kaiord_diff

Compare two fitness files and show differences.

- **Input**: two files with their formats
- **Output**: field-by-field differences with tolerances applied

### kaiord_extract_workout

Extract structured workout definition from a fitness file.

- **Input**: file content and format
- **Output**: workout JSON with steps, targets, and durations

### kaiord_list_formats

List all supported formats and their capabilities.

- **Input**: none
- **Output**: format registry with read/write/validate support per format

## Resources

| URI                        | Description                         |
| -------------------------- | ----------------------------------- |
| `kaiord://schema/krd`      | KRD JSON Schema                     |
| `kaiord://formats`         | Supported formats with capabilities |
| `kaiord://docs/krd-format` | KRD format specification            |

## Prompts

| Name              | Description                               |
| ----------------- | ----------------------------------------- |
| `convert_file`    | Guided file conversion workflow           |
| `analyze_workout` | Inspect, extract, and summarize a workout |

## Supported formats

| Format | Extension | Type   | Description                  |
| ------ | --------- | ------ | ---------------------------- |
| FIT    | `.fit`    | Binary | Garmin FIT protocol          |
| TCX    | `.tcx`    | Text   | Training Center XML          |
| ZWO    | `.zwo`    | Text   | Zwift workout XML            |
| GCN    | `.gcn`    | Text   | Garmin Connect workout JSON  |
| KRD    | `.krd`    | Text   | Kaiord canonical JSON format |

## Next steps

- [Quick Start](/guide/quick-start) -- get started with Kaiord
- [CLI Commands](/cli/commands) -- command-line alternative
