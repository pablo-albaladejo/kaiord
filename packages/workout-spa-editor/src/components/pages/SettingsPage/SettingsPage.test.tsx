import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { useAiRuntimeStore } from "../../../store/ai-runtime-store";
import { renderWithProviders } from "../../../test-utils";
import SettingsPage from "./SettingsPage";

vi.mock("../../../contexts/garmin-bridge-context", async (importOriginal) => {
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

function renderAtPath(path: string) {
  const memory = memoryLocation({ path, record: true });
  const result = renderWithProviders(
    <Router hook={memory.hook}>
      <Route path="/settings/:tab?">
        <SettingsPage />
      </Route>
    </Router>,
    { persistence: createDexiePersistence(db) }
  );
  return { ...result, memory };
}

describe("SettingsPage", () => {
  beforeEach(async () => {
    await Promise.all([
      db.table("aiProviders").clear(),
      db.table("meta").clear(),
      db.table("profiles").clear(),
    ]);
    useAiRuntimeStore.setState({
      selectedProviderId: null,
      generation: { status: "idle" },
    });
  });

  describe("routing", () => {
    it("should redirect /settings to /settings/ai", async () => {
      // Arrange

      // Act
      const { memory } = renderAtPath("/settings");

      // Assert
      await waitFor(() => {
        expect(memory.history).toContain("/settings/ai");
      });
    });

    it("should redirect unknown tab to /settings/ai", () => {
      // Arrange

      // Act
      const { memory } = renderAtPath("/settings/unknown");

      // Assert
      expect(memory.history.at(-1)).toBe("/settings/ai");
    });
  });

  describe("rendering", () => {
    it("should render the page shell for a valid tab", () => {
      // Arrange

      // Act
      renderAtPath("/settings/ai");

      // Assert
      expect(screen.getByTestId("settings-page")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Settings · AI"
      );
    });

    it("should render the profile tab content at /settings/profile", async () => {
      // Arrange

      // Act
      renderAtPath("/settings/profile");

      // Assert
      expect(
        await screen.findByRole("heading", { name: /profile manager/i })
      ).toBeInTheDocument();
    });

    it("should render the ai tab content at /settings/ai", () => {
      // Arrange

      // Act
      renderAtPath("/settings/ai");

      // Assert
      expect(screen.getByText("LLM Providers")).toBeInTheDocument();
    });

    it("should render the extensions tab content at /settings/extensions", () => {
      // Arrange

      // Act
      renderAtPath("/settings/extensions");

      // Assert
      expect(screen.getByText("Garmin Connect")).toBeInTheDocument();
      expect(screen.getByText("Train2Go")).toBeInTheDocument();
    });

    it("should render the usage tab content at /settings/usage", async () => {
      // Arrange

      // Act
      renderAtPath("/settings/usage");

      // Assert
      expect(
        await screen.findByTestId("settings-panel-usage")
      ).toBeInTheDocument();
    });

    it("should render the privacy tab content at /settings/privacy", () => {
      // Arrange

      // Act
      renderAtPath("/settings/privacy");

      // Assert
      expect(screen.getByText("Clear All API Keys")).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("should navigate to a new tab when clicking a sidebar entry", async () => {
      // Arrange
      const user = userEvent.setup();
      const { memory } = renderAtPath("/settings/ai");

      // Act
      await user.click(screen.getByTestId("settings-tab-privacy"));

      // Assert
      await waitFor(() => {
        expect(memory.history.at(-1)).toBe("/settings/privacy");
      });
    });

    it("should mark the active tab with aria-selected", () => {
      // Arrange

      // Act
      renderAtPath("/settings/extensions");

      // Assert
      expect(screen.getByTestId("settings-tab-extensions")).toHaveAttribute(
        "aria-selected",
        "true"
      );
      expect(screen.getByTestId("settings-tab-ai")).toHaveAttribute(
        "aria-selected",
        "false"
      );
    });
  });
});
