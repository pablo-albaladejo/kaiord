import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGarminHttpClient } from "./garmin-http-client";
import type { Logger } from "@kaiord/core";

vi.mock("./garmin-sso", () => ({
  exchangeOAuth2: vi.fn(async () => ({
    access_token: "refreshed-bearer",
    refresh_token: "refreshed-rt",
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token_expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  })),
}));

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const validOAuth1 = { oauth_token: "t", oauth_token_secret: "s" };

const createValidToken = (expiresIn = 3600) => ({
  access_token: "my-bearer",
  refresh_token: "r",
  token_type: "Bearer",
  expires_in: expiresIn,
  refresh_token_expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + expiresIn,
});

const createExpiredToken = () => ({
  access_token: "expired-bearer",
  refresh_token: "r",
  token_type: "Bearer",
  expires_in: 3600,
  refresh_token_expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) - 100,
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

  it("should throw when not authenticated", async () => {
    const mockFetch = vi.fn();
    const client = createGarminHttpClient(mockLogger, mockFetch);

    await expect(client.get("https://api.test/data")).rejects.toThrow(
      "Not authenticated"
    );
  });

  it("should inject Bearer token in requests", async () => {
    const mockFetch = createOkFetch();
    const client = createGarminHttpClient(mockLogger, mockFetch);
    client.setTokens(validOAuth1, createValidToken());

    const result = await client.get<{ data: string }>("https://api.test/data");

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
    const mockFetch = createOkFetch({ id: 1 });
    const client = createGarminHttpClient(mockLogger, mockFetch);
    client.setTokens(validOAuth1, createValidToken());

    await client.post("https://api.test/create", { name: "test" });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test/create",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "test" }),
      })
    );
  });

  it("should use X-Http-Method-Override for delete", async () => {
    const mockFetch = createOkFetch({});
    const client = createGarminHttpClient(mockLogger, mockFetch);
    client.setTokens(validOAuth1, createValidToken());

    await client.del("https://api.test/item/1");

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

  it("should throw on non-ok responses", async () => {
    const mockFetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    })) as unknown as typeof globalThis.fetch;

    const client = createGarminHttpClient(mockLogger, mockFetch);
    client.setTokens(validOAuth1, createValidToken());

    await expect(client.get("https://api.test/data")).rejects.toThrow(
      "API request failed"
    );
  });

  it("should proactively refresh when token is expired", async () => {
    const consumerResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        consumer_key: "ck",
        consumer_secret: "cs",
      }),
    };
    const dataResponse = {
      ok: true,
      status: 200,
      json: async () => ({ data: "refreshed" }),
    };

    let callCount = 0;
    const mockFetch = vi.fn(async () => {
      callCount++;
      if (callCount === 1) return consumerResponse;
      return dataResponse;
    }) as unknown as typeof globalThis.fetch;

    const client = createGarminHttpClient(mockLogger, mockFetch);
    client.setTokens(validOAuth1, createExpiredToken());

    const result = await client.get<{ data: string }>("https://api.test/data");

    expect(result).toEqual({ data: "refreshed" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("should retry on 401 with refreshed token", async () => {
    const consumerResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        consumer_key: "ck",
        consumer_secret: "cs",
      }),
    };
    const unauthorizedResponse = {
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    };
    const okResponse = {
      ok: true,
      status: 200,
      json: async () => ({ data: "after-refresh" }),
    };

    let callCount = 0;
    const mockFetch = vi.fn(async () => {
      callCount++;
      if (callCount === 1) return unauthorizedResponse;
      if (callCount === 2) return consumerResponse;
      return okResponse;
    }) as unknown as typeof globalThis.fetch;

    const client = createGarminHttpClient(mockLogger, mockFetch);
    client.setTokens(validOAuth1, createValidToken());

    const result = await client.get<{ data: string }>("https://api.test/data");

    expect(result).toEqual({ data: "after-refresh" });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("should coalesce concurrent requests into single refresh", async () => {
    const { exchangeOAuth2 } = await import("./garmin-sso");
    const mockedExchange = vi.mocked(exchangeOAuth2);
    mockedExchange.mockClear();

    const consumerResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        consumer_key: "ck",
        consumer_secret: "cs",
      }),
    };
    const dataResponse = {
      ok: true,
      status: 200,
      json: async () => ({ value: "ok" }),
    };

    let callCount = 0;
    const mockFetch = vi.fn(async () => {
      callCount++;
      if (callCount === 1) return consumerResponse;
      return dataResponse;
    }) as unknown as typeof globalThis.fetch;

    const client = createGarminHttpClient(mockLogger, mockFetch);
    client.setTokens(validOAuth1, createExpiredToken());

    const [r1, r2, r3] = await Promise.all([
      client.get<{ value: string }>("https://api.test/a"),
      client.get<{ value: string }>("https://api.test/b"),
      client.get<{ value: string }>("https://api.test/c"),
    ]);

    expect(r1).toEqual({ value: "ok" });
    expect(r2).toEqual({ value: "ok" });
    expect(r3).toEqual({ value: "ok" });
    expect(mockedExchange).toHaveBeenCalledTimes(1);
  });

  it("should reject waiting subscribers when refresh fails", async () => {
    const { exchangeOAuth2 } = await import("./garmin-sso");
    const mockedExchange = vi.mocked(exchangeOAuth2);
    mockedExchange.mockRejectedValueOnce(new Error("refresh failed"));

    const consumerResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        consumer_key: "ck",
        consumer_secret: "cs",
      }),
    };

    const mockFetch = vi.fn(
      async () => consumerResponse
    ) as unknown as typeof globalThis.fetch;

    const client = createGarminHttpClient(mockLogger, mockFetch);
    client.setTokens(validOAuth1, createExpiredToken());

    const results = await Promise.allSettled([
      client.get("https://api.test/a"),
      client.get("https://api.test/b"),
      client.get("https://api.test/c"),
    ]);

    for (const result of results) {
      expect(result.status).toBe("rejected");
    }
  });
});
