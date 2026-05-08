import { afterEach, describe, expect, it, vi } from "vitest";

import { defaultIdProvider } from "./id-provider";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UNIQUENESS_SAMPLE_SIZE = 10_000;

describe("defaultIdProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return a UUID v4 string", () => {
    // Arrange

    // Act
    const id = defaultIdProvider();

    // Assert
    expect(id).toMatch(UUID_V4_REGEX);
  });

  it("should be unique over 10k calls", () => {
    // Arrange
    const ids = new Set<string>();

    // Act
    for (let i = 0; i < UNIQUENESS_SAMPLE_SIZE; i++) {
      ids.add(defaultIdProvider());
    }

    // Assert
    expect(ids.size).toBe(UNIQUENESS_SAMPLE_SIZE);
  });

  it("should fall back to crypto.getRandomValues when randomUUID is undefined", () => {
    // Arrange
    const realGetRandomValues = crypto.getRandomValues.bind(crypto);
    vi.stubGlobal("crypto", {
      getRandomValues: (buf: Uint8Array) => realGetRandomValues(buf),
    });

    // Act
    const id = defaultIdProvider();

    // Assert
    expect(id).toMatch(UUID_V4_REGEX);
  });

  it("should throw when no secure random source is available", () => {
    // Arrange

    // Act
    vi.stubGlobal("crypto", {});

    // Assert
    expect(() => defaultIdProvider()).toThrow(/No secure random source/);
  });
});
