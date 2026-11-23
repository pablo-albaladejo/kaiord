import { afterEach, describe, expect, it, vi } from "vitest";

import { checkAllowsUse } from "./bridge-session-outcome";
import { SESSION_PROBES } from "./bridge-session-probes";
import { sendBridgeMessage } from "./bridge-transport";

vi.mock("./bridge-transport", () => ({ sendBridgeMessage: vi.fn() }));

const mockedSend = vi.mocked(sendBridgeMessage);

const PROBED = [
  "garmin-bridge",
  "train2go-bridge",
  "whoop-bridge",
  "trainingpeaks-bridge",
] as const;

const answer = (session: string) => ({
  ok: true,
  protocolVersion: 1,
  data: {
    id: "x",
    protocolVersion: 1,
    session,
    authenticated: session === "signed-in",
    connected: session === "signed-in",
  },
});

describe("the typed Session outcome a check answers", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each(PROBED)(
    "should read signed-in from %s as an active session",
    async (bridgeId) => {
      // Arrange
      mockedSend.mockResolvedValue(answer("signed-in"));

      // Act
      const result = await SESSION_PROBES[bridgeId]("ext");

      // Assert
      expect(result).toEqual({
        reachable: true,
        sessionActive: true,
        error: null,
        needsReauth: false,
        outdated: false,
      });
    }
  );

  it.each(PROBED)(
    "should read signed-out from %s as a Session the Platform ended",
    async (bridgeId) => {
      // Arrange
      mockedSend.mockResolvedValue(answer("signed-out"));

      // Act
      const result = await SESSION_PROBES[bridgeId]("ext");

      // Assert
      expect(result).toMatchObject({
        reachable: true,
        sessionActive: false,
        needsReauth: true,
      });
    }
  );

  it.each(PROBED)(
    "should read not-answering from %s without claiming a sign-out",
    async (bridgeId) => {
      // Arrange
      mockedSend.mockResolvedValue(answer("not-answering"));

      // Act
      const result = await SESSION_PROBES[bridgeId]("ext");

      // Assert
      expect(result).toMatchObject({
        reachable: true,
        sessionActive: false,
        needsReauth: false,
      });
      expect(result.error).not.toBeNull();
      expect(result.notChecked).not.toBe(true);
    }
  );

  it.each(PROBED)(
    "should read not-checked from %s as known only at first use, neither working nor broken",
    async (bridgeId) => {
      // Arrange
      mockedSend.mockResolvedValue(answer("not-checked"));

      // Act
      const result = await SESSION_PROBES[bridgeId]("ext");

      // Assert
      expect(result).toEqual({
        reachable: true,
        sessionActive: false,
        error: null,
        needsReauth: false,
        outdated: false,
        notChecked: true,
      });
    }
  );
});

describe("checkAllowsUse", () => {
  it.each([
    { answer: { session: "signed-in", authenticated: true }, allowed: true },
    { answer: { session: "not-checked", authenticated: false }, allowed: true },
    { answer: { session: "signed-out", authenticated: false }, allowed: false },
    {
      answer: { session: "not-answering", authenticated: false },
      allowed: false,
    },
    { answer: { authenticated: true }, allowed: true },
    { answer: { authenticated: false }, allowed: false },
  ])(
    "should let a real read go ahead for $answer only when nothing verified it cannot",
    ({ answer, allowed }) => {
      // Arrange

      // Act
      const result = checkAllowsUse(answer);

      // Assert
      expect(result).toBe(allowed);
    }
  );
});
