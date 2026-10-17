import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { buildCoachingActivityId } from "../../../types/coaching-activity-record";
import { defineReadTool } from "./define-read-tool";
import { createQueryCoachingTool } from "./query-coaching-tool";
import { createQueryHealthTool } from "./query-health-tool";
import { createQueryWorkoutsTool } from "./query-workouts-tool";

const TODAY = "2026-06-13";
const OTHER = "OTHER_PROFILE_MARKER";
const SMALL_BUDGET = 400;
const ROW_COUNT = 20;
const PAYLOAD_CHARS = 50;
const MANY_WORKOUTS = 60;
const OWN_SCORE = 80;
const OTHER_SCORE = 20;
const WORKOUT_ROW_CAP = 50;

const workout = (id: string, profileId: string, date: string) =>
  ({
    id,
    profileId,
    date,
    sport: "cycling",
    state: "raw",
    krd: {
      extensions: { structured_workout: { name: `${profileId}-${OTHER}` } },
    },
  }) as unknown as WorkoutRecord;

const seedTwoProfiles = async () => {
  const persistence = createInMemoryPersistence();
  for (const profileId of ["p1", "p2"]) {
    await persistence.workouts.put(workout(`w-${profileId}`, profileId, TODAY));
    await persistence.healthSleep.put({
      id: `s-${profileId}`,
      profileId,
      date: TODAY,
      krd: {
        score: profileId === "p1" ? OWN_SCORE : OTHER_SCORE,
        externalId: OTHER,
      },
    } as never);
    await persistence.coaching.put({
      id: buildCoachingActivityId(profileId, "train2go", `a-${profileId}`),
      profileId,
      source: "train2go",
      sourceId: `a-${profileId}`,
      date: TODAY,
      sport: "cycling",
      title: `${profileId}-${OTHER}`,
      status: "pending",
      fetchedAt: "2026-06-13T10:00:00.000Z",
    } as never);
  }
  return persistence;
};

const rowsTool = (rows: string[]) =>
  defineReadTool({
    name: "test_rows",
    description: "test",
    input: {},
    rowsKey: "rows",
    maxRows: 100,
    maxBytes: SMALL_BUDGET,
    read: async () => ({ rows, summary: { count: rows.length } }),
  });

const deps = (persistence = createInMemoryPersistence()) => ({
  persistence,
  profileId: "p1",
  today: TODAY,
});

describe("defineReadTool", () => {
  it.each([
    ["query_workouts", createQueryWorkoutsTool, {}],
    ["query_health", createQueryHealthTool, { metric: "sleep" }],
    ["query_coaching", createQueryCoachingTool, {}],
  ] as const)(
    "should return zero rows of another profile from %s",
    async (_name, create, input) => {
      // Arrange
      const tool = create(deps(await seedTwoProfiles()));

      // Act
      const result = (await tool.execute(input)) as { count: number };

      // Assert
      expect(result.count).toBe(1);
      expect(JSON.stringify(result)).not.toContain("p2-");
      expect(JSON.stringify(result)).not.toContain(`"score":${OTHER_SCORE}`);
    }
  );

  it.each([["2026/06/01"], ["June 1"], ["2026-6-1"], ["20260601"]])(
    "should reject the non-ISO date %s",
    async (dateFrom) => {
      // Arrange
      const tool = createQueryWorkoutsTool(deps());

      // Act
      const parsed = tool.inputSchema.safeParse({ dateFrom });

      // Assert
      expect(parsed.success).toBe(false);
      await expect(tool.execute({ dateFrom })).rejects.toThrow();
    }
  );

  it("should reject a sport outside the closed domain", () => {
    // Arrange
    const tool = createQueryWorkoutsTool(deps());

    // Act
    const parsed = tool.inputSchema.safeParse({ sport: "jogging around" });

    // Assert
    expect(parsed.success).toBe(false);
  });

  it("should cut rows to the byte budget and say how many it omitted", async () => {
    // Arrange
    const rows = Array.from(
      { length: ROW_COUNT },
      (_, i) => `${String(i).padStart(2, "0")}${"x".repeat(PAYLOAD_CHARS)}`
    );
    const tool = rowsTool(rows)(deps());

    // Act
    const result = (await tool.execute({})) as {
      rows: string[];
      truncated: boolean;
      omitted: number;
      count: number;
    };

    // Assert
    const bytes = new TextEncoder().encode(JSON.stringify(result)).length;
    expect(bytes).toBeLessThanOrEqual(SMALL_BUDGET);
    expect(result.truncated).toBe(true);
    expect(result.omitted).toBe(ROW_COUNT - result.rows.length);
    expect(result.rows.at(-1)).toBe(rows.at(-1));
    expect(result.count).toBe(ROW_COUNT);
  });

  it("should report no truncation and echo range_used when everything fits", async () => {
    // Arrange
    const tool = rowsTool(["a", "b"])(deps());

    // Act
    const result = await tool.execute({ dateFrom: "2026-06-01" });

    // Assert
    expect(result).toEqual({
      range_used: { from: "2026-06-01", to: TODAY },
      count: 2,
      rows: ["a", "b"],
      truncated: false,
      omitted: 0,
    });
  });

  it("should hold query_workouts to its row cap while counting every row", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    for (let i = 0; i < MANY_WORKOUTS; i++) {
      await persistence.workouts.put({
        ...workout(`w${i}`, "p1", TODAY),
        krd: null,
      } as unknown as WorkoutRecord);
    }
    const tool = createQueryWorkoutsTool(deps(persistence));

    // Act
    const result = (await tool.execute({})) as {
      count: number;
      workouts: Array<{ id: string }>;
      truncated: boolean;
      omitted: number;
    };

    // Assert
    expect(result.count).toBe(MANY_WORKOUTS);
    expect(result.workouts).toHaveLength(WORKOUT_ROW_CAP);
    expect(result).toMatchObject({
      truncated: true,
      omitted: MANY_WORKOUTS - WORKOUT_ROW_CAP,
    });
  });
});
