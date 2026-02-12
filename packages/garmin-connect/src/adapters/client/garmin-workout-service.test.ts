import { describe, it, expect, vi } from "vitest";
import { createGarminWorkoutService } from "./garmin-workout-service";
import type { GarminHttpClient } from "../http/garmin-http-client";
import type { Logger } from "@kaiord/core";
import { WORKOUT_URL } from "../http/urls";

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const GCN_WORKOUT_DETAIL = {
  workoutId: 123,
  workoutName: "Test Ride",
  sportType: { sportTypeId: 2, sportTypeKey: "cycling" },
  workoutSegments: [
    {
      segmentOrder: 1,
      sportType: { sportTypeId: 2, sportTypeKey: "cycling" },
      workoutSteps: [
        {
          type: "ExecutableStepDTO",
          stepOrder: 1,
          stepType: { stepTypeId: 1, stepTypeKey: "warmup" },
          endCondition: {
            conditionTypeId: 2,
            conditionTypeKey: "time",
            displayable: true,
          },
          endConditionValue: 600,
          targetType: {
            workoutTargetTypeId: 1,
            workoutTargetTypeKey: "no.target",
          },
        },
      ],
    },
  ],
};

const createMockHttpClient = (): GarminHttpClient => ({
  get: vi.fn(async () => ({})),
  post: vi.fn(async () => ({ workoutId: 999, workoutName: "Pushed" })),
  del: vi.fn(async () => ({})),
  setTokens: vi.fn(),
  getOAuth2Token: vi.fn(() => undefined),
});

describe("createGarminWorkoutService", () => {
  it("should list workouts", async () => {
    const httpClient = createMockHttpClient();
    vi.mocked(httpClient.get).mockResolvedValue([
      {
        workoutId: 1,
        workoutName: "Run",
        sportType: { sportTypeKey: "running" },
        createdDate: 1700000000000,
        updatedDate: 1700000000000,
      },
    ]);

    const service = createGarminWorkoutService(httpClient, mockLogger);
    const workouts = await service.list({ offset: 0, limit: 10 });

    expect(workouts).toHaveLength(1);
    expect(workouts[0].id).toBe("1");
    expect(workouts[0].name).toBe("Run");
    expect(workouts[0].sport).toBe("running");
    expect(httpClient.get).toHaveBeenCalledWith(
      expect.stringContaining(`${WORKOUT_URL}/workouts`)
    );
  });

  it("should pull a workout by id", async () => {
    const httpClient = createMockHttpClient();
    vi.mocked(httpClient.get).mockResolvedValue(GCN_WORKOUT_DETAIL);

    const service = createGarminWorkoutService(httpClient, mockLogger);
    const krd = await service.pull("123");

    expect(krd.version).toBe("1.0");
    expect(krd.type).toBe("structured_workout");
    expect(httpClient.get).toHaveBeenCalledWith(`${WORKOUT_URL}/workout/123`);
  });

  it("should remove a workout", async () => {
    const httpClient = createMockHttpClient();

    const service = createGarminWorkoutService(httpClient, mockLogger);
    await service.remove("456");

    expect(httpClient.del).toHaveBeenCalledWith(`${WORKOUT_URL}/workout/456`);
  });
});
