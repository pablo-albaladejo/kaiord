import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BatchCostConfirmation } from "./BatchCostConfirmation";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { WorkoutRecord } from "../../../types/calendar-record";

const anthropic: LlmProviderConfig = {
  id: "p1",
  type: "anthropic",
  apiKey: "k",
  model: "claude",
  label: "My Claude",
  isDefault: true,
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
  it("renders provider, tokens, and cost when open with a provider", () => {
    render(
      <BatchCostConfirmation
        open
        workouts={workouts}
        provider={anthropic}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByTestId("batch-cost-provider")).toHaveTextContent(
      "My Claude"
    );
    // "3k z1" → 5 chars / 3 = ceil 2 + 500 output = 502 tokens.
    expect(screen.getByTestId("batch-cost-tokens")).toHaveTextContent("502");
    expect(screen.getByTestId("batch-cost-usd")).toHaveTextContent("$");
  });

  it("renders 'No provider selected' and disables Confirm when provider is null", () => {
    render(
      <BatchCostConfirmation
        open
        workouts={workouts}
        provider={null}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByTestId("batch-cost-provider")).toHaveTextContent(
      "No provider selected"
    );
    expect(screen.getByTestId("batch-cost-usd")).toHaveTextContent("—");
    expect(screen.getByTestId("batch-cost-confirm")).toBeDisabled();
  });

  it("fires onConfirm when Confirm clicked", async () => {
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

    await user.click(screen.getByTestId("batch-cost-confirm"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("fires onCancel when Cancel clicked", async () => {
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

    await user.click(screen.getByTestId("batch-cost-cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when open is false", () => {
    render(
      <BatchCostConfirmation
        open={false}
        workouts={workouts}
        provider={anthropic}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByTestId("batch-cost-provider")).toBeNull();
  });
});
