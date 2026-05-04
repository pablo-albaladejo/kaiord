import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { UsageRecord } from "../../../types/usage-schemas";
import { UsageTable } from "./UsageTable";

function makeRow(overrides: Partial<UsageRecord> = {}): UsageRecord {
  return {
    yearMonth: "2026-04",
    inputTokens: 1200,
    outputTokens: 300,
    totalTokens: 1500,
    totalCost: 0.02,
    entries: [],
    ...overrides,
  };
}

describe("UsageTable", () => {
  it("should render input and output tokens as separate columns for fresh rows", () => {
    // Arrange

    // Act

    render(<UsageTable rows={[makeRow()]} monthsWindow={3} />);

    // Assert

    expect(screen.getByTestId("usage-input-2026-04")).toHaveTextContent(
      "1,200"
    );
    expect(screen.getByTestId("usage-output-2026-04")).toHaveTextContent("300");
  });

  it("shows `—` under Output for legacy rows", () => {
    // Arrange

    const legacy = makeRow({
      yearMonth: "2026-03",
      inputTokens: 500,
      outputTokens: 0,
      totalTokens: 500,
      legacy: true,
    });

    // Act

    render(<UsageTable rows={[legacy]} monthsWindow={3} />);

    // Assert

    expect(screen.getByTestId("usage-output-2026-03")).toHaveTextContent("—");
    // Input column still shows the conservative backfill value.
    expect(screen.getByTestId("usage-input-2026-03")).toHaveTextContent("500");
  });

  it("should render multiple rows without cross-row leakage", () => {
    // Arrange

    const fresh = makeRow({ yearMonth: "2026-04" });
    const legacy = makeRow({
      yearMonth: "2026-03",
      legacy: true,
      outputTokens: 0,
      inputTokens: 500,
      totalTokens: 500,
    });

    // Act

    render(<UsageTable rows={[fresh, legacy]} monthsWindow={3} />);

    // Assert

    expect(screen.getByTestId("usage-output-2026-04")).toHaveTextContent("300");
    expect(screen.getByTestId("usage-output-2026-03")).toHaveTextContent("—");
  });
});
