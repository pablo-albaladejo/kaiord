import { describe, it, expect, vi } from "vitest";
import { createGarminWorkoutService } from "./garmin-workout-service";
import type { GarminHttpClient } from "../http/types";
import type { KRD, Logger } from "@kaiord/core";
import { WORKOUT_URL } from "../http/urls";

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const createMockHttpClient = (): GarminHttpClient => ({
  get: vi.fn(async () => ({})),
  post: vi.fn(async () => ({ workoutId: 999, workoutName: "Pushed" })),
  del: vi.fn(async () => ({})),
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

  it("should push a workout", async () => {
    const httpClient = createMockHttpClient();
    vi.mocked(httpClient.post).mockResolvedValue({
      workoutId: 999,
      workoutName: "Pushed",
    });

    const service = createGarminWorkoutService(httpClient, mockLogger);

    const krd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: "2025-01-15T10:00:00Z",
        sport: "cycling",
      },
      extensions: {
        structured_workout: {
          sport: "cycling",
          name: "Test Workout",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "open",
              target: { type: "open" },
              intensity: "warmup",
            },
          ],
        },
      },
    };

    const result = await service.push(krd);

    expect(result.id).toBe("999");
    expect(result.name).toBe("Pushed");
    expect(result.url).toContain("999");
    expect(httpClient.post).toHaveBeenCalledWith(
      `${WORKOUT_URL}/workout`,
      expect.any(Object)
    );
  });

  it("should throw a ServiceApiError when push fails", async () => {
    const httpClient = createMockHttpClient();
    vi.mocked(httpClient.post).mockRejectedValue(new Error("network error"));

    const service = createGarminWorkoutService(httpClient, mockLogger);

    const krd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: "2025-01-15T10:00:00Z",
        sport: "cycling",
      },
      extensions: {
        structured_workout: {
          sport: "cycling",
          name: "Test Workout",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "open",
              target: { type: "open" },
              intensity: "warmup",
            },
          ],
        },
      },
    };

    await expect(service.push(krd)).rejects.toThrow("Failed to push workout");
  });

  it("should throw a ServiceApiError when list fails", async () => {
    const httpClient = createMockHttpClient();
    vi.mocked(httpClient.get).mockRejectedValue(new Error("network error"));

    const service = createGarminWorkoutService(httpClient, mockLogger);

    await expect(service.list()).rejects.toThrow("Failed to list workouts");
  });

  it("should pull a workout and return KRD", async () => {
    const httpClient = createMockHttpClient();
    const gcnPayload = {
      workoutName: "Morning Run",
      sportType: { sportTypeKey: "running" },
      workoutSegments: [
        {
          workoutSteps: [
            {
              type: "ExecutableStepDTO",
              stepType: { stepTypeKey: "warmup" },
              endCondition: { conditionTypeKey: "lap.button" },
              endConditionValue: 0,
              targetType: { workoutTargetTypeKey: "no.target" },
            },
          ],
        },
      ],
    };
    vi.mocked(httpClient.get).mockResolvedValue(gcnPayload);

    const service = createGarminWorkoutService(httpClient, mockLogger);
    const krd = await service.pull("42");

    expect(krd).toBeDefined();
    expect(krd.type).toBe("structured_workout");
    expect(httpClient.get).toHaveBeenCalledWith(`${WORKOUT_URL}/workout/42`);
  });

  it("should throw a ServiceApiError when pull fails", async () => {
    const httpClient = createMockHttpClient();
    vi.mocked(httpClient.get).mockRejectedValue(new Error("network error"));

    const service = createGarminWorkoutService(httpClient, mockLogger);

    await expect(service.pull("42")).rejects.toThrow("Failed to pull workout");
  });

  it("should remove a workout", async () => {
    const httpClient = createMockHttpClient();
    vi.mocked(httpClient.del).mockResolvedValue(undefined);

    const service = createGarminWorkoutService(httpClient, mockLogger);
    await service.remove("42");

    expect(httpClient.del).toHaveBeenCalledWith(`${WORKOUT_URL}/workout/42`);
  });

  it("should throw a ServiceApiError when remove fails", async () => {
    const httpClient = createMockHttpClient();
    vi.mocked(httpClient.del).mockRejectedValue(new Error("network error"));

    const service = createGarminWorkoutService(httpClient, mockLogger);

    await expect(service.remove("42")).rejects.toThrow(
      "Failed to remove workout"
    );
  });
});
