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
  it.each([
    ["WEIGHT_SCALE", FIT_MESSAGE_NUMBERS.WEIGHT_SCALE, 30],
    ["BODY_COMPOSITION", FIT_MESSAGE_NUMBERS.BODY_COMPOSITION, 41],
    ["MONITORING", FIT_MESSAGE_NUMBERS.MONITORING, 55],
    ["MONITORING_INFO", FIT_MESSAGE_NUMBERS.MONITORING_INFO, 103],
    ["STRESS_LEVEL", FIT_MESSAGE_NUMBERS.STRESS_LEVEL, 227],
    ["SLEEP_LEVEL", FIT_MESSAGE_NUMBERS.SLEEP_LEVEL, 275],
    ["HRV_STATUS_SUMMARY", FIT_MESSAGE_NUMBERS.HRV_STATUS_SUMMARY, 370],
    ["HRV_VALUE", FIT_MESSAGE_NUMBERS.HRV_VALUE, 371],
  ] as const)(
    "should map %s to its FIT SDK mesgNum",
    (_name, value, expected) => {
      // Arrange

      // Act
      const actual = value;

      // Assert
      expect(actual).toBe(expected);
    }
  );
});
