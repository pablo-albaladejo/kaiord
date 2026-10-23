import { describe, expect, it } from "vitest";

import { CALIBRATION_RATE_LIMIT_INFO } from "../../test-utils/calibration-capture-fixture";
import { SEVEN_DAY_FIELD, decideNextCall } from "./rate-limit-guard";
import type { WeeklyField } from "./rate-limit-guard";

const LIMIT = 0.85;
const ABOVE = 0.86;
const BELOW = 0.8;
const LOW = 0.1;
const PERCENT_LIKE = 75;

/** Stand-in pins for the decision rules; the real pin is checked against the capture below. */
const FRACTION: WeeklyField = {
  path: ["utilization"],
  scale: "fraction",
  when: { rateLimitType: "seven_day" },
};
const PERCENT: WeeklyField = { path: ["weeklyPercent"], scale: "percent" };

const weekly = (utilization: unknown, status = "allowed") => ({
  status,
  rateLimitType: "seven_day",
  utilization,
});

const decide = (infos: Array<unknown>, field: WeeklyField | null = FRACTION) =>
  decideNextCall(infos, { field, maxWeekly: 0.85 });

describe("decideNextCall", () => {
  it("should continue at exactly 0.85, because the limit stops only above it", () => {
    // Arrange
    const infos = [weekly(LIMIT)];

    // Act
    const decision = decide(infos);

    // Assert
    expect(decision).toEqual({ action: "continue", utilization: 0.85 });
  });

  it("should stop at 0.86 as a rate limit, not a harness fault", () => {
    // Arrange
    const infos = [weekly(ABOVE)];

    // Act
    const decision = decide(infos);

    // Assert
    expect(decision).toMatchObject({ action: "stop", kind: "rate-limit" });
  });

  it("should convert a percent field by its pinned scale", () => {
    // Arrange
    const infos = [{ status: "allowed", weeklyPercent: 86 }];

    // Act
    const decision = decide(infos, PERCENT);

    // Assert
    expect(decision).toMatchObject({ action: "stop", kind: "rate-limit" });
  });

  it("should fail closed when the output carried no rate_limit_event", () => {
    // Arrange
    const infos: Array<unknown> = [];

    // Act
    const decision = decide(infos);

    // Assert
    expect(decision).toEqual({
      action: "stop",
      kind: "harness-fault",
      reason: "the CLI output carried no rate_limit_event",
    });
  });

  it("should fail closed on an event of an unrecognized shape", () => {
    // Arrange
    const infos = [{ utilization: 0.1 }, "not an object"];

    // Act
    const decision = decide(infos);

    // Assert
    expect(decision).toMatchObject({
      kind: "harness-fault",
      reason: "unrecognized rate_limit_event shape",
    });
  });

  it("should fail closed when the pinned field is missing, not a number or out of scale", () => {
    // Arrange
    const cases = [
      [{ status: "allowed", rateLimitType: "five_hour", utilization: 0.1 }],
      [weekly("75%")],
      [weekly(PERCENT_LIKE)],
      [weekly(-LOW)],
    ];

    // Act
    const reasons = cases.map((infos) => {
      const decision = decide(infos);
      return decision.action === "stop" ? decision.kind : "continue";
    });

    // Assert
    expect(reasons).toEqual([
      "harness-fault",
      "harness-fault",
      "harness-fault",
      "harness-fault",
    ]);
  });

  it("should stop on a status other than allowed", () => {
    // Arrange
    const infos = [weekly(LOW, "rejected")];

    // Act
    const decision = decide(infos);

    // Assert
    expect(decision).toMatchObject({ action: "stop", kind: "rate-limit" });
  });

  it("should continue on an allowed_warning below the limit", () => {
    // Arrange
    const infos = [weekly(BELOW, "allowed_warning")];

    // Act
    const decision = decide(infos);

    // Assert
    expect(decision).toEqual({ action: "continue", utilization: 0.8 });
  });

  it.each([
    ["allowed_warning at the limit", "allowed_warning", LIMIT, "continue"],
    ["allowed_warning above the limit", "allowed_warning", ABOVE, "stop"],
    ["an unknown status at a low fraction", "throttled", LOW, "stop"],
  ])("should let the fraction govern: %s", (_label, status, value, action) => {
    // Arrange
    const infos = [weekly(value, status)];

    // Act
    const decision = decide(infos);

    // Assert
    expect(decision.action).toBe(action);
    if (decision.action === "stop") expect(decision.kind).toBe("rate-limit");
  });

  it("should read the weekly fraction from the real calibration event", () => {
    // Arrange
    const infos = [CALIBRATION_RATE_LIMIT_INFO];

    // Act
    const decision = decide(infos, SEVEN_DAY_FIELD);

    // Assert
    expect(decision).toEqual({ action: "continue", utilization: 0.52 });
  });

  it("should stop the pass when no field is pinned", () => {
    // Arrange
    const infos = [weekly(LOW)];

    // Act
    const decision = decide(infos, null);

    // Assert
    expect(decision).toMatchObject({ action: "stop", kind: "harness-fault" });
    expect(decision.action === "stop" && decision.reason).toContain(
      "--calibrate"
    );
  });
});
