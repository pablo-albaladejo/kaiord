import { describe, expect, it } from "vitest";

import { createNoopAnalytics } from "./noop-analytics";

describe("createNoopAnalytics", () => {
  it("should be callable without side effects", () => {
    // Arrange
    const analytics = createNoopAnalytics();

    // Act
    const pageViewResult = analytics.pageView("/editor/");
    const eventWithPropsResult = analytics.event("workout-generated", {
      provider: "claude",
      sport: "cycling",
    });
    const eventWithoutPropsResult = analytics.event("editor-loaded");

    // Assert
    expect(pageViewResult).toBeUndefined();
    expect(eventWithPropsResult).toBeUndefined();
    expect(eventWithoutPropsResult).toBeUndefined();
  });
});
