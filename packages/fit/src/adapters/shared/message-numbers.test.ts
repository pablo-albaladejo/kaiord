/* eslint-disable no-magic-numbers --
 * This file is the literal-value contract test for `FIT_MESSAGE_NUMBERS`.
 * Every assertion compares the registered constant to the FIT-SDK-canonical
 * raw number (e.g. 30, 41, 55, 103, 227, 275, 370, 371). Extracting these
 * into named constants here would just re-state the assertion through a
 * layer of indirection and add no safety — the named constants are the
 * production code under test.
 */
import { describe, expect, it } from "vitest";

import { FIT_MESSAGE_NUMBERS } from "./message-numbers";

describe("FIT_MESSAGE_NUMBERS — health message numbers", () => {
  it("should map WEIGHT_SCALE to FIT SDK mesgNum 30", () => {
    // Arrange

    // Act
    const value = FIT_MESSAGE_NUMBERS.WEIGHT_SCALE;

    // Assert
    expect(value).toBe(30);
  });

  it("should map BODY_COMPOSITION to FIT SDK mesgNum 41", () => {
    // Arrange

    // Act
    const value = FIT_MESSAGE_NUMBERS.BODY_COMPOSITION;

    // Assert
    expect(value).toBe(41);
  });

  it("should map MONITORING to FIT SDK mesgNum 55", () => {
    // Arrange

    // Act
    const value = FIT_MESSAGE_NUMBERS.MONITORING;

    // Assert
    expect(value).toBe(55);
  });

  it("should map MONITORING_INFO to FIT SDK mesgNum 103", () => {
    // Arrange

    // Act
    const value = FIT_MESSAGE_NUMBERS.MONITORING_INFO;

    // Assert
    expect(value).toBe(103);
  });

  it("should map STRESS_LEVEL to FIT SDK mesgNum 227", () => {
    // Arrange

    // Act
    const value = FIT_MESSAGE_NUMBERS.STRESS_LEVEL;

    // Assert
    expect(value).toBe(227);
  });

  it("should map SLEEP_LEVEL to FIT SDK mesgNum 275", () => {
    // Arrange

    // Act
    const value = FIT_MESSAGE_NUMBERS.SLEEP_LEVEL;

    // Assert
    expect(value).toBe(275);
  });

  it("should map HRV_STATUS_SUMMARY to FIT SDK mesgNum 370", () => {
    // Arrange

    // Act
    const value = FIT_MESSAGE_NUMBERS.HRV_STATUS_SUMMARY;

    // Assert
    expect(value).toBe(370);
  });

  it("should map HRV_VALUE to FIT SDK mesgNum 371", () => {
    // Arrange

    // Act
    const value = FIT_MESSAGE_NUMBERS.HRV_VALUE;

    // Assert
    expect(value).toBe(371);
  });
});

describe("FIT_MESSAGE_NUMBERS — invariants", () => {
  const healthEntries = [
    ["WEIGHT_SCALE", FIT_MESSAGE_NUMBERS.WEIGHT_SCALE],
    ["BODY_COMPOSITION", FIT_MESSAGE_NUMBERS.BODY_COMPOSITION],
    ["MONITORING", FIT_MESSAGE_NUMBERS.MONITORING],
    ["MONITORING_INFO", FIT_MESSAGE_NUMBERS.MONITORING_INFO],
    ["STRESS_LEVEL", FIT_MESSAGE_NUMBERS.STRESS_LEVEL],
    ["SLEEP_LEVEL", FIT_MESSAGE_NUMBERS.SLEEP_LEVEL],
    ["HRV_STATUS_SUMMARY", FIT_MESSAGE_NUMBERS.HRV_STATUS_SUMMARY],
    ["HRV_VALUE", FIT_MESSAGE_NUMBERS.HRV_VALUE],
  ] as const;

  it.each(healthEntries)(
    "should expose %s as a non-negative integer",
    (_name, value) => {
      // Arrange

      // Act
      const isNonNegativeInteger = Number.isInteger(value) && value >= 0;

      // Assert
      expect(isNonNegativeInteger).toBe(true);
    }
  );
});
