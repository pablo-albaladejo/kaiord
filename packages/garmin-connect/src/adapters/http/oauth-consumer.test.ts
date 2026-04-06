import { describe, it, expect, vi } from "vitest";
import type { Logger } from "@kaiord/core";
import { fetchOAuthConsumer } from "./oauth-consumer";

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe("fetchOAuthConsumer", () => {
  it("should return consumer key and secret on success", async () => {
    const mockFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        consumer_key: "my-key",
        consumer_secret: "my-secret",
      }),
    })) as unknown as typeof globalThis.fetch;

    const result = await fetchOAuthConsumer(mockFetch, mockLogger);

    expect(result).toStrictEqual({ key: "my-key", secret: "my-secret" });
  });

  it("should throw when fetch response is not ok", async () => {
    const mockFetch = vi.fn(async () => ({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    })) as unknown as typeof globalThis.fetch;

    await expect(fetchOAuthConsumer(mockFetch, mockLogger)).rejects.toThrow(
      "Failed to fetch OAuth consumer"
    );
  });
});
