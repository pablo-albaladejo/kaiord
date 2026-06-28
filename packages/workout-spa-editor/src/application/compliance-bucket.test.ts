import { describe, expect, it } from "vitest";

import { complianceBucket } from "./compliance-bucket";
// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const JUST_BELOW_AMBER_MID_BOUNDARY = 0.499 as const;
// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const AMBER_MID_BOUNDARY = 0.5 as const;
// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const JUST_BELOW_MID_EMERALD_BOUNDARY = 0.799 as const;
// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const MID_EMERALD_BOUNDARY = 0.8 as const;
// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const NEGATIVE_OUT_OF_RANGE = -0.5 as const;
// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const ABOVE_ONE_OUT_OF_RANGE = 1.5 as const;

describe("complianceBucket", () => {
  it.each([
    { score: null, label: "null", expected: "neutral" },
    { score: 0, label: "0", expected: "amber" },
    {
      score: JUST_BELOW_AMBER_MID_BOUNDARY,
      label: "just below 0.5",
      expected: "amber",
    },
    { score: AMBER_MID_BOUNDARY, label: "boundary 0.5", expected: "mid" },
    {
      score: JUST_BELOW_MID_EMERALD_BOUNDARY,
      label: "just below 0.8",
      expected: "mid",
    },
    { score: MID_EMERALD_BOUNDARY, label: "boundary 0.8", expected: "emerald" },
    { score: 1.0, label: "1.0", expected: "emerald" },
    {
      score: NEGATIVE_OUT_OF_RANGE,
      label: "out-of-range below 0",
      expected: "amber",
    },
    {
      score: ABOVE_ONE_OUT_OF_RANGE,
      label: "out-of-range above 1",
      expected: "emerald",
    },
    { score: Number.NaN, label: "NaN", expected: "neutral" },
  ])("should map $label to $expected", ({ score, expected }) => {
    // Arrange

    // Act
    const bucket = complianceBucket(score);

    // Assert
    expect(bucket).toBe(expected);
  });
});
