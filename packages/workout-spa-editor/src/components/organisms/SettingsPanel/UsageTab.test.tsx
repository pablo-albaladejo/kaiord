import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UsageEventRecord } from "../../../types/usage-event-schemas";
import { UsageTab } from "./UsageTab";

let mockEvents: UsageEventRecord[] = [];

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => mockEvents,
}));

vi.mock("../../../adapters/dexie/dexie-database", () => ({
  db: {},
}));

const YEAR_MONTH_LENGTH = 7;
const currentMonth = () => new Date().toISOString().slice(0, YEAR_MONTH_LENGTH);

const makeEvent = (over: Partial<UsageEventRecord>): UsageEventRecord => ({
  id: "e",
  yearMonth: currentMonth(),
  date: `${currentMonth()}-01`,
  purpose: "chat",
  promptTokens: 100,
  completionTokens: 50,
  tokens: 150,
  cost: 0.001,
  createdAt: `${currentMonth()}-01T00:00:00.000Z`,
  ...over,
});

describe("UsageTab", () => {
  beforeEach(() => {
    mockEvents = [];
  });

  it("should render the empty state when no events exist", () => {
    // Arrange

    // Act
    render(<UsageTab />);

    // Assert
    expect(screen.getByText(/No AI usage recorded yet/i)).toBeInTheDocument();
    expect(screen.queryByTestId("usage-table")).toBeNull();
  });

  it("should fold events of a month into a single total row", () => {
    // Arrange
    const ym = currentMonth();
    mockEvents = [
      makeEvent({ id: "a", purpose: "chat", tokens: 150 }),
      makeEvent({
        id: "b",
        purpose: "workout_generation",
        promptTokens: 400,
        completionTokens: 100,
        tokens: 500,
        cost: 0.004,
      }),
    ];

    // Act
    render(<UsageTab />);

    // Assert
    expect(screen.getByTestId(`usage-row-${ym}`)).toHaveTextContent("650");
  });

  it("should render a breakdown sub-row for each active purpose only", () => {
    // Arrange
    const ym = currentMonth();
    mockEvents = [
      makeEvent({ id: "a", purpose: "chat" }),
      makeEvent({ id: "b", purpose: "lab_extraction" }),
    ];

    // Act
    render(<UsageTab />);

    // Assert
    expect(screen.getByTestId(`usage-purpose-${ym}-chat`)).toBeInTheDocument();
    expect(
      screen.getByTestId(`usage-purpose-${ym}-lab_extraction`)
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(`usage-purpose-${ym}-workout_generation`)
    ).toBeNull();
  });
});
