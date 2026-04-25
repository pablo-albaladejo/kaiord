import { createNoopAnalytics } from "@kaiord/core";
import type { Analytics } from "@kaiord/core";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { AnalyticsProvider, useAnalytics } from "./analytics-context";

describe("useAnalytics", () => {
  it("should return noop analytics when used without a provider", () => {
    // Arrange & Act
    const { result } = renderHook(() => useAnalytics());

    // Assert — noop: methods exist and do not throw
    expect(() => result.current.pageView("/")).not.toThrow();
    expect(() => result.current.event("test")).not.toThrow();
  });

  it("should return injected analytics when wrapped in AnalyticsProvider", () => {
    // Arrange
    const mockAnalytics: Analytics = {
      pageView: vi.fn(),
      event: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AnalyticsProvider analytics={mockAnalytics}>
        {children}
      </AnalyticsProvider>
    );

    // Act
    const { result } = renderHook(() => useAnalytics(), { wrapper });
    result.current.event("test-event", { key: "value" });

    // Assert
    expect(mockAnalytics.event).toHaveBeenCalledWith("test-event", {
      key: "value",
    });
  });

  it("should forward pageView calls to the injected adapter", () => {
    // Arrange
    const mockAnalytics: Analytics = {
      pageView: vi.fn(),
      event: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AnalyticsProvider analytics={mockAnalytics}>
        {children}
      </AnalyticsProvider>
    );

    // Act
    const { result } = renderHook(() => useAnalytics(), { wrapper });
    result.current.pageView("/editor/");

    // Assert
    expect(mockAnalytics.pageView).toHaveBeenCalledWith("/editor/");
  });

  it("should use noop by default (context default value)", () => {
    // Arrange
    const noop = createNoopAnalytics();

    // Act — without provider wrapper, should behave like noop
    const { result } = renderHook(() => useAnalytics());

    // Assert — same interface, no throws
    expect(result.current.event).toBeTypeOf("function");
    expect(result.current.pageView).toBeTypeOf("function");
    expect(() => result.current.event("any-event")).not.toThrow();
    expect(noop.event).toBeTypeOf("function");
  });
});
