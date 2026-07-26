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

  describe("landing list", () => {
    it("should render the grouped list at /settings with no tab", () => {
      // Arrange

      // Act
      renderAtPath("/settings");

      // Assert
      expect(screen.getByTestId("settings-group-list")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Settings"
      );
    });

    it("should render every group eyebrow", () => {
      // Arrange
      const eyebrows = [
        "AI generation",
        "Preferences",
        "Privacy & data",
        "Advanced",
      ];

      // Act
      renderAtPath("/settings");

      // Assert
      for (const eyebrow of eyebrows) {
        expect(screen.getByText(eyebrow)).toBeInTheDocument();
      }
    });

    it.each([
      { row: "extensions", destination: "/settings/extensions" },
      { row: "units", destination: "/settings/preferences" },
      { row: "language", destination: "/settings/preferences" },
      {
        row: "manageYourData",
        destination: "/settings/privacy?section=data-management",
      },
    ])(
      "should navigate to $destination when clicking the $row row",
      async ({ row, destination }) => {
        // Arrange
        const user = userEvent.setup();
        const { memory } = renderAtPath("/settings");

        // Act
        await user.click(screen.getByTestId(`settings-row-${row}`));

        // Assert
        await waitFor(() => {
          expect(memory.history.at(-1)).toBe(destination);
        });
      }
    );
  });

  describe("routing", () => {
    it("should redirect unknown tab to /settings", () => {
      // Arrange

      // Act
      const { memory } = renderAtPath("/settings/unknown");

      // Assert
      expect(memory.history.at(-1)).toBe("/settings");
    });
  });

  describe("detail views", () => {
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

    it.each([
      { tab: "ai", content: "LLM Providers" },
      { tab: "privacy", content: "Clear All API Keys" },
    ])(
      "should render the $tab tab content at /settings/$tab",
      ({ tab, content }) => {
        // Arrange

        // Act
        renderAtPath(`/settings/${tab}`);

        // Assert
        expect(screen.getByText(content)).toBeInTheDocument();
      }
    );

    it("should render the extensions tab content at /settings/extensions", () => {
      // Arrange

      // Act
      renderAtPath("/settings/extensions");

      // Assert
      // "Garmin Connect" appears twice: the bridge table row and the
      // Tanita → Garmin sync card's status row.
      expect(screen.getAllByText("Garmin Connect").length).toBeGreaterThan(0);
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
  });

  describe("back navigation", () => {
    it("should navigate back to /settings from a detail view", async () => {
      // Arrange
      const user = userEvent.setup();
      const { memory } = renderAtPath("/settings/ai");

      // Act
      await user.click(screen.getByTestId("settings-back"));

      // Assert
      await waitFor(() => {
        expect(memory.history.at(-1)).toBe("/settings");
      });
    });
  });

  describe("section deep-links", () => {
    const sectionOf = () =>
      (document.activeElement as HTMLElement | null)?.getAttribute(
        "data-settings-section"
      ) ?? null;

    it.each([
      { path: "/settings/ai?section=providers", section: "providers" },
      {
        path: "/settings/privacy?section=data-management",
        section: "data-management",
      },
    ])(
      "should focus the $section section for its query",
      async ({ path, section }) => {
        // Arrange

        // Act
        renderAtPath(path);

        // Assert
        await waitFor(() => {
          expect(sectionOf()).toBe(section);
        });
      }
    );

    it("should focus no section when the query is absent", () => {
      // Arrange

      // Act
      renderAtPath("/settings/ai");

      // Assert
      expect(sectionOf()).toBeNull();
    });
  });
});
