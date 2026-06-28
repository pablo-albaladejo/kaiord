import type { Logger } from "@kaiord/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { withRetry } from "./retry";

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

const RETRY_TIMING_MS = {
  BASE_DELAY: 100,
  BASE_DELAY_LARGE: 1000,
  MAX_DELAY: 10000,
  JITTERED_DELAY_50: 50,
  JITTERED_DELAY_500: 500,
} as const;

const RETRY_LIMITS = {
  MAX_RETRIES: 3,
  EXPECTED_CALLS_AFTER_ONE_RETRY: 2,
  EXPECTED_CALLS_AFTER_TWO_RETRIES: 3,
  EXPECTED_CALLS_AT_MAX: 4,
  JITTER_FACTOR: 0.5,
} as const;

const mockResponse = (status: number): Response =>
  // eslint-disable-next-line no-magic-numbers -- HTTP success-range boundary, RFC 9110 well-known constant
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
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("retryable status codes", () => {
    it.each([
      HTTP_STATUS.TOO_MANY_REQUESTS,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    ])("should retry on HTTP %i", async (status) => {
      // Arrange
      const fetchFn = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValueOnce(mockResponse(status))
        .mockResolvedValueOnce(mockResponse(HTTP_STATUS.OK));
      const retryFetch = withRetry(fetchFn, {
        randomFn: () => RETRY_LIMITS.JITTER_FACTOR,
        baseDelay: RETRY_TIMING_MS.BASE_DELAY,
      });
      const promise = retryFetch("https://example.com");
      await vi.advanceTimersByTimeAsync(200);

      // Act
      const response = await promise;

      // Assert
      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(fetchFn).toHaveBeenCalledTimes(
        RETRY_LIMITS.EXPECTED_CALLS_AFTER_ONE_RETRY
      );
    });
  });

  describe("non-retryable status codes", () => {
    it.each([
      HTTP_STATUS.BAD_REQUEST,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_STATUS.FORBIDDEN,
      HTTP_STATUS.NOT_FOUND,
    ])("should not retry on HTTP %i", async (status) => {
      // Arrange
      const fetchFn = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(mockResponse(status));
      const retryFetch = withRetry(fetchFn, {
        randomFn: () => RETRY_LIMITS.JITTER_FACTOR,
      });

      // Act
      const response = await retryFetch("https://example.com");

      // Assert
      expect(response.status).toBe(status);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
  });

  it("should retry on TypeError (network error)", async () => {
    // Arrange
    const fetchFn = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(mockResponse(HTTP_STATUS.OK));
    const retryFetch = withRetry(fetchFn, {
      randomFn: () => RETRY_LIMITS.JITTER_FACTOR,
      baseDelay: RETRY_TIMING_MS.BASE_DELAY,
    });
    const promise = retryFetch("https://example.com");
    await vi.advanceTimersByTimeAsync(200);

    // Act
    const response = await promise;

    // Assert
    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(fetchFn).toHaveBeenCalledTimes(
      RETRY_LIMITS.EXPECTED_CALLS_AFTER_ONE_RETRY
    );
  });

  it("should not retry on non-TypeError exceptions", async () => {
    // Arrange
    const fetchFn = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValueOnce(new Error("Some other error"));

    // Act
    const retryFetch = withRetry(fetchFn, {
      randomFn: () => RETRY_LIMITS.JITTER_FACTOR,
    });

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
      .mockResolvedValue(mockResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR));
    const retryFetch = withRetry(fetchFn, {
      maxRetries: RETRY_LIMITS.MAX_RETRIES,
      randomFn: () => RETRY_LIMITS.JITTER_FACTOR,
      baseDelay: RETRY_TIMING_MS.BASE_DELAY,
    });
    const promise = retryFetch("https://example.com");
    // eslint-disable-next-line no-magic-numbers -- timer-test arbitrary advance budget, not domain-modeled
    await vi.advanceTimersByTimeAsync(50000);

    // Act
    const response = await promise;

    // Assert
    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(fetchFn).toHaveBeenCalledTimes(RETRY_LIMITS.EXPECTED_CALLS_AT_MAX);
  });

  it("should calculate delay with full jitter formula", async () => {
    // Arrange
    const fetchFn = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(mockResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR))
      .mockResolvedValueOnce(mockResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR))
      .mockResolvedValueOnce(mockResponse(HTTP_STATUS.OK));
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
      randomFn: () => RETRY_LIMITS.JITTER_FACTOR,
      baseDelay: RETRY_TIMING_MS.BASE_DELAY_LARGE,
      maxDelay: RETRY_TIMING_MS.MAX_DELAY,
    });

    // Act
    const promise = retryFetch("https://example.com");
    // eslint-disable-next-line no-magic-numbers -- timer-test arbitrary advance budget, not domain-modeled
    await vi.advanceTimersByTimeAsync(50000);
    await promise;

    // Assert
    expect(delays[0]).toBe(RETRY_TIMING_MS.JITTERED_DELAY_500);
    expect(delays[1]).toBe(RETRY_TIMING_MS.BASE_DELAY_LARGE);
  });

  it("should log debug on each retry with attempt info", async () => {
    // Arrange
    const logger = createLogger();
    const fetchFn = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(mockResponse(HTTP_STATUS.SERVICE_UNAVAILABLE))
      .mockResolvedValueOnce(mockResponse(HTTP_STATUS.OK));
    const retryFetch = withRetry(fetchFn, {
      randomFn: () => RETRY_LIMITS.JITTER_FACTOR,
      baseDelay: RETRY_TIMING_MS.BASE_DELAY,
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
      delay: RETRY_TIMING_MS.JITTERED_DELAY_50,
      status: HTTP_STATUS.SERVICE_UNAVAILABLE,
    });
  });

  it("should log debug with error message on network error retry", async () => {
    // Arrange
    const logger = createLogger();
    const fetchFn = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(mockResponse(HTTP_STATUS.OK));
    const retryFetch = withRetry(fetchFn, {
      randomFn: () => RETRY_LIMITS.JITTER_FACTOR,
      baseDelay: RETRY_TIMING_MS.BASE_DELAY,
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
        delay: RETRY_TIMING_MS.JITTERED_DELAY_50,
        error: "Failed to fetch",
      }
    );
  });

  it("should return successful response after transient failure", async () => {
    // Arrange
    const fetchFn = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(mockResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR))
      .mockResolvedValueOnce(mockResponse(HTTP_STATUS.TOO_MANY_REQUESTS))
      .mockResolvedValueOnce(mockResponse(HTTP_STATUS.OK));
    const retryFetch = withRetry(fetchFn, {
      randomFn: () => RETRY_LIMITS.JITTER_FACTOR,
      baseDelay: RETRY_TIMING_MS.BASE_DELAY,
    });
    const promise = retryFetch("https://example.com");
    // eslint-disable-next-line no-magic-numbers -- timer-test arbitrary advance budget, not domain-modeled
    await vi.advanceTimersByTimeAsync(50000);

    // Act
    const response = await promise;

    // Assert
    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(fetchFn).toHaveBeenCalledTimes(
      RETRY_LIMITS.EXPECTED_CALLS_AFTER_TWO_RETRIES
    );
  });

  it("should use default options when none provided", async () => {
    // Arrange
    const fetchFn = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(mockResponse(HTTP_STATUS.OK));
    const retryFetch = withRetry(fetchFn);

    // Act
    const response = await retryFetch("https://example.com");

    // Assert
    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
