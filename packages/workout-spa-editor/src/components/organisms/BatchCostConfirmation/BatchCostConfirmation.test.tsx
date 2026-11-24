import { WORKOUT_PARSER_SYSTEM } from "@kaiord/ai/prompts";
import { CHARS_PER_TOKEN } from "@kaiord/ai/providers";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { BatchCostConfirmation } from "./BatchCostConfirmation";

const anthropic: LlmProviderConfig = {
  id: "p1",
  type: "anthropic",
  apiKey: "k",
  model: "claude-sonnet-5",
  label: "My Claude",
  isDefault: true,
  createdAt: 0,
};

const workouts: WorkoutRecord[] = [
  {
    id: "w1",
    date: "2026-04-18",
    state: "raw",
    raw: { description: "3k z1", comments: [] },
  } as unknown as WorkoutRecord,
];

describe("BatchCostConfirmation", () => {
  it("should render provider, tokens, and cost when open with a provider", () => {
    // Arrange

    // Act

    render(
      <BatchCostConfirmation
        open
        workouts={workouts}
        provider={anthropic}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert

    expect(screen.getByTestId("batch-cost-provider")).toHaveTextContent(
      "My Claude"
    );
    // The system prompt and "3k z1", 3 characters a token, + 500 output.
    const chars = WORKOUT_PARSER_SYSTEM.template.length + "3k z1".length;
    const input = Math.ceil(chars / CHARS_PER_TOKEN);
    expect(screen.getByTestId("batch-cost-tokens")).toHaveTextContent(
      (input + 500).toLocaleString("en")
    );
    expect(screen.getByTestId("batch-cost-usd")).toHaveTextContent("$");
  });

  it("should render 'No provider selected' and disable Confirm when provider is null", () => {
    // Arrange

    // Act

    render(
      <BatchCostConfirmation
        open
        workouts={workouts}
        provider={null}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert

    expect(screen.getByTestId("batch-cost-provider")).toHaveTextContent(
      "No provider selected"
    );
    expect(screen.getByTestId("batch-cost-usd")).toHaveTextContent("—");
    expect(screen.getByTestId("batch-cost-confirm")).toBeDisabled();
  });

  it("should fire onConfirm when Confirm clicked", async () => {
    // Arrange

    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <BatchCostConfirmation
        open
        workouts={workouts}
        provider={anthropic}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    // Act

    await user.click(screen.getByTestId("batch-cost-confirm"));

    // Assert

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should fire onCancel when Cancel clicked", async () => {
    // Arrange

    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <BatchCostConfirmation
        open
        workouts={workouts}
        provider={anthropic}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    // Act

    await user.click(screen.getByTestId("batch-cost-cancel"));

    // Assert

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should render nothing when open is false", () => {
    // Arrange

    // Act

    render(
      <BatchCostConfirmation
        open={false}
        workouts={workouts}
        provider={anthropic}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert

    expect(screen.queryByTestId("batch-cost-provider")).toBeNull();
  });
});
