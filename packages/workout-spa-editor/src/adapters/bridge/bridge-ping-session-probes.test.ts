import { afterEach, describe, expect, it, vi } from "vitest";

import { readGarminSession } from "../../application/connections/session-outcome";
import {
  classifyEnvelope,
  probeGarminSession,
  probeTrain2GoSession,
  probeTrainingPeaksSession,
  probeWhoopSession,
} from "./bridge-ping-session-probes";
import type { SessionProber } from "./bridge-session-probe-types";
import { type ExtensionResponse, sendBridgeMessage } from "./bridge-transport";

vi.mock("./bridge-transport", () => ({ sendBridgeMessage: vi.fn() }));

const mockedSend = vi.mocked(sendBridgeMessage);

const ACTIVE = {
  reachable: true,
  sessionActive: true,
  error: null,
  needsReauth: false,
  outdated: false,
};
const COULD_NOT_TELL = { ...ACTIVE, sessionActive: false };
const SIGNED_OUT = { ...COULD_NOT_TELL, needsReauth: true };

type Case = readonly [string, ExtensionResponse, Record<string, unknown>];

const ok = (data: unknown): ExtensionResponse => ({
  ok: true,
  delivered: true,
  protocolVersion: 1,
  data,
});

const PROBERS: readonly (readonly [string, SessionProber, string, Case[]])[] = [
  [
    "garmin-bridge",
    probeGarminSession,
    "ping",
    [
      ["a read that worked", ok({ gcApi: { ok: true } }), ACTIVE],
      // #1100: a failed read is no evidence about the sign-in.
      [
        "a read Garmin failed",
        ok({ gcApi: { ok: false, status: 503 } }),
        COULD_NOT_TELL,
      ],
      [
        "a refused sign-in",
        ok({ gcApi: { ok: false, needsReauth: true } }),
        SIGNED_OUT,
      ],
    ],
  ],
  [
    "train2go-bridge",
    probeTrain2GoSession,
    "ping",
    [
      ["an active session", ok({ sessionActive: true, userId: 42 }), ACTIVE],
      [
        "an inactive session it cannot explain",
        ok({ sessionActive: false }),
        COULD_NOT_TELL,
      ],
      [
        "a refused sign-in",
        ok({ sessionActive: false, needsReauth: true }),
        SIGNED_OUT,
      ],
    ],
  ],
  [
    "trainingpeaks-bridge",
    probeTrainingPeaksSession,
    "checkSession",
    [
      ["a minted token", ok({ authenticated: true, athleteId: 7 }), ACTIVE],
      [
        "TrainingPeaks not answering",
        ok({ authenticated: false, needsReauth: false }),
        COULD_NOT_TELL,
      ],
      [
        "a refused sign-in",
        ok({ authenticated: false, needsReauth: true }),
        SIGNED_OUT,
      ],
    ],
  ],
  [
    "whoop-bridge",
    probeWhoopSession,
    "status",
    [
      [
        "a held sign-in",
        ok({ connected: true, userId: 12, capturedAt: 1 }),
        ACTIVE,
      ],
      // #1091: the popup calls this Connected, so the App must too.
      [
        "a held sign-in with no user id",
        ok({ connected: true, userId: null, capturedAt: 1 }),
        ACTIVE,
      ],
      [
        "no sign-in held",
        ok({ connected: false, userId: null, capturedAt: null }),
        SIGNED_OUT,
      ],
    ],
  ],
];

describe("session probers at the message contract", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe.each(PROBERS)("%s", (_bridge, probe, action, cases) => {
    it.each(cases)("should read %s", async (_label, answer, expected) => {
      // Arrange
      mockedSend.mockResolvedValue(answer);

      // Act
      const result = await probe("ext-1");

      // Assert
      expect(mockedSend.mock.calls[0]?.[1]).toEqual({ action });
      expect(result).toEqual(expected);
    });

    it("should recognise an outdated extension whatever its action answers", async () => {
      // Arrange
      // #1098: an outdated extension may not know the action at all; the
      // envelope's version still says what it is, so it is never "signed out".
      mockedSend.mockResolvedValue({
        ok: false,
        delivered: true,
        protocolVersion: 2,
        error: `Unknown action: ${action}`,
      });

      // Act
      const result = await probe("ext-1");

      // Assert
      expect(result).toMatchObject({
        reachable: true,
        outdated: true,
        needsReauth: false,
      });
    });

    it("should report an extension that did not reply as unreachable", async () => {
      // Arrange
      mockedSend.mockResolvedValue({
        ok: false,
        delivered: false,
        error: "Extension did not respond",
      });

      // Act
      const result = await probe("ext-1");

      // Assert
      expect(result).toMatchObject({
        reachable: false,
        needsReauth: false,
        outdated: false,
      });
    });

    it("should never call a delivered failure signed out without the Platform's refusal", async () => {
      // Arrange
      mockedSend.mockResolvedValue({
        ok: false,
        delivered: true,
        protocolVersion: 1,
        error: "500 from upstream",
      });

      // Act
      const result = await probe("ext-1");

      // Assert
      expect(result).toEqual({ ...COULD_NOT_TELL, error: "500 from upstream" });
    });
  });
});

describe("classifyEnvelope", () => {
  it("should read a refusal the envelope carries as signed out", () => {
    // Arrange
    const answer: ExtensionResponse = {
      ok: false,
      delivered: true,
      protocolVersion: 1,
      needsReauth: true,
      error: "redirected to login",
    };

    // Act
    const result = classifyEnvelope(answer, readGarminSession);

    // Assert
    expect(result).toEqual({ ...SIGNED_OUT, error: "redirected to login" });
  });

  it("should call an envelope with no protocol version outdated", () => {
    // Arrange
    const answer: ExtensionResponse = { ok: true, delivered: true, data: {} };

    // Act
    const result = classifyEnvelope(answer, readGarminSession);

    // Assert
    expect(result.outdated).toBe(true);
  });
});
