import { describe, expect, it } from "vitest";

import type { PersistencePort } from "../../../ports/persistence-port";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { createQueryEnergyBalanceTool } from "./query-energy-balance-tool";

const TODAY = "2026-06-21";
const PROFILE_ID = "p1";

const seedProfile = (persistence: PersistencePort) =>
  persistence.profiles.put({
    id: PROFILE_ID,
    name: "Athlete",
    bodyWeight: 70,
    height: 178,
    birthDate: "1990-06-21",
    sex: "male",
    sportZones: {},
    linkedAccounts: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

const seedWellness = (persistence: PersistencePort) =>
  persistence.healthDaily.put({
    id: "w1",
    profileId: PROFILE_ID,
    date: TODAY,
    krd: {
      kind: "daily",
      version: "2.0",
      date: TODAY,
      steps: 9000,
      activeCalories: 600,
      restingCalories: 1700,
      intensityMinutes: { moderate: 0, vigorous: 0 },
    },
  } as never);

type ToolResult = {
  range_used: { from: string; to: string };
  goal: {
    goal_type: string;
    daily_delta_kcal: number | null;
    target_kcal: number | null;
    capped: boolean;
    maintenance_kcal: number | null;
    maintenance_is_estimate: boolean;
  } | null;
  days: ReadonlyArray<{ gated: boolean }>;
};

describe("createQueryEnergyBalanceTool", () => {
  it("should return the day's balance and null goal when no target exists", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedProfile(persistence);
    await seedWellness(persistence);
    const tool = createQueryEnergyBalanceTool({
      persistence,
      profileId: PROFILE_ID,
      today: TODAY,
    });

    // Act
    const result = (await tool.execute({ date: TODAY })) as ToolResult;

    // Assert
    expect(result.days).toHaveLength(1);
    expect(result.days[0]?.gated).toBe(false);
    expect(result.goal).toBeNull();
  });

  it("should include active-goal context when a target is set", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedProfile(persistence);
    await seedWellness(persistence);
    await persistence.energyTargets.put({
      profileId: PROFILE_ID,
      goalType: "fat_loss",
      startWeightKg: 72,
      targetWeightKg: 68,
      targetDate: "2026-09-01",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    });
    const tool = createQueryEnergyBalanceTool({
      persistence,
      profileId: PROFILE_ID,
      today: TODAY,
    });

    // Act
    const result = (await tool.execute({ date: TODAY })) as ToolResult;

    // Assert
    expect(result.goal?.goal_type).toBe("fat_loss");
    expect(result.goal?.daily_delta_kcal).toBeLessThan(0);
    expect(result.goal?.target_kcal).not.toBeNull();
  });
});
