import { describe, expect, it } from "vitest";

import { createInMemoryTraceRepository } from "../../test-utils/in-memory-trace-repository";
import { buildTrace } from "../../test-utils/trace-fixture";
import { pruneTraces } from "./prune-traces";

const NOW = new Date("2026-11-20T12:00:00.000Z");

const MINUTE_MS = 60_000;
const DAY_MINUTES = 1440;
const OVER_LIMIT = 203;
const INSIDE_DAYS = 89;
const OUTSIDE_DAYS = 91;

const minutesBefore = (n: number) =>
  new Date(NOW.getTime() - n * MINUTE_MS).toISOString();

describe("pruneTraces", () => {
  it("should keep the newest 200 Traces and delete the older ones", async () => {
    // Arrange
    const traces = createInMemoryTraceRepository();
    for (let i = 0; i < OVER_LIMIT; i++)
      await traces.put(
        buildTrace({ id: `t-${i}`, startedAt: minutesBefore(i) })
      );

    // Act
    await pruneTraces(traces, NOW);
    const kept = await traces.list();

    // Assert
    expect(kept).toHaveLength(200);
    expect(kept.at(0)?.id).toBe("t-0");
    expect(kept.at(-1)?.id).toBe("t-199");
  });

  it("should delete a Trace started more than 90 days ago", async () => {
    // Arrange
    const traces = createInMemoryTraceRepository();
    await traces.put(
      buildTrace({
        id: "day-89",
        startedAt: minutesBefore(INSIDE_DAYS * DAY_MINUTES),
      })
    );
    await traces.put(
      buildTrace({
        id: "day-91",
        startedAt: minutesBefore(OUTSIDE_DAYS * DAY_MINUTES),
      })
    );

    // Act
    await pruneTraces(traces, NOW);

    // Assert
    expect((await traces.list()).map((t) => t.id)).toEqual(["day-89"]);
  });
});
