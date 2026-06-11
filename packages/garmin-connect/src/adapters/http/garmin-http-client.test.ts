import type { Logger } from "@kaiord/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TokenReader } from "../token/token-manager.types";
import { createGarminHttpClient } from "./garmin-http-client";

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const createMockReader = (overrides?: Partial<TokenReader>): TokenReader => ({
  getAccessToken: vi.fn(() => "my-bearer"),
  getGeneration: vi.fn(() => 1),
  refresh: vi.fn(async () => {}),
  isAuthenticated: vi.fn(() => true),
  ...overrides,
});

const createOkFetch = (data: unknown = { data: "test" }) =>
  vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
  })) as unknown as typeof globalThis.fetch;

describe("createGarminHttpClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should inject Bearer token in requests", async () => {
    // Arrange
    const mockFetch = createOkFetch();
    const reader = createMockReader();
    const client = createGarminHttpClient(reader, mockFetch, mockLogger);

    // Act
    const result = await client.get<{ data: string }>("https://api.test/data");

    // Assert
    expect(result).toEqual({ data: "test" });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test/data",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer my-bearer",
        }),
      })
    );
  });

  it("should post with JSON content type", async () => {
    // Arrange
    const mockFetch = createOkFetch({ id: 1 });
    const reader = createMockReader();
    const client = createGarminHttpClient(reader, mockFetch, mockLogger);

    // Act
    await client.post("https://api.test/create", { name: "test" });

    // Assert
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test/create",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "test" }),
      })
    );
  });

  it("should use X-Http-Method-Override for delete", async () => {
    // Arrange
    const mockFetch = createOkFetch({});
    const reader = createMockReader();
    const client = createGarminHttpClient(reader, mockFetch, mockLogger);

    // Act
    await client.del("https://api.test/item/1");

    // Assert
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test/item/1",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Http-Method-Override": "DELETE",
        }),
      })
    );
  });

  it("should post with null body sending undefined", async () => {
    // Arrange
    const mockFetch = createOkFetch({ id: 1 });
    const reader = createMockReader();
    const client = createGarminHttpClient(reader, mockFetch, mockLogger);

    // Act
    await client.post("https://api.test/create", null);

    // Assert
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test/create",
      expect.objectContaining({
        method: "POST",
        body: undefined,
      })
    );
  });
});
