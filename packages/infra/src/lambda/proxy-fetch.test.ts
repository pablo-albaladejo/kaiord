import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockedFunction } from "vitest";

class MockSocks5ProxyAgent {
  uri: string;
  constructor(uri: string) {
    this.uri = uri;
  }
}

vi.mock("undici", () => ({
  Socks5ProxyAgent: MockSocks5ProxyAgent,
}));

let mockFetch: MockedFunction<typeof fetch>;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  mockFetch = vi.fn<typeof fetch>();
  globalThis.fetch = mockFetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe("proxyFetch", () => {
  it("should pass dispatcher with SOCKS5 proxy agent to fetch", async () => {
    mockFetch.mockResolvedValueOnce(new Response("ok"));
    const { proxyFetch } = await import("./proxy-fetch");

    await proxyFetch("https://example.com", { method: "GET" });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        method: "GET",
        dispatcher: expect.any(MockSocks5ProxyAgent),
      })
    );
  });
});

describe("checkTunnelHealth", () => {
  it("should return true on successful response", async () => {
    mockFetch.mockResolvedValueOnce(new Response("", { status: 200 }));
    const { checkTunnelHealth } = await import("./proxy-fetch");

    const result = await checkTunnelHealth(1);

    expect(result).toBe(true);
  });

  it("should return true on 4xx response", async () => {
    mockFetch.mockResolvedValueOnce(new Response("", { status: 403 }));
    const { checkTunnelHealth } = await import("./proxy-fetch");

    const result = await checkTunnelHealth(1);

    expect(result).toBe(true);
  });

  it("should return false on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const { checkTunnelHealth } = await import("./proxy-fetch");

    const result = await checkTunnelHealth(1);

    expect(result).toBe(false);
  });

  it("should retry and succeed on second attempt", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockResolvedValueOnce(new Response("", { status: 200 }));
    const { checkTunnelHealth } = await import("./proxy-fetch");

    const result = await checkTunnelHealth(2, 10);

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
