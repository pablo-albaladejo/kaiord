import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createOperationQueue } from "./operation-queue";
import {
  OPERATION_QUEUE_BRIDGE as BRIDGE,
  OPERATION_QUEUE_DELAYS_MS as DELAYS,
  OPERATION_QUEUE_ERRORS as ERRORS,
  OPERATION_QUEUE_RATE as RATE,
  OPERATION_QUEUE_RESULTS as RESULTS,
} from "./operation-queue.test-fixtures";

describe("createOperationQueue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("enqueue", () => {
    it("should execute an operation and return result", async () => {
      // Arrange
      const queue = createOperationQueue(DELAYS.none);
      const op = {
        bridgeId: BRIDGE.defaultId,
        execute: vi.fn().mockResolvedValue(RESULTS.fortyTwo),
      };
      const promise = queue.enqueue(op);
      await vi.advanceTimersByTimeAsync(DELAYS.short);

      // Act
      const result = await promise;

      // Assert
      expect(result).toBe(RESULTS.fortyTwo);
      expect(op.execute).toHaveBeenCalledOnce();
    });

    it("should serialize operations for the same bridge", async () => {
      // Arrange
      const order: number[] = [];
      const queue = createOperationQueue(DELAYS.none);
      const makeOp = (n: number) => ({
        bridgeId: BRIDGE.defaultId,
        execute: vi.fn(async () => {
          order.push(n);
          return n;
        }),
      });
      const p1 = queue.enqueue(makeOp(RESULTS.one));
      const p2 = queue.enqueue(makeOp(RESULTS.two));
      await vi.advanceTimersByTimeAsync(DELAYS.serializeWindow);

      // Act
      const [r1, r2] = await Promise.all([p1, p2]);

      // Assert
      expect(r1).toBe(RESULTS.one);
      expect(r2).toBe(RESULTS.two);
      expect(order).toEqual([RESULTS.one, RESULTS.two]);
    });

    it("should apply delay between operations", async () => {
      // Arrange
      const queue = createOperationQueue(DELAYS.delayBetween);
      const start = Date.now();
      const timestamps: number[] = [];
      const makeOp = (id: number) => ({
        bridgeId: BRIDGE.defaultId,
        execute: vi.fn(async () => {
          timestamps.push(Date.now() - start);
          return id;
        }),
      });
      const p1 = queue.enqueue(makeOp(RESULTS.one));
      const p2 = queue.enqueue(makeOp(RESULTS.two));
      await vi.advanceTimersByTimeAsync(DELAYS.delayBetweenWindow);

      // Act
      await Promise.all([p1, p2]);

      // Assert
      expect(timestamps).toHaveLength(2);
      expect(timestamps[1]! - timestamps[0]!).toBeGreaterThanOrEqual(
        DELAYS.delayBetween
      );
    });
  });

  describe("hourly rate limit", () => {
    it("should reject when 60 operations reached in an hour", async () => {
      // Arrange
      const queue = createOperationQueue(DELAYS.none);
      const bridgeId = BRIDGE.defaultId;
      queue._timestamps.set(
        bridgeId,
        Array.from({ length: RATE.hourlyLimit }, () => Date.now())
      );

      // Act
      const op = { bridgeId, execute: vi.fn().mockResolvedValue(RESULTS.ok) };

      // Assert
      await expect(queue.enqueue(op)).rejects.toThrow(ERRORS.rateLimit);
      expect(op.execute).not.toHaveBeenCalled();
    });

    it("should allow operations after hour window passes", async () => {
      // Arrange
      const queue = createOperationQueue(DELAYS.none);
      const bridgeId = BRIDGE.defaultId;
      const oneHourAgo = Date.now() - DELAYS.hourMs - 1;
      queue._timestamps.set(
        bridgeId,
        Array.from({ length: RATE.hourlyLimit }, () => oneHourAgo)
      );
      const op = { bridgeId, execute: vi.fn().mockResolvedValue(RESULTS.ok) };
      const promise = queue.enqueue(op);
      await vi.advanceTimersByTimeAsync(DELAYS.short);

      // Act
      const result = await promise;

      // Assert
      expect(result).toBe(RESULTS.ok);
    });
  });

  describe("exponential backoff on 429", () => {
    it("should retry with backoff on 429 error", async () => {
      // Arrange
      const queue = createOperationQueue(DELAYS.none);
      const error429 = Object.assign(new Error(ERRORS.tooMany), {
        status: ERRORS.status429,
      });
      const execute = vi
        .fn()
        .mockRejectedValueOnce(error429)
        .mockResolvedValue(RESULTS.success);
      const op = { bridgeId: BRIDGE.defaultId, execute };
      const promise = queue.enqueue(op);
      await vi.advanceTimersByTimeAsync(DELAYS.retryWindow);

      // Act
      const result = await promise;

      // Assert
      expect(result).toBe(RESULTS.success);
      expect(execute).toHaveBeenCalledTimes(2);
    });

    it("should give up after MAX_RETRIES (5) on repeated 429", async () => {
      // Arrange
      const queue = createOperationQueue(DELAYS.none);
      const error429 = Object.assign(new Error(ERRORS.tooMany), {
        status: ERRORS.status429,
      });
      const execute = vi.fn().mockRejectedValue(error429);
      const op = { bridgeId: BRIDGE.defaultId, execute };
      const promise = queue.enqueue(op);
      promise.catch(() => {});

      // Act
      await vi.advanceTimersByTimeAsync(DELAYS.exhaustWindow);

      // Assert
      await expect(promise).rejects.toThrow(ERRORS.tooMany);
      expect(execute).toHaveBeenCalledTimes(RATE.maxRetries);
    });

    it("should propagate non-429 errors immediately", async () => {
      // Arrange
      vi.useRealTimers();
      const queue = createOperationQueue(DELAYS.none);
      const error = new Error(ERRORS.network);

      // Act
      const op = {
        bridgeId: BRIDGE.defaultId,
        execute: vi.fn().mockRejectedValue(error),
      };

      // Assert
      await expect(queue.enqueue(op)).rejects.toThrow(ERRORS.network);
    });
  });
});
