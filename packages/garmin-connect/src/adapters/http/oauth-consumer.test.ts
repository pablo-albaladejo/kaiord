import type { Logger } from "@kaiord/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchOAuthConsumer } from "./oauth-consumer";

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe("fetchOAuthConsumer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return consumer key and secret on success", async () => {
    // Arrange
    const mockFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        consumer_key: "my-key",
        consumer_secret: "my-secret",
      }),
    })) as unknown as typeof globalThis.fetch;

    // Act
    const result = await fetchOAuthConsumer(mockFetch, mockLogger);

    // Assert
    expect(result).toStrictEqual({ key: "my-key", secret: "my-secret" });
  });

  it("should throw when fetch response is not ok", async () => {
    // Arrange

    // Act
    const mockFetch = vi.fn(async () => ({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    })) as unknown as typeof globalThis.fetch;

    // Assert
    await expect(fetchOAuthConsumer(mockFetch, mockLogger)).rejects.toThrow(
      "Failed to fetch OAuth consumer"
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      "[SSO] OAuth consumer fetch failed",
      { status: 503 }
    );
  });
});
