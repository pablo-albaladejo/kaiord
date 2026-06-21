import { describe, expect, it, vi } from "vitest";

import { validateIntervalsIcuKey } from "./intervals-icu-validate";

const okResponse = { ok: true } as Response;
const unauthorizedResponse = { ok: false } as Response;

describe("validateIntervalsIcuKey", () => {
  it("should send Basic auth with the API_KEY username and report success", async () => {
    // Arrange
    const fetchFn = vi.fn().mockResolvedValue(okResponse);

    // Act
    const valid = await validateIntervalsIcuKey("the-key", fetchFn);

    // Assert
    expect(valid).toBe(true);
    const [, init] = fetchFn.mock.calls[0];
    expect(init.headers.Authorization).toBe(`Basic ${btoa("API_KEY:the-key")}`);
  });

  it("should report failure when the provider rejects the key", async () => {
    // Arrange
    const fetchFn = vi.fn().mockResolvedValue(unauthorizedResponse);

    // Act
    const valid = await validateIntervalsIcuKey("bad", fetchFn);

    // Assert
    expect(valid).toBe(false);
  });
});
