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
    it("executes an operation and returns result", async () => {
      const queue = createOperationQueue(0);
      const op = { bridgeId: "b1", execute: vi.fn().mockResolvedValue(42) };

      const promise = queue.enqueue(op);
      await vi.advanceTimersByTimeAsync(10);
      const result = await promise;

      expect(result).toBe(42);
      expect(op.execute).toHaveBeenCalledOnce();
    });

    it("serializes operations for the same bridge", async () => {
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
      const [r1, r2] = await Promise.all([p1, p2]);

      expect(r1).toBe(1);
      expect(r2).toBe(2);
      expect(order).toEqual([1, 2]);
    });

    it("applies delay between operations", async () => {
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
      await Promise.all([p1, p2]);

      expect(timestamps).toHaveLength(2);
      expect(timestamps[1]! - timestamps[0]!).toBeGreaterThanOrEqual(500);
    });
  });

  describe("hourly rate limit", () => {
    it("rejects when 60 operations reached in an hour", async () => {
      const queue = createOperationQueue(0);
      const bridgeId = "b1";

      queue._timestamps.set(
        bridgeId,
        Array.from({ length: 60 }, () => Date.now())
      );

      const op = { bridgeId, execute: vi.fn().mockResolvedValue("ok") };

      await expect(queue.enqueue(op)).rejects.toThrow("Rate limit reached");
      expect(op.execute).not.toHaveBeenCalled();
    });

    it("allows operations after hour window passes", async () => {
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

      const result = await promise;
      expect(result).toBe("ok");
    });
  });

  describe("exponential backoff on 429", () => {
    it("retries with backoff on 429 error", async () => {
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

      // First delay(0) + first attempt fails + backoff 1000*2^1 = 2000ms
      await vi.advanceTimersByTimeAsync(2_100);

      const result = await promise;
      expect(result).toBe("success");
      expect(execute).toHaveBeenCalledTimes(2);
    });

    it("gives up after MAX_RETRIES (5) on repeated 429", async () => {
      const queue = createOperationQueue(0);
      const error429 = Object.assign(new Error("Too Many"), {
        status: 429,
      });

      const execute = vi.fn().mockRejectedValue(error429);
      const op = { bridgeId: "b1", execute };
      const promise = queue.enqueue(op);

      // Prevent unhandled rejection warning during timer advancement
      promise.catch(() => {});

      // Advance enough time for all retries: 2s + 4s + 8s + 16s + 30s = ~60s
      await vi.advanceTimersByTimeAsync(70_000);

      await expect(promise).rejects.toThrow("Too Many");
      // 1 initial + 4 retries = 5 total, gives up when attempt reaches 5
      expect(execute).toHaveBeenCalledTimes(5);
    });

    it("propagates non-429 errors immediately", async () => {
      vi.useRealTimers();
      const queue = createOperationQueue(0);
      const error = new Error("Network failure");

      const op = {
        bridgeId: "b1",
        execute: vi.fn().mockRejectedValue(error),
      };

      await expect(queue.enqueue(op)).rejects.toThrow("Network failure");
    });
  });
});
