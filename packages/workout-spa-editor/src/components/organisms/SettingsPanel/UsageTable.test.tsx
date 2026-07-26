import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { UsageTotals } from "../../../application/usage/fold-usage-events";
import type { MonthUsage } from "./usage-table-types";
import { UsageTable } from "./UsageTable";

const ZERO: UsageTotals = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  totalCost: 0,
};

const totals = (over: Partial<UsageTotals>): UsageTotals => ({
  ...ZERO,
  ...over,
});

const MONTHS_WINDOW = 3;

function makeMonth(over: Partial<MonthUsage> = {}): MonthUsage {
  const chat = totals({
    inputTokens: 1200,
    outputTokens: 300,
    totalTokens: 1500,
    totalCost: 0.02,
  });
  return {
    yearMonth: "2026-04",
    totals: chat,
    byPurpose: { chat, workout_generation: ZERO, lab_extraction: ZERO },
    ...over,
  };
}

describe("UsageTable", () => {
  it("should render per-month total input and output as separate columns", () => {
    // Arrange

    // Act
    render(<UsageTable rows={[makeMonth()]} monthsWindow={MONTHS_WINDOW} />);

    // Assert
    expect(screen.getByTestId("usage-input-2026-04")).toHaveTextContent(
      "1,200"
    );
    expect(screen.getByTestId("usage-output-2026-04")).toHaveTextContent("300");
  });

  it("should render a breakdown sub-row only for purposes with usage", () => {
    // Arrange
    const month = makeMonth({
      byPurpose: {
        chat: totals({
          inputTokens: 800,
          outputTokens: 200,
          totalTokens: 1000,
          totalCost: 0.01,
        }),
        workout_generation: totals({
          inputTokens: 400,
          outputTokens: 100,
          totalTokens: 500,
          totalCost: 0.01,
        }),
        lab_extraction: ZERO,
      },
    });

    // Act
    render(<UsageTable rows={[month]} monthsWindow={MONTHS_WINDOW} />);

    // Assert
    expect(
      screen.getByTestId("usage-purpose-2026-04-chat")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("usage-purpose-2026-04-workout_generation")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("usage-purpose-2026-04-lab_extraction")
    ).toBeNull();
  });

  it("should render multiple month rows without cross-row leakage", () => {
    // Arrange
    const april = makeMonth({ yearMonth: "2026-04" });
    const march = makeMonth({
      yearMonth: "2026-03",
      totals: totals({
        inputTokens: 500,
        outputTokens: 100,
        totalTokens: 600,
        totalCost: 0.006,
      }),
    });

    // Act
    render(<UsageTable rows={[april, march]} monthsWindow={MONTHS_WINDOW} />);

    // Assert
    expect(screen.getByTestId("usage-output-2026-04")).toHaveTextContent("300");
    expect(screen.getByTestId("usage-output-2026-03")).toHaveTextContent("100");
  });
});
