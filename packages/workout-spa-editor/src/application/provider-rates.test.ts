import { describe, it, expect } from "vitest";

import { getProviderRate } from "./provider-rates";

describe("getProviderRate", () => {
  it("returns the anthropic blended rate", () => {
    expect(getProviderRate("anthropic")).toBe(3.0);
  });

  it("returns the openai blended rate", () => {
    expect(getProviderRate("openai")).toBe(1.5);
  });

  it("returns the google blended rate", () => {
    expect(getProviderRate("google")).toBe(0.3);
  });
});
