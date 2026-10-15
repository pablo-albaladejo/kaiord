import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { renderWithProviders } from "../../../test-utils";
import type { AiModelBinding } from "../../../types/ai-model-binding";
import type { UsageEventRecord } from "../../../types/usage-event-schemas";
import { AssistantCard } from "./AssistantCard";

const live = vi.hoisted(() => ({
  providers: [] as LlmProviderConfig[],
  bindings: [] as AiModelBinding[],
  events: [] as UsageEventRecord[],
}));

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({
    id: "p-1",
    profile: { name: "Ana", linkedAccounts: [] },
  }),
}));
vi.mock("../../../hooks/use-ai-providers-live", () => ({
  useAiProvidersLive: () => live.providers,
}));
vi.mock("../../../hooks/use-ai-model-bindings-live", () => ({
  useAiModelBindingsLive: () => live.bindings,
}));
vi.mock("../../../hooks/use-usage-summary", () => ({
  useUsageSummary: () => ({ months: ["2026-10"], events: live.events }),
}));

const claude: LlmProviderConfig = {
  id: "claude",
  type: "anthropic",
  apiKey: "sk-ant-1111",
  label: "Mi Claude",
  isDefault: true,
  keyCheck: "valid",
  createdAt: 1,
};

const usage = (id: string, tokens: number, cost: number): UsageEventRecord => ({
  id,
  yearMonth: "2026-10",
  date: "2026-10-14",
  purpose: "chat",
  promptTokens: tokens,
  completionTokens: 0,
  tokens,
  cost,
  createdAt: `2026-10-14T00:00:0${id}.000Z`,
});

describe("AssistantCard", () => {
  beforeEach(() => {
    live.providers = [claude];
    live.bindings = [
      {
        profileId: "p-1",
        purpose: "default",
        providerId: "claude",
        modelId: "claude-opus-5",
        updatedAt: "2026-10-15T00:00:00.000Z",
      },
    ];
    live.events = [];
  });

  it("should name the athlete, the main model, its account and its key status", () => {
    // Arrange

    // Act
    renderWithProviders(<AssistantCard />);

    // Assert
    expect(screen.getByText("Your assistant (for Ana)")).toBeInTheDocument();
    expect(screen.getByTestId("assistant-model")).toHaveTextContent(
      "Claude Opus 5"
    );
    expect(screen.getByText("on Mi Claude")).toBeInTheDocument();
    expect(screen.getByTestId("key-status")).toHaveTextContent("Key verified");
    expect(screen.getByLabelText("Main model")).toBeInTheDocument();
  });

  it("should sum this month's requests, tokens and estimated cost", () => {
    // Arrange
    const [big, small] = [
      { tokens: 1000, cost: 0.2 },
      { tokens: 500, cost: 0.05 },
    ];
    live.events = [
      usage("1", big.tokens, big.cost),
      usage("2", small.tokens, small.cost),
    ];

    // Act
    renderWithProviders(<AssistantCard />);

    // Assert
    expect(screen.getByTestId("assistant-usage")).toHaveTextContent(
      "This month: 2 requests · 1,500 tokens · ~$0.25"
    );
  });

  it("should say nothing was used this month yet", () => {
    // Arrange

    // Act
    renderWithProviders(<AssistantCard />);

    // Assert
    expect(screen.getByText("No AI use yet this month.")).toBeInTheDocument();
  });

  it("should point to adding an account when there is none", () => {
    // Arrange
    live.providers = [];

    // Act
    renderWithProviders(<AssistantCard />);

    // Assert
    expect(
      screen.getByText(
        "Add an AI account below to choose the model your assistant uses."
      )
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Main model")).not.toBeInTheDocument();
  });
});
