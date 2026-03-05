import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AiWorkoutInput } from "./AiWorkoutInput";
import { useAiStore } from "../../../store/ai-store";

describe("AiWorkoutInput", () => {
  beforeEach(() => {
    useAiStore.setState({
      providers: [],
      customPrompt: "",
      selectedProviderId: null,
      generation: { status: "idle" },
    });
  });

  it("should show settings prompt when no providers configured", () => {
    render(<AiWorkoutInput onSettingsClick={vi.fn()} />);

    expect(
      screen.getByText(/Configure an AI provider/)
    ).toBeInTheDocument();
    expect(screen.getByText("Open Settings")).toBeInTheDocument();
  });

  it("should call onSettingsClick when button clicked", () => {
    const onClick = vi.fn();
    render(<AiWorkoutInput onSettingsClick={onClick} />);

    screen.getByText("Open Settings").click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("should show input form when providers exist", () => {
    useAiStore.getState().addProvider({
      type: "anthropic",
      apiKey: "sk-123",
      model: "claude-sonnet-4-5-20241022",
      label: "Test Claude",
    });

    render(<AiWorkoutInput onSettingsClick={vi.fn()} />);

    expect(
      screen.getByPlaceholderText(/Describe your workout/)
    ).toBeInTheDocument();
    expect(screen.getByText("Generate")).toBeInTheDocument();
  });

  it("should show error message when generation fails", () => {
    useAiStore.getState().addProvider({
      type: "anthropic",
      apiKey: "sk-123",
      model: "m1",
      label: "L1",
    });
    useAiStore.setState({
      generation: { status: "error", message: "API key invalid" },
    });

    render(<AiWorkoutInput onSettingsClick={vi.fn()} />);

    expect(screen.getByText("API key invalid")).toBeInTheDocument();
  });

  it("should disable generate button when text is empty", () => {
    useAiStore.getState().addProvider({
      type: "openai",
      apiKey: "sk-123",
      model: "gpt-4o",
      label: "GPT",
    });

    render(<AiWorkoutInput onSettingsClick={vi.fn()} />);

    expect(screen.getByText("Generate")).toBeDisabled();
  });
});
