import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it } from "vitest";

import { KRD_SCHEMA_TEXT } from "./build-server";
import { FIT_OUTPUT_CAP_BYTES } from "./limits";
import {
  callTool,
  fixtureBase64,
  THREE_STEP_KRD,
} from "./test-utils/mcp-request";

const NativeArrayBuffer = globalThis.ArrayBuffer;

// Records every resizable ArrayBuffer reservation, as the PoC's Proxy did,
// but only to observe: the Worker itself never patches a global.
const recordReservations = (): Array<number> => {
  const reservations: Array<number> = [];
  globalThis.ArrayBuffer = new Proxy(NativeArrayBuffer, {
    construct(target, args: [number, { maxByteLength?: number }?]) {
      const max = args[1]?.maxByteLength;
      if (max !== undefined) reservations.push(max);
      return new target(...args);
    },
  });
  return reservations;
};

describe("FIT writer cap", () => {
  afterEach(() => {
    globalThis.ArrayBuffer = NativeArrayBuffer;
  });

  it("should reserve at most the cap when converting KRD to FIT", async () => {
    // Arrange
    const reservations = recordReservations();
    const args = {
      input_content: JSON.stringify(THREE_STEP_KRD),
      input_format: "krd",
      output_format: "fit",
    };

    // Act
    const { reply } = await callTool("kaiord_convert", args);

    // Assert
    expect(reply.result?.isError).toBeUndefined();
    expect(reservations.length).toBeGreaterThan(0);
    for (const max of reservations) {
      expect(max).toBeLessThanOrEqual(FIT_OUTPUT_CAP_BYTES);
    }
  });

  it("should reserve at most the cap in round-trip validation", async () => {
    // Arrange
    const reservations = recordReservations();
    const args = { input_content: fixtureBase64("fit/WorkoutRepeatSteps.fit") };

    // Act
    const { reply } = await callTool("kaiord_round_trip_validate", args);

    // Assert
    expect(reply.result?.isError).toBeUndefined();
    expect(reservations.length).toBeGreaterThan(0);
    for (const max of reservations) {
      expect(max).toBeLessThanOrEqual(FIT_OUTPUT_CAP_BYTES);
    }
  });
});

describe("bundled texts", () => {
  it("should reproduce krd.json byte for byte", () => {
    // Arrange
    const url = new URL("../../core/schema/krd.json", import.meta.url);

    // Act
    const onDisk = readFileSync(url, "utf8");

    // Assert
    expect(KRD_SCHEMA_TEXT).toBe(onDisk);
  });
});
