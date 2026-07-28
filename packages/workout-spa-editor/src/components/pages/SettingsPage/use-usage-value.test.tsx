import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { UsageEventRecord } from "../../../types/usage-event-schemas";
import { useUsageValue } from "./use-usage-value";

const summary = vi.hoisted(() => ({
  value: {
    months: ["2026-07"],
    events: [] as UsageEventRecord[] | undefined,
  },
}));

vi.mock("../../../hooks/use-usage-summary", () => ({
  useUsageSummary: () => summary.value,
}));

const PROMPT_TOKENS = 1_000_000;
const COMPLETION_TOKENS = 214_880;
const COST = 3.5;

const event = (over: Partial<UsageEventRecord> = {}): UsageEventRecord => ({
  id: "e1",
  yearMonth: "2026-07",
  date: "2026-07-01",
  purpose: "chat",
  promptTokens: PROMPT_TOKENS,
  completionTokens: COMPLETION_TOKENS,
  tokens: PROMPT_TOKENS + COMPLETION_TOKENS,
  cost: COST,
  createdAt: "2026-07-01T00:00:00.000Z",
  ...over,
});

describe("useUsageValue", () => {
  it("should format the current month total compactly", () => {
    // Arrange
    summary.value = { months: ["2026-07"], events: [event()] };

    // Act
    const { result } = renderHook(() => useUsageValue());

    // Assert
    expect(result.current).toBe("1.2M tokens · July");
  });

  it("should render no value while the usage query resolves", () => {
    // Arrange
    summary.value = { months: ["2026-07"], events: undefined };

    // Act
    const { result } = renderHook(() => useUsageValue());

    // Assert
    expect(result.current).toBeUndefined();
  });

  it("should render no value when the month has no usage", () => {
    // Arrange
    summary.value = { months: ["2026-07"], events: [] };

    // Act
    const { result } = renderHook(() => useUsageValue());

    // Assert
    expect(result.current).toBeUndefined();
  });
});
