import { afterEach, describe, expect, it, vi } from "vitest";

import { SESSION_PROBES } from "./bridge-session-probes";
import { sendBridgeMessage } from "./bridge-transport";

vi.mock("./bridge-transport", () => ({ sendBridgeMessage: vi.fn() }));

const mockedSend = vi.mocked(sendBridgeMessage);
const WHOOP_USER_ID = 12345;

describe("SESSION_PROBES", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should expose a prober for every cheaply-probeable bridge", () => {
    // Arrange
    const expected = [
      "garmin-bridge",
      "train2go-bridge",
      "whoop-bridge",
      "trainingpeaks-bridge",
    ];

    // Act
    const keys = Object.keys(SESSION_PROBES);

    // Assert
    expect(keys.sort()).toEqual(expected.sort());
  });

  it("should not expose a prober for tanita-bridge", () => {
    // Arrange
    const bridgeId = "tanita-bridge";

    // Act
    const prober = SESSION_PROBES[bridgeId];

    // Assert
    // tanita's checkSession downloads the whole export CSV — polling it would
    // re-fetch the user's entire history every pass.
    expect(prober).toBeUndefined();
  });
});

describe("whoop-bridge prober", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should report an active session when connected with a user id", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { connected: true, userId: WHOOP_USER_ID, capturedAt: null },
    });

    // Act
    const result = await SESSION_PROBES["whoop-bridge"]("ext-w");

    // Assert
    expect(result).toEqual({
      reachable: true,
      sessionActive: true,
      error: null,
      needsReauth: false,
      outdated: false,
    });
  });

  it("should report no session when connected without a user id", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { connected: true, userId: null, capturedAt: null },
    });

    // Act
    const result = await SESSION_PROBES["whoop-bridge"]("ext-w");

    // Assert
    expect(result.sessionActive).toBe(false);
  });

  it("should fold a bridge error into the result instead of throwing", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      error: "No session token captured",
    });

    // Act
    const result = await SESSION_PROBES["whoop-bridge"]("ext-w");

    // Assert
    expect(result).toEqual({
      reachable: true,
      sessionActive: false,
      error: "No session token captured",
      needsReauth: false,
      outdated: false,
    });
  });
});

describe("trainingpeaks-bridge prober", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should mirror the authenticated flag", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { authenticated: true, athleteId: 7 },
    });

    // Act
    const result = await SESSION_PROBES["trainingpeaks-bridge"]("ext-tp");

    // Assert
    expect(result.sessionActive).toBe(true);
  });

  it("should carry needsReauth from a dead session envelope", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      error: "Session expired",
      needsReauth: true,
    });

    // Act
    const result = await SESSION_PROBES["trainingpeaks-bridge"]("ext-tp");

    // Assert
    expect(result).toEqual({
      reachable: true,
      sessionActive: false,
      error: "Session expired",
      needsReauth: true,
      outdated: false,
    });
  });
});

describe("transport-failure error reporting", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fold a whoop transport failure message into error", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      error: "Extension not available",
    });

    // Act
    const result = await SESSION_PROBES["whoop-bridge"]("ext-w");

    // Assert
    // The thrown WhoopBridgeError message is more useful than a bare null.
    expect(result).toEqual({
      reachable: true,
      sessionActive: false,
      error: "Extension not available",
      needsReauth: false,
      outdated: false,
    });
  });

  it("should report a clean signed-out whoop response with a null error", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { connected: false, userId: null, capturedAt: null },
    });

    // Act
    const result = await SESSION_PROBES["whoop-bridge"]("ext-w");

    // Assert
    expect(result).toEqual({
      reachable: true,
      sessionActive: false,
      error: null,
      needsReauth: false,
      outdated: false,
    });
  });
});
