import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Logger } from "@kaiord/core";
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
      const response = await promise;

      expect(response.status).toBe(200);
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("non-retryable status codes", () => {
    it.each([400, 401, 403, 404])(
      "should not retry on HTTP %i",
      async (status) => {
        const fetchFn = vi
          .fn<typeof globalThis.fetch>()
          .mockResolvedValue(mockResponse(status));

        const retryFetch = withRetry(fetchFn, { randomFn: () => 0.5 });

        const response = await retryFetch("https://example.com");

        expect(response.status).toBe(status);
        expect(fetchFn).toHaveBeenCalledTimes(1);
      }
    );
  });

  it("should retry on TypeError (network error)", async () => {
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
    const response = await promise;

    expect(response.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("should not retry on non-TypeError exceptions", async () => {
    const fetchFn = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValueOnce(new Error("Some other error"));

    const retryFetch = withRetry(fetchFn, { randomFn: () => 0.5 });

    await expect(retryFetch("https://example.com")).rejects.toThrow(
      "Some other error"
    );
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("should respect maxRetries limit", async () => {
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
    const response = await promise;

    expect(response.status).toBe(500);
    expect(fetchFn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });

  it("should calculate delay with full jitter formula", async () => {
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

    // attempt 0: 0.5 * min(10000, 1000 * 2^0) = 0.5 * 1000 = 500
    // attempt 1: 0.5 * min(10000, 1000 * 2^1) = 0.5 * 2000 = 1000
    expect(delays[0]).toBe(500);
    expect(delays[1]).toBe(1000);

    vi.mocked(globalThis.setTimeout).mockRestore();
  });

  it("should log debug on each retry with attempt info", async () => {
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
    await promise;

    expect(logger.debug).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith("Retrying request", {
      attempt: 1,
      delay: 50,
      status: 503,
    });
  });

  it("should log debug with error message on network error retry", async () => {
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
    await promise;

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
    const response = await promise;

    expect(response.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it("should use default options when none provided", async () => {
    const fetchFn = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(mockResponse(200));

    const retryFetch = withRetry(fetchFn);

    const response = await retryFetch("https://example.com");

    expect(response.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
