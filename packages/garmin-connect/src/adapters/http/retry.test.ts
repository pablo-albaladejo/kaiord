import type { Logger } from "@kaiord/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { withRetry } from "./retry";

const mockResponse = (status: number): Response =>
  ({ status, ok: status >= 200 && status < 300 }) as Response;

const createLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("retryable status codes", () => {
    it.each([429, 500, 503])("should retry on HTTP %i", async (status) => {
      // Arrange
      const fetchFn = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValueOnce(mockResponse(status))
        .mockResolvedValueOnce(mockResponse(200));
      const retryFetch = withRetry(fetchFn, {
        randomFn: () => 0.5,
        baseDelay: 100,
      });
      const promise = retryFetch("https://example.com");
      await vi.advanceTimersByTimeAsync(200);

      // Act
      const response = await promise;

      // Assert
      expect(response.status).toBe(200);
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("non-retryable status codes", () => {
    it.each([400, 401, 403, 404])(
      "should not retry on HTTP %i",
      async (status) => {
        // Arrange
        const fetchFn = vi
          .fn<typeof globalThis.fetch>()
          .mockResolvedValue(mockResponse(status));
        const retryFetch = withRetry(fetchFn, { randomFn: () => 0.5 });

        // Act
        const response = await retryFetch("https://example.com");

        // Assert
        expect(response.status).toBe(status);
        expect(fetchFn).toHaveBeenCalledTimes(1);
      }
    );
  });

  it("should retry on TypeError (network error)", async () => {
    // Arrange
    const fetchFn = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(mockResponse(200));
    const retryFetch = withRetry(fetchFn, {
      randomFn: () => 0.5,
      baseDelay: 100,
    });
    const promise = retryFetch("https://example.com");
    await vi.advanceTimersByTimeAsync(200);

    // Act
    const response = await promise;

    // Assert
    expect(response.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("should not retry on non-TypeError exceptions", async () => {
    // Arrange
    const fetchFn = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValueOnce(new Error("Some other error"));

    // Act
    const retryFetch = withRetry(fetchFn, { randomFn: () => 0.5 });

    // Assert
    await expect(retryFetch("https://example.com")).rejects.toThrow(
      "Some other error"
    );
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("should respect maxRetries limit", async () => {
    // Arrange
    const fetchFn = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(mockResponse(500));
    const retryFetch = withRetry(fetchFn, {
      maxRetries: 3,
      randomFn: () => 0.5,
      baseDelay: 100,
    });
    const promise = retryFetch("https://example.com");
    await vi.advanceTimersByTimeAsync(50000);

    // Act
    const response = await promise;

    // Assert
    expect(response.status).toBe(500);
    expect(fetchFn).toHaveBeenCalledTimes(4);
  });

  it("should calculate delay with full jitter formula", async () => {
    // Arrange
    const fetchFn = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(mockResponse(500))
      .mockResolvedValueOnce(mockResponse(500))
      .mockResolvedValueOnce(mockResponse(200));
    const delays: number[] = [];
    const originalSetTimeout = globalThis.setTimeout;
    vi.spyOn(globalThis, "setTimeout").mockImplementation(((
      fn: () => void,
      ms?: number
    ) => {
      if (ms !== undefined && ms > 0) delays.push(ms);
      return originalSetTimeout(fn, ms);
    }) as typeof setTimeout);
    const retryFetch = withRetry(fetchFn, {
      randomFn: () => 0.5,
      baseDelay: 1000,
      maxDelay: 10000,
    });
    const promise = retryFetch("https://example.com");
    await vi.advanceTimersByTimeAsync(50000);
    await promise;
    expect(delays[0]).toBe(500);
    expect(delays[1]).toBe(1000);

    // Act
    vi.mocked(globalThis.setTimeout).mockRestore();

    // Assert
  });

  it("should log debug on each retry with attempt info", async () => {
    // Arrange
    const logger = createLogger();
    const fetchFn = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(mockResponse(503))
      .mockResolvedValueOnce(mockResponse(200));
    const retryFetch = withRetry(fetchFn, {
      randomFn: () => 0.5,
      baseDelay: 100,
      logger,
    });
    const promise = retryFetch("https://example.com");
    await vi.advanceTimersByTimeAsync(200);

    // Act
    await promise;

    // Assert
    expect(logger.debug).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith("Retrying request", {
      attempt: 1,
      delay: 50,
      status: 503,
    });
  });

  it("should log debug with error message on network error retry", async () => {
    // Arrange
    const logger = createLogger();
    const fetchFn = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(mockResponse(200));
    const retryFetch = withRetry(fetchFn, {
      randomFn: () => 0.5,
      baseDelay: 100,
      logger,
    });
    const promise = retryFetch("https://example.com");
    await vi.advanceTimersByTimeAsync(200);

    // Act
    await promise;

    // Assert
    expect(logger.debug).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith(
      "Retrying request after network error",
      {
        attempt: 1,
        delay: 50,
        error: "Failed to fetch",
      }
    );
  });

  it("should return successful response after transient failure", async () => {
    // Arrange
    const fetchFn = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(mockResponse(500))
      .mockResolvedValueOnce(mockResponse(429))
      .mockResolvedValueOnce(mockResponse(200));
    const retryFetch = withRetry(fetchFn, {
      randomFn: () => 0.5,
      baseDelay: 100,
    });
    const promise = retryFetch("https://example.com");
    await vi.advanceTimersByTimeAsync(50000);

    // Act
    const response = await promise;

    // Assert
    expect(response.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it("should use default options when none provided", async () => {
    // Arrange
    const fetchFn = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(mockResponse(200));
    const retryFetch = withRetry(fetchFn);

    // Act
    const response = await retryFetch("https://example.com");

    // Assert
    expect(response.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
