import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { CreateInputPhase } from "./CreateInputPhase";

const PROVIDER: LlmProviderConfig = {
  id: "p1",
  type: "anthropic",
  apiKey: "k",
  model: "claude",
  label: "Claude",
  isDefault: true,
  createdAt: "2026-05-30T00:00:00.000Z",
};

const withRouter = (ui: ReactNode) => {
  const loc = memoryLocation({ path: "/workout/new", record: true });
  return <Router hook={loc.hook}>{ui}</Router>;
};

const baseProps = {
  sport: "cycling" as const,
  onSportChange: vi.fn(),
  promptText: "",
  onPromptChange: vi.fn(),
  provider: PROVIDER,
  onGenerate: vi.fn(),
  onClose: vi.fn(),
};

describe("CreateInputPhase", () => {
  it("should disable Generate until a prompt is entered", () => {
    // Arrange
    const ui = <CreateInputPhase {...baseProps} promptText="" />;

    // Act
    render(withRouter(ui));

    // Assert
    expect(
      screen.getByRole("button", { name: /generate workout/i })
    ).toBeDisabled();
  });

  it("should enable Generate when prompt has content", () => {
    // Arrange
    const ui = <CreateInputPhase {...baseProps} promptText="ride" />;

    // Act
    render(withRouter(ui));

    // Assert
    expect(
      screen.getByRole("button", { name: /generate workout/i })
    ).toBeEnabled();
  });

  it("should fill the prompt when an example chip is clicked", async () => {
    // Arrange
    const onPromptChange = vi.fn();
    const ui = (
      <CreateInputPhase {...baseProps} onPromptChange={onPromptChange} />
    );

    // Act
    render(withRouter(ui));
    await userEvent.click(screen.getByText("45 min Z2 endurance ride"));

    // Assert
    expect(onPromptChange).toHaveBeenCalledWith("45 min Z2 endurance ride");
  });

  it("should show the provider empty state when no provider is set", () => {
    // Arrange
    const ui = <CreateInputPhase {...baseProps} provider={null} />;

    // Act
    render(withRouter(ui));

    // Assert
    expect(screen.getByText(/configure an ai provider/i)).toBeInTheDocument();
  });
});
