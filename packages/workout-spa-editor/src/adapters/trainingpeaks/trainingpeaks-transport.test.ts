import { afterEach, describe, expect, it, vi } from "vitest";

import { sendBridgeMessage } from "../bridge/bridge-transport";
import {
  checkTrainingPeaksSession,
  readTrainingPeaksMetrics,
  TrainingPeaksBridgeError,
} from "./trainingpeaks-transport";

vi.mock("../bridge/bridge-transport", () => ({ sendBridgeMessage: vi.fn() }));

const mockedSend = vi.mocked(sendBridgeMessage);
const CHECK_SESSION_TIMEOUT_MS = 5_000;
const READ_METRICS_TIMEOUT_MS = 30_000;
const ATHLETE_ID = 987_654;
const START = "2026-06-20";
const END = "2026-07-20";

describe("checkTrainingPeaksSession", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should relay a checkSession probe and resolve with the parsed session", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      // The bridge answers with its whole BRIDGE_MANIFEST plus these keys.
      data: {
        bridgeId: "trainingpeaks-bridge",
        capabilities: ["read:body", "write:body"],
        authenticated: true,
        athleteId: ATHLETE_ID,
      },
    });

    // Act
    const result = await checkTrainingPeaksSession("ext-123");

    // Assert
    expect(mockedSend).toHaveBeenCalledWith(
      "ext-123",
      { action: "checkSession" },
      CHECK_SESSION_TIMEOUT_MS
    );
    expect(result).toEqual({ authenticated: true, athleteId: ATHLETE_ID });
  });

  it("should throw a typed error carrying the bridge message", async () => {
    // Arrange
    const message = "Extension did not respond";
    mockedSend.mockResolvedValue({ ok: false, error: message });

    // Act
    const act = checkTrainingPeaksSession("ext-123");

    // Assert
    await expect(act).rejects.toBeInstanceOf(TrainingPeaksBridgeError);
    await expect(act).rejects.toThrow(message);
  });

  it("should reject a malformed session envelope", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { authenticated: "yes" },
    });

    // Act
    const act = checkTrainingPeaksSession("ext-123");

    // Assert
    await expect(act).rejects.toThrow(
      "Malformed TrainingPeaks session response"
    );
  });
});

describe("readTrainingPeaksMetrics", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should relay a read-metrics range and resolve with the raw payload", async () => {
    // Arrange
    const body = [{ timeStamp: "2026-07-20T08:00:00", details: [] }];
    mockedSend.mockResolvedValue({ ok: true, protocolVersion: 1, data: body });

    // Act
    const result = await readTrainingPeaksMetrics("ext-123", START, END);

    // Assert
    expect(mockedSend).toHaveBeenCalledWith(
      "ext-123",
      { action: "read-metrics", start: START, end: END },
      READ_METRICS_TIMEOUT_MS
    );
    expect(result).toEqual(body);
  });

  it("should carry the needsReauth flag on a dead-session failure", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      error: "Not signed in to TrainingPeaks",
      needsReauth: true,
    });

    // Act
    const act = readTrainingPeaksMetrics("ext-123", START, END);

    // Assert
    await expect(act).rejects.toBeInstanceOf(TrainingPeaksBridgeError);
    await expect(act).rejects.toMatchObject({ needsReauth: true });
  });
});
