import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

// A line-level reading of wrangler.toml, enough for the keys this test pins:
// comments dropped, `[table]` / `[[array]]` headers tracked, `key = value`
// pairs recorded under their table.
const readToml = (): Map<string, string> => {
  const text = readFileSync(
    new URL("../wrangler.toml", import.meta.url),
    "utf8"
  );
  const entries = new Map<string, string>();
  let table = "";
  for (const raw of text.split("\n")) {
    const line = raw.replace(/#.*$/, "").trim();
    const header = /^\[\[?([^\]]+)\]\]?$/.exec(line);
    if (header) {
      table = `${header[1]}.`;
      continue;
    }
    const pair = /^([\w-]+)\s*=\s*(.+)$/.exec(line);
    if (pair) entries.set(`${table}${pair[1]}`, pair[2] ?? "");
  }
  return entries;
};

const STORAGE_BINDINGS = [
  "kv_namespaces",
  "d1_databases",
  "r2_buckets",
  "durable_objects",
];

describe("wrangler.toml", () => {
  const config = readToml();
  const raw = readFileSync(
    new URL("../wrangler.toml", import.meta.url),
    "utf8"
  );
  const active = raw
    .split("\n")
    .filter((line) => !line.trim().startsWith("#"))
    .join("\n");

  it("should turn off Workers Logs, invocation logs, traces and Logpush", () => {
    // Arrange
    const keys = [
      "observability.enabled",
      "observability.logs.enabled",
      "observability.logs.invocation_logs",
      "observability.logs.persist",
      "observability.traces.enabled",
      "observability.issues.enabled",
      "logpush",
    ];

    // Act
    const values = keys.map((key) => config.get(key));

    // Assert
    expect(values).toEqual(keys.map(() => "false"));
  });

  it("should bind no storage", () => {
    // Arrange
    const bindings = STORAGE_BINDINGS;

    // Act
    const found = bindings.filter((name) => active.includes(name));

    // Assert
    expect(found).toEqual([]);
  });

  it("should route kaiord.com/mcp only, off workers.dev", () => {
    // Arrange
    const route = '{ pattern = "kaiord.com/mcp", zone_name = "kaiord.com" }';

    // Act
    const routes = active.match(/pattern\s*=/g) ?? [];

    // Assert
    expect(active).toContain(route);
    expect(routes).toHaveLength(1);
    expect(config.get("workers_dev")).toBe("false");
  });

  it("should pin the compatibility date and enable nodejs_compat", () => {
    // Arrange
    const keys = ["compatibility_date", "compatibility_flags", "main"];

    // Act
    const [date, flags, main] = keys.map((key) => config.get(key));

    // Assert
    expect(date).toBe('"2026-10-01"');
    expect(flags).toBe('["nodejs_compat"]');
    expect(main).toBe('"src/worker.ts"');
  });

  it("should leave the rate-limit binding to task 3.3, commented out", () => {
    // Arrange
    const binding = "MCP_RATE_LIMITER";

    // Act
    const commented = raw.includes(`# name = "${binding}"`);

    // Assert
    expect(commented).toBe(true);
    expect(active).not.toContain(binding);
  });
});
