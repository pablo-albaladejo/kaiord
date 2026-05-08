import { beforeEach, describe, expect, it, vi } from "vitest";

import { HTTP_STATUS_FORBIDDEN } from "../../test-utils/constants";
import type { TokenReader } from "../token/token-manager.types";
import { authFetch } from "./garmin-auth-fetch";

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
    // Arrange
    mockFetch.mockResolvedValue(okResponse());
    const reader = createMockReader();

    // Act
    await authFetch("https://api/data", undefined, reader, mockFetch);

    // Assert
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
    // Arrange
    let callCount = 0;
    const reader = createMockReader({
      isAuthenticated: vi.fn(() => {
        callCount++;
        return callCount > 1;
      }),
    });
    mockFetch.mockResolvedValue(okResponse());

    // Act
    await authFetch("https://api/data", undefined, reader, mockFetch);

    // Assert
    expect(reader.refresh).toHaveBeenCalledTimes(1);
  });

  it("should refresh and retry on 401 with same generation", async () => {
    // Arrange
    const reader = createMockReader({
      getGeneration: vi.fn(() => 1),
      getAccessToken: vi.fn(() => "refreshed-token"),
    });
    mockFetch
      .mockResolvedValueOnce(unauthorizedResponse())
      .mockResolvedValueOnce(okResponse({ ok: true }));

    // Act
    const res = await authFetch(
      "https://api/data",
      undefined,
      reader,
      mockFetch
    );

    // Assert
    expect(reader.refresh).toHaveBeenCalledTimes(1);
    expect(res.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("should skip refresh on 401 when generation changed", async () => {
    // Arrange
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

    // Act
    const res = await authFetch(
      "https://api/data",
      undefined,
      reader,
      mockFetch
    );

    // Assert
    expect(reader.refresh).not.toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });

  it("should throw on non-401 error responses", async () => {
    // Arrange
    mockFetch.mockResolvedValue(errorResponse(500, "Internal Server Error"));

    // Act
    const reader = createMockReader();

    // Assert
    await expect(
      authFetch("https://api/data", undefined, reader, mockFetch)
    ).rejects.toThrow("API request failed");
  });

  it("should throw when not authenticated and no token", async () => {
    // Arrange

    // Act
    const reader = createMockReader({
      isAuthenticated: vi.fn(() => false),
      getAccessToken: vi.fn(() => undefined),
      refresh: vi.fn(async () => {}),
    });

    // Assert
    await expect(
      authFetch("https://api/data", undefined, reader, mockFetch)
    ).rejects.toThrow("Not authenticated");
  });

  it("should throw after retry fails", async () => {
    // Arrange
    const reader = createMockReader();

    // Act
    mockFetch
      .mockResolvedValueOnce(unauthorizedResponse())
      .mockResolvedValueOnce(errorResponse(HTTP_STATUS_FORBIDDEN, "Forbidden"));

    // Assert
    await expect(
      authFetch("https://api/data", undefined, reader, mockFetch)
    ).rejects.toThrow("API request failed after token refresh");
  });
});
