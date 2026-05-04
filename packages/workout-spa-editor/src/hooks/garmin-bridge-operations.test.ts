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
    const result = evaluatePingResult({ ok: false });

    expect(result).toEqual({ installed: false });
  });

  it("should detect supported protocol version", () => {
    const result = evaluatePingResult({
      ok: true,
      protocolVersion: 1,
      data: { gcApi: { ok: true } },
    });

    expect(result).toEqual({
      installed: true,
      session: true,
      error: null,
    });
  });

  it("should flag outdated bridge with unsupported protocol version", () => {
    const result = evaluatePingResult({
      ok: true,
      protocolVersion: 999,
      data: { gcApi: { ok: true } },
    });

    expect(result).toEqual({
      installed: true,
      session: false,
      error: "Update your Kaiord Garmin Bridge extension",
    });
  });

  it("should flag missing protocol version as outdated", () => {
    const result = evaluatePingResult({
      ok: true,
      data: { gcApi: { ok: true } },
    });

    expect(result).toEqual({
      installed: true,
      session: false,
      error: "Update your Kaiord Garmin Bridge extension",
    });
  });

  it("should report session=false when gcApi is not ok", () => {
    const result = evaluatePingResult({
      ok: true,
      protocolVersion: 1,
      data: { gcApi: { ok: false } },
    });

    expect(result).toEqual({
      installed: true,
      session: false,
      error: null,
    });
  });
});
