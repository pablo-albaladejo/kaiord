import { describe, expect, it } from "vitest";

import { getProviderRate } from "./provider-rates";

const ANTHROPIC_RATE_USD_PER_M = 3.0;
const OPENAI_RATE_USD_PER_M = 1.5;
const GOOGLE_RATE_USD_PER_M = 0.3;

describe("getProviderRate", () => {
  it.each([
    { type: "anthropic", rate: ANTHROPIC_RATE_USD_PER_M },
    { type: "openai", rate: OPENAI_RATE_USD_PER_M },
    { type: "google", rate: GOOGLE_RATE_USD_PER_M },
  ] as const)("should return the $type blended rate", ({ type, rate }) => {
    // Arrange

    // Act
    const result = getProviderRate(type);

    // Assert
    expect(result).toBe(rate);
  });
});
