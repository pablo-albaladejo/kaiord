import { afterEach, describe, expect, it, vi } from "vitest";

import { sendBridgeMessage } from "../../bridge/bridge-transport";
import { readTrainingPeaksAthleteId } from "./trainingpeaks-athlete-transport";

vi.mock("../../bridge/bridge-transport", () => ({
  sendBridgeMessage: vi.fn(),
}));

const mockedSend = vi.mocked(sendBridgeMessage);
const ATHLETE_ID = 987_654;
const NOT_PERMITTED = {
  ok: false,
  protocolVersion: 1,
  error: "Origin or action not permitted",
};

describe("readTrainingPeaksAthleteId", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should read the athlete id from the read the extension makes just before a write", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 2,
      data: { athleteId: ATHLETE_ID },
    });

    // Act
    const athleteId = await readTrainingPeaksAthleteId("ext");

    // Assert
    expect(athleteId).toBe(ATHLETE_ID);
    expect(mockedSend).toHaveBeenCalledTimes(1);
    expect(mockedSend.mock.calls[0][1]).toEqual({ action: "read-athlete-id" });
  });

  it("should carry needsReauth when TrainingPeaks says the Session is gone", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      protocolVersion: 2,
      error: "TrainingPeaks session expired",
      needsReauth: true,
    });

    // Act
    const attempt = readTrainingPeaksAthleteId("ext");

    // Assert
    await expect(attempt).rejects.toMatchObject({ needsReauth: true });
  });

  it("should fall back to an older extension's session check, which still answers the athlete id", async () => {
    // Arrange
    mockedSend.mockResolvedValueOnce(NOT_PERMITTED).mockResolvedValueOnce({
      ok: true,
      protocolVersion: 1,
      data: { authenticated: true, athleteId: ATHLETE_ID },
    });

    // Act
    const athleteId = await readTrainingPeaksAthleteId("ext");

    // Assert
    expect(athleteId).toBe(ATHLETE_ID);
    expect(mockedSend.mock.calls[1][1]).toEqual({ action: "checkSession" });
  });

  it.each([
    {
      label: "it could not tell",
      session: { authenticated: false },
      needsReauth: false,
    },
    {
      label: "TrainingPeaks ended the Session",
      session: { authenticated: false, needsReauth: true },
      needsReauth: true,
    },
    {
      label: "TrainingPeaks did not answer",
      session: { authenticated: false, needsReauth: false },
      needsReauth: false,
    },
  ])(
    "should say why an older extension named no athlete: $label",
    async ({ session, needsReauth }) => {
      // Arrange
      mockedSend
        .mockResolvedValueOnce(NOT_PERMITTED)
        .mockResolvedValueOnce({ ok: true, protocolVersion: 1, data: session });

      // Act
      const attempt = readTrainingPeaksAthleteId("ext");

      // Assert
      await expect(attempt).rejects.toMatchObject({ needsReauth });
    }
  );

  it("should tell an older extension by its protocol version, not by the words of its refusal", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      protocolVersion: 2,
      error: "Origin or action not permitted",
    });

    // Act
    const attempt = readTrainingPeaksAthleteId("ext");

    // Assert
    await expect(attempt).rejects.toMatchObject({ needsReauth: false });
    expect(mockedSend).toHaveBeenCalledTimes(1);
  });
});
