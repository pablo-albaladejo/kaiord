import { afterEach, describe, expect, it, vi } from "vitest";

import { sendBridgeMessage } from "../bridge/bridge-transport";
import {
  checkTrainingPeaksSession,
  TrainingPeaksBridgeError,
} from "./trainingpeaks-transport";

vi.mock("../bridge/bridge-transport", () => ({ sendBridgeMessage: vi.fn() }));

const mockedSend = vi.mocked(sendBridgeMessage);
const CHECK_SESSION_TIMEOUT_MS = 5_000;
const ATHLETE_ID = 987_654;

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
