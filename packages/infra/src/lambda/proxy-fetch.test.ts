import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockedFunction } from "vitest";

const mockSetGlobalDispatcher = vi.fn();
const mockSocksDispatcher = vi.fn().mockReturnValue({ mock: true });

vi.mock("undici", () => ({
  setGlobalDispatcher: mockSetGlobalDispatcher,
}));

vi.mock("fetch-socks", () => ({
  socksDispatcher: mockSocksDispatcher,
}));

let mockFetch: MockedFunction<typeof fetch>;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mockFetch = vi.fn<typeof fetch>();
  globalThis.fetch = mockFetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe("enableSocksProxy", () => {
  it("should set global dispatcher with SOCKS5 config", async () => {
    const { enableSocksProxy } = await import("./proxy-fetch");

    enableSocksProxy();

    expect(mockSocksDispatcher).toHaveBeenCalledWith({
      type: 5,
      host: "localhost",
      port: 1055,
    });
    expect(mockSetGlobalDispatcher).toHaveBeenCalledWith({ mock: true });
  });

  it("should only configure once", async () => {
    const { enableSocksProxy } = await import("./proxy-fetch");

    enableSocksProxy();
    enableSocksProxy();

    expect(mockSetGlobalDispatcher).toHaveBeenCalledTimes(1);
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
