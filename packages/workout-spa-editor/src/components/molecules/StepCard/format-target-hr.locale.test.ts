import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { getTranslate } from "../../../i18n/use-translate";
import type { WorkoutStep } from "../../../types/krd";
import { formatTarget } from "./format-target";

const step = (value: Record<string, unknown>) =>
  ({
    stepIndex: 0,
    durationType: "open",
    duration: { type: "open" },
    targetType: "heart_rate",
    target: { type: "heart_rate", value },
  }) as unknown as WorkoutStep;

describe("heart-rate step target in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it.each([
    ["a single value", { unit: "bpm", value: 150 }, "150 ppm"],
    ["a range", { unit: "range", min: 140, max: 160 }, "140-160 ppm"],
  ])("should show ppm for %s", (_label, value, expected) => {
    // Arrange
    const t = getTranslate("editor", "es");
    const hrUnit = getTranslate("common", "es")("units.hr");

    // Act
    const text = formatTarget(step(value), "metric", t, undefined, hrUnit);

    // Assert
    expect(text).toBe(expected);
  });
});
