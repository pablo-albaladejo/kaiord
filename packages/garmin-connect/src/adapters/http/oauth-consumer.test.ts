import { describe, it, expect, vi } from "vitest";
import { fetchOAuthConsumer } from "./oauth-consumer";

describe("fetchOAuthConsumer", () => {
  it("should return consumer key and secret on success", async () => {
    const mockFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        consumer_key: "my-key",
        consumer_secret: "my-secret",
      }),
    })) as unknown as typeof globalThis.fetch;

    const result = await fetchOAuthConsumer(mockFetch);

    expect(result).toStrictEqual({ key: "my-key", secret: "my-secret" });
  });

  it("should throw when fetch response is not ok", async () => {
    const mockFetch = vi.fn(async () => ({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    })) as unknown as typeof globalThis.fetch;

    await expect(fetchOAuthConsumer(mockFetch)).rejects.toThrow(
      "Failed to fetch OAuth consumer"
    );
  });
});
