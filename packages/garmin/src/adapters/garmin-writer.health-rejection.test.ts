import {
  createConsoleLogger,
  type KRD,
  UnsupportedKrdTypeError,
} from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { createGarminWriter } from "./garmin-writer";

const writer = createGarminWriter({ logger: createConsoleLogger() });

const buildHealthKrd = (
  type:
    | "sleep_record"
    | "weight_measurement"
    | "hrv_summary"
    | "daily_wellness"
    | "body_composition"
    | "stress_episode"
): KRD =>
  ({
    version: "2.0",
    type,
    metadata: { created: "2026-05-22T07:00:00.000Z" },
  }) as unknown as KRD;

describe("Garmin writer — health-type rejection", () => {
  it("should throw UnsupportedKrdTypeError for sleep_record", async () => {
    // Arrange
    const krd = buildHealthKrd("sleep_record");

    // Act
    const promise = writer(krd);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(UnsupportedKrdTypeError);
    await expect(promise).rejects.toMatchObject({
      krdType: "sleep_record",
      adapterName: "garmin",
    });
  });

  it.each([
    ["weight_measurement"],
    ["hrv_summary"],
    ["daily_wellness"],
    ["body_composition"],
    ["stress_episode"],
  ] as const)("should throw UnsupportedKrdTypeError for %s", async (type) => {
    // Arrange
    const krd = buildHealthKrd(type);

    // Act
    const promise = writer(krd);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(UnsupportedKrdTypeError);
    await expect(promise).rejects.toMatchObject({
      krdType: type,
      adapterName: "garmin",
    });
  });
});
