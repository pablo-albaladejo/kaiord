/**
 * Garmin Bridge Operations Tests
 *
 * Unit tests for evaluatePingResult, covering protocol
 * version checks and outdated bridge detection.
 */

import { describe, expect, it } from "vitest";

import { evaluatePingResult } from "./garmin-bridge-operations";

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
