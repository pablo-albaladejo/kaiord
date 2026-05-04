import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { addProvider } from "../../../application/ai/add-provider";
import { useAiRuntimeStore } from "../../../store/ai-runtime-store";
import { renderWithProviders } from "../../../test-utils";
import { AiWorkoutInput } from "./AiWorkoutInput";

const renderInput = (onSettingsClick = vi.fn()) =>
  renderWithProviders(<AiWorkoutInput onSettingsClick={onSettingsClick} />, {
    persistence: createDexiePersistence(db),
  });

describe("AiWorkoutInput", () => {
  beforeEach(async () => {
    await db.table("aiProviders").clear();
    await db.table("meta").clear();
    useAiRuntimeStore.setState({
      selectedProviderId: null,
      generation: { status: "idle" },
    });
  });

  afterEach(async () => {
    await db.table("aiProviders").clear();
  });

  it("should show the empty-state CTA when no providers are configured", async () => {
    // Arrange

    // Act

    renderInput();

    // Assert

    await waitFor(() => {
      expect(screen.getByText(/Configure an AI provider/)).toBeInTheDocument();
    });
    expect(screen.getByText("Open Settings")).toBeInTheDocument();
  });

  it("should invoke onSettingsClick when the empty-state button is clicked", async () => {
    // Arrange

    const onClick = vi.fn();

    // Act

    renderInput(onClick);

    // Assert

    await waitFor(() => {
      expect(screen.getByText("Open Settings")).toBeInTheDocument();
    });
    screen.getByText("Open Settings").click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("should show the input form once a provider is persisted", async () => {
    // Arrange

    const persistence = createDexiePersistence(db);
    await addProvider(persistence, {
      type: "anthropic",
      apiKey: "sk-123",
      model: "claude-sonnet-4-5-20241022",
      label: "Test Claude",
    });

    // Act

    renderInput();

    // Assert

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/sweet spot cycling/)
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Generate Workout")).toBeInTheDocument();
  });

  it("should render the runtime-store error message inline", async () => {
    // Arrange

    const persistence = createDexiePersistence(db);
    await addProvider(persistence, {
      type: "anthropic",
      apiKey: "sk-123",
      model: "m1",
      label: "L1",
    });
    useAiRuntimeStore.setState({
      generation: { status: "error", message: "API key invalid" },
    });

    // Act

    renderInput();

    // Assert

    await waitFor(() => {
      expect(screen.getByText("API key invalid")).toBeInTheDocument();
    });
  });

  it("should disable the generate button while the prompt textarea is empty", async () => {
    // Arrange

    const persistence = createDexiePersistence(db);
    await addProvider(persistence, {
      type: "openai",
      apiKey: "sk-123",
      model: "gpt-4o",
      label: "GPT",
    });

    // Act

    renderInput();

    // Assert

    await waitFor(() => {
      expect(screen.getByText("Generate Workout")).toBeDisabled();
    });
  });
});
