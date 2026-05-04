import { describe, expect, it } from "vitest";

import { getProviderRate } from "./provider-rates";

describe("getProviderRate", () => {
  it("should return the anthropic blended rate", () => {
    // Arrange

    // Act

    // Assert
    expect(getProviderRate("anthropic")).toBe(3.0);
  });

  it("should return the openai blended rate", () => {
    // Arrange

    // Act

    // Assert
    expect(getProviderRate("openai")).toBe(1.5);
  });

  it("should return the google blended rate", () => {
    // Arrange

    // Act

    // Assert
    expect(getProviderRate("google")).toBe(0.3);
  });
});
