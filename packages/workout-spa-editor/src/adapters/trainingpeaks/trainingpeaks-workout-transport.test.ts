import { afterEach, describe, expect, it, vi } from "vitest";

import { sendBridgeMessage } from "../bridge/bridge-transport";
import { TrainingPeaksBridgeError } from "./trainingpeaks-transport";
import { pushTrainingPeaksWorkout } from "./trainingpeaks-workout-transport";

vi.mock("../bridge/bridge-transport", () => ({ sendBridgeMessage: vi.fn() }));

const mockedSend = vi.mocked(sendBridgeMessage);
const EXTENSION_ID = "tp-extension-id";
const PUSH_WORKOUT_TIMEOUT_MS = 20_000;
const WORKOUT_ID = 4_242_424;

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

  it("should relay the payload verbatim, leaving structure a JSON string", async () => {
    // Arrange
    mockedSend.mockResolvedValue({ ok: true, data: { workoutId: WORKOUT_ID } });

    // Act
    await pushTrainingPeaksWorkout(EXTENSION_ID, PAYLOAD);

    // Assert
    const [, message] = mockedSend.mock.calls[0]!;
    const relayed = (message as { workout: Record<string, unknown> }).workout;
    expect(relayed.structure).toBe(PAYLOAD.structure);
    expect(typeof relayed.structure).toBe("string");
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

  it("should treat an accepted response carrying no id as a transport error", async () => {
    // Arrange
    mockedSend.mockResolvedValue({ ok: true, data: { created: true } });

    // Act
    const act = pushTrainingPeaksWorkout(EXTENSION_ID, PAYLOAD);

    // Assert
    await expect(act).rejects.toThrow(
      "TrainingPeaks accepted the workout but returned no id"
    );
  });

  it("should reject an id of the wrong type rather than coerce it", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      data: { workoutId: String(WORKOUT_ID) },
    });

    // Act
    const act = pushTrainingPeaksWorkout(EXTENSION_ID, PAYLOAD);

    // Assert
    await expect(act).rejects.toThrow("returned no id");
  });
});
