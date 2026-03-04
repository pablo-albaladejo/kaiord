import { describe, it, expect, vi } from "vitest";
import { createTokenRefreshManager } from "./token-refresh";
import type { Logger } from "@kaiord/core";

vi.mock("./garmin-sso", () => ({
  exchangeOAuth2: vi.fn(async () => ({
    access_token: "refreshed",
    refresh_token: "rt",
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token_expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  })),
}));

vi.mock("./oauth-consumer", () => ({
  fetchOAuthConsumer: vi.fn(async () => ({
    key: "ck",
    secret: "cs",
  })),
}));

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe("createTokenRefreshManager", () => {
  it("should throw when no tokens are available for refresh", async () => {
    const mockFetch = vi.fn() as unknown as typeof globalThis.fetch;
    const manager = createTokenRefreshManager(mockFetch, mockLogger);

    await expect(manager.ensureFreshToken()).rejects.toThrow(
      "No tokens available for refresh"
    );
  });

  it("should refresh token when tokens are available", async () => {
    const mockFetch = vi.fn() as unknown as typeof globalThis.fetch;
    const manager = createTokenRefreshManager(mockFetch, mockLogger);

    manager.state.oauth1Token = {
      oauth_token: "t",
      oauth_token_secret: "s",
    };
    manager.state.oauth2Token = {
      access_token: "old",
      refresh_token: "rt",
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token_expires_in: 86400,
      expires_at: Math.floor(Date.now() / 1000) - 100,
    };

    await manager.ensureFreshToken();

    expect(manager.state.oauth2Token?.access_token).toBe("refreshed");
  });
});
