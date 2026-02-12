import { describe, it, expect, vi } from "vitest";
import { garminSso } from "./garmin-sso";
import type { Logger } from "@kaiord/core";

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const CONSUMER_JSON = JSON.stringify({
  consumer_key: "test-key",
  consumer_secret: "test-secret",
});

const CSRF_HTML = '<input name="_csrf" value="csrf-token-123" />';
const TICKET_HTML = 'ticket=ST-12345-abc"';
const OAUTH1_RESPONSE = "oauth_token=tok1&oauth_token_secret=sec1";
const OAUTH2_RESPONSE = JSON.stringify({
  access_token: "bearer-token",
  refresh_token: "refresh-token",
  token_type: "Bearer",
  expires_in: 3600,
  refresh_token_expires_in: 86400,
});

const createMockFetch = (responses: Array<{ text?: string; json?: unknown }>) => {
  let callIndex = 0;
  return vi.fn(async () => {
    const resp = responses[callIndex++] ?? { text: "" };
    return {
      ok: true,
      status: 200,
      text: async () => resp.text ?? JSON.stringify(resp.json ?? {}),
      json: async () => resp.json ?? JSON.parse(resp.text ?? "{}"),
    } as unknown as Response;
  });
};

describe("garminSso", () => {
  it("should complete the 5-step SSO flow and return tokens", async () => {
    const mockFetch = createMockFetch([
      { json: { consumer_key: "ck", consumer_secret: "cs" } },
      { text: "" },
      { text: CSRF_HTML },
      { text: TICKET_HTML },
      { text: OAUTH1_RESPONSE },
      { json: JSON.parse(OAUTH2_RESPONSE) },
    ]);

    const result = await garminSso("user", "pass", mockLogger, mockFetch);

    expect(result.oauth1.oauth_token).toBe("tok1");
    expect(result.oauth1.oauth_token_secret).toBe("sec1");
    expect(result.oauth2.access_token).toBe("bearer-token");
    expect(result.oauth2.expires_at).toBeGreaterThan(0);
  });

  it("should throw when CSRF token is not found", async () => {
    const mockFetch = createMockFetch([
      { json: { consumer_key: "ck", consumer_secret: "cs" } },
      { text: "" },
      { text: "<html>no csrf here</html>" },
    ]);

    await expect(
      garminSso("user", "pass", mockLogger, mockFetch)
    ).rejects.toThrow("CSRF token not found");
  });

  it("should throw when ticket is not found", async () => {
    const mockFetch = createMockFetch([
      { json: { consumer_key: "ck", consumer_secret: "cs" } },
      { text: "" },
      { text: CSRF_HTML },
      { text: "<html>no ticket here</html>" },
    ]);

    await expect(
      garminSso("user", "pass", mockLogger, mockFetch)
    ).rejects.toThrow("Login failed: ticket not found");
  });

  it("should throw on account locked", async () => {
    const lockedHtml = 'var status="ACCOUNT_LOCKED"';
    const mockFetch = createMockFetch([
      { json: { consumer_key: "ck", consumer_secret: "cs" } },
      { text: "" },
      { text: CSRF_HTML },
      { text: lockedHtml },
    ]);

    await expect(
      garminSso("user", "pass", mockLogger, mockFetch)
    ).rejects.toThrow("Account locked");
  });
});
