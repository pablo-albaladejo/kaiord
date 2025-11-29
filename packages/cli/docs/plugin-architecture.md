# Plugin Architecture for Custom Format Converters

## Overview

The Kaiord CLI plugin system allows third-party developers to add support for custom workout file formats without modifying the core library or CLI code. Plugins are dynamically loaded at runtime and integrate seamlessly with the existing conversion pipeline.

## Design Principles

1. **Zero Core Modification** - Plugins extend functionality without changing core code
2. **Type Safety** - Full TypeScript support with proper type definitions
3. **Isolation** - Plugins run in isolated contexts with clear boundaries
4. **Discoverability** - Automatic plugin discovery from standard locations
5. **Compatibility** - Version-aware plugin loading with compatibility checks
6. **Error Handling** - Graceful degradation when plugins fail to load

## Plugin Interface

### Core Plugin Contract

Every plugin must implement the `KaiordPlugin` interface:

```typescript
export type KaiordPlugin = {
  // Plugin metadata
  name: string;
  version: string;
  description: string;
  author?: string;
  homepage?: string;

  // Format support
  formats: Array<{
    extension: string; // e.g., ".gpx", ".hrm"
    mimeType?: string; // e.g., "application/gpx+xml"
    description: string;
  }>;

  // Compatibility
  kaiordVersion: string; // Semver range, e.g., "^0.1.0"

  // Converter implementations
  toKrd: (input: Uint8Array | string, options?: unknown) => Promise<KRD>;
  fromKrd: (krd: KRD, options?: unknown) => Promise<Uint8Array | string>;

  // Optional lifecycle hooks
  initialize?: (logger: Logger) => Promise<void>;
  cleanup?: () => Promise<void>;
};
```

### Plugin Package Structure

Plugins are npm packages with a specific structure:

```
@kaiord/plugin-gpx/
├── package.json          # Plugin metadata
├── dist/
│   └── index.js          # Compiled plugin entry point
├── src/
│   └── index.ts          # Plugin implementation
└── README.md             # Plugin documentation
```

### Plugin package.json

```json
{
  "name": "@kaiord/plugin-gpx",
  "version": "1.0.0",
  "description": "GPX format support for Kaiord",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "keywords": ["kaiord-plugin", "gpx", "workout"],
  "kaiord": {
    "plugin": true,
    "version": "^0.1.0"
  },
  "peerDependencies": {
    "@kaiord/core": "^0.1.0"
  }
}
```

## Plugin Discovery

### Discovery Locations

Plugins are discovered from multiple locations in priority order:

1. **Project-local plugins** - `./node_modules/@kaiord/plugin-*`
2. **Global plugins** - `~/.kaiord/plugins/`
3. **Config-specified plugins** - Listed in `.kaiordrc.json`

### Discovery Algorithm

```typescript
type PluginDiscovery = {
  discoverPlugins: () => Promise<Array<PluginMetadata>>;
  loadPlugin: (path: string) => Promise<KaiordPlugin>;
  validatePlugin: (plugin: KaiordPlugin) => ValidationResult;
};

const createPluginDiscovery = (logger: Logger): PluginDiscovery => ({
  discoverPlugins: async () => {
    const plugins: Array<PluginMetadata> = [];

    // 1. Scan node_modules for @kaiord/plugin-* packages
    const localPlugins = await scanDirectory("./node_modules/@kaiord");
    plugins.push(...localPlugins);

    // 2. Scan global plugin directory
    const globalPlugins = await scanDirectory("~/.kaiord/plugins");
    plugins.push(...globalPlugins);

    // 3. Load plugins from config
    const config = await loadConfig();
    if (config.plugins) {
      plugins.push(...config.plugins);
    }

    return plugins;
  },

  loadPlugin: async (path: string) => {
    // Dynamic import of plugin module
    const module = await import(path);
    const plugin = module.default || module;

    // Validate plugin structure
    if (!isValidPlugin(plugin)) {
      throw new Error(`Invalid plugin structure: ${path}`);
    }

    return plugin;
  },

  validatePlugin: (plugin: KaiordPlugin) => {
    // Check required fields
    if (!plugin.name || !plugin.version || !plugin.formats) {
      return { valid: false, error: "Missing required fields" };
    }

    // Check version compatibility
    if (!semver.satisfies(KAIORD_VERSION, plugin.kaiordVersion)) {
      return {
        valid: false,
        error: `Incompatible version: requires ${plugin.kaiordVersion}`,
      };
    }

    // Check converter implementations
    if (
      typeof plugin.toKrd !== "function" ||
      typeof plugin.fromKrd !== "function"
    ) {
      return { valid: false, error: "Missing converter implementations" };
    }

    return { valid: true };
  },
});
```

