import { afterEach, describe, expect, it, vi } from "vitest";

import { sendBridgeMessage } from "../bridge/bridge-transport";
import { TrainingPeaksBridgeError } from "./trainingpeaks-transport";
import {
  pushTrainingPeaksWorkout,
  readTrainingPeaksCopyState,
} from "./trainingpeaks-workout-transport";

vi.mock("../bridge/bridge-transport", () => ({ sendBridgeMessage: vi.fn() }));

const mockedSend = vi.mocked(sendBridgeMessage);
const EXTENSION_ID = "tp-extension-id";
const PUSH_WORKOUT_TIMEOUT_MS = 20_000;
const WORKOUT_ID = 4_242_424;
const HTTP_PAYMENT_REQUIRED = 402;

/** `structure` arrives already JSON-encoded; the API requires that shape. */
const PAYLOAD = {
  workoutDay: "2026-09-08T00:00:00",
  title: "Threshold 3x10",
  structure: '{"structure":[]}',
};

describe("pushTrainingPeaksWorkout", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should relay push-workout to the bridge and return the created id", async () => {
    // Arrange
    mockedSend.mockResolvedValue({ ok: true, data: { workoutId: WORKOUT_ID } });

    // Act
    const id = await pushTrainingPeaksWorkout(EXTENSION_ID, PAYLOAD);

    // Assert
    expect(id).toBe(WORKOUT_ID);
    expect(mockedSend).toHaveBeenCalledWith(
      EXTENSION_ID,
      { action: "push-workout", workout: PAYLOAD },
      PUSH_WORKOUT_TIMEOUT_MS
    );
  });

  it("should raise the bridge's own message when the push fails", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      error: "402 beyond the account planning horizon",
    });

    // Act
    const act = pushTrainingPeaksWorkout(EXTENSION_ID, PAYLOAD);

    // Assert
    await expect(act).rejects.toThrow(TrainingPeaksBridgeError);
    await expect(act).rejects.toThrow(
      "402 beyond the account planning horizon"
    );
  });

  it("should fall back to a generic message when the bridge names no error", async () => {
    // Arrange
    mockedSend.mockResolvedValue({ ok: false });

    // Act
    const act = pushTrainingPeaksWorkout(EXTENSION_ID, PAYLOAD);

    // Assert
    await expect(act).rejects.toThrow("TrainingPeaks workout push failed");
  });

  it("should carry the reauth flag through to the raised error", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      error: "session expired",
      needsReauth: true,
    });

    // Act
    const error = await pushTrainingPeaksWorkout(EXTENSION_ID, PAYLOAD).catch(
      (e: unknown) => e as TrainingPeaksBridgeError
    );

    // Assert
    expect(error.needsReauth).toBe(true);
  });

  it("should carry TrainingPeaks' status through to the raised error", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      error: "TrainingPeaks refused the date",
      status: HTTP_PAYMENT_REQUIRED,
    });

    // Act
    const error = await pushTrainingPeaksWorkout(EXTENSION_ID, PAYLOAD).catch(
      (e: unknown) => e as TrainingPeaksBridgeError
    );

    // Assert
    expect(error.status).toBe(HTTP_PAYMENT_REQUIRED);
  });

  it("should mark the push undelivered when the bridge says so", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      error: "no receiver",
      delivered: false,
    });

    // Act
    const error = await pushTrainingPeaksWorkout(EXTENSION_ID, PAYLOAD).catch(
      (e: unknown) => e as TrainingPeaksBridgeError
    );

    // Assert
    expect(error.delivered).toBe(false);
  });

  it.each([
    { label: "the data carries no id at all", data: { created: true } },
    {
      label: "the id is a string rather than a number",
      data: { workoutId: String(WORKOUT_ID) },
    },
  ])(
    "should treat an accepted response as a transport error when $label",
    async ({ data }) => {
      // Arrange
      mockedSend.mockResolvedValue({ ok: true, data });

      // Act
      const act = pushTrainingPeaksWorkout(EXTENSION_ID, PAYLOAD);

      // Assert
      await expect(act).rejects.toThrow("returned no id");
    }
  );
});

describe("readTrainingPeaksCopyState", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should ask the extension for the one recorded workout", async () => {
    // Arrange
    mockedSend.mockResolvedValue({ ok: true, data: { workoutId: WORKOUT_ID } });

    // Act
    await readTrainingPeaksCopyState(EXTENSION_ID, String(WORKOUT_ID));

    // Assert
    expect(mockedSend).toHaveBeenCalledWith(
      EXTENSION_ID,
      { action: "read-workout", workoutId: String(WORKOUT_ID) },
      expect.any(Number)
    );
  });

  it.each([
    { label: "TrainingPeaks returns it", res: { ok: true }, state: "present" },
    {
      label: "TrainingPeaks answers 404",
      res: { ok: false, status: 404 },
      state: "gone",
    },
    {
      label: "TrainingPeaks answers 500",
      res: { ok: false, status: 500 },
      state: "unknown",
    },
    {
      label: "the extension does not answer",
      res: { ok: false, delivered: false },
      state: "unknown",
    },
  ])("should report $state when $label", async ({ res, state }) => {
    // Arrange
    mockedSend.mockResolvedValue(res);

    // Act
    const result = await readTrainingPeaksCopyState(EXTENSION_ID, "1");

    // Assert
    expect(result).toBe(state);
  });
});
