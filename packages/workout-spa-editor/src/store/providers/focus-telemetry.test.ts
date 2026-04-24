import { describe, expect, it, vi } from "vitest";

import {
  defaultFocusTelemetry,
  formFieldShortCircuitEvent,
  focusErrorEvent,
  overlayDeferredApplyEvent,
  safeEmit,
  unresolvedTargetFallbackEvent,
  wiringCanaryEvent,
  type FocusTelemetry,
  type FocusTelemetryEvent,
} from "./focus-telemetry";

// Task 1.1.a — Exhaustive switch coverage via `never` assertion.
// If a new variant is added to FocusTelemetryEvent without updating the
// switch, TypeScript will error here at compile time.
const assertExhaustive = (event: never): never => {
  throw new Error(`Unhandled event type: ${JSON.stringify(event)}`);
};

const handleEvent = (event: FocusTelemetryEvent): string => {
  switch (event.type) {
    case "wiring-canary":
      return "wiring-canary";
    case "unresolved-target-fallback":
      return "unresolved-target-fallback";
    case "form-field-short-circuit":
      return "form-field-short-circuit";
    case "overlay-deferred-apply":
      return "overlay-deferred-apply";
    case "focus-error":
      return "focus-error";
    default:
      return assertExhaustive(event);
  }
};

describe("FocusTelemetryEvent discriminated union", () => {
  it("exhaustive switch covers all five variants without hitting the never branch", () => {
    // Arrange
    const events: FocusTelemetryEvent[] = [
      wiringCanaryEvent(),
      unresolvedTargetFallbackEvent("item", "first-item"),
      formFieldShortCircuitEvent(),
      overlayDeferredApplyEvent(250),
      focusErrorEvent("focus"),
    ];

    // Act & Assert — no throw means all branches are handled
    for (const event of events) {
      expect(() => handleEvent(event)).not.toThrow();
    }
  });
});

describe("defaultFocusTelemetry", () => {
  it("is a no-op function that does not throw", () => {
    expect(() => defaultFocusTelemetry(wiringCanaryEvent())).not.toThrow();
    expect(() =>
      defaultFocusTelemetry(unresolvedTargetFallbackEvent("item", "first-item"))
    ).not.toThrow();
  });
});

// Task 1.2.a — safeEmit does not interrupt focus behavior when telemetry throws
describe("safeEmit", () => {
  it("calls the telemetry function with the event", () => {
    // Arrange
    const spy = vi.fn<FocusTelemetry>();
    const event = wiringCanaryEvent();

    // Act
    safeEmit(spy, event);

    // Assert
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(event);
  });

  it("does not throw when the telemetry function throws", () => {
    // Arrange
    const throwing: FocusTelemetry = () => {
      throw new Error("telemetry down");
    };

    // Act & Assert — focus behavior must not be interrupted
    expect(() => safeEmit(throwing, wiringCanaryEvent())).not.toThrow();
  });

  it("emits a console.warn when the telemetry function throws (dev-only path)", () => {
    // Arrange
    const throwing: FocusTelemetry = () => {
      throw new Error("telemetry down");
    };
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Act
    safeEmit(throwing, wiringCanaryEvent());

    // Assert
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });
});

// Task 1.3.a — Event payloads contain no ItemId, step/block names, or workout titles
describe("event payload shape — no PII, no ItemId", () => {
  it("wiringCanaryEvent has only the type field", () => {
    const event = wiringCanaryEvent();
    expect(Object.keys(event)).toEqual(["type"]);
    expect(event.type).toBe("wiring-canary");
  });

  it("unresolvedTargetFallbackEvent has only type, targetKind, fallback", () => {
    const event = unresolvedTargetFallbackEvent("item", "first-item");
    expect(Object.keys(event).sort()).toEqual(
      ["fallback", "targetKind", "type"].sort()
    );
    expect(event.type).toBe("unresolved-target-fallback");
    expect(event.targetKind).toBe("item");
    expect(event.fallback).toBe("first-item");
  });

  it("formFieldShortCircuitEvent has only the type field", () => {
    const event = formFieldShortCircuitEvent();
    expect(Object.keys(event)).toEqual(["type"]);
    expect(event.type).toBe("form-field-short-circuit");
  });

  it("overlayDeferredApplyEvent has only type and deferredForMs", () => {
    const event = overlayDeferredApplyEvent(250);
    expect(Object.keys(event).sort()).toEqual(["deferredForMs", "type"].sort());
    expect(event.type).toBe("overlay-deferred-apply");
  });

  it("focusErrorEvent has only type and phase", () => {
    const event = focusErrorEvent("focus");
    expect(Object.keys(event).sort()).toEqual(["phase", "type"].sort());
    expect(event.type).toBe("focus-error");
    expect(event.phase).toBe("focus");
  });

  it("overlayDeferredApplyEvent quantizes deferredForMs to 100ms buckets", () => {
    expect(overlayDeferredApplyEvent(0).deferredForMs).toBe(0);
    expect(overlayDeferredApplyEvent(50).deferredForMs).toBe(100);
    expect(overlayDeferredApplyEvent(149).deferredForMs).toBe(100);
    expect(overlayDeferredApplyEvent(150).deferredForMs).toBe(200);
    expect(overlayDeferredApplyEvent(250).deferredForMs).toBe(300);
    expect(overlayDeferredApplyEvent(-10).deferredForMs).toBe(0);
  });

  it("overlayDeferredApplyEvent deferredForMs is always a non-negative integer", () => {
    const values = [0, 50, 99, 150, 500, 1234];
    for (const ms of values) {
      const { deferredForMs } = overlayDeferredApplyEvent(ms);
      expect(deferredForMs).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(deferredForMs)).toBe(true);
    }
  });
});
