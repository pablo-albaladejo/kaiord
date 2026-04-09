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

## Tools

### kaiord_convert

Convert between FIT, TCX, ZWO, GCN, and KRD formats.

- **Input**: source format, target format, file content (base64 for binary)
- **Output**: converted file content

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
