import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { profileWith } from "../../../lib/athlete/test-profile";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { useWorkoutStore } from "../../../store/workout-store";
import type { KRD } from "../../../types/krd";
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

const renderAt = (path: string, ui: ReactNode) => {
  const loc = memoryLocation({ path, record: true });
  render(<Router hook={loc.hook}>{ui}</Router>);
  return loc;
};

const DAY_SHEET = "/workout/new?date=2026-10-05&from=calendar-day";

const baseProps = {
  sport: "cycling" as const,
  onSportChange: vi.fn(),
  profile: profileWith("cycling", { ftp: 268 }),
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

  it("should name the threshold the generation writes against", () => {
    // Arrange
    const ui = <CreateInputPhase {...baseProps} />;

    // Act
    render(withRouter(ui));

    // Assert
    expect(screen.getByText(/FTP 268 W/)).toBeInTheDocument();
    expect(screen.getByText(/athlete profile/i)).toBeInTheDocument();
  });

  it("should omit the threshold line when the sport has none set", () => {
    // Arrange
    const ui = (
      <CreateInputPhase {...baseProps} profile={profileWith("cycling", {})} />
    );

    // Act
    render(withRouter(ui));

    // Assert
    expect(screen.queryByText(/athlete profile/i)).not.toBeInTheDocument();
  });

  it("should open the blank editor on the sheet's day with the chosen sport", async () => {
    // Arrange
    const ui = <CreateInputPhase {...baseProps} sport="running" />;
    const loc = renderAt(DAY_SHEET, ui);

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Blank" }));

    // Assert
    expect(loc.history.at(-1)).toBe(
      "/workout/new?source=scratch&date=2026-10-05&from=calendar-day&sport=running"
    );
  });

  it("should start the blank editor from an empty draft", async () => {
    // Arrange
    const stale = { version: "1.0", type: "structured_workout" } as KRD;
    useWorkoutStore.setState({ currentWorkout: stale });
    renderAt(DAY_SHEET, <CreateInputPhase {...baseProps} />);

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Blank" }));

    // Assert
    expect(useWorkoutStore.getState().currentWorkout).toBeNull();
  });

  it("should import onto the sheet's day", async () => {
    // Arrange
    const loc = renderAt(DAY_SHEET, <CreateInputPhase {...baseProps} />);

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Import file" }));

    // Assert
    expect(loc.history.at(-1)).toBe(
      "/workout/new?action=import&date=2026-10-05&from=calendar-day"
    );
  });

  it("should open the library in template-picker mode for the sheet's week", async () => {
    // Arrange
    const onClose = vi.fn();
    const sheet = "/workout/new?from=calendar&week=2026-W41";
    const ui = <CreateInputPhase {...baseProps} onClose={onClose} />;
    const loc = renderAt(sheet, ui);

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Template" }));

    // Assert
    expect(loc.history.at(-1)).toBe(
      "/library?source=template-picker&week=2026-W41&from=calendar"
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
