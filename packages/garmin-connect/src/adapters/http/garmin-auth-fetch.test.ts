import { describe, it, expect, vi, beforeEach } from "vitest";
import { authFetch } from "./garmin-auth-fetch";
import type { TokenReader } from "../token/token-manager.types";

const createMockReader = (overrides?: Partial<TokenReader>): TokenReader => ({
  getAccessToken: vi.fn(() => "token-v1"),
  getGeneration: vi.fn(() => 1),
  refresh: vi.fn(async () => {}),
  isAuthenticated: vi.fn(() => true),
  ...overrides,
});

const okResponse = (data = {}) =>
  ({ ok: true, status: 200, json: async () => data }) as Response;

const unauthorizedResponse = () =>
  ({
    ok: false,
    status: 401,
    statusText: "Unauthorized",
  }) as Response;

const errorResponse = (status: number, text: string) =>
  ({ ok: false, status, statusText: text }) as Response;

describe("authFetch", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  it("should send request with Bearer token", async () => {
    mockFetch.mockResolvedValue(okResponse());
    const reader = createMockReader();

    await authFetch("https://api/data", undefined, reader, mockFetch);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api/data",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-v1",
        }),
      })
    );
  });

  it("should refresh before request when not authenticated", async () => {
    let callCount = 0;
    const reader = createMockReader({
      isAuthenticated: vi.fn(() => {
        callCount++;
        return callCount > 1;
      }),
    });
    mockFetch.mockResolvedValue(okResponse());

    await authFetch("https://api/data", undefined, reader, mockFetch);

    expect(reader.refresh).toHaveBeenCalledTimes(1);
  });

  it("should refresh and retry on 401 with same generation", async () => {
    const reader = createMockReader({
      getGeneration: vi.fn(() => 1),
      getAccessToken: vi.fn(() => "refreshed-token"),
    });
    mockFetch
      .mockResolvedValueOnce(unauthorizedResponse())
      .mockResolvedValueOnce(okResponse({ ok: true }));

    const res = await authFetch(
      "https://api/data",
      undefined,
      reader,
      mockFetch
    );

    expect(reader.refresh).toHaveBeenCalledTimes(1);
    expect(res.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("should skip refresh on 401 when generation changed", async () => {
    let gen = 1;
    const reader = createMockReader({
      getGeneration: vi.fn(() => gen),
      getAccessToken: vi.fn(() => "new-token"),
    });
    mockFetch.mockImplementation(async () => {
      if (mockFetch.mock.calls.length === 1) {
        gen = 2; // simulate another caller refreshed
        return unauthorizedResponse();
      }
      return okResponse();
    });

    const res = await authFetch(
      "https://api/data",
      undefined,
      reader,
      mockFetch
    );

    expect(reader.refresh).not.toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });

  it("should throw on non-401 error responses", async () => {
    mockFetch.mockResolvedValue(errorResponse(500, "Internal Server Error"));
    const reader = createMockReader();

    await expect(
      authFetch("https://api/data", undefined, reader, mockFetch)
    ).rejects.toThrow("API request failed");
  });

  it("should throw when not authenticated and no token", async () => {
    const reader = createMockReader({
      isAuthenticated: vi.fn(() => false),
      getAccessToken: vi.fn(() => undefined),
      refresh: vi.fn(async () => {}),
    });

    await expect(
      authFetch("https://api/data", undefined, reader, mockFetch)
    ).rejects.toThrow("Not authenticated");
  });

  it("should throw after retry fails", async () => {
    const reader = createMockReader();
    mockFetch
      .mockResolvedValueOnce(unauthorizedResponse())
      .mockResolvedValueOnce(errorResponse(403, "Forbidden"));

    await expect(
      authFetch("https://api/data", undefined, reader, mockFetch)
    ).rejects.toThrow("API request failed after token refresh");
  });
});
