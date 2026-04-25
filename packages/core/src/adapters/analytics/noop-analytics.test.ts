import { describe, expect, it } from "vitest";
import { createNoopAnalytics } from "./noop-analytics";

describe("createNoopAnalytics", () => {
  it("should create adapter with all required methods", () => {
    // Arrange & Act
    const analytics = createNoopAnalytics();

    // Assert
    expect(analytics.pageView).toBeDefined();
    expect(analytics.event).toBeDefined();
  });

  it("should not throw when pageView is called", () => {
    // Arrange
    const analytics = createNoopAnalytics();

    // Act & Assert
    expect(() => analytics.pageView("/editor/")).not.toThrow();
  });

  it("should not throw when event is called with props", () => {
    // Arrange
    const analytics = createNoopAnalytics();

    // Act & Assert
    expect(() =>
      analytics.event("workout-generated", {
        provider: "claude",
        sport: "cycling",
      })
    ).not.toThrow();
  });

  it("should not throw when event is called without props", () => {
    // Arrange
    const analytics = createNoopAnalytics();

    // Act & Assert
    expect(() => analytics.event("editor-loaded")).not.toThrow();
  });

  it("should produce no side effects on pageView", () => {
    // Arrange
    const analytics = createNoopAnalytics();
    const result = analytics.pageView("/test/");

    // Assert
    expect(result).toBeUndefined();
  });

  it("should produce no side effects on event", () => {
    // Arrange
    const analytics = createNoopAnalytics();
    const result = analytics.event("garmin-synced", { result: "success" });

    // Assert
    expect(result).toBeUndefined();
  });
});
