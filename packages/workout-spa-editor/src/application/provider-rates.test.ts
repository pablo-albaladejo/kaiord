import { describe, expect, it } from "vitest";

import { getProviderRate } from "./provider-rates";

const ANTHROPIC_RATE_USD_PER_M = 3.0;
const OPENAI_RATE_USD_PER_M = 1.5;
const GOOGLE_RATE_USD_PER_M = 0.3;

describe("getProviderRate", () => {
  it("should return the anthropic blended rate", () => {
    // Arrange

    // Act

    // Assert
    expect(getProviderRate("anthropic")).toBe(ANTHROPIC_RATE_USD_PER_M);
  });

  it("should return the openai blended rate", () => {
    // Arrange

    // Act

    // Assert
    expect(getProviderRate("openai")).toBe(OPENAI_RATE_USD_PER_M);
  });

  it("should return the google blended rate", () => {
    // Arrange

    // Act

    // Assert
    expect(getProviderRate("google")).toBe(GOOGLE_RATE_USD_PER_M);
  });
});
