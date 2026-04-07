import { describe, it, expect, vi } from "vitest";
import { getLoginTicket } from "./sso-login";
import type { Logger } from "@kaiord/core";

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe("getLoginTicket", () => {
  it("should throw when SSO login page returns non-ok status", async () => {
    let callCount = 0;
    const mockFetch = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { ok: true, text: async () => "" };
      }
      return {
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        text: async () => "",
      };
    }) as unknown as typeof globalThis.fetch;

    await expect(
      getLoginTicket("user", "pass", mockFetch, mockLogger)
    ).rejects.toThrow("SSO login page returned 503");
  });
});
