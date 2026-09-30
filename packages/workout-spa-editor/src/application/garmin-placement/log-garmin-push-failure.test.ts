import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createPlacementHarness, D1 } from "../../test-utils/placement-harness";
import { logGarminPushFailure } from "./log-garmin-push-failure";

const T0 = new Date("2026-10-01T08:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("logGarminPushFailure", () => {
  it("should log the error's name and a scrubbed message", () => {
    // Arrange
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new TypeError("push for athlete@example.com failed");

    // Act
    logGarminPushFailure(error);

    // Assert
    expect(spy).toHaveBeenCalledWith("[garmin-push] failed", {
      name: "TypeError",
      message: "push for <email> failed",
    });
  });

  it("should bound the logged message", () => {
    // Arrange
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    logGarminPushFailure("x ".repeat(500));

    // Assert
    const [, context] = spy.mock.calls[0] as [string, { message: string }];
    expect(context.message.length).toBeLessThanOrEqual(200);
  });
});

describe("runPhaseOne — a failed library push", () => {
  it("should log the cause before reporting library-push-failed", async () => {
    // Arrange
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const h = createPlacementHarness();
    h.library.fail = true;

    // Act
    const result = await h.push(D1);

    // Assert
    expect(result).toMatchObject({ reason: "library-push-failed" });
    expect(spy).toHaveBeenCalledWith("[garmin-push] failed", {
      name: "Error",
      message: "library push failed",
    });
  });
});
