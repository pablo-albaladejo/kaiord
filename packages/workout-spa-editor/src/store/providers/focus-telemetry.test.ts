import { describe, expect, it, vi } from "vitest";

import {
  defaultFocusTelemetry,
  focusErrorEvent,
  type FocusTelemetry,
  formFieldShortCircuitEvent,
  overlayDeferredApplyEvent,
  safeEmit,
  unresolvedTargetFallbackEvent,
  wiringCanaryEvent,
} from "./focus-telemetry";
import {
  FOCUS_TELEMETRY_DEFERRED_BUCKETS as BUCKETS,
  FOCUS_TELEMETRY_DEFERRED_INPUT_BATCH as DEFERRED_BATCH,
  FOCUS_TELEMETRY_DEFERRED_MS as MS,
  FOCUS_TELEMETRY_ERRORS as ERRORS,
  FOCUS_TELEMETRY_EVENT_TYPES as TYPES,
  FOCUS_TELEMETRY_TARGETS as TARGETS,
} from "./focus-telemetry.test-fixtures";

describe("defaultFocusTelemetry", () => {
  it("should be a no-op function that does not throw", () => {
    // Arrange

    // Act

    // Assert
    expect(() => defaultFocusTelemetry(wiringCanaryEvent())).not.toThrow();
    expect(() =>
      defaultFocusTelemetry(
        unresolvedTargetFallbackEvent(
          TARGETS.itemKind,
          TARGETS.firstItemFallback
        )
      )
    ).not.toThrow();
  });
});

// Task 1.2.a — safeEmit does not interrupt focus behavior when telemetry throws
describe("safeEmit", () => {
  it("should call the telemetry function with the event", () => {
    // Arrange
    const spy = vi.fn<FocusTelemetry>();
    const event = wiringCanaryEvent();

    // Act
    safeEmit(spy, event);

    // Assert
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(event);
  });

  it("should not throw when the telemetry function throws", () => {
    // Arrange

    // Act
    const throwing: FocusTelemetry = () => {
      throw new Error(ERRORS.telemetryDown);
    };

    // Assert
    expect(() => safeEmit(throwing, wiringCanaryEvent())).not.toThrow();
  });

  it("should emit a console.warn when the telemetry function throws (dev-only path)", () => {
    // Arrange
    const throwing: FocusTelemetry = () => {
      throw new Error(ERRORS.telemetryDown);
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
  it("should expose only the type field on wiringCanaryEvent", () => {
    // Arrange

    // Act
    const event = wiringCanaryEvent();

    // Assert
    expect(Object.keys(event)).toEqual(["type"]);
    expect(event.type).toBe(TYPES.wiringCanary);
  });

  it("should expose only type, targetKind, fallback on unresolvedTargetFallbackEvent", () => {
    // Arrange

    // Act
    const event = unresolvedTargetFallbackEvent(
      TARGETS.itemKind,
      TARGETS.firstItemFallback
    );

    // Assert
    expect(Object.keys(event).sort()).toEqual(
      ["fallback", "targetKind", "type"].sort()
    );
    expect(event.type).toBe(TYPES.unresolvedTargetFallback);
    expect(event.targetKind).toBe(TARGETS.itemKind);
    expect(event.fallback).toBe(TARGETS.firstItemFallback);
  });

  it("should expose only the type field on formFieldShortCircuitEvent", () => {
    // Arrange

    // Act
    const event = formFieldShortCircuitEvent();

    // Assert
    expect(Object.keys(event)).toEqual(["type"]);
    expect(event.type).toBe(TYPES.formFieldShortCircuit);
  });

  it("should expose only type and deferredForMs on overlayDeferredApplyEvent", () => {
    // Arrange

    // Act
    const event = overlayDeferredApplyEvent(MS.twoHundredFifty);

    // Assert
    expect(Object.keys(event).sort()).toEqual(["deferredForMs", "type"].sort());
    expect(event.type).toBe(TYPES.overlayDeferredApply);
  });

  it("should expose only type and phase on focusErrorEvent", () => {
    // Arrange

    // Act
    const event = focusErrorEvent(TARGETS.focusPhase);

    // Assert
    expect(Object.keys(event).sort()).toEqual(["phase", "type"].sort());
    expect(event.type).toBe(TYPES.focusError);
    expect(event.phase).toBe(TARGETS.focusPhase);
  });

  it("should quantize deferredForMs to 100ms buckets via overlayDeferredApplyEvent", () => {
    // Arrange

    // Act

    // Assert
    expect(overlayDeferredApplyEvent(MS.zero).deferredForMs).toBe(BUCKETS.zero);
    expect(overlayDeferredApplyEvent(MS.fifty).deferredForMs).toBe(
      BUCKETS.oneHundred
    );
    expect(
      overlayDeferredApplyEvent(MS.oneHundredFortyNine).deferredForMs
    ).toBe(BUCKETS.oneHundred);
    expect(overlayDeferredApplyEvent(MS.oneHundredFifty).deferredForMs).toBe(
      BUCKETS.twoHundred
    );
    expect(overlayDeferredApplyEvent(MS.twoHundredFifty).deferredForMs).toBe(
      BUCKETS.threeHundred
    );
    expect(overlayDeferredApplyEvent(MS.negativeTen).deferredForMs).toBe(
      BUCKETS.zero
    );
  });

  it("should always make overlayDeferredApplyEvent.deferredForMs a non-negative integer", () => {
    // Arrange

    // Act
    const values = DEFERRED_BATCH;

    // Assert
    for (const ms of values) {
      const { deferredForMs } = overlayDeferredApplyEvent(ms);
      expect(deferredForMs).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(deferredForMs)).toBe(true);
    }
  });
});