## Plugin Registry

### Registry Implementation

The plugin registry manages loaded plugins and provides format resolution:

```typescript
type PluginRegistry = {
  register: (plugin: KaiordPlugin) => void;
  unregister: (name: string) => void;
  getPlugin: (format: string) => KaiordPlugin | undefined;
  listPlugins: () => Array<KaiordPlugin>;
  supportsFormat: (format: string) => boolean;
};

const createPluginRegistry = (logger: Logger): PluginRegistry => {
  const plugins = new Map<string, KaiordPlugin>();
  const formatMap = new Map<string, string>(); // extension -> plugin name

  return {
    register: (plugin: KaiordPlugin) => {
      logger.info(`Registering plugin: ${plugin.name}`, {
        version: plugin.version,
        formats: plugin.formats.map((f) => f.extension),
      });

      plugins.set(plugin.name, plugin);

      // Map formats to plugin
      for (const format of plugin.formats) {
        formatMap.set(format.extension, plugin.name);
      }
    },

    unregister: (name: string) => {
      const plugin = plugins.get(name);
      if (!plugin) return;

      // Remove format mappings
      for (const format of plugin.formats) {
        formatMap.delete(format.extension);
      }

      plugins.delete(name);
      logger.info(`Unregistered plugin: ${name}`);
    },

    getPlugin: (format: string) => {
      const pluginName = formatMap.get(format);
      return pluginName ? plugins.get(pluginName) : undefined;
    },

    listPlugins: () => Array.from(plugins.values()),

    supportsFormat: (format: string) => formatMap.has(format),
  };
};
```

## Integration with CLI

### Enhanced Convert Command

The convert command is extended to support plugin formats:

```typescript
export const convertCommand = async (
  options: ConvertOptions
): Promise<number> => {
  const logger = await createLogger(options);

  // Initialize plugin system
  const pluginDiscovery = createPluginDiscovery(logger);
  const pluginRegistry = createPluginRegistry(logger);

  // Discover and load plugins
  const discoveredPlugins = await pluginDiscovery.discoverPlugins();

  for (const metadata of discoveredPlugins) {
    try {
      const plugin = await pluginDiscovery.loadPlugin(metadata.path);
      const validation = pluginDiscovery.validatePlugin(plugin);

      if (validation.valid) {
        // Initialize plugin if it has lifecycle hook
        if (plugin.initialize) {
          await plugin.initialize(logger);
        }

        pluginRegistry.register(plugin);
      } else {
        logger.warn(`Skipping invalid plugin: ${metadata.name}`, {
          error: validation.error,
        });
      }
    } catch (error) {
      logger.error(`Failed to load plugin: ${metadata.name}`, { error });
    }
  }

  // Detect formats (including plugin formats)
  const inputFormat =
    options.inputFormat || detectFormat(options.input, pluginRegistry);
  const outputFormat =
    options.outputFormat || detectFormat(options.output, pluginRegistry);

  // Get providers (core + plugins)
  const providers = createProvidersWithPlugins(logger, pluginRegistry);

  // Convert using appropriate converter (core or plugin)
  await convertFile(
    options.input,
    options.output,
    inputFormat,
    outputFormat,
    providers
  );

  return 0;
};
```

### Enhanced Providers

