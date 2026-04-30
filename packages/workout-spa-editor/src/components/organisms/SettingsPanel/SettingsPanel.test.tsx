import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { useAiRuntimeStore } from "../../../store/ai-runtime-store";
import { renderWithProviders } from "../../../test-utils";
import { SettingsPanel } from "./SettingsPanel";

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

const renderPanel = () =>
  renderWithProviders(<SettingsPanel open={true} onOpenChange={vi.fn()} />, {
    persistence: createDexiePersistence(db),
  });

describe("SettingsPanel", () => {
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
    await db.table("meta").clear();
  });

  it("renders when open", () => {
    renderPanel();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("shows the AI tab by default", () => {
    renderPanel();
    expect(screen.getByText("LLM Providers")).toBeInTheDocument();
  });

  it("switches to the Extensions tab", () => {
    renderPanel();
    fireEvent.click(screen.getByText("Extensions"));
    expect(screen.getByText("Garmin Connect")).toBeInTheDocument();
    expect(screen.getByText("Train2Go")).toBeInTheDocument();
    expect(screen.getByText("Refresh Status")).toBeInTheDocument();
  });

  it("switches to the Privacy tab", () => {
    renderPanel();
    fireEvent.click(screen.getByText("Privacy"));
    expect(screen.getByText("Privacy Information")).toBeInTheDocument();
  });

  it("shows the provider list as empty initially", () => {
    renderPanel();
    expect(
      screen.getByText("No providers configured. Add one below.")
    ).toBeInTheDocument();
  });

  it("shows privacy disclaimers", () => {
    renderPanel();
    fireEvent.click(screen.getByText("Privacy"));
    expect(
      screen.getByText(/We do not store your credentials/)
    ).toBeInTheDocument();
    expect(screen.getByText("Clear All API Keys")).toBeInTheDocument();
  });
});
