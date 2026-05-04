import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createOperationQueue } from "./operation-queue";

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
      const queue = createOperationQueue(0);
      const op = { bridgeId: "b1", execute: vi.fn().mockResolvedValue(42) };
      const promise = queue.enqueue(op);
      await vi.advanceTimersByTimeAsync(10);

      // Act
      const result = await promise;

      // Assert
      expect(result).toBe(42);
      expect(op.execute).toHaveBeenCalledOnce();
    });

    it("should serialize operations for the same bridge", async () => {
      // Arrange
      const order: number[] = [];
      const queue = createOperationQueue(0);
      const makeOp = (n: number) => ({
        bridgeId: "b1",
        execute: vi.fn(async () => {
          order.push(n);
          return n;
        }),
      });
      const p1 = queue.enqueue(makeOp(1));
      const p2 = queue.enqueue(makeOp(2));
      await vi.advanceTimersByTimeAsync(50);

      // Act
      const [r1, r2] = await Promise.all([p1, p2]);

      // Assert
      expect(r1).toBe(1);
      expect(r2).toBe(2);
      expect(order).toEqual([1, 2]);
    });

    it("should apply delay between operations", async () => {
      // Arrange
      const queue = createOperationQueue(500);
      const start = Date.now();
      const timestamps: number[] = [];
      const makeOp = (id: number) => ({
        bridgeId: "b1",
        execute: vi.fn(async () => {
          timestamps.push(Date.now() - start);
          return id;
        }),
      });
      const p1 = queue.enqueue(makeOp(1));
      const p2 = queue.enqueue(makeOp(2));
      await vi.advanceTimersByTimeAsync(1_200);

      // Act
      await Promise.all([p1, p2]);

      // Assert
      expect(timestamps).toHaveLength(2);
      expect(timestamps[1]! - timestamps[0]!).toBeGreaterThanOrEqual(500);
    });
  });

  describe("hourly rate limit", () => {
    it("should reject when 60 operations reached in an hour", async () => {
      // Arrange
      const queue = createOperationQueue(0);
      const bridgeId = "b1";
      queue._timestamps.set(
        bridgeId,
        Array.from({ length: 60 }, () => Date.now())
      );

      // Act
      const op = { bridgeId, execute: vi.fn().mockResolvedValue("ok") };

      // Assert
      await expect(queue.enqueue(op)).rejects.toThrow("Rate limit reached");
      expect(op.execute).not.toHaveBeenCalled();
    });

    it("should allow operations after hour window passes", async () => {
      // Arrange
      const queue = createOperationQueue(0);
      const bridgeId = "b1";
      const oneHourAgo = Date.now() - 60 * 60 * 1_000 - 1;
      queue._timestamps.set(
        bridgeId,
        Array.from({ length: 60 }, () => oneHourAgo)
      );
      const op = { bridgeId, execute: vi.fn().mockResolvedValue("ok") };
      const promise = queue.enqueue(op);
      await vi.advanceTimersByTimeAsync(10);

      // Act
      const result = await promise;

      // Assert
      expect(result).toBe("ok");
    });
  });

  describe("exponential backoff on 429", () => {
    it("should retry with backoff on 429 error", async () => {
      // Arrange
      const queue = createOperationQueue(0);
      const error429 = Object.assign(new Error("Too Many"), {
        status: 429,
      });
      const execute = vi
        .fn()
        .mockRejectedValueOnce(error429)
        .mockResolvedValue("success");
      const op = { bridgeId: "b1", execute };
      const promise = queue.enqueue(op);
      await vi.advanceTimersByTimeAsync(2_100);

      // Act
      const result = await promise;

      // Assert
      expect(result).toBe("success");
      expect(execute).toHaveBeenCalledTimes(2);
    });

    it("should give up after MAX_RETRIES (5) on repeated 429", async () => {
      // Arrange
      const queue = createOperationQueue(0);
      const error429 = Object.assign(new Error("Too Many"), {
        status: 429,
      });
      const execute = vi.fn().mockRejectedValue(error429);
      const op = { bridgeId: "b1", execute };
      const promise = queue.enqueue(op);
      promise.catch(() => {});

      // Act
      await vi.advanceTimersByTimeAsync(70_000);

      // Assert
      await expect(promise).rejects.toThrow("Too Many");
      expect(execute).toHaveBeenCalledTimes(5);
    });

    it("should propagate non-429 errors immediately", async () => {
      // Arrange
      vi.useRealTimers();
      const queue = createOperationQueue(0);
      const error = new Error("Network failure");

      // Act
      const op = {
        bridgeId: "b1",
        execute: vi.fn().mockRejectedValue(error),
      };

      // Assert
      await expect(queue.enqueue(op)).rejects.toThrow("Network failure");
    });
  });
});
