import { describe, it, expect, vi } from "vitest";
import { createGarminHttpClient } from "./garmin-http-client";
import type { Logger } from "@kaiord/core";

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe("createGarminHttpClient", () => {
  it("should throw when not authenticated", async () => {
    const mockFetch = vi.fn();
    const client = createGarminHttpClient(mockLogger, mockFetch);

    await expect(client.get("https://api.test/data")).rejects.toThrow(
      "Not authenticated"
    );
  });

  it("should inject Bearer token in requests", async () => {
    const mockFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ data: "test" }),
    })) as unknown as typeof globalThis.fetch;

    const client = createGarminHttpClient(mockLogger, mockFetch);
    client.setTokens(
      { oauth_token: "t", oauth_token_secret: "s" },
      {
        access_token: "my-bearer",
        refresh_token: "r",
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token_expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }
    );

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
    const mockFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ id: 1 }),
    })) as unknown as typeof globalThis.fetch;

    const client = createGarminHttpClient(mockLogger, mockFetch);
    client.setTokens(
      { oauth_token: "t", oauth_token_secret: "s" },
      {
        access_token: "bearer",
        refresh_token: "r",
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token_expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }
    );

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
    const mockFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({}),
    })) as unknown as typeof globalThis.fetch;

    const client = createGarminHttpClient(mockLogger, mockFetch);
    client.setTokens(
      { oauth_token: "t", oauth_token_secret: "s" },
      {
        access_token: "bearer",
        refresh_token: "r",
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token_expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }
    );

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
    client.setTokens(
      { oauth_token: "t", oauth_token_secret: "s" },
      {
        access_token: "bearer",
        refresh_token: "r",
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token_expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }
    );

    await expect(client.get("https://api.test/data")).rejects.toThrow(
      "API request failed"
    );
  });
});