```typescript
type ProvidersWithPlugins = Providers & {
  pluginRegistry: PluginRegistry;
  convertWithPlugin: (
    input: Uint8Array | string,
    inputFormat: string,
    outputFormat: string
  ) => Promise<Uint8Array | string>;
};

const createProvidersWithPlugins = (
  logger: Logger,
  pluginRegistry: PluginRegistry
): ProvidersWithPlugins => {
  const coreProviders = createDefaultProviders(logger);

  return {
    ...coreProviders,
    pluginRegistry,

    convertWithPlugin: async (input, inputFormat, outputFormat) => {
      // Check if input format is handled by plugin
      const inputPlugin = pluginRegistry.getPlugin(inputFormat);

      // Convert to KRD
      let krd: KRD;
      if (inputPlugin) {
        krd = await inputPlugin.toKrd(input);
      } else {
        // Use core converter
        krd = await convertToKrdCore(input, inputFormat, coreProviders);
      }

      // Check if output format is handled by plugin
      const outputPlugin = pluginRegistry.getPlugin(outputFormat);

      // Convert from KRD
      if (outputPlugin) {
        return await outputPlugin.fromKrd(krd);
      } else {
        // Use core converter
        return await convertFromKrdCore(krd, outputFormat, coreProviders);
      }
    },
  };
};
```

## Configuration

### Plugin Configuration in .kaiordrc.json

```json
{
  "plugins": [
    {
      "name": "@kaiord/plugin-gpx",
      "enabled": true,
      "options": {
        "includeElevation": true,
        "includeHeartRate": true
      }
    },
    {
      "name": "@kaiord/plugin-polar",
      "enabled": false
    }
  ],
  "pluginPaths": ["~/.kaiord/plugins", "./custom-plugins"]
}
```

## Example Plugin Implementation

### GPX Plugin Example

```typescript
// @kaiord/plugin-gpx/src/index.ts
import type { KRD } from "@kaiord/core";
import type { KaiordPlugin } from "@kaiord/cli";
import { parseGpx, buildGpx } from "./gpx-parser";

const plugin: KaiordPlugin = {
  name: "@kaiord/plugin-gpx",
  version: "1.0.0",
  description: "GPX format support for Kaiord",
  author: "Kaiord Contributors",
  homepage: "https://github.com/kaiord/plugin-gpx",

  formats: [
    {
      extension: ".gpx",
      mimeType: "application/gpx+xml",
      description: "GPS Exchange Format",
    },
  ],

  kaiordVersion: "^0.1.0",

  toKrd: async (input: Uint8Array | string): Promise<KRD> => {
    const gpxString =
      typeof input === "string" ? input : new TextDecoder().decode(input);
    const gpxData = parseGpx(gpxString);

    // Convert GPX to KRD format
    return {
      version: "1.0",
      type: "activity",
      metadata: {
        created: gpxData.metadata.time,
        sport: "running", // GPX doesn't specify sport
      },
      records: gpxData.trackPoints.map((point) => ({
        timestamp: point.time,
        position: {
          lat: point.lat,
          lon: point.lon,
        },
        altitude: point.ele,
        heartRate: point.extensions?.heartRate,
      })),
    };
  },

  fromKrd: async (krd: KRD): Promise<string> => {
    // Convert KRD to GPX format
    const gpxData = {
      metadata: {
        time: krd.metadata.created,
      },
      trackPoints: (krd.records || []).map((record) => ({
        lat: record.position?.lat || 0,
        lon: record.position?.lon || 0,
        ele: record.altitude,
        time: record.timestamp,
        extensions: {
          heartRate: record.heartRate,
        },
      })),
    };

    return buildGpx(gpxData);
  },

  initialize: async (logger) => {
    logger.info("GPX plugin initialized");
  },

  cleanup: async () => {
    // Cleanup resources if needed
  },
};

export default plugin;
```

## Plugin Development Guide

### Creating a New Plugin

1. **Initialize plugin package**:

   ```bash
   mkdir @kaiord/plugin-myformat
   cd @kaiord/plugin-myformat
   npm init -y
   ```

2. **Install dependencies**:

   ```bash
   npm install @kaiord/core
   npm install -D @kaiord/cli typescript
   ```

