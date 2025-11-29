# Example Plugin: GPX Format Support

This document provides a complete example of implementing a Kaiord plugin for GPX (GPS Exchange Format) support.

## Plugin Structure

```
@kaiord/plugin-gpx/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # Plugin entry point
│   ├── gpx-parser.ts      # GPX parsing logic
│   └── gpx-builder.ts     # GPX building logic
├── test/
│   └── plugin.test.ts     # Plugin tests
└── README.md
```

## package.json

```json
{
  "name": "@kaiord/plugin-gpx",
  "version": "1.0.0",
  "description": "GPX format support for Kaiord",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "prepublishOnly": "pnpm build && pnpm test"
  },
  "keywords": ["kaiord-plugin", "gpx", "workout", "gps"],
  "author": "Kaiord Contributors",
  "license": "MIT",
  "kaiord": {
    "plugin": true,
    "version": "^0.1.0"
  },
  "peerDependencies": {
    "@kaiord/core": "^0.1.0"
  },
  "devDependencies": {
    "@kaiord/cli": "^0.1.0",
    "@kaiord/core": "^0.1.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"
  },
  "dependencies": {
    "fast-xml-parser": "^4.3.2"
  }
}
```

## src/index.ts (Plugin Entry Point)

```typescript
import type { KRD } from "@kaiord/core";
import type { KaiordPlugin } from "@kaiord/cli";
import type { Logger } from "@kaiord/core";
import { parseGpx } from "./gpx-parser";
import { buildGpx } from "./gpx-builder";

/**
 * GPX Plugin for Kaiord
 *
 * Provides support for GPS Exchange Format (GPX) files.
 * GPX is commonly used for GPS tracks and routes.
 */
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

  toKrd: async (
    input: Uint8Array | string,
    options?: unknown
  ): Promise<KRD> => {
    // Convert input to string if needed
    const gpxString =
      typeof input === "string" ? input : new TextDecoder().decode(input);

    // Parse GPX XML
    const gpxData = parseGpx(gpxString);

    // Convert GPX to KRD format
    const krd: KRD = {
      version: "1.0",
      type: "activity",
      metadata: {
        created: gpxData.metadata.time || new Date().toISOString(),
        sport: "running", // GPX doesn't specify sport, default to running
        manufacturer: gpxData.metadata.creator || "unknown",
      },
      records: gpxData.trackPoints.map((point) => ({
        timestamp: point.time,
        position: {
          lat: point.lat,
          lon: point.lon,
        },
        altitude: point.ele,
        heartRate: point.extensions?.heartRate,
        cadence: point.extensions?.cadence,
        power: point.extensions?.power,
        speed: point.extensions?.speed,
      })),
    };

    return krd;
  },

  fromKrd: async (krd: KRD, options?: unknown): Promise<string> => {
    // Convert KRD to GPX format
    const gpxData = {
      metadata: {
        time: krd.metadata.created,
        creator: krd.metadata.manufacturer || "Kaiord",
      },
      trackPoints: (krd.records || []).map((record) => ({
        lat: record.position?.lat || 0,
        lon: record.position?.lon || 0,
        ele: record.altitude,
        time: record.timestamp,
        extensions: {
          heartRate: record.heartRate,
          cadence: record.cadence,
          power: record.power,
          speed: record.speed,
        },
      })),
    };

    return buildGpx(gpxData);
  },

  initialize: async (logger: Logger) => {
    logger.info("GPX plugin initialized", {
      version: plugin.version,
      formats: plugin.formats.map((f) => f.extension),
    });
  },

  cleanup: async () => {
    // No cleanup needed for this plugin
  },
};

export default plugin;
```

## src/gpx-parser.ts

```typescript
import { XMLParser } from "fast-xml-parser";

export type GpxData = {
  metadata: {
    time?: string;
    creator?: string;
  };
  trackPoints: Array<{
    lat: number;
    lon: number;
    ele?: number;
    time: string;
    extensions?: {
      heartRate?: number;
      cadence?: number;
      power?: number;
      speed?: number;
    };
  }>;
};

export const parseGpx = (gpxString: string): GpxData => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  const gpx = parser.parse(gpxString);

  // Extract metadata
  const metadata = {
    time: gpx.gpx?.metadata?.time,
    creator: gpx.gpx?.["@_creator"],
  };

  // Extract track points
  const tracks = Array.isArray(gpx.gpx?.trk) ? gpx.gpx.trk : [gpx.gpx?.trk];
  const trackPoints: GpxData["trackPoints"] = [];

  for (const track of tracks) {
    if (!track) continue;

    const segments = Array.isArray(track.trkseg)
      ? track.trkseg
      : [track.trkseg];

    for (const segment of segments) {
      if (!segment?.trkpt) continue;

      const points = Array.isArray(segment.trkpt)
        ? segment.trkpt
        : [segment.trkpt];

      for (const point of points) {
        trackPoints.push({
          lat: Number.parseFloat(point["@_lat"]),
          lon: Number.parseFloat(point["@_lon"]),
          ele: point.ele ? Number.parseFloat(point.ele) : undefined,
          time: point.time,
          extensions: point.extensions
            ? {
                heartRate: point.extensions.heartRate
                  ? Number.parseInt(point.extensions.heartRate)
                  : undefined,
                cadence: point.extensions.cadence
                  ? Number.parseInt(point.extensions.cadence)
                  : undefined,
                power: point.extensions.power
                  ? Number.parseInt(point.extensions.power)
                  : undefined,
                speed: point.extensions.speed
                  ? Number.parseFloat(point.extensions.speed)
                  : undefined,
              }
            : undefined,
        });
      }
    }
  }

  return { metadata, trackPoints };
};
```

