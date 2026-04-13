/**
 * Garmin Bridge Operations Tests
 *
 * Unit tests for evaluatePingResult, covering protocol
 * version checks and outdated bridge detection.
 */

import { describe, expect, it } from "vitest";

import { evaluatePingResult } from "./garmin-bridge-operations";

describe("evaluatePingResult", () => {
  it("returns installed=false when response is not ok", () => {
    const result = evaluatePingResult({ ok: false });

    expect(result).toEqual({ installed: false });
  });

  it("detects supported protocol version", () => {
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

  it("flags outdated bridge with unsupported protocol version", () => {
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

  it("flags missing protocol version as outdated", () => {
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

  it("reports session=false when gcApi is not ok", () => {
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
