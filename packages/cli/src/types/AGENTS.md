<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/types/AGENTS.md

Type definitions and interfaces for the CLI.

## Purpose

**What lives here:** Shared TypeScript types, interfaces, and protocols that multiple modules depend on.

Currently: Plugin system interfaces (for future extensibility).

## Key Files

- **`plugin.ts`** — Plugin system interfaces:
  - `KaiordPlugin` — Main plugin interface (name, version, formats, converters, lifecycle hooks)
  - `PluginFormat` — Describes a format supported by a plugin (extension, MIME type, description)
  - `PluginMetadata` — Metadata discovered during plugin scanning
  - `PluginValidationResult` — Result of plugin validation
  - `PluginDiscovery` — Service to discover and load plugins
  - `PluginRegistry` — Service to register and query loaded plugins
  - `PluginConfig` — Plugin configuration from `.kaiordrc.json`

## For AI Agents: Working in This Directory

### When to Add Types Here

- Shared across 3+ modules
- Part of a protocol or interface contract
- Plugin system or extensibility concerns
- Configuration schemas

### When to Keep Types Local

- Used by single command or utility
- Command-specific options (keep in `src/commands/mycommand/types.ts`)
- Utility-specific schemas (keep in `src/utils/my-util.ts` as Zod schema)

### Plugin System Overview

The plugin system is **designed but not yet implemented**. It allows third-party developers to add format support without modifying core code.

**Key concepts:**

- Plugins are npm packages named `@kaiord/plugin-*`
- Each plugin implements `KaiordPlugin` interface
- Plugin discovery: scan `node_modules/@kaiord/plugin-*`, global plugin dir, config file
- Format resolution: map file extensions to plugins
- Converters: `toKrd()` (format → KRD) and `fromKrd()` (KRD → format)

**Example (from docs/plugin-architecture.md):**

```typescript
const gpxPlugin: KaiordPlugin = {
  name: "@kaiord/plugin-gpx",
  version: "1.0.0",
  description: "GPX format support",
  formats: [
    {
      extension: ".gpx",
      mimeType: "application/gpx+xml",
      description: "GPS Exchange Format",
    },
  ],
  kaiordVersion: "^0.1.0",
  toKrd: async (input) => {
    /* ... */
  },
  fromKrd: async (krd) => {
    /* ... */
  },
};
```

### Adding New Types

1. Create a focused `.ts` file in `src/types/`
2. Export types, not implementations
3. Document with JSDoc comments
4. Keep definitions under 100 lines
5. Link from parent AGENTS.md

## Testing

- Types are validated by TypeScript compiler (no runtime tests needed)
- Plugin system types validated when implementations are created

## Dependencies

- `@kaiord/core` — Core types (KRD, Logger, etc.)

## Code Limits

- Per file: Under 200 lines (types only, no implementation)
- Keep type definitions focused and well-documented
