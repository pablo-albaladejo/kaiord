# @kaiord/mcp

Model Context Protocol (MCP) server for Kaiord. Exposes fitness file conversion, validation, and inspection tools to AI agents (Claude Desktop, Claude Code, etc.).

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

### Local development (monorepo)

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

| Tool | Description |
|------|-------------|
| `kaiord_convert` | Convert between FIT, TCX, ZWO, GCN, and KRD formats |
| `kaiord_validate` | Validate KRD JSON against the schema |
| `kaiord_inspect` | Parse and summarize any fitness file |
| `kaiord_diff` | Compare two fitness files |
| `kaiord_extract_workout` | Extract structured workout definition |
| `kaiord_list_formats` | List supported formats and capabilities |

## Resources

| URI | Description |
|-----|-------------|
| `kaiord://schema/krd` | KRD JSON Schema |
| `kaiord://formats` | Supported formats with capabilities |
| `kaiord://docs/krd-format` | KRD format specification |

## Prompts

| Name | Description |
|------|-------------|
| `convert_file` | Guided file conversion workflow |
| `analyze_workout` | Inspect + extract + summarize a workout |

## Supported Formats

| Format | Extension | Type | Description |
|--------|-----------|------|-------------|
| FIT | `.fit` | Binary | Garmin FIT protocol |
| TCX | `.tcx` | Text | Training Center XML |
| ZWO | `.zwo` | Text | Zwift workout XML |
| GCN | `.gcn` | Text | Garmin Connect workout JSON |
| KRD | `.krd` | Text | Kaiord canonical JSON format |

## License

MIT
