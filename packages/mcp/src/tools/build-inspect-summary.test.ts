import type { KRD } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { buildInspectSummary } from "./build-inspect-summary";

const createMinimalKrd = (overrides?: Partial<KRD>): KRD => ({
  version: "1.0",
  type: "recorded_activity",
  metadata: {
    created: "2025-01-15T10:00:00Z",
    sport: "cycling",
    subSport: "indoor_cycling",
    manufacturer: "Garmin",
    product: "Edge 530",
    serialNumber: 12345,
  },
  sessions: [
    { sport: "cycling" } as KRD["sessions"] extends (infer T)[] | undefined
      ? T
      : never,
  ],
  laps: [],
  records: [],
  events: [],
  ...overrides,
});

describe("buildInspectSummary", () => {
  it("should include type and sport information", () => {
    const krd = createMinimalKrd();

    const summary = buildInspectSummary(krd);

    expect(summary).toContain("Type: recorded_activity");
    expect(summary).toContain("Sport: cycling");
    expect(summary).toContain("Sub-sport: indoor_cycling");
  });

  it("should include metadata fields", () => {
    const krd = createMinimalKrd();

    const summary = buildInspectSummary(krd);

    expect(summary).toContain("Created: 2025-01-15T10:00:00Z");
    expect(summary).toContain("Manufacturer: Garmin");
    expect(summary).toContain("Product: Edge 530");
    expect(summary).toContain("Serial: 12345");
  });

  it("should show N/A for missing optional metadata", () => {
    const krd = createMinimalKrd({
      metadata: {
        created: "2025-01-15T10:00:00Z",
        sport: "running",
      },
    });

    const summary = buildInspectSummary(krd);

    expect(summary).toContain("Sub-sport: N/A");
    expect(summary).toContain("Manufacturer: N/A");
    expect(summary).toContain("Product: N/A");
    expect(summary).toContain("Serial: N/A");
  });

  it("should include data counts", () => {
    const krd = createMinimalKrd({
      sessions: [{} as never, {} as never],
      laps: [{} as never, {} as never, {} as never],
      records: [{} as never],
      events: [],
    });

    const summary = buildInspectSummary(krd);

    expect(summary).toContain("Sessions: 2");
    expect(summary).toContain("Laps: 3");
    expect(summary).toContain("Records: 1");
    expect(summary).toContain("Events: 0");
  });

  it("should show zero counts when arrays are undefined", () => {
    const krd = createMinimalKrd({
      sessions: undefined,
      laps: undefined,
      records: undefined,
      events: undefined,
    });

    const summary = buildInspectSummary(krd);

    expect(summary).toContain("Sessions: 0");
    expect(summary).toContain("Laps: 0");
    expect(summary).toContain("Records: 0");
    expect(summary).toContain("Events: 0");
  });

  it("should display workout info when present", () => {
    const krd = createMinimalKrd({
      extensions: {
        structured_workout: {
          name: "FTP Test",
          steps: [{ type: "warmup" }, { type: "active" }],
        },
      },
    });

    const summary = buildInspectSummary(krd);

    expect(summary).toContain("Name: FTP Test");
    expect(summary).toContain("Steps: 2");
  });

  it("should show no workout message when absent", () => {
    const krd = createMinimalKrd({ extensions: undefined });

    const summary = buildInspectSummary(krd);

    expect(summary).toContain("No structured workout found.");
  });

  it("should handle workout with missing name", () => {
    const krd = createMinimalKrd({
      extensions: {
        structured_workout: { steps: [] },
      },
    });

    const summary = buildInspectSummary(krd);

    expect(summary).toContain("Name: Unnamed");
    expect(summary).toContain("Steps: 0");
  });
});
