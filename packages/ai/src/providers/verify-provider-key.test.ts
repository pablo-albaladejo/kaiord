import { describe, expect, it, vi } from "vitest";

import type { LlmProviderType } from "./types";
import { verifyProviderKey } from "./verify-provider-key";

const respond = (status: number, body = "{}") =>
  vi.fn(async () => new Response(body, { status }));

const GOOGLE_BAD_KEY =
  '{"error":{"code":400,"message":"API key not valid.","status":"INVALID_ARGUMENT","details":[{"reason":"API_KEY_INVALID"}]}}';

const UNAUTHORIZED = 401;
const FORBIDDEN = 403;
const TOO_MANY_REQUESTS = 429;
const OVERLOADED = 529;

describe("verifyProviderKey", () => {
  it.each([
    {
      type: "anthropic" as const,
      url: "https://api.anthropic.com/v1/models?limit=1",
      header: ["x-api-key", "sk-test"],
    },
    {
      type: "openai" as const,
      url: "https://api.openai.com/v1/models",
      header: ["authorization", "Bearer sk-test"],
    },
    {
      type: "google" as const,
      url: "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1",
      header: ["x-goog-api-key", "sk-test"],
    },
  ])(
    "should list $type models with a GET, which spends no tokens",
    async ({ type, url, header }) => {
      // Arrange
      const fetchImpl = respond(200);

      // Act
      const result = await verifyProviderKey(
        { type, apiKey: "sk-test" },
        fetchImpl
      );

      // Assert
      expect(result).toBe("valid");
      const [calledUrl, init] = fetchImpl.mock.calls[0] as unknown as [
        string,
        RequestInit,
      ];
      expect(calledUrl).toBe(url);
      expect(init.method).toBe("GET");
      expect(new Headers(init.headers).get(header[0]!)).toBe(header[1]);
    }
  );

  it("should let the browser call Anthropic directly", async () => {
    // Arrange
    const fetchImpl = respond(200);

    // Act
    await verifyProviderKey({ type: "anthropic", apiKey: "k" }, fetchImpl);

    // Assert
    const [, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const headers = new Headers(init.headers);
    expect(headers.get("anthropic-dangerous-direct-browser-access")).toBe(
      "true"
    );
    expect(headers.get("anthropic-version")).toBe("2023-06-01");
  });

  it.each<[LlmProviderType, number, string]>([
    ["anthropic", UNAUTHORIZED, "{}"],
    ["openai", UNAUTHORIZED, "{}"],
    ["openai", FORBIDDEN, "{}"],
    ["google", 400, GOOGLE_BAD_KEY],
    ["google", FORBIDDEN, "{}"],
  ])("should call a %s key invalid on HTTP %i", async (type, status, body) => {
    // Arrange
    const fetchImpl = respond(status, body);

    // Act
    const result = await verifyProviderKey({ type, apiKey: "k" }, fetchImpl);

    // Assert
    expect(result).toBe("invalid");
  });

  it.each<[LlmProviderType, number]>([
    ["anthropic", TOO_MANY_REQUESTS],
    ["openai", 500],
    ["google", 400],
    ["anthropic", OVERLOADED],
  ])(
    "should leave a %s key unverified on HTTP %i, which says nothing about the key",
    async (type, status) => {
      // Arrange
      const fetchImpl = respond(status);

      // Act
      const result = await verifyProviderKey({ type, apiKey: "k" }, fetchImpl);

      // Assert
      expect(result).toBe("unverified");
    }
  );

  it("should leave the key unverified when the network fails", async () => {
    // Arrange
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });

    // Act
    const result = await verifyProviderKey(
      { type: "openai", apiKey: "k" },
      fetchImpl
    );

    // Assert
    expect(result).toBe("unverified");
  });
});
