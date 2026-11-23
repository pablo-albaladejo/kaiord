import { describe, expect, it } from "vitest";

import { createInMemoryTraceRepository } from "../../test-utils/in-memory-trace-repository";
import { buildTrace } from "../../test-utils/trace-fixture";
import { exportTraces, TRACES_FORMAT } from "./export-traces";

describe("exportTraces", () => {
  it("should write every Trace, newest first, as one JSON file", async () => {
    // Arrange
    const traces = createInMemoryTraceRepository();
    await traces.put(
      buildTrace({ id: "old", startedAt: "2026-11-01T10:00:00.000Z" })
    );
    await traces.put(
      buildTrace({ id: "new", startedAt: "2026-11-02T10:00:00.000Z" })
    );

    // Act
    const file = await exportTraces(
      traces,
      new Date("2026-11-03T00:00:00.000Z")
    );
    const parsed = JSON.parse(file.text) as { traces: Array<{ id: string }> };

    // Assert
    expect(file.filename).toBe("kaiord-traces-2026-11-03.json");
    expect(file.mediaType).toBe("application/json");
    expect(parsed).toMatchObject({
      format: TRACES_FORMAT,
      version: 1,
      exportedAt: "2026-11-03T00:00:00.000Z",
    });
    expect(parsed.traces.map((t) => t.id)).toEqual(["new", "old"]);
  });
});
