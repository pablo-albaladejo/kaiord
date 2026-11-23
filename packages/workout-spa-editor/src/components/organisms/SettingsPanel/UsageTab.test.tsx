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

  it("should show each model's cost with the prices it was priced at", () => {
    // Arrange
    mockEvents = [
      makeEvent({
        id: "a",
        providerType: "anthropic",
        modelId: "claude-sonnet-5",
        costBasis: "price_table",
        priceReadOn: "2026-11-23",
        cost: 0.0018,
        requestCount: 2,
        failedRequests: 1,
      }),
    ];

    // Act
    render(<UsageTab />);

    // Assert
    const row = screen.getByTestId("usage-model-anthropic-claude-sonnet-5");
    expect(row).toHaveTextContent("Claude Sonnet 5");
    expect(row).toHaveTextContent("$0.0018");
    expect(row).toHaveTextContent(
      "$2.00 input · $10.00 output · $0.20 cached input per million tokens"
    );
    expect(row).toHaveTextContent("2026-11-23");
    expect(screen.getByRole("link", { name: "Price list" })).toHaveAttribute(
      "href",
      "https://platform.claude.com/docs/en/about-claude/pricing"
    );
  });

  it("should show a model with no price as unknown, never as free", () => {
    // Arrange
    const ym = currentMonth();
    mockEvents = [
      makeEvent({
        id: "a",
        providerType: "openai",
        modelId: "o1",
        costBasis: "unknown",
        cost: 0,
      }),
    ];

    // Act
    render(<UsageTab />);

    // Assert
    expect(screen.getByTestId("usage-model-openai-o1")).toHaveTextContent(
      "Price unknown"
    );
    expect(screen.getByTestId(`usage-row-${ym}`)).toHaveTextContent(
      "—+ 1 run at an unknown price"
    );
    expect(screen.getByTestId(`usage-row-${ym}`)).not.toHaveTextContent("$0");
  });

  it("should say that failed attempts are counted and which requests are not", () => {
    // Arrange
    mockEvents = [
      makeEvent({
        id: "a",
        providerType: "anthropic",
        modelId: "claude-sonnet-5",
        costBasis: "price_table",
        failedRequests: 2,
        unmeasuredRequests: 1,
      }),
    ];

    // Act
    render(<UsageTab />);

    // Assert
    expect(screen.getByTestId("usage-cost-basis")).toHaveTextContent(
      "every attempt the Provider billed"
    );
    expect(screen.getByTestId("usage-unmeasured")).toHaveTextContent(
      "1 request failed before its Provider reported the tokens used"
    );
  });

  it("should label a cost that includes an estimate and say which requests it estimates", () => {
    // Arrange
    const ym = currentMonth();
    mockEvents = [
      makeEvent({
        id: "a",
        providerType: "anthropic",
        modelId: "claude-sonnet-5",
        costBasis: "price_table",
        requestCount: 1,
        estimatedRequests: 1,
      }),
    ];

    // Act
    render(<UsageTab />);

    // Assert
    expect(screen.getByTestId(`usage-row-${ym}`)).toHaveTextContent(
      "includes an estimate"
    );
    expect(screen.getByTestId("usage-estimated")).toHaveTextContent(
      "1 request was cut before its Provider reported the tokens used"
    );
  });

  it("should say the usage shown is this device's", () => {
    // Arrange
    mockEvents = [makeEvent({ id: "a" })];

    // Act
    render(<UsageTab />);

    // Assert
    expect(screen.getByTestId("usage-this-device")).toHaveTextContent(
      "not in Drive sync or a backup file"
    );
  });
});
