import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { createQueryHealthTool } from "./query-health-tool";

const TODAY = "2026-06-13";
const IMPORTED_STEPS = 4000;
const IMPORTED_ACTIVE_KCAL = 600;
const MANUAL_STEPS = 12000;

describe("createQueryHealthTool", () => {
  it("should route to the store for the requested metric, profile-scoped", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.healthSleep.put({
      id: "s1",
      profileId: "p1",
      date: "2026-06-10",
      krd: { hours: 7 },
    } as never);
    await persistence.healthSleep.put({
      id: "s2",
      profileId: "p2",
      date: "2026-06-10",
      krd: { hours: 8 },
    } as never);
    const tool = createQueryHealthTool({
      persistence,
      profileId: "p1",
      today: TODAY,
    });

    // Act
    const result = (await tool.execute({ metric: "sleep" })) as {
      metric: string;
      count: number;
    };

    // Assert
    expect(result.metric).toBe("sleep");
    expect(result.count).toBe(1);
  });

  it("should give the model one daily-wellness reading per day across sources", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const krd = (steps: number, activeCalories: number) => ({
      kind: "daily" as const,
      version: "2.0",
      date: "2026-06-10",
      steps,
      activeCalories,
      restingCalories: 1700,
      intensityMinutes: { moderate: 0, vigorous: 0 },
    });
    await persistence.healthDaily.put({
      id: "d-imported",
      profileId: "p1",
      date: "2026-06-10",
      sourceBridgeId: "fit-import",
      krd: krd(IMPORTED_STEPS, IMPORTED_ACTIVE_KCAL),
    });
    await persistence.healthDaily.put({
      id: "d-manual",
      profileId: "p1",
      date: "2026-06-10",
      sourceBridgeId: "manual",
      krd: {
        kind: "daily",
        version: "2.0",
        date: "2026-06-10",
        steps: MANUAL_STEPS,
      },
    });
    const tool = createQueryHealthTool({
      persistence,
      profileId: "p1",
      today: TODAY,
    });

    // Act
    const result = (await tool.execute({ metric: "daily-wellness" })) as {
      count: number;
      records: { krd: { steps: number; activeCalories: number } }[];
    };

    // Assert
    expect(result.count).toBe(1);
    expect(result.records[0]?.krd.steps).toBe(MANUAL_STEPS);
    expect(result.records[0]?.krd.activeCalories).toBe(IMPORTED_ACTIVE_KCAL);
  });

  it("should reject an unknown metric via its schema", () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const tool = createQueryHealthTool({
      persistence,
      profileId: "p1",
      today: TODAY,
    });

    // Act
    const result = tool.inputSchema.safeParse({ metric: "calories" });

    // Assert
    expect(result.success).toBe(false);
  });
});