3. **Implement plugin interface**:

   ```typescript
   import type { KaiordPlugin } from "@kaiord/cli";

   const plugin: KaiordPlugin = {
     name: "@kaiord/plugin-myformat",
     version: "1.0.0",
     description: "My custom format support",
     formats: [{ extension: ".myformat", description: "My Format" }],
     kaiordVersion: "^0.1.0",
     toKrd: async (input) => {
       /* ... */
     },
     fromKrd: async (krd) => {
       /* ... */
     },
   };

   export default plugin;
   ```

4. **Build and test**:

   ```bash
   npm run build
   npm test
   ```

5. **Publish**:
   ```bash
   npm publish
   ```

### Plugin Testing

```typescript
// test/plugin.test.ts
import { describe, expect, it } from "vitest";
import plugin from "../src/index";
import { buildKRD } from "@kaiord/core/test-utils";

describe("MyFormat Plugin", () => {
  it("should convert to KRD", async () => {
    const input = "..."; // Sample input
    const krd = await plugin.toKrd(input);

    expect(krd.version).toBe("1.0");
    expect(krd.type).toBe("workout");
  });

  it("should convert from KRD", async () => {
    const krd = buildKRD.build();
    const output = await plugin.fromKrd(krd);

    expect(output).toBeDefined();
    expect(typeof output).toBe("string");
  });

  it("should round-trip", async () => {
    const original = "..."; // Sample input
    const krd = await plugin.toKrd(original);
    const converted = await plugin.fromKrd(krd);
    const roundTrip = await plugin.toKrd(converted);

    expect(roundTrip).toEqual(krd);
  });
});
```

## Security Considerations

1. **Plugin Sandboxing** - Plugins run in the same process but should be isolated
2. **Version Validation** - Strict semver checking prevents incompatible plugins
3. **Error Isolation** - Plugin errors don't crash the CLI
4. **Code Review** - Official plugins undergo security review
5. **Signature Verification** - Future: verify plugin signatures

## Performance Considerations

1. **Lazy Loading** - Plugins loaded only when needed
2. **Caching** - Plugin discovery results cached
3. **Parallel Loading** - Multiple plugins loaded concurrently
4. **Memory Management** - Plugins cleaned up after use

## Future Enhancements

1. **Plugin Marketplace** - Central registry for discovering plugins
2. **Hot Reload** - Reload plugins without restarting CLI
3. **Plugin Dependencies** - Plugins can depend on other plugins
4. **Plugin Hooks** - Additional lifecycle hooks for advanced use cases
5. **Plugin UI** - Interactive plugin management commands
6. **Plugin Analytics** - Usage tracking and performance metrics

## CLI Commands for Plugin Management

```bash
# List installed plugins
kaiord plugins list

# Install a plugin
kaiord plugins install @kaiord/plugin-gpx

# Uninstall a plugin
kaiord plugins uninstall @kaiord/plugin-gpx

# Enable/disable a plugin
kaiord plugins enable @kaiord/plugin-gpx
kaiord plugins disable @kaiord/plugin-gpx

# Show plugin info
kaiord plugins info @kaiord/plugin-gpx

# Validate a plugin
kaiord plugins validate ./path/to/plugin
```

## Benefits

1. **Extensibility** - Add new formats without core changes
2. **Community** - Third-party developers can contribute formats
3. **Flexibility** - Users choose which formats to support
4. **Maintainability** - Core stays focused, plugins handle edge cases
5. **Innovation** - Rapid experimentation with new formats

## Limitations

1. **Type Safety** - Dynamic loading reduces compile-time type checking
2. **Compatibility** - Plugin versions must match CLI version
3. **Performance** - Plugin loading adds startup overhead
4. **Security** - Malicious plugins could compromise system
5. **Debugging** - Plugin errors harder to trace than core errors

## Conclusion

The plugin architecture provides a robust, extensible system for adding custom format support to Kaiord CLI. It maintains type safety, follows best practices, and enables community contributions while keeping the core library focused and maintainable.
