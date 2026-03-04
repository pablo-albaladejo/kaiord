import { describe, it, expect, vi } from "vitest";
import { getOAuth1Token, exchangeOAuth2 } from "./sso-oauth";
import type { OAuthConsumer } from "./types";

vi.mock("./oauth-signer", () => ({
  createOAuthSigner: () => ({
    toHeader: () => ({ Authorization: "OAuth mock-header" }),
  }),
}));

const consumer: OAuthConsumer = { key: "ck", secret: "cs" };

describe("getOAuth1Token", () => {
  it("should return OAuth1 tokens on success", async () => {
    const mockFetch = vi.fn(async () => ({
      ok: true,
      text: async () => "oauth_token=tok1&oauth_token_secret=sec1",
    })) as unknown as typeof globalThis.fetch;

    const result = await getOAuth1Token("ticket-123", consumer, mockFetch);

    expect(result).toStrictEqual({
      oauth_token: "tok1",
      oauth_token_secret: "sec1",
    });
  });

  it("should throw when response is not ok", async () => {
    const mockFetch = vi.fn(async () => ({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    })) as unknown as typeof globalThis.fetch;

    await expect(
      getOAuth1Token("ticket-123", consumer, mockFetch)
    ).rejects.toThrow("OAuth1 token request failed");
  });

  it("should throw when oauth_token is missing from response", async () => {
    const mockFetch = vi.fn(async () => ({
      ok: true,
      text: async () => "some_other_param=value",
    })) as unknown as typeof globalThis.fetch;

    await expect(
      getOAuth1Token("ticket-123", consumer, mockFetch)
    ).rejects.toThrow("OAuth1 token exchange failed");
  });
});

describe("exchangeOAuth2", () => {
  const oauth1 = { oauth_token: "t1", oauth_token_secret: "s1" };

  it("should return OAuth2 token with computed expires_at", async () => {
    const mockFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        access_token: "bearer",
        refresh_token: "rt",
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token_expires_in: 86400,
      }),
    })) as unknown as typeof globalThis.fetch;

    const result = await exchangeOAuth2(oauth1, consumer, mockFetch);

    expect(result.access_token).toBe("bearer");
    expect(result.expires_at).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("should throw when response is not ok", async () => {
    const mockFetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    })) as unknown as typeof globalThis.fetch;

    await expect(exchangeOAuth2(oauth1, consumer, mockFetch)).rejects.toThrow(
      "OAuth2 exchange failed"
    );
  });
});
