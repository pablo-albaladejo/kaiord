import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsPanel } from "./SettingsPanel";
import { useAiStore } from "../../../store/ai-store";

vi.mock("../../../contexts", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useGarminBridge: () => ({
      extensionInstalled: false,
      sessionActive: false,
      pushing: { status: "idle" },
      lastError: null,
      detectExtension: vi.fn(),
      pushWorkout: vi.fn(),
      listWorkouts: vi.fn(),
      setPushing: vi.fn(),
    }),
  };
});

vi.mock("../../../store/train2go-store", () => ({
  useTrain2GoStore: () => ({
    extensionInstalled: false,
    sessionActive: false,
    lastError: null,
    detectExtension: vi.fn(),
  }),
}));

describe("SettingsPanel", () => {
  beforeEach(() => {
    useAiStore.setState({
      providers: [],
      customPrompt: "",
      selectedProviderId: null,
      generation: { status: "idle" },
    });
  });

  it("should render when open", () => {
    render(<SettingsPanel open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("should show AI tab by default", () => {
    render(<SettingsPanel open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText("LLM Providers")).toBeInTheDocument();
  });

  it("should switch to Extensions tab", () => {
    render(<SettingsPanel open={true} onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByText("Extensions"));

    expect(screen.getByText("Garmin Connect")).toBeInTheDocument();
    expect(screen.getByText("Train2Go")).toBeInTheDocument();
    expect(screen.getByText("Refresh Status")).toBeInTheDocument();
  });

  it("should switch to Privacy tab", () => {
    render(<SettingsPanel open={true} onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByText("Privacy"));

    expect(screen.getByText("Privacy Information")).toBeInTheDocument();
  });

  it("should show provider list as empty initially", () => {
    render(<SettingsPanel open={true} onOpenChange={vi.fn()} />);

    expect(
      screen.getByText("No providers configured. Add one below.")
    ).toBeInTheDocument();
  });

  it("should show privacy disclaimers", () => {
    render(<SettingsPanel open={true} onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByText("Privacy"));

    expect(
      screen.getByText(/We do not store your credentials/)
    ).toBeInTheDocument();
    expect(screen.getByText("Clear All API Keys")).toBeInTheDocument();
  });
});