## src/gpx-builder.ts

```typescript
import { XMLBuilder } from "fast-xml-parser";
import type { GpxData } from "./gpx-parser";

export const buildGpx = (data: GpxData): string => {
  const gpxObject = {
    "?xml": {
      "@_version": "1.0",
      "@_encoding": "UTF-8",
    },
    gpx: {
      "@_version": "1.1",
      "@_creator": data.metadata.creator || "Kaiord",
      "@_xmlns": "http://www.topografix.com/GPX/1/1",
      "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "@_xsi:schemaLocation":
        "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd",
      metadata: {
        time: data.metadata.time || new Date().toISOString(),
      },
      trk: {
        trkseg: {
          trkpt: data.trackPoints.map((point) => ({
            "@_lat": point.lat,
            "@_lon": point.lon,
            ele: point.ele,
            time: point.time,
            extensions: point.extensions
              ? {
                  heartRate: point.extensions.heartRate,
                  cadence: point.extensions.cadence,
                  power: point.extensions.power,
                  speed: point.extensions.speed,
                }
              : undefined,
          })),
        },
      },
    },
  };

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
  });

  return builder.build(gpxObject);
};
```

## test/plugin.test.ts

```typescript
import { describe, expect, it } from "vitest";
import plugin from "../src/index";
import { buildKRD } from "@kaiord/core/test-utils";

describe("GPX Plugin", () => {
  const sampleGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Kaiord">
  <metadata>
    <time>2025-01-15T10:30:00Z</time>
  </metadata>
  <trk>
    <trkseg>
      <trkpt lat="41.3851" lon="2.1734">
        <ele>12.5</ele>
        <time>2025-01-15T10:30:00Z</time>
        <extensions>
          <heartRate>145</heartRate>
          <cadence>85</cadence>
        </extensions>
      </trkpt>
      <trkpt lat="41.3852" lon="2.1735">
        <ele>13.0</ele>
        <time>2025-01-15T10:30:01Z</time>
        <extensions>
          <heartRate>146</heartRate>
          <cadence>86</cadence>
        </extensions>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

  it("should have correct metadata", () => {
    expect(plugin.name).toBe("@kaiord/plugin-gpx");
    expect(plugin.version).toBe("1.0.0");
    expect(plugin.formats).toHaveLength(1);
    expect(plugin.formats[0].extension).toBe(".gpx");
  });

  it("should convert GPX to KRD", async () => {
    const krd = await plugin.toKrd(sampleGpx);

    expect(krd.version).toBe("1.0");
    expect(krd.type).toBe("activity");
    expect(krd.metadata.created).toBe("2025-01-15T10:30:00Z");
    expect(krd.records).toHaveLength(2);
    expect(krd.records?.[0].position?.lat).toBe(41.3851);
    expect(krd.records?.[0].heartRate).toBe(145);
  });

  it("should convert KRD to GPX", async () => {
    const krd = buildKRD.build({
      type: "activity",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      records: [
        {
          timestamp: "2025-01-15T10:30:00Z",
          position: { lat: 41.3851, lon: 2.1734 },
          altitude: 12.5,
          heartRate: 145,
        },
      ],
    });

    const gpx = await plugin.fromKrd(krd);

    expect(gpx).toContain('<?xml version="1.0"');
    expect(gpx).toContain("<gpx");
    expect(gpx).toContain('lat="41.3851"');
    expect(gpx).toContain("<heartRate>145</heartRate>");
  });

  it("should round-trip GPX -> KRD -> GPX", async () => {
    const krd = await plugin.toKrd(sampleGpx);
    const gpx = await plugin.fromKrd(krd);
    const krd2 = await plugin.toKrd(gpx);

    expect(krd2.records).toHaveLength(krd.records?.length || 0);
    expect(krd2.records?.[0].position?.lat).toBeCloseTo(
      krd.records?.[0].position?.lat || 0,
      4
    );
  });

  it("should handle binary input", async () => {
    const buffer = new TextEncoder().encode(sampleGpx);
    const krd = await plugin.toKrd(buffer);

    expect(krd.version).toBe("1.0");
    expect(krd.records).toHaveLength(2);
  });
});
```

## README.md

````markdown
# @kaiord/plugin-gpx

GPX format support for Kaiord CLI.

## Installation

```bash
npm install @kaiord/plugin-gpx
```
````

## Usage

The plugin is automatically discovered by Kaiord CLI when installed:

```bash
# Convert GPX to KRD
kaiord convert --input workout.gpx --output workout.krd

# Convert KRD to GPX
kaiord convert --input workout.krd --output workout.gpx
```

## Features

- ✅ Parse GPX 1.1 files
- ✅ Extract track points with GPS coordinates
- ✅ Support for elevation, heart rate, cadence, power
- ✅ Round-trip conversion (GPX ↔ KRD ↔ GPX)
- ✅ Preserve metadata (creator, time)

## Limitations

- GPX doesn't specify sport type (defaults to "running")
- Only track points are supported (not routes or waypoints)
- Extensions are limited to common fitness metrics

## License

MIT

````

## Publishing the Plugin

```bash
# Build the plugin
pnpm build

# Run tests
pnpm test

# Publish to npm
npm publish --access public
````

## Using the Plugin

Once published, users can install and use the plugin:

```bash
# Install the plugin
npm install -g @kaiord/plugin-gpx

# Use with Kaiord CLI
kaiord convert --input workout.gpx --output workout.krd
```

The plugin is automatically discovered and loaded by the CLI.
