/**
 * Garmin Bridge Operations Tests
 *
 * Unit tests for evaluatePingResult (protocol version checks, outdated
 * bridge detection) and the executePush/executeList transport helpers
 * (envelope-to-result mapping over a mocked store transport).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendMessage } from "../store/garmin-extension-transport";
import {
  evaluatePingResult,
  executeList,
  executePush,
} from "./garmin-bridge-operations";

vi.mock("../store/garmin-extension-transport", () => ({
  sendMessage: vi.fn(),
}));

const PUSH_TIMEOUT_MS = 15_000;

const mockedSend = vi.mocked(sendMessage);

describe("evaluatePingResult", () => {
  it("should return installed=false when response is not ok", () => {
    // Arrange

    // Act
    const result = evaluatePingResult({ ok: false });

    // Assert
    expect(result).toEqual({ installed: false });
  });

  it("should detect supported protocol version", () => {
    // Arrange

    // Act
    const result = evaluatePingResult({
      ok: true,
      protocolVersion: 1,
      data: { gcApi: { ok: true } },
    });

    // Assert
    expect(result).toEqual({
      installed: true,
      session: true,
      error: null,
    });
  });

  it.each([
    { res: { ok: true, protocolVersion: 999, data: { gcApi: { ok: true } } } },
    { res: { ok: true, data: { gcApi: { ok: true } } } },
  ])(
    "should flag an outdated bridge when the protocol version is unsupported or missing",
    ({ res }) => {
      // Arrange

      // Act
      const result = evaluatePingResult(res);

      // Assert
      expect(result).toEqual({
        installed: true,
        session: false,
        error: "Update your Kaiord Garmin Bridge extension",
      });
    }
  );

  it("should report session=false when gcApi is not ok", () => {
    // Arrange

    // Act
    const result = evaluatePingResult({
      ok: true,
      protocolVersion: 1,
      data: { gcApi: { ok: false } },
    });

    // Assert
    expect(result).toEqual({
      installed: true,
      session: false,
      error: null,
    });
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

  it("should flag redetect on auth-shaped failures", async () => {
    // Arrange
    mockedSend.mockResolvedValue({ ok: false, status: 401, error: "Nope" });

    // Act
    const result = await executePush("ext-1", {});

    // Assert
    expect(result).toEqual({
      status: "error",
      message: "Nope",
      redetect: true,
    });
  });

  it("should translate a transport timeout into the retry guidance message", async () => {
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
      message:
        "Extension did not respond. Check Garmin Connect before retrying.",
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
