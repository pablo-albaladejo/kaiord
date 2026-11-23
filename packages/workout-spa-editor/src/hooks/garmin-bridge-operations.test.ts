/**
 * Garmin Bridge Operations Tests
 *
 * Unit tests for evaluatePingResult (protocol version checks, outdated
 * bridge detection) and the executePush/executeList transport helpers
 * (envelope-to-result mapping over a mocked store transport).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { SPA_ACTION_TIMEOUT_MS } from "../application/garmin-placement/placement-timing";
import {
  evaluatePingResult,
  executeList,
  executePush,
} from "./garmin-bridge-operations";

// An extension one protocol behind (the store version): it refuses the
// thin Bridge's `request`, and the transport falls back to the legacy
// action, whose answer each case sets.
const { legacySend } = vi.hoisted(() => ({ legacySend: vi.fn() }));
vi.mock("../adapters/bridge/bridge-transport", () => ({
  sendBridgeMessage: (id: string, message: { action?: string }, t: number) =>
    message?.action === "request"
      ? Promise.resolve({
          ok: false,
          protocolVersion: 1,
          error: "Origin or action not permitted",
          retryable: false,
        })
      : legacySend(id, message, t),
}));

const PUSH_TIMEOUT_MS = SPA_ACTION_TIMEOUT_MS;
const NON_STRING = 7;

const mockedSend = legacySend;

describe("evaluatePingResult", () => {
  it.each([
    { outcome: "signed-in", session: true },
    { outcome: "not-checked", session: true },
    { outcome: "signed-out", session: false },
    { outcome: "not-answering", session: false },
  ])(
    "should let a send go ahead on $outcome only when nothing verified it cannot",
    ({ outcome, session }) => {
      // Arrange
      const res = {
        ok: true,
        protocolVersion: 1,
        data: { session: outcome, gcApi: { ok: outcome === "signed-in" } },
      };

      // Act
      const result = evaluatePingResult(res);

      // Assert
      expect(result).toMatchObject({ installed: true, session });
    }
  );

  it("should call a ping that got no answer not answering, never not installed", () => {
    // Arrange
    const res = {
      ok: false,
      delivered: false,
      error: "Extension did not respond",
    };

    // Act
    const result = evaluatePingResult(res);

    // Assert
    expect(result).toMatchObject({
      installed: false,
      connection: "not-answering",
    });
  });

  it("should detect a working Connection on the supported protocol", () => {
    // Arrange
    const res = { ok: true, protocolVersion: 1, data: { gcApi: { ok: true } } };

    // Act
    const result = evaluatePingResult(res);

    // Assert
    expect(result).toEqual({
      installed: true,
      session: true,
      connection: "working",
      features: [],
    });
  });

  it.each([
    [
      ["calendar-write-v1", "calendar-find-v1"],
      ["calendar-write-v1", "calendar-find-v1"],
    ],
    [["calendar-write-v1", NON_STRING, null], ["calendar-write-v1"]],
    ["calendar-write-v1", []],
  ])("should read the ping features %j as %j", (features, expected) => {
    // Arrange
    const data = { gcApi: { ok: true }, features };

    // Act
    const result = evaluatePingResult({ ok: true, protocolVersion: 1, data });

    // Assert
    expect(result).toMatchObject({ features: expected });
  });

  it.each([
    { res: { ok: true, protocolVersion: 999, data: { gcApi: { ok: true } } } },
    { res: { ok: true, data: { gcApi: { ok: true } } } },
  ])(
    "should call a bridge on an unsupported or missing protocol outdated",
    ({ res }) => {
      // Arrange
      const answer = res;

      // Act
      const result = evaluatePingResult(answer);

      // Assert
      expect(result).toMatchObject({
        installed: true,
        session: false,
        connection: "outdated",
      });
    }
  );

  it("should call a failed Garmin read not answering, never signed out", () => {
    // Arrange
    const res = {
      ok: true,
      protocolVersion: 1,
      data: { gcApi: { ok: false, status: 503 } },
    };

    // Act
    const result = evaluatePingResult(res);

    // Assert
    expect(result).toMatchObject({
      session: false,
      connection: "not-answering",
    });
  });

  it("should ask for a sign-in only when Garmin refused it", () => {
    // Arrange
    const res = {
      ok: true,
      protocolVersion: 1,
      data: { gcApi: { ok: false, needsReauth: true } },
    };

    // Act
    const result = evaluatePingResult(res);

    // Assert
    expect(result).toMatchObject({ session: false, connection: "signed-out" });
  });
});

describe("executePush", () => {
  beforeEach(() => {
    mockedSend.mockReset();
  });

  it("should return success with the parsed garmin workout id", async () => {
    // Arrange
    mockedSend.mockResolvedValue({ ok: true, data: { workoutId: 4711 } });

    // Act
    const result = await executePush("ext-1", { workoutName: "W" });

    // Assert
    expect(result).toEqual({ status: "success", garminWorkoutId: "4711" });
    expect(mockedSend).toHaveBeenCalledWith(
      "ext-1",
      { action: "push", gcn: { workoutName: "W" } },
      PUSH_TIMEOUT_MS
    );
  });

  it("should map an invalidated extension context to the invalidated status", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      error: "Extension context invalidated",
    });

    // Act
    const result = await executePush("ext-1", {});

    // Assert
    expect(result).toEqual({ status: "invalidated" });
  });

  it("should flag redetect and ask for a sign-in when the extension verified the Session ended", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      status: 401,
      needsReauth: true,
      error: "Nope",
    });

    // Act
    const result = await executePush("ext-1", {});

    // Assert
    expect(result).toEqual({
      status: "error",
      reason: "sign-in",
      detail: "Nope",
      redetect: true,
    });
  });

  it("should report a transport timeout as Garmin not answering", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      error: "Extension did not respond",
    });

    // Act
    const result = await executePush("ext-1", {});

    // Assert
    expect(result).toEqual({
      status: "error",
      reason: "not-answering",
      detail: "Extension did not respond",
      redetect: false,
    });
  });
});

describe("executeList", () => {
  beforeEach(() => {
    mockedSend.mockReset();
  });

  it("should return the workout array on success", async () => {
    // Arrange
    mockedSend.mockResolvedValue({ ok: true, data: [{ workoutId: 1 }] });

    // Act
    const result = await executeList("ext-1");

    // Assert
    expect(result).toEqual({ data: [{ workoutId: 1 }], redetect: false });
  });

  it("should coerce a non-array payload to an empty list", async () => {
    // Arrange
    mockedSend.mockResolvedValue({ ok: true, data: null });

    // Act
    const result = await executeList("ext-1");

    // Assert
    expect(result).toEqual({ data: [], redetect: false });
  });

  it("should throw the update guidance when the extension context is invalidated", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      error: "Extension context invalidated",
    });

    // Act
    const attempt = executeList("ext-1");

    // Assert
    await expect(attempt).rejects.toThrow(
      "Extension was updated. Please try again."
    );
  });

  it("should throw with a redetect marker on auth-shaped failures", async () => {
    // Arrange
    mockedSend.mockResolvedValue({ ok: false, status: 403, error: "Denied" });

    // Act
    const attempt = executeList("ext-1");

    // Assert
    await expect(attempt).rejects.toMatchObject({
      message: "Denied",
      redetect: true,
    });
  });

  it("should throw a plain error on non-auth failures", async () => {
    // Arrange
    mockedSend.mockResolvedValue({ ok: false, status: 500 });

    // Act
    const attempt = executeList("ext-1");

    // Assert
    await expect(attempt).rejects.toThrow("List failed");
  });
});
