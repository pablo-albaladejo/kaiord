import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UsageRecord } from "../../../types/usage-schemas";
import { UsageTab } from "./UsageTab";

let mockRows: UsageRecord[] = [];

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => mockRows,
}));

vi.mock("../../../adapters/dexie/dexie-database", () => ({
  db: {
    table: () => ({
      where: () => ({
        anyOf: () => ({
          toArray: async () => mockRows,
        }),
      }),
    }),
  },
}));

describe("UsageTab", () => {
  beforeEach(() => {
    mockRows = [];
  });

  it("should render the empty state when no records exist", () => {
    // Arrange

    // Act

    render(<UsageTab />);

    // Assert

    expect(screen.getByText(/No AI usage recorded yet/i)).toBeInTheDocument();
    expect(screen.queryByTestId("usage-table")).toBeNull();
  });

  it("should render rows in reverse-chronological order when records exist", () => {
    // Arrange

    mockRows = [
      {
        yearMonth: "2026-02",
        inputTokens: 800,
        outputTokens: 200,
        totalTokens: 1000,
        totalCost: 0.003,
        entries: [],
      },
      {
        yearMonth: "2026-04",
        inputTokens: 4000,
        outputTokens: 1000,
        totalTokens: 5000,
        totalCost: 0.015,
        entries: [],
      },
      {
        yearMonth: "2026-03",
        inputTokens: 1600,
        outputTokens: 400,
        totalTokens: 2000,
        totalCost: 0.006,
        entries: [],
      },
    ];

    render(<UsageTab />);

    const table = screen.getByTestId("usage-table");

    // Act

    const rows = table.querySelectorAll("tbody tr");

    // Assert

    expect(rows[0].getAttribute("data-testid")).toBe("usage-row-2026-04");
    expect(rows[1].getAttribute("data-testid")).toBe("usage-row-2026-03");
    expect(rows[2].getAttribute("data-testid")).toBe("usage-row-2026-02");
  });

  it("should format totals with thousands separator and 4-decimal USD", () => {
    // Arrange

    mockRows = [
      {
        yearMonth: "2026-04",
        inputTokens: 10000,
        outputTokens: 2345,
        totalTokens: 12345,
        totalCost: 0.01234567,
        entries: [],
      },
    ];

    render(<UsageTab />);

    // Act

    const row = screen.getByTestId("usage-row-2026-04");

    // Assert

    expect(row).toHaveTextContent("12,345");
    expect(row).toHaveTextContent("$0.0123");
  });
});
